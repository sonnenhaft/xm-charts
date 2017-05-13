import React from 'react'
import Timeline from './Timeline'
import NetworkGrid from './NetworkGrid'
import { compose, withPropsOnChange, withState } from 'recompose'

import './SimulationChart.scss'
import eventsAdapter from '../utils/eventsAdapter'

const SimulationChart = props => {
  const { events, nodes, className } = props
  const { currentTime, onCurrentTimeChanged } = props
  return (
    <div className={className} styleName="root">
      <NetworkGrid styleName="network" {...{ events, nodes, currentTime }}/>
      <Timeline styleName="timeline" {...{ events, nodes, currentTime, onCurrentTimeChanged }} />
    </div>
  )
}

const getLastDateOrReturnZero = ({ events }) => events.length ? events[events.length - 1].date : 0
const enhance = compose(
  withPropsOnChange(['events'], ({ events }) => ({ events: eventsAdapter(events) })),
  withState('currentTime', 'onCurrentTimeChanged', getLastDateOrReturnZero),
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
