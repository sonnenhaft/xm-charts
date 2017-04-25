import React, {Component} from 'react'
import throttle from 'throttle-debounce/throttle'

import styles from './TimelineChartWrapper.scss'
import TimelineChart from '../TimelineChart/TimelineChart'
import {RightBar} from './RightBar'
import {LeftBar} from './LeftBar'
import GlobalKeyDetector from './GlobalKeyDetector'

import NetworkGrid from '../NetworkGrid'

const DAY = 60 * 60 * 24 * 1000

export default class TimelineChartWrapper extends Component {
  CHROME_MAX_ZOOM = Math.min(Math.pow(10, 5) * 5) // higher magic zoom crashes chrome with out of memory

  constructor(props) {
    super(props)
    this.state = {
      isToggled: false,
      zoomFactor: 1,
      zoomPosition: 0,
      playingInterval: null,
      currentSpeed: 1,
      currentTime: this._getCurrentTime(props),
    }

    this.onKeyDown = throttle(50, this.onKeyDown)
  }

  tabListener = () => {
    const isTabHidden = window.document.hidden
    if (!isTabHidden) {
      this.stopPlaying()
    }
  }

  componentDidMount() {
    document.addEventListener('visibilitychange', this.tabListener)
  }

  componentWillUnmount() {
    document.removeEventListener('visibilitychange', this.tabListener)
    if (this.state.playingInterval) {
      this.startPlaying()
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

  onToggledChanged = isToggled => this.setState({isToggled})
  onZoomed = ({zoomFactor, zoomPosition}) => {
    this.setState({zoomPosition, zoomFactor: Math.min(this.CHROME_MAX_ZOOM, Math.max(zoomFactor, 1))})
  }
  onZoomChanged = zoomFactor => {
    const zoomPosition = zoomFactor === 1 ? 0 : this.state.zoomPosition
    this.onZoomed({zoomFactor, zoomPosition})
  }
  onTimeChanged = currentTime => {
    let {chartData: {events = []} = {}} = this.props
    let time = Math.min(currentTime, events[events.length - 1].date)
    let number = Math.max(events.findIndex(({date}) => date > time), 1) - 1
    this.setState({currentTime, selectedEvent: events[number]})
  }

  longJump = forward => {
    let {selectedEvent} = this.state
    if (!selectedEvent) {
      const events = this.props.chartData.events
      selectedEvent = events[events.length - 1]
    }
    const {chartData: {events}} = this.props
    let nextEvent = events.filter(({firstInSubnet, lastInSubnet}) => {
      return firstInSubnet || lastInSubnet
    }).find(({date}) => {
      return forward ? date > selectedEvent.date : date < selectedEvent.date
    })
    if (nextEvent) {
      let prevIndex = events.indexOf(selectedEvent)
      let nextIndex = events.indexOf(nextEvent)
      this.jumpToOffset(nextIndex - prevIndex)
    }
  }

  jumpToOffset(eventIndexOffset) {
    const {chartData: {events}} = this.props
    let {selectedEvent} = this.state
    let prevIndex = events.indexOf(selectedEvent)
    let newIndex = prevIndex + eventIndexOffset
    const lastIndex = events.length - 1
    if (newIndex < 0) {
      newIndex = lastIndex
    } else if (newIndex > lastIndex) {
      newIndex = 0
      if (this.state.playingInterval) {
        this.stopPlaying()
        return
      }
    }
    selectedEvent = events[newIndex]
    this.setState({currentTime: selectedEvent.date, selectedEvent})
  }

  onNext = () => this.jumpToOffset(1)
  onPrev = () => this.jumpToOffset(-1)
  onLongNext = () => this.longJump(true)
  onLongPrev = () => this.longJump(false)

  moveOnDaysNumber(count) {
    this.setState({currentTime: this.state.currentTime + count * DAY})
  }

  startPlaying = () => {
    if (!this.state.playingInterval) {
      this.setState({
        playingInterval: setInterval(this.onNext, 400 / this.state.currentSpeed),
      }, this.onNext)
    }
  }

  stopPlaying = () => {
    if (this.state.playingInterval) {
      clearTimeout(this.state.playingInterval)
      this.setState({playingInterval: null})
    }
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

  onSpeedUpdated = currentSpeed => {
    if (this.state.playingInterval) {
      this.stopPlaying()
      this.setState({currentSpeed}, () => {
        this.startPlaying()
      })
    } else {
      this.setState({currentSpeed})
    }
  }

  render() {
    const chartData = this.props.chartData
    const isPlaying = !!this.state.playingInterval
    const {events} = chartData
    const {
      isToggled, zoomFactor, zoomPosition,
      currentTime, selectedEvent, currentSpeed,
    } = this.state
    const {
      onTimeChanged, onToggledChanged, onZoomed, onKeyDown, onZoomChanged,
      onPrev, onNext, onLongPrev, onLongNext, stopPlaying, startPlaying, onSpeedUpdated, onResetPosition,
    } = this

    const state = {
      isToggled, zoomFactor, zoomPosition,
      currentTime, selectedEvent, currentSpeed,
      events, chartData, isPlaying,
    }
    const callbacks = {
      onTimeChanged, onToggledChanged, onZoomed, onKeyDown, onZoomChanged,
      onPrev, onNext, onLongPrev, onLongNext, stopPlaying, startPlaying, onSpeedUpdated, onResetPosition,
    }
    const params = {...state, ...callbacks}

    return <div>
      <div style={{display: 'flex', justifyContent: 'space-between'}}>
        <NetworkGrid {...{currentTime, chartData}}>Marketing</NetworkGrid>
      </div>
      <GlobalKeyDetector className={styles['timeline-chart-wrapper']} onKeyDown={onKeyDown}>
        <LeftBar {...params} />
        <TimelineChart {...params} />
        <RightBar {...{zoomFactor, onZoomChanged, isToggled, onToggledChanged}} />
      </GlobalKeyDetector>
    </div>
  }
}
