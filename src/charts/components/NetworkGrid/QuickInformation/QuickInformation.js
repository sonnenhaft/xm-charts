import React from 'react'
import './QuickInformation.scss'

function getNodeStatus({isStartingPoint, isDiscovered, isCompromised} = {}) {
  if (isStartingPoint) {
    return 'Starting point'
  } else if(isDiscovered) {
    return 'Discovered'
  } else if (isCompromised) {
    return 'Asset compromised'
  } else {
    return 'undefined'
  }
}

const QuickInformation = ({ selectedElement, status }) => {
  return <div styleName="quick-information">
    {selectedElement.type === 'node' && <div>
      <div styleName="header-with-name">
        <div styleName="grey-small-text">Device</div>
        <div>(resize icon)</div>
      </div>
      <div styleName="name">{selectedElement.element.name}</div>
      <div>event state icons</div>
      <div>
        <div>
          <b>Status: </b>
          <span>{getNodeStatus(status[selectedElement.element.agentId])}</span>
        </div>
        <div><b>Method: </b><span>N/A</span></div>
        <div><b>Source: </b><span>N/A</span></div>
      </div>
      <hr/>
      <div>
        <div><b>Data Assets: </b><span>N/A</span></div>
        <div><b>Staging: </b><span>N/A</span></div>
        <div><b>OS: </b><span>{selectedElement.element.os.name}</span></div>
        <div>
          <b>IP: </b>
          {selectedElement.element.ipv4.map(({ data }) => data.join('.')).join(',')}
        </div>
      </div>
    </div>}
  </div>
}


export default QuickInformation
