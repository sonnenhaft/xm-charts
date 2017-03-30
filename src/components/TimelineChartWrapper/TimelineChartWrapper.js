import React, { Component } from 'react'

import styles from './TimelineChartWrapper.scss'
import TimelineChart from '../TimelineChart/TimelineChart'
import SquareButtons from './SquareButtons/SquareButtons'
import ControlPanel from './ControlPanel/ControlPanel'

export default class TimelineChartWrapper extends Component {
  constructor (props) {
    super(props)
    this.state = { isToggled: false, zoomFactor: 1, currentTime: null }
  }

  onToggled = () => this.setState({ isToggled: !this.state.isToggled })
  onZoomed = zoomFactor => this.setState({ zoomFactor })
  onTimeChanged = currentTime => this.setState({ currentTime })

  render () {
    const { isToggled, zoomFactor, currentTime } = this.state
    const chartData = this.props.data
    const { onTimeChanged, onToggled, onZoomed } = this
    return <div className={ styles['timeline-chart-wrapper'] }>
      <ControlPanel { ...{ isToggled, zoomFactor, currentTime } } />
      <TimelineChart { ...{ isToggled, chartData, onZoomed, onTimeChanged } } />
      <SquareButtons { ...{ onToggled, isToggled } } />
    </div>
  }
}
