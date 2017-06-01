import React from 'react'
import './QuickInformation.scss'

function getNodeStatus({ isStartingPoint, isDiscovered, isCompromised } = {}) {
  if ( isStartingPoint ) {
    return 'Starting point'
  } else if ( isDiscovered ) {
    return 'Discovered'
  } else if ( isCompromised ) {
    return 'Asset compromised'
  } else {
    return 'undefined'
  }
}

const QuickInformation = ({ selectedElement: { element, type }, status, getClusterData }) => {
  const data = {}
  if ( type === 'cluster' ) {
    Object.assign(data, getClusterData(element))
  }
  return <div styleName="quick-information">
    {type === 'node' && <div>
      <div styleName="header-with-name">
        <div styleName="grey-small-text">Device</div>
        <div>(resize icon)</div>
      </div>
      <div styleName="name">{element.name}</div>
      <div>event state icons</div>
      <div>
        <div>
          <b>Status: </b>
          <span>{getNodeStatus(status[element.agentId])}</span>
        </div>
        <div><b>Method: </b><span>N/A</span></div>
        <div><b>Source: </b><span>N/A</span></div>
      </div>
      <hr/>
      <div>
        <div><b>Data Assets: </b><span>N/A</span></div>
        <div><b>Staging: </b><span>N/A</span></div>
        <div><b>OS: </b><span>{element.os.name}</span></div>
        <div>
          <b>IP: </b>
          {element.ipv4.map(({ data }) => data.join('.')).join(',')}
        </div>
      </div>
    </div>}

    {type === 'cluster' && <div>
      <div styleName="header-with-name">
        <div styleName="grey-small-text">Segment</div>
        <div>(resize icon)</div>
      </div>
      <div styleName="name">{element.cluster}</div>
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

    {type === 'arrow' && <div>
      <div styleName="header-with-name">
        <div styleName="grey-small-text">Method</div>
        <div>(resize icon)</div>
      </div>
      <div styleName="name">{element.event.data.method}</div>
      <hr/>
      <div styleName="arrow-stats">
        <div><b>Source Device</b><span>{element.startNode.node.name}</span></div>
        <div><b>Target Device</b><span>{element.endNode.node.name}</span></div>
        <div><b>Local Rank</b><span>N/A</span></div>
        <div><b>Global Rank</b><span>N/A</span></div>
      </div>
      <div styleName="block-method-button">
        Block Method
      </div>
    </div>}
  </div>
}


export default QuickInformation
