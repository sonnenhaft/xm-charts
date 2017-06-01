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

const QuickInformation = ({ selectedElement, status, getClusterData }) => {
  const data = {}
  if (selectedElement.type === 'cluster') {
    Object.assign(data, getClusterData(selectedElement.element))
  }
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

    {selectedElement.type === 'cluster' && <div>
      <div styleName="header-with-name">
        <div styleName="grey-small-text">Segment</div>
        <div>(resize icon)</div>
      </div>
      <div styleName="name">{selectedElement.element.cluster}</div>
      <hr/>
      <div styleName="cluster-icons">
        <div>(icon) Device {data.device}</div>
        <div>(icon) Data {data.data}</div>
        <div>(icon) Network {data.network}</div>
      </div>
      <div styleName="cluster-stats">
        <div><b>Total Devices</b><span>N/A</span></div>
        <div><b>Compromised</b><span>N/A</span></div>
        <div><b>Reconned</b><span>N/A</span></div>
        <div><b>Undiscovered</b><span>N/A</span></div>
        <div><b>Segment Rule</b><span>N/A</span></div>
      </div>
    </div>}
  </div>
}


export default QuickInformation
