import React from 'react'
import Timeline from './Timeline'
import NetworkGrid from './NetworkGrid'
import { withState } from 'recompose'

import './SimulationChart.scss'
import eventsAndNodesAdapter from '../utils/eventsAndNodesAdapter'

const SimulationChart = ({ events: _events = [], nodes: _nodes = [], className = '', currentTime, onCurrentTimeChanged }) => {
  const { events, nodes } = eventsAndNodesAdapter({events: _events, nodes: _nodes})
  return (
    <div className={className} styleName="root">
      <NetworkGrid styleName="network" {...{ events, nodes, currentTime }}/>
      <Timeline styleName="timeline" {...{ events, nodes, currentTime, onCurrentTimeChanged }} />
    </div>
  )
}

const enhance = withState('currentTime', 'onCurrentTimeChanged', ({ events }) => {
  return events.length && new Date(events[events.length - 1].timestamp).getTime()
})

export default enhance(SimulationChart)
