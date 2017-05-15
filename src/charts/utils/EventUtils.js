const circleTypes = ['assetCompromised', 'newAsset']

export const isTrafficLight = type => circleTypes.includes(type)

export const isFirstInSubnet = type => 'newStartingPointNode' === type

export const isSpecial = ({type}) => isFirstInSubnet(type) || isTrafficLight(type)

export const getEventInfo = ({data = {}}) => ({
  source: (data.sourceNode || {}).id,
  method: data.method,
})
