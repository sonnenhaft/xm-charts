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
  events: events.filter(({ type }) => type !== 'newAsset').map(event => {
    const data = event.data || {}
    return {
      ...event,
      date: new Date(event.timestamp).getTime(),
      source: (data.sourceNode || {}).id,
      method: data.method,
      nodeId: event.node.id,
      lastInSubnet: event.type === 'assetCompromised',
      firstInSubnet: event.type === 'startingPoint',
      campainId: 1,
    }
  }),
})
