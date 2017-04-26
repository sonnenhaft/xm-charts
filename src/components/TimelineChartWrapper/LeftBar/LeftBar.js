import React, {Component, PropTypes as P} from 'react'

import playSvg from './../../../assets/icons/play.svg'
import nextFlagSvg from './../../../assets/icons/next-flag.svg'
import nextStorySvg from './../../../assets/icons/next-story.svg'
import circleButtonSvgIcon from '../../../assets/icons/circle-button.svg'
import downloadedSvg from '../../../assets/icons/asset-downloaded.svg'

import './LeftBar.scss'

import CurrentTime from './CurrentTime'
import CircleIndicator from './CircleIndicator'
import ShareButtons from '../../common/ShareButtons/ShareButtons'


const Icon = ({children: __html}) => <span dangerouslySetInnerHTML={{__html}} />

class LeftBar extends Component {
  static defaultProps = {events: []}
  static propTypes = {
    currentTime: P.number.isRequired,
    onCurrentTimeChanged: P.func.isRequired,

    currentSpeed: P.number.isRequired,
    onCurrentSpeedChanged: P.func.isRequired,

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
  }

  tabListener = () => {
    const isTabHidden = window.document.hidden
    if (!isTabHidden) {
      this.onPaused()
    }
  }

  componentWillUnmount() {
    window.document.removeEventListener('visibilitychange', this.tabListener)
    this.onPaused()
  }

  onPlayStarted = () => {
    if (this.props.playingInterval) { return }
    const playingInterval = setInterval(() => {
      const props = this.props
      if (props.currentTime === props.events[props.events.length - 1].date) {
        this.onPaused()
      } else {
        this.onNext()
      }
    }, 400 / this.props.currentSpeed)
    this.props.onPlayingIntervalChanged(playingInterval, this.onNext)
  }

  onPaused = cb => {
    if (!this.props.playingInterval) { return }
    clearTimeout(this.props.playingInterval)
    this.props.onPlayingIntervalChanged(null, cb)
  }

  onSpeedUpdated = currentSpeed => this.props.onCurrentSpeedChanged(currentSpeed)

  onPlay = () => {
    if (this.props.playingInterval) {
      this.onPaused()
    } else {
      this.onPlayStarted()
    }
  }

  onRecordButtonClicked = () => console.log('TODO: add on record like button pressed action')

  componentWillReceiveProps({currentTime, playingInterval, currentSpeed}) {
    if (this.props.currentTime !== currentTime) {
      const events = this.props.events
      const safeTime = Math.min(currentTime, events[events.length - 1].date)
      const selectedEventIndex = Math.max(events.findIndex(({date}) => date > safeTime), 1) - 1
      this.setState({selectedEventIndex})
    }

    if (this.props.currentSpeed !== currentSpeed && playingInterval) {
      this.onPaused(this.onPlayStarted)
    }
  }

  onNext = () => this.jumpToOffset(1)
  onPrev = () => this.jumpToOffset(-1)

  jumpToOffset(eventIndexOffset) {
    const {state, props} = this
    let newIndex = state.selectedEventIndex + eventIndexOffset
    const lastIndex = props.events.length - 1
    if (newIndex > lastIndex || newIndex < 0) {
      return
    }
    this.props.onCurrentTimeChanged(props.events[newIndex].date)
  }

  onLongNext = () => this.longJump(true)
  onLongPrev = () => this.longJump(false)

  longJump(forward) {
    const props = this.props
    // only "special" events in here
    // find instead of  findIndex because we loose order
    const nextEvent = props.events
      .filter(({firstInSubnet, lastInSubnet}) => firstInSubnet || lastInSubnet)
      .find(({date}) => forward ? date > props.currentTime : date < props.currentTime)

    if (nextEvent) {
      const idx = props.events.indexOf(nextEvent)
      this.jumpToOffset(idx - this.state.selectedEventIndex)
    }
  }

  render() {
    const {state, props} = this
    const currentEvent = props.events[state.selectedEventIndex]
    const time = props.currentTime - props.events[0].date

    return <div styleName={`timeline-control-block ${(props.isToggled ? 'is-toggled' : '')}`}>
      <div />
      <div styleName="circle-stats-block">
        <div styleName="circle-block">
          <CircleIndicator percent={currentEvent.networkSuperiority} />
        </div>

        <div styleName="stats-block">
          <ShareButtons data={currentEvent.compromisedAssets}
                        type={props.isToggled ? 'vertical-black' : ''} />
          <div styleName="buttoned-item">
            <span styleName="icon" dangerouslySetInnerHTML={{__html: downloadedSvg}} />
            <span>
                {currentEvent.compromisedDataGB}
              <small>GB</small>
              </span>
          </div>
        </div>
        <div styleName="right-buttons black-buttons">
          <button onClick={this.onPrev}
                  title="jump to previous event"
                  styleName="play-action-button">
            <Icon>{nextStorySvg}</Icon>
          </button>

          <button onClick={this.onLongPrev}
                  title="long jump backward"
                  styleName="play-action-button">
            <Icon>{nextFlagSvg}</Icon>
          </button>
        </div>
        <div styleName="left-buttons black-buttons">
          <button onClick={this.onNext}
                  title="jump to next event"
                  styleName="play-action-button">
            <Icon>{nextStorySvg}</Icon>
          </button>
          <button onClick={this.onLongNext}
                  title="long jump forward"
                  styleName="play-action-button">
            <Icon>{nextFlagSvg}</Icon>
          </button>
        </div>
      </div>

      <div />
      <div styleName="play-buttons-block">
        <button onClick={this.onRecordButtonClicked} styleName="play-action-button">
          <Icon>{circleButtonSvgIcon}</Icon>
        </button>
        <CurrentTime {...{time}} />

        <button onClick={this.onPlay}
                styleName="play-action-button"
                title={state.playingInterval ? 'pause' : 'play'}>
          <Icon>{playSvg}</Icon>
        </button>

        <div styleName="left-buttons show-zoom-menu">

          <button title="Current speed" styleName="no-hover play-action-button">
            <Icon>{`${props.currentSpeed}x`}</Icon>
          </button>

          <div styleName="zoom-menu">
            {[0.5, 1, 2, 4].map(number => (
              <div key={number}>
                {number !== props.currentSpeed &&
                <button onClick={() => this.onSpeedUpdated(number)}
                        title="Change play speed"
                        styleName="play-action-button">
                  {number}x
                </button>
                }
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  }
}

export {LeftBar}
