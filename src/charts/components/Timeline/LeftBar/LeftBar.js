import React, { Component, PropTypes as P } from 'react'

import playSvg from 'assets/icons/play.svg'
import pauseSvg from 'assets/icons/pause.svg'
import nextFlagSvg from 'assets/icons/next-flag.svg'
import nextStorySvg from 'assets/icons/next-story.svg'
import circleButtonSvgIcon from 'assets/icons/circle-button.svg'
import downloadedSvg from 'assets/icons/asset-downloaded.svg'
import { isSpecial } from 'charts/utils/EventUtils'

import './LeftBar.scss'

import CurrentTime from './CurrentTime'
import CircleIndicator from './CircleIndicator'
import ShareButtons from '../common/ShareButtons'

const Icon = ({ children: __html }) => <span dangerouslySetInnerHTML={{ __html }}/>

export default class LeftBar extends Component {
  static defaultProps = { events: [] }
  static propTypes = {
    currentTime: P.number.isRequired,
    onCurrentTimeChanged: P.func.isRequired,

    currentSpeed: P.number.isRequired,
    onCurrentSpeedChanged: P.func.isRequired,
    onZoomFactorChanged: P.func.isRequired,

    playingInterval: P.number,
    onPlayingIntervalChanged: P.func.isRequired,

    events: P.array,
    isToggled: P.bool.isRequired,
  }

  constructor(props) {
    super(props)
    this.state = {
      selectedEventIndex: 0,
    }
  }

  componentDidMount() {
    window.document.addEventListener('visibilitychange', this.tabListener)
    this.setCurrentEvent(this.props)
  }

  tabListener = () => {
    const isTabHidden = window.document.hidden
    if ( !isTabHidden ) {
      this.onPaused()
    }
  }

  componentWillUnmount() {
    window.document.removeEventListener('visibilitychange', this.tabListener)
    this.onPaused()
  }

  getLast = props => props.events[props.events.length - 1].date

  onPlayStarted = () => {
    if ( this.props.playingInterval ) { return }
    const playingInterval = setInterval(() => {
      const props = this.props
      if ( props.currentTime === this.getLast(props) ) {
        this.onPaused()
      } else {
        this.onNext()
      }
    }, 400 / this.props.currentSpeed)
    this.props.onPlayingIntervalChanged(playingInterval, this.onNext)
  }

  onPaused = cb => {
    if ( !this.props.playingInterval ) { return }
    clearTimeout(this.props.playingInterval)
    this.props.onPlayingIntervalChanged(null, cb)
  }

  onSpeedUpdated = currentSpeed => this.props.onCurrentSpeedChanged(currentSpeed)

  onPlay = () => {
    if ( this.props.playingInterval ) {
      this.onPaused()
    } else {
      if ( this.props.currentTime === this.getLast(this.props) ) {
        this.props.onCurrentTimeChanged(this.props.events[0].date, ()=>{
          this.onPlayStarted()
        })
      } else {
        this.onPlayStarted()
      }

    }
  }

  onRecordButtonClicked = () => {
    this.props.onCurrentTimeChanged(this.props.events[0].date)
    this.onPaused()
    this.props.onZoomFactorChanged(1)
  }

  setCurrentEvent({ events, currentTime }) {
    const lastDate = events[events.length - 1].date
    let selectedEventIndex
    if ( currentTime >= lastDate ) {
      selectedEventIndex = events.length - 1
    } else if ( currentTime < events[0].date ) {
      selectedEventIndex = 0
    } else {
      selectedEventIndex = Math.max(events.findIndex(({ date }) => date > currentTime), 1) - 1
    }
    this.setState({ selectedEventIndex })
  }

  componentWillReceiveProps({ currentTime, playingInterval, currentSpeed, events }) {
    if ( this.props.currentTime !== currentTime ) {
      this.setCurrentEvent({ events, currentTime })
    }

    if ( this.props.currentSpeed !== currentSpeed && playingInterval ) {
      this.onPaused(this.onPlayStarted)
    }
  }

  onNext = () => this.jumpToOffset(1)
  onPrev = () => this.jumpToOffset(-1)

  getEventPossibleEvent(indexOffset) {
    const { state, props } = this
    let newIndex = state.selectedEventIndex + indexOffset
    const lastIndex = props.events.length - 1
    if ( newIndex > lastIndex || newIndex < 0 ) {
      return
    }
    return props.events[newIndex].date
  }

  jumpToOffset(offset) {
    this.props.onCurrentTimeChanged(this.getEventPossibleEvent(offset))
  }

  onLongNext = () => this.longJump(true)
  onLongPrev = () => this.longJump(false)

  longJump(forward) {
    const nextEvent = this.getPossibleCircle(forward)
    if ( nextEvent ) {
      const idx = this.props.events.indexOf(nextEvent)
      this.jumpToOffset(idx - this.state.selectedEventIndex)
    }
  }

  getPossibleCircle(forward) {
    const props = this.props
    // only "special" events in here
    // find instead of  findIndex because we loose order
    const specialEvents = props.events.filter(isSpecial)
    if ( forward ) {
      return specialEvents.find(({ date }) => date > props.currentTime)
    } else {
      let closetIdx
      if ( props.currentTime >= props.events[props.events.length - 1].date ) {
        closetIdx = specialEvents.length - 1
      } else {
        closetIdx = specialEvents.findIndex(({ date }) => date >= props.currentTime)
      }
      if ( closetIdx > 0 ) {
        return specialEvents[closetIdx - 1]
      }
    }
  }

  render() {
    const { state, props } = this
    const currentEvent = props.events[state.selectedEventIndex]
    const time = props.currentTime - props.events[0].date

    const isPlaying = props.playingInterval
    return <div styleName={`timeline-control-block ${(props.isToggled ? 'is-toggled' : '')}`}>
      <div>
        <div styleName="circle-stats-block">
          <div styleName="circle-block">
            <CircleIndicator percent={currentEvent.networkSuperiority} isPlaying={!!isPlaying}/>
          </div>

          <div styleName="stats-block">
            <ShareButtons data={currentEvent.compromisedAssets}
                          type={props.isToggled ? 'vertical-black' : ''}/>
            <div styleName="buttoned-item">
              <span styleName="icon" dangerouslySetInnerHTML={{ __html: downloadedSvg }}/>
              <span>
                {currentEvent.compromisedDataGB}
                <small>GB</small>
              </span>
            </div>
          </div>

        </div>
        <div styleName="play-buttons-block">
          <button onClick={this.onRecordButtonClicked} styleName="play-action-button reset-circle">
            <Icon>{circleButtonSvgIcon}</Icon>
          </button>
          <CurrentTime {...{ time }} />
        </div>
      </div>
      <div>
        <div styleName="four-control-buttons">
          <div styleName="right-buttons black-buttons">
            <button onClick={this.onPrev}
                    title="jump to previous event"
                    styleName="play-action-button"
                    disabled={!this.getEventPossibleEvent(-1)}>
              <Icon>{nextStorySvg}</Icon>
            </button>

            <button onClick={this.onLongPrev}
                    title="long jump backward"
                    styleName="play-action-button"
                    disabled={!this.getPossibleCircle()}>
              <Icon>{nextFlagSvg}</Icon>
            </button>
          </div>
          <div styleName="left-buttons black-buttons">
            <button onClick={this.onNext}
                    title="jump to next event"
                    styleName="play-action-button"
                    disabled={!this.getEventPossibleEvent(1)}>
              <Icon>{nextStorySvg}</Icon>
            </button>
            <button onClick={this.onLongNext}
                    title="long jump forward"
                    styleName="play-action-button"
                    disabled={!this.getPossibleCircle(true)}>
              <Icon>{nextFlagSvg}</Icon>
            </button>
          </div>
        </div>
        <div styleName="four-control-buttons">
          <button onClick={this.onPlay}
                  styleName="play-action-button"
                  title={isPlaying ? 'pause' : 'play'}>
            <Icon>{isPlaying ? pauseSvg : playSvg}</Icon>
          </button>

          <div styleName="left-buttons show-zoom-menu">

            <button title="Current speed" styleName="no-hover play-action-button">
              <Icon>{`x${props.currentSpeed}`}</Icon>
            </button>

            <div styleName="zoom-menu">
              {[0.5, 1, 2, 4].map(number => (
                <div key={number}>
                  <button onClick={() => this.onSpeedUpdated(number)}
                          title="Change play speed"
                          disabled={number === props.currentSpeed}
                          styleName={`play-action-button ${number === props.currentSpeed ? 'active' : ''}`}>
                    <span>{number}x</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  }
}
