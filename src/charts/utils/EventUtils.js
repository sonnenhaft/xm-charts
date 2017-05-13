const circleTypes = ['assetCompromised', 'newAsset']

export const isCircle = type => circleTypes.includes(type)

export const isFirstInSubnet = type => 'newStartingPointNode' === type

export const getEventInfo = ({data = {}}) => ({
  source: (data.sourceNode || {}).id,
  method: data.method,
})
