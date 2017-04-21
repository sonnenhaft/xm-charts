import nodes from './node.json'
import events from './events.json'

export default () => {
  const campains = [{id: 1, events}]

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

  return {campains, events, nodes}
}
