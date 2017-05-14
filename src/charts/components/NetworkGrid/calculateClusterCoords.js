import { groupBy, maxBy, transform, values } from 'lodash'
import pack from 'bin-pack'

const MARGIN = 0.5
const MARGIN_TOP = 1
const LAYOUT_MARGIN_TOP = MARGIN * 2
const LAYOUT_MARGIN_BOTTOM = MARGIN / 4
const LAYOUT_MARGIN_LEFT = MARGIN / 4
const PADDING_RIGHT = 0
const PADDING_LEFT = MARGIN
const PADDING_H = MARGIN

function moveToHead(arr, item) {
  arr[arr.indexOf(item)] = arr[0]
  arr[0] = item
}

function moveUnidentifiedCulsterToTopLeft(items) {
  const unidentifiedCluster = items.find(({ item: { clusterId } }) => !clusterId)
  if ( !unidentifiedCluster ) {
    return
  }
  const lines = values(groupBy(items, ({ y }) => y))
  const unidentifiedLine = lines.find(line => line.indexOf(unidentifiedCluster) !== -1)
  moveToHead(unidentifiedLine, unidentifiedCluster)
  unidentifiedLine.reduce((sum, item) => {
    item.x = sum
    return sum + item.width
  }, 0)

  const allLines = Object.values(lines)
  moveToHead(allLines, unidentifiedLine)
  allLines.reduce((sum, line) => {
    line.forEach(item => item.y = sum)
    return sum + maxBy(line, 'height').height
  }, 0)
}

export default  function(computers, ratio = 1) {
  let clusters = transform(groupBy(computers, 'cluster'), (result, nodesObject, clusterId) => {
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
  moveUnidentifiedCulsterToTopLeft(items)

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

  const coordinatedNodes = items.reduce((nodes, { width, x, y, item: { nodesObject } }) => {
    return nodes.concat(nodesObject.map((node, index) => {
      return ({
        node,
        x: index % width + x,
        // yes, in here u see width too, hard to explain, is just works)
        y: (index - index % width) / width + y,
      })
    }))
  }, [])

  const coordinatedClusters = items.reduce((clusters, { width, height, x, y, item: { clusterId: cluster } }) => {
    clusters.push({
      cluster,
      id: cluster,
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
}
