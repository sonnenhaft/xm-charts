import React from 'react'
import './QuickInformation.scss'
import { Desktop, Diskette, Snow } from '../IconsGroup'
const Icon = ({ children: __html }) => <svg dangerouslySetInnerHTML={{ __html }}/>

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

const Unknown = () => <span styleName="unknown"
  title="developer don't know how to calculate this field">
  Unknown!
</span>

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
        <div><b>Method: </b><Unknown/></div>
        <div><b>Source: </b><Unknown/></div>
      </div>
      <hr/>
      <div>
        <div><b>Data Assets: </b><Unknown/></div>
        <div><b>Staging: </b><Unknown/></div>
        <div><b>OS: </b><span>{element.os.name || element.os.type}</span></div>
        <div>
          <b>IP: </b>
          <span>{element.ipv4.map(({ data }) => data.join('.')).join(',')}</span>
        </div>
      </div>
    </div>}

    {type === 'cluster' && <div>
      <div styleName="header-with-name">
        <div styleName="grey-small-text">Segment</div>
        <div>(resize icon)</div>
      </div>
      <div styleName="name">{element.cluster === 'undefined' ? 'Unidentified' : element.cluster}</div>
      <hr/>
      <div styleName="cluster-icons">
        <div><Icon>{Desktop}</Icon>Device <br/>{data.device}</div>
        <div><Icon>{Diskette}</Icon> Data <br/>{data.data}</div>
        <div><Icon>{Snow}</Icon> Network <br/>{data.network}</div>
      </div>
      <div styleName="cluster-stats">
        <div><b>Total Devices</b><span>{element.coordinatedNodes.length}</span></div>
        <div><b>Compromised</b><span>{data.compromised}</span></div>
        <div><b>Reconned</b><span>{data.discovered}</span></div>
        <div><b>Undiscovered</b><span>{data.undiscovered}</span></div>
        {/*<div><b>Segment Rule</b><Unknown/></div>*/}
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
        <div><b>Local Rank</b><Unknown/></div>
        <div><b>Global Rank</b><Unknown/></div>
      </div>
      <div styleName="block-method-button">
        Block Method
      </div>
    </div>}
  </div>
}


export default QuickInformation
