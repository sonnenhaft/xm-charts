export const isAssetCompromised = type => 'assetCompromised' === type

export const isStaringPoint = type => 'newStartingPointNode' === type

export const isSpecial = ({ type }) => isStaringPoint(type) || isAssetCompromised(type)

export const getEventInfo = ({ data = {} }) => ({
  source: (data.sourceNode || {}).id,
  method: data.method,
})
