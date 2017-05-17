import React, { Component } from 'react'
import Timeline from './Timeline'
import NetworkGrid from './NetworkGrid'

import './SimulationChart.scss'
import eventsAdapter from '../utils/eventsAdapter'


const getLastDateOrReturnZero = events => {
  return (events && events.length) ? events[events.length - 1].date : 0
}

export default class SimulationChart extends Component {
  onSelectedNodeIndexChanged = selectedNodeIndex => this.setState({ selectedNodeIndex })
  onCurrentTimeChanged = currentTime => this.setState({ currentTime })

  constructor(props) {
    super(props)
    const events = eventsAdapter(props.events)
    this.state = {
      selectedNodeIndex: -1,
      events: events,
      currentTime: getLastDateOrReturnZero(events),
    }
  }

  componentWillReceiveProps({ events }) {
    if ( this.props.events !== events ) {
      events = eventsAdapter(events)
      this.setState({ events, currentTime: getLastDateOrReturnZero(events) })
    }
  }

  render() {
    const props = this.props
    const state = this.state
    const { nodes, className } = props
    const { currentTime, selectedNodeIndex, events } = state
    const { onCurrentTimeChanged, onSelectedNodeIndexChanged } = this

    return (
      <div className={className} styleName="root">
        <NetworkGrid styleName="network" {...{ events, nodes, currentTime, selectedNodeIndex, onSelectedNodeIndexChanged }}/>
        <Timeline styleName="timeline" {...{ events, nodes, currentTime, onCurrentTimeChanged }} />
      </div>
    )
  }
}
