import { groupBy, transform, values } from 'lodash'
import pack from 'bin-pack'
import { defaultMemoize } from 'reselect'

const MARGIN = 1
const MARGIN_LEFT = 0
const MARGIN_RIGHT = 3
const MARGIN_TOP = 1
const LAYOUT_MARGIN_TOP = MARGIN * 2
const LAYOUT_MARGIN_BOTTOM = MARGIN / 4
const LAYOUT_MARGIN_LEFT = MARGIN / 4
const PADDING_RIGHT = 0
const PADDING_LEFT = 0.7 * MARGIN
const PADDING_TOP = 0.7 * MARGIN
const PADDING_BOTTOM = 0.42 * MARGIN

export default  defaultMemoize(function(nodes, ratio = 1) {
  let clusters = transform(groupBy(nodes, 'cluster'), (result, nodesObject, clusterId) => {
    const size = nodesObject.length
    const width = Math.ceil(Math.sqrt(size))
    const height = Math.ceil(size / width)
    result[clusterId] = {
      clusterId,
      width: width + PADDING_RIGHT + PADDING_LEFT + MARGIN_LEFT + MARGIN_RIGHT,
      height: height + PADDING_TOP + PADDING_BOTTOM + MARGIN + MARGIN_TOP,
      nodesObject,
    }
  })

  values(clusters).forEach(item => {
    item.width *= ratio
  })

  let { width: totalWidth, height: totalHeight, items } = pack(values(clusters), { inPlace: false })

  totalWidth /= ratio
  items.forEach(item => {
    item.width /= ratio
    item.x /= ratio
  })

  items.forEach(item => {
    item.width -= MARGIN_LEFT + MARGIN_RIGHT + PADDING_RIGHT + PADDING_LEFT
    item.height -= MARGIN + MARGIN_TOP + PADDING_TOP + PADDING_BOTTOM
    item.x += MARGIN_LEFT  + PADDING_LEFT
    item.y += MARGIN_TOP + PADDING_TOP
  })

  const coordinatedNodesMap = items.reduce((nodes, { width, x, y, item: { nodesObject } }) => {
    return nodes.concat(nodesObject.map((node, index) => {
      return ({
        id: node.agentId + index + x,
        node,
        x: index % width + x,
        // yes, in here u see width too, hard to explain, is just works)
        y: (index - index % width) / width + y,
      })
    }))
  }, []).reduce((map, value) => {
    map[value.node.agentId] = value
    return map
  }, {})

  // sorry for this, setting "coordinatedNodes" into same position as it was
  const coordinatedNodes = nodes.map(({ agentId }) => {
    return coordinatedNodesMap[agentId]
  })

  const coordinatedClusters = items.reduce((clusters, { width, height, x, y, item: { nodesObject, clusterId: cluster } }) => {
    clusters.push({
      cluster,
      id: cluster + nodesObject.length,
      coordinatedNodes: nodesObject.map(({ agentId }) => coordinatedNodesMap[agentId]),
      width: PADDING_RIGHT + PADDING_LEFT + width,
      height: PADDING_TOP + PADDING_BOTTOM + height,
      x: x - PADDING_LEFT,
      y: y - PADDING_TOP,
    })
    return clusters
  }, [])

  coordinatedClusters.concat(coordinatedNodes).forEach(item => {
    item.x += LAYOUT_MARGIN_LEFT
    item.y += LAYOUT_MARGIN_TOP
  })

  return {
    totalWidth: totalWidth + LAYOUT_MARGIN_LEFT * 2,
    totalHeight: totalHeight + LAYOUT_MARGIN_TOP + LAYOUT_MARGIN_BOTTOM,
    coordinatedClusters,
    coordinatedNodes,
  }
})

export const getArrows = defaultMemoize((events, coordinatedNodes, currentTime, width, height) => {
  const nodesMap = coordinatedNodes.reduce((map, calc) => {
    map[calc.node.agentId] = calc
    return map
  }, {})
  const filteredEvents = events
    .filter(({ date }) => date <= currentTime)

  let count = 0
  const compromisedMap = filteredEvents.filter(({ type }) => type === 'assetCompromised').reduce((map, event) => {
    if (!map[event.node.id] ) {
      map[event.node.id] = ++count
    }
    return map
  }, {})

  const fn = ([x1, x2], width) => {
    if ( x1 < x2 ) {
      x1 += width
    } else if ( x1 > x2 ) {
      x2 += width
    } else {
      x1 += width / 2
      x2 += width / 2
    }
    return [x1, x2]
  }

  return filteredEvents
    .filter(({ data = {} }) => data.sourceNode && data.sourceNode.id)
    .map(event => {

      const { data: { sourceNode: { id: start } }, node: { id: end } } = event
      const startNode = nodesMap[start]
      const endNode = nodesMap[end]

      const [x1, x2] = fn([startNode.x, endNode.x], width)
      const [y2, y1] = fn([endNode.y, startNode.y], height)

      return {
        id: event.id,
        event,
        attackPathNumber: event.type !== 'newDiscoveredNode' ? (compromisedMap[end] || 0) : 0,
        startNode: { x: x1, y: y1 },
        endNode: { x: x2, y: y2 },
        middlePoint: { x: x1 + (x2 - x1) / 2, y: y1 + (y2 - y1) / 2 },
        tipPoint: { x: x1 + (x2 - x1) / 2 * 1.1, y: y1 + (y2 - y1) / 2 * 1.1 },
      }
    })
})
