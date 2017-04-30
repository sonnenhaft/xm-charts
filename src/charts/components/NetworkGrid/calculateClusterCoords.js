import { groupBy, transform, values }  from 'lodash'
import pack from 'bin-pack'

const MARGIN = 0.25
const LAYOUT_MARGIN_TOP = MARGIN
const LAYOUT_MARGIN_BOTTOM = MARGIN/4
const LAYOUT_MARGIN_LEFT = MARGIN/4
const PADDING_W = MARGIN
const PADDING_H = MARGIN * 2

export default  function(computers) {
  let clusters = transform(groupBy(computers, 'cluster'), (result, nodesObject, clusterId) => {
    const size = nodesObject.length
    const width = Math.ceil(Math.sqrt(size))
    const height = width
    // const height =  Math.ceil(size/width)
    result[clusterId] = {
      clusterId,
      width: width + PADDING_W * 2 + MARGIN * 2,
      height: height + PADDING_H * 2 + MARGIN * 2,
      nodesObject,
    }
  })

  let { width: totalWidth, height: totalHeight, items } = pack(values(clusters), { inPlace: false })

  items.forEach(item => {
    item.width -= MARGIN * 2 + PADDING_W * 2
    item.height -= MARGIN * 2 + PADDING_H * 2
    item.x += MARGIN + PADDING_W
    item.y += MARGIN + PADDING_H // ??
  })

  const coordinatedNodes = items.reduce((nodes, { width, height, x, y, item: { nodesObject } }) => {
    return nodes.concat(nodesObject.map((node, index) => {
      return ({
        node,
        y: index / height + (1 - index % (height)) / height + y,
        x: index % (width ) + x,
      })
    }))
  }, [])

  const coordinatedClusters = items.reduce((clusters, { width, height, x, y, item: { clusterId: cluster } }) => {
    clusters.push({
      cluster,
      id: cluster,
      width: PADDING_W * 2 + width,
      height: PADDING_H * 2 + height,
      x: x - PADDING_W,
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


