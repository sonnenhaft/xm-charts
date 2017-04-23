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
    this.state = {
      isToggled: false,
      zoomFactor: 2,
      zoomPosition: 0,
      currentTime: this._getCurrentTime(props),
    }

    this.onKeyDown = throttle(300, this.onKeyDown)
  }

  tabListener = () => {
    const isTabHidden = window.document.hidden
    if (!isTabHidden && this.wasPlaying) {
      this.onPlay()
    }
    this.wasPlaying = this.playingInterval
    if (isTabHidden && this.wasPlaying) {
      this.onPlay()
    }
  }

  componentDidMount() { document.addEventListener('visibilitychange', this.tabListener) }
  componentWillUnmount() {
    document.removeEventListener('visibilitychange', this.tabListener)
    if (this.playingInterval) {
      this.onPlay()
    }
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
  onZoomed = ({zoomFactor, zoomPosition}) => {
    this.setState({zoomPosition, zoomFactor: Math.min(this.CHROME_MAX_ZOOM, Math.max(zoomFactor, 1))})
  }
  onTimeChanged = currentTime => {
    let {chartData: {events = []} = {}} = this.props
    let time = Math.min(currentTime, events[events.length - 1].date)
    let number = Math.max(events.findIndex(({date}) => date > time), 1) - 1
    this.setState({currentTime, selectedEvent: events[number]})
  }

  setEvent(indexOffset = 1) {
    const {chartData: {events}} = this.props
    let {selectedEvent} = this.state
    let prevIndex = events.indexOf(selectedEvent)
    let newIndex = prevIndex + indexOffset
    const lastIndex = events.length - 1
    if (newIndex < 0) {
      newIndex = lastIndex
    } else if (newIndex > lastIndex) {
      newIndex = 0
    }
    selectedEvent = events[newIndex]
    this.setState({currentTime: selectedEvent.date, selectedEvent})
  }

  onReset = () => this.setState({zoomFactor: 1, zoomPosition: 0})

  onNext = () => this.setEvent()
  onPrev = () => this.setEvent(-1)

  onLongNext = () => this.setEvent()
  onLongPrev = () => this.setEvent(-1)

  moveOnDaysNumber(count) {
    this.setState({currentTime: this.state.currentTime + count * DAY})
  }

  onPlay = () => {
    let {playingInterval} = this.state
    if (playingInterval) {
      clearTimeout(playingInterval)
      playingInterval = null
    } else {
      playingInterval = setInterval(this.onNext, 100)
    }
    this.setState({playingInterval})
  }

  getLast() {
    const {chartData: {events}} = this.props
    return events[events.length - 1]
  }

  onResetPosition = () => console.log('on record like button pressed')

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
    const {isToggled, zoomFactor, zoomPosition, currentTime, selectedEvent} = this.state
    const {chartData} = this.props
    const {events} = chartData
    const {onTimeChanged, onToggled, onZoomed, onKeyDown} = this
    const {onReset, onPrev, onNext, onLongPrev, onLongNext, onPlay, onResetPosition} = this
    const controlActions = {onReset, onPrev, onNext, onLongPrev, onLongNext, onPlay, onResetPosition}
    return <div>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <NetworkGrid {...{currentTime, chartData}}>Marketing</NetworkGrid>
        <NetworkGrid {...{currentTime, chartData}}>Testing</NetworkGrid>
        <NetworkGrid {...{currentTime, chartData}} >Production</NetworkGrid>
      </div>
      <GlobalKeyDetector className={styles['timeline-chart-wrapper']} onKeyDown={onKeyDown}>
        <ControlPanel {...{events, isToggled, zoomFactor, currentTime, ...controlActions, selectedEvent}} />
        <TimelineChart {...{isToggled, currentTime, zoomPosition, chartData, onZoomed, onTimeChanged, zoomFactor}} />
        <SquareButtons {...{onToggled, isToggled}} />
      </GlobalKeyDetector>
    </div>
  }
}
