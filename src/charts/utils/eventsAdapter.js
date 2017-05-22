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

  shiftSameTimestamps(eventsWithDate)

  const timelineEvents = eventsWithDate.filter(({ type }) => type !== 'newAsset')
  const assetEvents = eventsWithDate.filter(({ type }) => type === 'newAsset' || type === 'assetCompromised')
  const assetEventsByNode = groupBy(assetEvents, e => e.node.id)

  timelineEvents.forEach(e => {
    e.filteredAssets = assetEventsByNode[e.node.id] //allNodesAssets
  })

  return timelineEvents

  // const points = events.filter(({ type }) => type !== 'newAsset').map(event => {
  //   return {
  //     ...event,
  //     date: getMicrosconds(event.timestamp),
  //   }
  // })
  // shiftSameTimestamps(points)
  //
  // const assets = events.filter(({ type }) => ['assetCompromised', 'newAsset'].includes(type))
  //
  // return points.map(point => {
  //   const filteredAssets = assets.filter(asset => asset.node.id === point.node.id).map(asset => ({
  //     ...asset,
  //     date: getMicrosconds(asset.timestamp),
  //   }))
  //
  //   shiftSameTimestamps(filteredAssets)
  //   return ({ ...point, filteredAssets })
  // })
}
