import React, {Component} from 'react'

import styles from './TimelineChartWrapper.scss'
import TimelineChart from '../TimelineChart/TimelineChart'
import {RightBar} from './RightBar'
import {LeftBar} from './LeftBar'

import NetworkGrid from '../NetworkGrid'

// chrome was crashing with higher value with higher value
const MAX_ZOOM = Math.min(Math.pow(10, 5) * 5)
const MIN_ZOOM = 1

export default class TimelineChartWrapper extends Component {
  constructor(props) {
    super(props)
    let currentTime = 0
    const events = props.chartData.events
    if (events) {
      currentTime = events[events.length - 1].date
    }
    this.state = {
      isToggled: false,
      zoomFactor: 1,
      zoomPosition: 0,
      playingInterval: null,
      currentTime,
      currentSpeed: 1,
    }
  }

  onCurrentSpeedChanged = (currentSpeed, cb) => this.setState({currentSpeed}, cb)
  onCurrentTimeChanged = currentTime => this.setState({currentTime})
  onToggledChanged = isToggled => this.setState({isToggled})
  onPlayingIntervalChanged = (playingInterval, cb) => this.setState({playingInterval}, cb) // necessary to disable animation

  onZoomFactorChangedAndMoved = ({zoomFactor, zoomPosition}) => {
    const safeZoom = Math.min(MAX_ZOOM, Math.max(zoomFactor, MIN_ZOOM))
    this.setState({zoomPosition, zoomFactor: safeZoom})
  }

  onZoomFactorChanged = zoomFactor => {
    const zoomPosition = zoomFactor === 1 ? 0 : this.state.zoomPosition
    this.onZoomFactorChangedAndMoved({zoomFactor, zoomPosition})
  }

  render() {
    const {
      onZoomFactorChangedAndMoved, onCurrentTimeChanged,
      onZoomFactorChanged, onToggledChanged,
      onCurrentSpeedChanged, onPlayingIntervalChanged,
    } = this
    const {isToggled, zoomFactor, zoomPosition, currentTime, currentSpeed, playingInterval} = this.state

    const chartData = this.props.chartData
    const {events} = chartData

    return <div>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <NetworkGrid {...{currentTime, chartData}}>Marketing</NetworkGrid>
      </div>
      <div className={styles['timeline-chart-wrapper']}>
        <LeftBar {...{
          currentTime, onCurrentTimeChanged,
          currentSpeed, onCurrentSpeedChanged,
          playingInterval, onPlayingIntervalChanged,
          isToggled, events,
        }} />
        <TimelineChart {...{
          currentTime, onCurrentTimeChanged,
          zoomFactor, zoomPosition, onZoomFactorChangedAndMoved,
          isToggled, currentSpeed, chartData, isPlaying: !!playingInterval,
        }} />
        <RightBar {...{
          zoomFactor, onZoomFactorChanged,
          isToggled, onToggledChanged,
        }} />
      </div>
    </div>
  }
}
