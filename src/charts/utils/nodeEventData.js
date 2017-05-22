import { defaultMemoize } from 'reselect'

const DEFAULT_STATE = {
  state: 'undiscovered', // undiscovered, discovered, compromised
  device: 'undiscovered',
  data: 'undiscovered',
  network: 'undiscovered',
  isStartingPoint: false,
}

function getStateFromEvent({type, data, compromisedAssets}) {
  switch (type) {
    case 'newDiscoveredNode':
      return {state: 'discovered'}
    case 'nodeMarkAsRed':
      return {state: 'compromised'}
    case 'assetCompromised':
      return Object
              .entries(compromisedAssets)
              .filter(([_, value]) => value) // eslint-disable-line no-unused-vars
              .reduce((result, [key]) => ({...result, [key]: 'compromised'}), {})
    case 'startingPoint':
    case 'newStartingPointNode':
      return {isStartingPoint: true}
    case 'newAsset':
      return Object
        .entries(data)
        .filter(([_, value]) => value) // eslint-disable-line no-unused-vars
        .reduce((result, [key]) => ({...result, [key]: 'discovered'}), {})
  }
}

export const getNodesEventsDataMap = defaultMemoize((events, datetime)  => {

  return events
          .filter(({date}) => datetime >= date)
          .map(es => console.log(es) || es)
          .reduce((result, event) =>  ({
            ...result,
            [event.node.id]: {
              ...(result[event.node.id] || {...DEFAULT_STATE}),
              ...getStateFromEvent(event),
            },
          }), {})
})
