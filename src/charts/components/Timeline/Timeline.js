import React, { Component, PropTypes as P } from 'react'

import './TimeLine.scss'
import TimelineChart from './TimelineChart'
import RightBar from './RightBar'
import LeftBar from './LeftBar'

const MAX_ZOOM = Math.pow(10, 5) * 5// higher fails the chrome
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
    className: P.string,
  }

  onCurrentSpeedChanged = (currentSpeed, cb) => this.setState({ currentSpeed }, cb)
  onToggledChanged = isToggled => this.setState({ isToggled })
  onPlayingIntervalChanged = (playingInterval, cb) => this.setState({ playingInterval }, cb) // necessary to disable animation

  onZoomFactorChanged = zoomFactor => this.setState({ zoomFactor })

  render() {
    const {
      onZoomFactorChanged, onToggledChanged,
      onCurrentSpeedChanged, onPlayingIntervalChanged,
    } = this

    const { currentTime, onCurrentTimeChanged, events, nodes, className } = this.props
    const { isToggled, zoomFactor, currentSpeed, playingInterval } = this.state


    return events.length ?
      (
        <div styleName="root" className={className}>
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
            maxZoom: MAX_ZOOM, minZoom: MIN_ZOOM,
          }} />
          <RightBar {...{
            zoomFactor, onZoomFactorChanged,
            isToggled, onToggledChanged,
            maxZoom: MAX_ZOOM, minZoom: MIN_ZOOM,
          }} />
        </div>
      ) : <div styleName="root no-data" className={className}>No events data yet...</div>

  }
}
