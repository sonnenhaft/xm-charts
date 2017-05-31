import {groupBy} from 'lodash'

const MILLISECOND = 1

function getMicrosconds(time) {
  return new Date(time).getTime() //+ Number(`0.${/\.(\d+)Z/.exec(time)[1]}`)
}

const shiftSameTimestamps = assets => {
  for (let i = 1; i < assets.length; i++) {
    if ( assets[i].date === assets[i - 1].date ) {
      assets[i].date += MILLISECOND
    }
  }
  return assets
}

export default events => {

  const eventsWithDate = events.map(e => ({...e, date: getMicrosconds(e.timestamp)}))
    .filter(e => e.node)

  shiftSameTimestamps(eventsWithDate)

  const timelineEvents = eventsWithDate.filter(({ type }) => type !== 'newAsset')
  const assetEvents = eventsWithDate.filter(({ type }) => type === 'newAsset' || type === 'assetCompromised')

  const assetEventsByNode = groupBy(assetEvents, e => e.node.id)
  timelineEvents.forEach(e => {
    if (!e.node) {
      console.log(e)
    }
    e.filteredAssets = assetEventsByNode[e.node.id] // allNodesAssets
  })

  return timelineEvents
}
