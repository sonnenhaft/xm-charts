import React from 'react'
import Timeline from './Timeline'
import NetworkGrid from './NetworkGrid'
import {withState, compose, withPropsOnChange} from 'recompose'

import './SimulationChart.scss'
import eventsAndNodesAdapter from '../utils/eventsAndNodesAdapter'

const SimulationChart = ({events = [], nodes = [], className = '', currentTime, onCurrentTimeChanged}) => (
  <div className={className} styleName="root">
    <NetworkGrid styleName="network" {...{events, nodes, currentTime}}/>
    <Timeline styleName="timeline" {...{events, nodes, currentTime, onCurrentTimeChanged}} />
  </div>
)


const enhance = compose(
  withPropsOnChange(['nodes', 'events'], ({nodes, events}) => eventsAndNodesAdapter({events, nodes})),
  withState('currentTime', 'onCurrentTimeChanged', ({events}) => events.length && new Date(events[events.length - 1].timestamp).getTime())
)

export default enhance(SimulationChart)
