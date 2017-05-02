import {
  findKey,
} from 'lodash'



function addEventData(existing, {type, data}) {
  switch (type) {
    case 'newDiscoveredNode': {
      if (!existing.state === 'undiscovered') {
        existing.state = 'discovered'
      }
      break
    }
    case 'nodeMarkAsRed': {
      existing.state = 'compromised'
    }
      break
    case 'assetCompromised': {
      existing[data.asset.ruleGroup] = 'compromised'
    }
      break
    case 'startingPoint':
    case 'newStartingPointNode': {
      existing.isStartingPoint = true
    }
      break
    case 'newAsset': {
      existing[findKey(data)] = 'discovered'
    }
      break
  }

}

export function getNodesEventsDataMap(events, date) {

  return events
    .filter(e => e.date <= date)
    .reduce((nodeMap, e) => {
      const nodeId = e.node.id
      nodeMap[nodeId] = nodeMap[nodeId] ||
        {
          state: 'undiscovered', // undiscovered, discovered, compromised
          device: 'undiscovered',
          data: 'undiscovered',
          network: 'undiscovered',
          isStartingPoint: false,
        }
      addEventData(nodeMap[nodeId], e)

    }, {})

}


/*

 {
 assets: {}
 }

 */
