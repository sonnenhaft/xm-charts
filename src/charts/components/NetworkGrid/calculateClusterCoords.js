import { groupBy, transform, values } from 'lodash'
import pack from 'bin-pack'
import { defaultMemoize } from 'reselect'

const MARGIN = 0.5
const MARGIN_TOP = 1
const LAYOUT_MARGIN_TOP = MARGIN * 2
const LAYOUT_MARGIN_BOTTOM = MARGIN / 4
const LAYOUT_MARGIN_LEFT = MARGIN / 4
const PADDING_RIGHT = 0
const PADDING_LEFT = MARGIN
const PADDING_H = MARGIN

export default  defaultMemoize(function(nodes, ratio = 1) {
  let clusters = transform(groupBy(nodes, 'cluster'), (result, nodesObject, clusterId) => {
    const size = nodesObject.length
    const width = Math.ceil(Math.sqrt(size))
    const height = Math.ceil(size / width)
    result[clusterId] = {
      clusterId,
      width: width + PADDING_RIGHT + PADDING_LEFT + MARGIN * 2,
      height: height + PADDING_H * 2 + MARGIN + MARGIN_TOP,
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
    item.width -= MARGIN * 2 + PADDING_RIGHT + PADDING_LEFT
    item.height -= MARGIN + MARGIN_TOP + PADDING_H * 2
    item.x += MARGIN + PADDING_LEFT
    item.y += MARGIN_TOP + PADDING_H
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
      height: PADDING_H * 2 + height,
      x: x - PADDING_LEFT,
      y: y - PADDING_H,
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

export const getArrows = defaultMemoize((events, coordinatedNodes, currentTime) => {
  const nodesMap = coordinatedNodes.reduce((map, calc) => {
    map[calc.node.agentId] = calc
    return map
  }, {})
  const filteredEvents = events
    .filter(({ date }) => date <= currentTime)

  const compromisedMap = filteredEvents.filter(({ type }) => type === 'assetCompromised').reduce((map, event) => {
    map[event.node.id] = true
    return map
  }, {})

  return filteredEvents
    .filter(({ data = {} }) => data.sourceNode && data.sourceNode.id)
    .map(event => {
      const { data: { sourceNode: { id: start } }, node: { id: end } } = event
      const startNode = nodesMap[start]
      const endNode = nodesMap[end]
      return {
        event,
        isCompormised: event.type !== 'newDiscoveredNode' && compromisedMap[end],
        startNode,
        endNode,
      }
    })
})

export const moveArrowsToCorners = defaultMemoize((arrows, width, height) => {
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

  const getNode = ({ node: { agentId: id } }) => id
  let startsEndsArray = arrows.filter(({ event: { type } }) => {
    return type !== 'newDiscoveredNode'
  }).map(({ startNode, endNode }) => ({
    start: getNode(startNode),
    end: getNode(endNode),
  }))

  const parentsMap = groupBy(startsEndsArray, ({ start }) => start)
  const childrenMap = groupBy(startsEndsArray, ({ end }) => end)
  const roots = Object.keys(parentsMap).filter(key => !childrenMap[key])

  function setWeights(root, weight, weights) {
    if ( weights[root] !== undefined ) {
      return
    }

    weights[root] = weight
    const children = parentsMap[root]
    if ( !children ) {
      return
    }
    for (let i = 0; i < children.length; i++) {
      setWeights(children[i].end, weight + 1, weights)
    }
    return weights
  }

  const rootsMap = roots.map(root => setWeights(root, 0, {})).reduce((map, weights) => {
    Object.keys(weights).forEach(key => {
      map[key] = Math.max(map[key] || 0, weights[key])
    })
    return map
  }, {})

  return arrows.map(({ event, startNode, endNode, isCompormised }) => {
    const [x1, x2] = fn([startNode.x, endNode.x], width)
    const [y2, y1] = fn([endNode.y, startNode.y], height)
    const val = event.type !== 'newDiscoveredNode' ? rootsMap[endNode.node.agentId] : null
    return {
      id: event.id,
      event,
      isCompormised,
      value: val,
      startNode: { x: x1, y: y1 },
      endNode: { x: x2, y: y2 },
      middlePoint: { x: x1 + (x2 - x1) / 2, y: y1 + (y2 - y1) / 2 },
    }
  })
})
