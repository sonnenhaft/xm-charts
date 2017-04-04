import React, {Component} from 'react'
import throttle from 'throttle-debounce/throttle'

import styles from './TimelineChartWrapper.scss'
import TimelineChart from '../TimelineChart/TimelineChart'
import SquareButtons from './SquareButtons/SquareButtons'
import ControlPanel from './ControlPanel/ControlPanel'
import GlobalKeyDetector from './GlobalKeyDetector'

const DAY = 60 * 60 * 24 * 1000

export default class TimelineChartWrapper extends Component {
  DEFAULT_ZOOM = 2

  constructor(props) {
    super(props)
    this.state = {isToggled: false, zoomFactor: this.DEFAULT_ZOOM, currentTime: null}

    this.onKeyDown = throttle(300, this.onKeyDown)
  }

  onToggled = () => this.setState({isToggled: !this.state.isToggled})
  onZoomed = zoomFactor => this.setState({zoomFactor: Math.max(zoomFactor, 1)})
  onTimeChanged = currentTime => this.setState({currentTime})
  onReset = () => this.setState({zoomFactor: 1})

  onNext = () => this.moveOnDaysNumber(1)
  onPrev = () => this.moveOnDaysNumber(-1)

  onLongNext = () => this.moveOnDaysNumber(2)
  onLongPrev = () => this.moveOnDaysNumber(-2)

  moveOnDaysNumber(count) {
    this.setState({currentTime: this.state.currentTime + count * DAY})
  }

  onPlay = () => console.log('onPlay')
  onResetPosition = () => console.log('onResetPosition')
  onKeyDown = e => {
    const code = e.code || `Arrow${e.key}`
    if (code === 'ArrowRight') {
      this.onNext()
    } else if (code === 'ArrowLeft') {
      this.onPrev()
    } else if (code === 'ArrowUp') {
      this.onZoomed(this.state.zoomFactor * 2)
    } else if (code === 'ArrowDown') {
      this.onZoomed(this.state.zoomFactor / 2)
    }
    if (code.indexOf('Arrow') !== -1) {
      e.preventDefault()
    }
  }

  render() {
    const {isToggled, zoomFactor, currentTime} = this.state
    const {data: chartData} = this.props
    const {onTimeChanged, onToggled, onZoomed, onKeyDown} = this
    const {onReset, onPrev, onNext, onLongPrev, onLongNext, onPlay, onResetPosition} = this
    const controlActions = {onReset, onPrev, onNext, onLongPrev, onLongNext, onPlay, onResetPosition}

    return <GlobalKeyDetector className={styles['timeline-chart-wrapper']} onKeyDown={onKeyDown}>
      <ControlPanel {...{isToggled, zoomFactor, currentTime, ...controlActions}} />
      <TimelineChart {...{isToggled, currentTime, chartData, onZoomed, onTimeChanged, zoomFactor}} />
      <SquareButtons {...{onToggled, isToggled}} />
    </GlobalKeyDetector>
  }
}
