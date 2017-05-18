import React, { Component } from 'react'
import Timeline from './Timeline'
import NetworkGrid from './NetworkGrid'

import './SimulationChart.scss'
import eventsAdapter from '../utils/eventsAdapter'


const getLastDateOrReturnZero = events => {
  return (events && events.length) ? events[events.length - 1].date : 0
}

export default class SimulationChart extends Component {

  state = {
    selectedNodeIndex: -1,
    events: undefined,
    currentTime: undefined,
  }

  componentWillMount() {
    this.setRawEvents(this.props.events)
  }

  componentWillReceiveProps({ events }) {
    if ( this.props.events !== events ) {
      this.setRawEvents(events)
    }
  }

  setRawEvents(rawEvents) {
    const events = eventsAdapter(rawEvents)
    const currentTime =  getLastDateOrReturnZero(events)
    this.state = {events, currentTime}
  }

  onSelectedNodeIndexChanged = selectedNodeIndex => this.setState({ selectedNodeIndex })

  onCurrentTimeChanged = currentTime => this.setState({ currentTime })

  render() {

    const {
      props: {nodes, className},
      state: {currentTime, selectedNodeIndex, events},
      onCurrentTimeChanged,
      onSelectedNodeIndexChanged,
    } = this

    return (
      <div className={className} styleName="root">
        <NetworkGrid styleName="network" {...{ events, nodes, currentTime, selectedNodeIndex, onSelectedNodeIndexChanged }}/>
        <Timeline styleName="timeline" {...{ events, nodes, currentTime, onCurrentTimeChanged }} />
      </div>
    )
  }
}
