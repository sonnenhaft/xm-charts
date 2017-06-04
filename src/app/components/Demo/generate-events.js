const SOURCE_SET_NUMBER = '2'
const FILE_NUMBER = '7'
const NUMBER_OF_NODES_TO_ADD = 1000

const nodes = require(`./nodes${SOURCE_SET_NUMBER}.json`)
const events = require(`./events${SOURCE_SET_NUMBER}.json`)
const fs = require('fs')

const PREFIX = `_${FILE_NUMBER}`

const randItem = (arr, offset = 0) => arr[Math.round(offset + Math.random() * (arr.length - 1 - offset))]
const rand = (arr, offset = 0) => Object.assign({}, randItem(arr, offset))

nodes.forEach(node => {
  node.agentId += PREFIX
  node._id += PREFIX
})

events.forEach(event => {
  event.id += PREFIX
  event.node.id += PREFIX
  if ( event.data && event.data.sourceNode ) {
    event.data.sourceNode.id += PREFIX
  }
})

const NUMBER_OF_EVENTS_TO_ADD = NUMBER_OF_NODES_TO_ADD * events.length / nodes.length

for (let i = 0; i < NUMBER_OF_NODES_TO_ADD; i++) {
  const randomItem = rand(nodes)
  randomItem.agentId = `${randomItem.agentId}_${i}`
  randomItem._id = `${randomItem._id}_${i}`
  randomItem.name = `${randomItem.name}_${i}`
  nodes.push(randomItem)
}

const startingPoints = events.filter(({ type }) => type === 'newStartingPointNode').map(({ node: {id} }) => id)

for (let i = 0; i < NUMBER_OF_EVENTS_TO_ADD; i++) {
  const lastEvent = events[events.length - 1]
  const event = rand(events)

  events.push(Object.assign(event, {
    id: `${event.id}_${i}`,
    type: 'newDiscoveredNode',
    node: { id: rand(nodes, NUMBER_OF_NODES_TO_ADD).agentId },
    timestamp: new Date(new Date(lastEvent.timestamp).getTime() + 1000).toString(),
    data: Object.assign(event.data, {
      method: 'Generated randomly',
      sourceNode: { id: randItem(startingPoints) },
    }),
    networkSuperiority: Math.min((lastEvent.networkSuperiority + Math.random()), 100),
  }))
}

fs.writeFileSync(`${__dirname  }/nodes${FILE_NUMBER}.json`, JSON.stringify(nodes, null, 4))
fs.writeFileSync(`${__dirname  }/events${FILE_NUMBER}.json`, JSON.stringify(events, null, 4))
