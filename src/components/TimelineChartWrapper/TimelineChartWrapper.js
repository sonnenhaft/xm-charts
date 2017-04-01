import React, {Component} from 'react'

import styles from './TimelineChartWrapper.scss'
import TimelineChart from '../TimelineChart/TimelineChart'
import SquareButtons from './SquareButtons/SquareButtons'
import ControlPanel from './ControlPanel/ControlPanel'

export default class TimelineChartWrapper extends Component {
  DEFAULT_ZOOM = 1

  constructor(props) {
    super(props)
    this.state = {isToggled: false, zoomFactor: this.DEFAULT_ZOOM, currentTime: null}
  }

  onToggled = () => this.setState({isToggled: !this.state.isToggled})
  onZoomed = zoomFactor => this.setState({zoomFactor})
  onTimeChanged = currentTime => this.setState({currentTime})
  onReset = () => this.setState({zoomFactor: this.DEFAULT_ZOOM})

  render() {
    const {isToggled, zoomFactor, currentTime} = this.state
    const chartData = this.props.data
    const {onTimeChanged, onToggled, onZoomed, onReset} = this
    return <div className={styles['timeline-chart-wrapper']}>
      <ControlPanel {...{isToggled, zoomFactor, currentTime, onReset}} />
      <TimelineChart {...{isToggled, chartData, onZoomed, onTimeChanged, zoomFactor}} />
      <SquareButtons {...{onToggled, isToggled}} />
    </div>
  }
}
