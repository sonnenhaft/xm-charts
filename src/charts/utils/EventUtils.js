export const isAssetCompromised = type => 'assetCompromised' === type

export const isStaringPoint = type => 'newStartingPointNode' === type

export const isSpecial = ({ type }) => isStaringPoint(type) || isAssetCompromised(type)
