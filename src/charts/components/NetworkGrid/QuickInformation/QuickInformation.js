import React from 'react'
import './QuickInformation.scss'
import { Desktop, Diskette, Snow } from '../IconsGroup'
import { compose, withState } from 'recompose'
import collapseSvg from './Collapse.svg'
import expandSvg from './Expand.svg'
import TabsHeader from './TabsHeader'
import d3 from 'charts/utils/decorated.d3.v4'

const Icon = ({ className, children: __html }) => {
 return <div {...{className}}><svg dangerouslySetInnerHTML={{ __html }}/></div>
}

const getIp = ipv4 => ipv4.length && ipv4[0].data.join('.')

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

const getActiveClass = (status, { agentId }, key) => {
  console.log(status[agentId] && status[agentId][key])
  const val = status[agentId] && status[agentId][key]
  return (val === 'discovered' || val === 'compromised') ? 'icon-active' : ''
}

const Unknown = () => <span title="developer don't know how to calculate this field"
                            styleName="unknown">Unknown!</span>

const headers = { node: 'Device', cluster: 'Segment', arrow: 'Method' }

const QuickInformation = props => {
  const { selectedElement: { element, type }, status, getClusterData, campainVisible } = props

  const { tabsVisible, setTabsVisible } = props
  const clusterData = {}
  if ( type === 'cluster' ) {
    Object.assign(clusterData, getClusterData(element))
  }
  return <div styleName="quick-information">
    <div styleName="header-with-name">
      <div>
        <div styleName="grey-small-text">{headers[type]}</div>
        <div styleName="name">
          {type === 'node' && <span>{element.name}</span>}
          {type === 'cluster' && <span>
        {element.cluster === 'undefined' ? 'Unidentified' : element.cluster}
      </span>}
          {type === 'arrow' && <span>{element.event.data.method}</span>}
        </div>
      </div>

      <div onClick={() => setTabsVisible(!tabsVisible)} styleName="resize-icon">
        <Icon>{tabsVisible ? collapseSvg : expandSvg}</Icon>
      </div>
    </div>

    {type === 'node' && <div styleName="event-state-icons">
      <Icon styleName={getActiveClass(status, element, 'data')}>{Desktop}</Icon>
      <Icon styleName={getActiveClass(status, element, 'device')}>{Diskette}</Icon>
      <Icon styleName={getActiveClass(status, element, 'network')}>{Snow}</Icon>
    </div>}

    {tabsVisible && <TabsHeader {...{ ...props, type: headers[type] }}/>}

    {type === 'node' && <div>
      {tabsVisible && <div>
        {campainVisible && <div styleName="lines">
          <div><b styleName="header">Recon Event</b></div>
          <div><b>Time</b><Unknown/></div>
          <div><b>Method</b><Unknown/></div>
          <div><b>Source</b><Unknown/></div>
          <hr/>
          <div><b styleName="header">Compromise Event</b></div>
          <div><b>Time</b><Unknown/></div>
          <div><b>Method</b><Unknown/></div>
          <div><b>Source</b><Unknown/></div>
          <hr/>
          <div><b styleName="header">Outgoing Recon Event</b></div>
          <div><b>Total Methods</b><Unknown/></div>
          <div><b>Total Devices</b><Unknown/></div>
        </div>}
        {!campainVisible && <div styleName="lines">
          <div><b styleName="header">Basic Details</b></div>
          <div><b>Device Name: </b><span>{element.name}</span></div>
          <div><b>OS: </b><span>{element.os.name || element.os.type}</span></div>
          <div>
            <b>IP: </b>
            <span>{getIp(element.ipv4)}</span>
          </div>
          <div><b>Mac Address: </b><Unknown/></div>
          <div><b>Last User: </b><Unknown/></div>
          <hr/>
          <div><b styleName="header">Agent Statistics</b></div>
          <div><b>ID: </b><span>{element.agentId}</span></div>
          <div><b>Uptime: </b><Unknown/></div>
          <div>
            <b>Last Communication Time: </b>
            <span>{d3.timeFormat('%m-%d-%Y %H:%M:%S')(new Date(element.lastConnectionTime))}</span>
          </div>
          <div><b>Brandwidth: </b><Unknown/></div>
          <div><b>CPU: </b><span>{element.arch}</span></div>
          <div><b>Memory: </b><Unknown/></div>
        </div>}
      </div>}
      {!tabsVisible && <div>
        <div styleName="lines">
          <div>
            <b>Status: </b>
            <span>{getNodeStatus(status[element.agentId])}</span>
          </div>
          <div><b>Method: </b><Unknown/></div>
          <div><b>Source: </b><Unknown/></div>
        </div>
        <hr/>
        <div styleName="lines">
          <div><b>Data Assets: </b><Unknown/></div>
          <div><b>Staging: </b><Unknown/></div>
          <div><b>OS: </b><span>{element.os.name || element.os.type}</span></div>
          <div>
            <b>IP: </b>
            <span>{getIp(element.ipv4)}</span>
          </div>
        </div>
      </div>}
    </div>}

    {type === 'cluster' && <div>
      {!tabsVisible && <div>
        <div styleName="cluster-icons">
          <div><Icon>{Desktop}</Icon>Device <br/>{clusterData.device}</div>
          <div><Icon>{Diskette}</Icon> Data <br/>{clusterData.data}</div>
          <div><Icon>{Snow}</Icon> Network <br/>{clusterData.network}</div>
        </div>
        <div styleName="cluster-stats">
          <div><b>Total Devices</b><span>{element.coordinatedNodes.length}</span></div>
          <div><b>Compromised</b><span>{clusterData.compromised}</span></div>
          <div><b>Reconned</b><span>{clusterData.discovered}</span></div>
          <div><b>Undiscovered</b><span>{clusterData.undiscovered}</span></div>
          <div><b>Segment Rule</b><Unknown/></div>
        </div>
      </div>}
      {tabsVisible && <div>
        {campainVisible && <div >
          <div styleName="lines">
            <div><b styleName="header">Assets Summary</b></div>
            <div>
              <b>Total Assets</b><span>
              <Unknown/>/{element.coordinatedNodes.length}</span>
            </div>
            <div><b>Compromised</b><span>{clusterData.compromised}</span></div>
            <div><b>Reconned</b><span>{clusterData.discovered}</span></div>
            <div><b>Undiscovered</b><span>{clusterData.undiscovered}</span></div>
          </div>
          <div styleName="cluster-icons">
            <div><Icon>{Desktop}</Icon>Device <br/>{clusterData.device}</div>
            <div><Icon>{Diskette}</Icon> Data <br/>{clusterData.data}</div>
            <div><Icon>{Snow}</Icon> Network <br/>{clusterData.network}</div>
          </div>
          <hr/>
          <div styleName="lines">
            <div><b styleName="header">Top 3 Recon Methods</b></div>
            <div><b>Method Name</b><Unknown/></div>
            <div><b>Method Name</b><Unknown/></div>
            <div><b>Method Name</b><Unknown/></div>
            <hr/>
            <div><b styleName="header">Top 3 Exploit Methods</b></div>
            <div><b>Method Name</b><Unknown/></div>
            <div><b>Method Name</b><Unknown/></div>
            <div><b>Method Name</b><Unknown/></div>
            <hr/>
            <div><b styleName="header">Outgoing Reconn Events</b></div>
            <div><b>Total</b><Unknown/></div>
            <div><b>Methods</b><Unknown/></div>
          </div>
        </div>}
        {!campainVisible && <div styleName="lines">
          <div><b styleName="header">Basic Details</b></div>
          <div>
            <b>Segment Name</b>
            <span>{element.cluster === 'undefined' ? 'Unidentified' : element.cluster}</span>
          </div>
          <div><b>OU</b><Unknown/></div>
          <div><b>IP</b><Unknown/></div>
          <div><b>Segment Rule</b><Unknown/></div>
          <div><b>Total Devices</b><span>{element.coordinatedNodes.length}</span></div>
          <hr/>
          <div><b styleName="header">Segment Statistics</b></div>
          <div><Unknown/></div>
          <div><Unknown/></div>
          <div><Unknown/></div>
        </div>}
      </div>}
    </div>}

    {type === 'arrow' && <div>
      {!tabsVisible && <div>
        <hr/>
        <div styleName="arrow-stats">
          <div><b>Source Device</b><span>{element.startNode.node.name}</span></div>
          <div><b>Target Device</b><span>{element.endNode.node.name}</span></div>
          <div><b>Local Rank</b><Unknown/></div>
          <div><b>Global Rank</b><Unknown/></div>
        </div>
      </div>}
      {tabsVisible && <div>
        {!campainVisible && <div>
          <div><b styleName="header">Method Description</b></div>
          <Unknown/>
          <hr/>
          <div styleName="lines">
            <div><b styleName="header">Method Statistics</b></div>
            <div><b>Local Rank</b><Unknown/></div>
            <div><b>Global Rank</b><Unknown/></div>
            <div><Unknown/></div>
            <div><Unknown/></div>
          </div>
        </div>}
        {campainVisible && <div>
          <div styleName="lines">
            <div><b styleName="header">Source Device</b></div>
            <div><b>Device Name</b><span>{element.startNode.node.name}</span></div>
            <div><b>IP</b><span>{getIp(element.startNode.node.ipv4)}</span></div>
            <div><b>Mac</b><Unknown/></div>
          </div>
          <hr/>
          <div styleName="lines">
            <div><b styleName="header">Target Device</b></div>
            <div><b>Device Name</b><span>{element.endNode.node.name}</span></div>
            <div><b>IP</b><span>{getIp(element.endNode.node.ipv4)}</span></div>
            <div><b>Mac</b><Unknown/></div>
          </div>
          <hr/>
          <div styleName="lines">
            <div><b styleName="header">Campain Statistics</b></div>
            <div><b>Total Devices Compromised</b><Unknown/></div>
            <div><b>Total Assets Compromised</b><Unknown/></div>
          </div>
          <br/>
          <br/>
          <div styleName="cluster-icons">
            <div><Icon>{Desktop}</Icon>Device <br/><Unknown/></div>
            <div><Icon>{Diskette}</Icon> Data <br/><Unknown/></div>
            <div><Icon>{Snow}</Icon> Network <br/><Unknown/></div>
          </div>
          <br/>
          <br/>
        </div>}
      </div>}
      <div styleName="block-method-button">
        Block Method
      </div>
    </div>}
  </div>
}

export default compose(
  withState('tabsVisible', 'setTabsVisible', false),
  withState('campainVisible', 'setCampainVisible', false),
)(QuickInformation)
