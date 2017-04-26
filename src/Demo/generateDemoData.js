import nodes from './demo-nodes.json'
import events from './demo-events.json'

events.forEach(event => {
  let {
    timestamp,
    type,
    node: {id: nodeId},
    data: {method, sourceNode: {id: source} = {}},
  } = event
  let date = new Date(timestamp).getTime()
  let compromized = type === 'newDiscoveredNode'

  Object.assign(event, {
    date,
    source,
    nodeId,
    method,
    campainId: 1,
    compromized,
  })
  events[2].firstInSubnet = true
  events[events.length - 2].lastInSubnet = true
})

export default () => ({events, nodes})