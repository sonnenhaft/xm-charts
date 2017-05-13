export default events => {
  const points = events.filter(({ type }) => type !== 'newAsset').map(event => {
    return {
      ...event,
      date: new Date(event.timestamp).getTime(),
    }
  })

  const assets = events.filter(({ type }) => ['assetCompromised', 'newAsset'].includes(type))

  return points.map(point => ({
    ...point,
    assets: assets.filter(asset => asset.node.id === point.node.id).map(asset => ({
      ...asset,
      date: new Date(asset.timestamp).getTime(),
    })),
  }))
}
