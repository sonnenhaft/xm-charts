import React, {Component} from 'react'
import throttle from 'throttle-debounce/throttle'

import styles from './TimelineChartWrapper.scss'
import TimelineChart from '../TimelineChart/TimelineChart'
import SquareButtons from './SquareButtons/SquareButtons'
import ControlPanel from './ControlPanel/ControlPanel'
import GlobalKeyDetector from './GlobalKeyDetector'

import NetworkGrid from '../NetworkGrid'

const DAY = 60 * 60 * 24 * 1000

export default class TimelineChartWrapper extends Component {
  CHROME_MAX_ZOOM = Math.min(Math.pow(10, 5) * 5) // higher magic zoom crashes chrome with out of memory

  constructor(props) {
    super(props)
    this.state = {isToggled: false, zoomFactor: 2, currentTime: this._getCurrentTime(props)}

    this.onKeyDown = throttle(300, this.onKeyDown)
  }

  _getCurrentTime(props) {
    let {chartData: {events = []} = {}} = props
    return events.length ? events[events.length - 1].date : 0
  }

  componentWillReceiveProps(props) {
    const currentTime = this._getCurrentTime(props)
    this.setState({currentTime})
  }

  onToggled = () => this.setState({isToggled: !this.state.isToggled})
  onZoomed = zoomFactor => this.setState({zoomFactor: Math.min(this.CHROME_MAX_ZOOM, Math.max(zoomFactor, 1))})
  onTimeChanged = currentTime => {
    let {chartData: {events = []} = {}} = this.props
    let time = Math.max(currentTime, events[events.length - 1].date)
    let number = Math.max(events.findIndex(({date}) => date > time), 1) - 1
    let selectedEvent = events[number]

    this.setState({currentTime, selectedEvent})
  }

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
    const {isToggled, zoomFactor, currentTime, selectedEvent} = this.state
    const {chartData} = this.props
    const {events} = chartData
    const {onTimeChanged, onToggled, onZoomed, onKeyDown} = this
    const {onReset, onPrev, onNext, onLongPrev, onLongNext, onPlay, onResetPosition} = this
    const controlActions = {onReset, onPrev, onNext, onLongPrev, onLongNext, onPlay, onResetPosition}
    return <div>
      <NetworkGrid {...{currentTime, chartData}} />
      <GlobalKeyDetector className={styles['timeline-chart-wrapper']} onKeyDown={onKeyDown}>
        <ControlPanel {...{events, isToggled, zoomFactor, currentTime, ...controlActions, selectedEvent}} />
        <TimelineChart {...{isToggled, currentTime, chartData, onZoomed, onTimeChanged, zoomFactor}} />
        <SquareButtons {...{onToggled, isToggled}} />
      </GlobalKeyDetector>
    </div>
  }
}
