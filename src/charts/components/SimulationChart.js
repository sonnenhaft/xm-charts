import React from 'react'
import Timeline from './Timeline'
import NetworkGrid from './NetworkGrid'
import { compose, withPropsOnChange, withState } from 'recompose'

import './SimulationChart.scss'
import eventsAdapter from '../utils/eventsAdapter'

const SimulationChart = props => {
  const { events, nodes, className } = props
  const { currentTime, onCurrentTimeChanged } = props
  const { selectedNodeIndex, onSelectedNodeIndexChanged } = props
  return (
    <div className={className} styleName="root">
      <NetworkGrid styleName="network" {...{ events, nodes, currentTime, selectedNodeIndex, onSelectedNodeIndexChanged }}/>
      <Timeline styleName="timeline" {...{ events, nodes, currentTime, onCurrentTimeChanged }} />
    </div>
  )
}

const getLastDateOrReturnZero = ({ events }) => events.length ? events[events.length - 1].date : 0
const enhance = compose(
  withPropsOnChange(['events'], ({ events }) => ({ events: eventsAdapter(events) })),
  // TODO(Dani): extract this states to your component, us to use in here them as props
  withState('currentTime', 'onCurrentTimeChanged', getLastDateOrReturnZero),
  withState('selectedNodeIndex', 'onSelectedNodeIndexChanged',  -1),
  withPropsOnChange(({ events, onCurrentTimeChanged }, newProps) => {
    // TODO(Dani): advice how to set state when component was not mounted yet
    // because current code is breaking for hot reload
    if ( newProps.events !== events ) {
      onCurrentTimeChanged(getLastDateOrReturnZero(newProps))
    }
    return true
  }, props => props),
)

export default enhance(SimulationChart)
