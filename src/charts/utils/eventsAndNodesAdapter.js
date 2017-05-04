import Chance from 'chance'

const chance = new Chance()

const STUB_CLUSTER_NAMES = [
  'Testing',
  'Testing AB',
  'Archive',
  'Production ',
  '',
]

export default ({nodes, events}) => ({
  nodes: nodes.map(node => ({
    ...node,
    cluster: chance.weighted(STUB_CLUSTER_NAMES, [1, 2, 3, 4, 2]),
  })),
  events: (() => {
    const points = events.filter(({ type }) => type !== 'newAsset').map(event => {
      const data = event.data || {}
      return {
        ...event,
        date: new Date(event.timestamp).getTime(),
        source: (data.sourceNode || {}).id,
        method: data.method,
        nodeId: event.node.id,
        lastInSubnet: ['assetCompromised', 'newAsset'].includes(event.type),
        firstInSubnet: ['newStartingPointNode'].includes(event.type),
        campainId: 1,
      }
    })

    const assets = events.filter(({ type }) => ['assetCompromised', 'newAsset'].includes(type))

    return points.map(point => ({
      ...point,
      assets: assets.filter(asset => asset.node.id === point.nodeId).map(asset => ({
        ...asset,
        date: new Date(asset.timestamp).getTime(),
      })),
    }))
  })(),
})
