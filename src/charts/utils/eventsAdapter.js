export default events => {
  const points = events.filter(({ type }) => type !== 'newAsset').map(event => {
    const data = event.data || {}
    return {
      ...event,
      date: new Date(event.timestamp).getTime(),

      source: (data.sourceNode || {}).id,
      method: data.method,
      nodeId: event.node.id,
      lastInSubnet: ['assetCompromised', 'newAsset'].includes(event.type),
      firstInSubnet: ['newStartingPointNode'].includes(event.type)
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
}
