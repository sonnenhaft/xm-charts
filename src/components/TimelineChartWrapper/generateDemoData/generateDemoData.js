import loremIpsum from 'lorem-ipsum'
import Chance from 'chance'
import nodes from './node.json'
import events from './events.json'

const chance = new Chance()

export function createEvent({eventId, campainId, minDate, maxDate, nodes}) {
  return {
    id: `${eventId}_${campainId}`,
    name: loremIpsum({count: 2, units: 'words'}).split(' ').join('-'),
    method: loremIpsum({count: 2, units: 'words'}),
    source: loremIpsum({count: 2, units: 'words'}),
    campainId,
    flag: chance.pickone(['asset', 'deviceSvgIcon']),
    compromized: chance.bool({likelihood: 25}),
    nodeId: chance.pickone(nodes).id,
    date: chance.hammertime({min: minDate, max: maxDate}),
  }
}

export default isYearly => {
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
