const { groupBy, transform, values } = require('lodash')
const pack = require('bin-pack')

const MARGIN = 0.6
module.exports = function(computers) {
  let clusters = transform(groupBy(computers, 'cluster'), (result, nodesObject, clusterId) => {
    const width = Math.ceil(Math.sqrt(nodesObject.length)) + MARGIN
    result[clusterId] = { size: nodesObject.length, clusterId, width, height: width, nodesObject }
  })

  let { width: totalWidth, height: totalHeight, items } = pack(values(clusters), { inPlace: false })

  items.forEach(item => {
    item.width -= MARGIN
    item.height -= MARGIN
    item.x += MARGIN/2
    item.y += MARGIN/2
  })

  const coordinatedNodes = items.reduce((nodes, { width, height, x, y, item: { nodesObject } }) => {
    return nodes.concat(nodesObject.map((node, index) => {
      const yy = index % height + y
      console.log(index % height)
      return ({
        node,
        x: Math.floor(index / width) + x ,
        y: yy,
      })
    }))
  }, [])

  const coordinatedClusters = items.reduce((clusters, { width, height, x, y, item: { clusterId: cluster } }) => {
    clusters.push({ cluster, width, height, x, y })
    return clusters
  }, [])

  return {
    totalWidth,
    totalHeight,
    coordinatedClusters,
    coordinatedNodes,
  }
}


