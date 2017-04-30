import React from 'react'
import Timeline from './Timeline'
import NetworkGrid from './NetworkGrid'
import {withState} from 'recompose'

import './SimulationChart.scss'


const SimulationChart = ({events = [], nodes = [], className = '', currentTime, onCurrentTimeChanged}) => (
  <div className={className} styleName="root">
    <NetworkGrid styleName="network" {...{ events, nodes, currentTime }}></NetworkGrid>
    <Timeline styleName="timeline" {...{ events, nodes, currentTime, onCurrentTimeChanged }} />
  </div>
)

const enhance =
  withState('currentTime', 'onCurrentTimeChanged', ({events}) => events.length && events[events.length - 1].date)


export default enhance(SimulationChart)
