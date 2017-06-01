import { defaultMemoize } from 'reselect'

const DEFAULT_STATE = {
  state: 'undiscovered', // undiscovered, discovered, compromised
  device: 'undiscovered',
  data: 'undiscovered',
  network: 'undiscovered',
  isStartingPoint: false,
}

function getStateFromEvent({ type, data, compromisedAssets }) {
  switch (type) {
    case 'newDiscoveredNode':
      return { state: 'discovered' }
    case 'nodeMarkAsRed':
      return { state: 'compromised' }
    case 'assetCompromised':
      return Object
        .entries(compromisedAssets)
        .filter(([_, value]) => value) // eslint-disable-line no-unused-vars
        .reduce((result, [key]) => ({ ...result, [key]: 'compromised' }), { isCompromised: true })
    case 'startingPoint':
    case 'newStartingPointNode':
      return { isStartingPoint: true }
    case 'newAsset':
      return Object
        .entries(data)
        .filter(([_, value]) => value) // eslint-disable-line no-unused-vars
        .reduce((result, [key]) => ({ ...result, [key]: 'discovered' }), { isDiscovered: true })
  }
}

export const getNodesEventsDataMap = defaultMemoize((events, datetime) => {

  return events
    .filter(({ date }) => datetime >= date)
    .reduce((result, event) => {
      const prevState = (result[event.node.id] || { ...DEFAULT_STATE })
      if (!prevState.events) {
        prevState.events = []
      }
      prevState.events.push(event)
      return ({
        ...result,
        [event.node.id]: {
          ...prevState,
          ...getStateFromEvent(event),
        },
      })
    }, {})
})
