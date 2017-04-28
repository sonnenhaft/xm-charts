import React, { Component, PropTypes as P } from 'react'

import './TimeLine.scss'
import TimelineChart from './TimelineChart/TimelineChart'
import RightBar from './RightBar'
import LeftBar from './LeftBar'

// chrome was crashing with higher value with higher value
const MAX_ZOOM = Math.min(Math.pow(10, 5) * 5)
const MIN_ZOOM = 1

export default class Timeline extends Component {
  constructor(props) {
    super(props)

    this.state = {
      isToggled: false,
      zoomFactor: 1,
      playingInterval: null,
      currentSpeed: 1,
    }
  }

  static propTypes = {
    currentTime: P.number.isRequired,
    onCurrentTimeChanged: P.func.isRequired,
    events: P.array,
    nodes: P.array,
  }

  onCurrentSpeedChanged = (currentSpeed, cb) => this.setState({ currentSpeed }, cb)
  onToggledChanged = isToggled => this.setState({ isToggled })
  onPlayingIntervalChanged = (playingInterval, cb) => this.setState({ playingInterval }, cb) // necessary to disable animation

  onZoomFactorChanged = zoomFactor =>   this.setState({ zoomFactor })

  render() {
    const {
      onZoomFactorChanged, onToggledChanged,
      onCurrentSpeedChanged, onPlayingIntervalChanged,
    } = this

    const { currentTime, onCurrentTimeChanged, events, nodes } = this.props
    const { isToggled, zoomFactor, currentSpeed, playingInterval } = this.state

    return <div>
      <div styleName="timeline-chart-wrapper">
        <LeftBar {...{
          currentTime, onCurrentTimeChanged,
          currentSpeed, onCurrentSpeedChanged,
          playingInterval, onPlayingIntervalChanged,
          isToggled, events,
        }} />
        <TimelineChart {...{
          currentTime, onCurrentTimeChanged,
          zoomFactor, onZoomFactorChanged,
          isToggled, currentSpeed, events, nodes, isPlaying: !!playingInterval,
        }} />
        <RightBar {...{
          zoomFactor, onZoomFactorChanged,
          isToggled, onToggledChanged,
          maxZoom: MAX_ZOOM, minZoom: MIN_ZOOM,
        }} />
      </div>
    </div>
  }
}
