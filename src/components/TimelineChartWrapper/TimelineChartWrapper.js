import React, {Component} from 'react'

import styles from './TimelineChartWrapper.scss'
import TimelineChart from '../TimelineChart/TimelineChart'
import SquareButtons from './SquareButtons/SquareButtons'
import ControlPanel from './ControlPanel/ControlPanel'

const DAY = 60*60*24*1000

export default class TimelineChartWrapper extends Component {
  DEFAULT_ZOOM = 2

  constructor(props) {
    super(props)
    this.state = {isToggled: false, zoomFactor: this.DEFAULT_ZOOM, currentTime: null}
  }

  onToggled = () => this.setState({isToggled: !this.state.isToggled})
  onZoomed = zoomFactor => this.setState({zoomFactor})
  onTimeChanged = currentTime => this.setState({currentTime})
  onReset = () => this.setState({zoomFactor: 1})

  onNext = () => this.setState({currentTime: this.state.currentTime + DAY})
  onPrev = () => this.setState({currentTime: this.state.currentTime - DAY})

  onLongNext = () => this.setState({currentTime: this.state.currentTime + 2*DAY})
  onLongPrev = () => this.setState({currentTime: this.state.currentTime - 2*DAY})

  onPlay = () => console.log('onPlay')
  onResetPosition = () => console.log('onResetPosition')

  render() {
    const {isToggled, zoomFactor, currentTime} = this.state
    const chartData = this.props.data
    const {onTimeChanged, onToggled, onZoomed} = this
    const {onReset, onPrev, onNext, onLongPrev, onLongNext, onPlay, onResetPosition} = this
    const controlActions = {onReset, onPrev, onNext, onLongPrev, onLongNext, onPlay, onResetPosition}
    return <div className={styles['timeline-chart-wrapper']}>
      <ControlPanel {...{isToggled, zoomFactor, currentTime, ...controlActions}} />
      <TimelineChart {...{isToggled, currentTime, chartData, onZoomed, onTimeChanged, zoomFactor}} />
      <SquareButtons {...{onToggled, isToggled}} />
    </div>
  }
}
