import React, {Component, PropTypes as P} from 'react'

import CurrentTime from './CurrentTime/CurrentTime'
import downloadedSvg from '../../../assets/icons/asset-downloaded.svg'

import playSvg from './../../../assets/icons/play.svg'
import nextFlagSvg from './../../../assets/icons/next-flag.svg'
import nextStorySvg from './../../../assets/icons/next-story.svg'

import circleButtonSvgIcon from '../../../assets/icons/circle-button.svg'
import ShareButtons from '../../common/ShareButtons/ShareButtons'
import styles from './LeftBar.scss'
import CircleIndicator from './CircleIndicator/CircleIndicator'
import {Button as SquareButton} from '../RightBar'

const Icon = ({children: __html}) => {
  return <span className={styles['icon']} dangerouslySetInnerHTML={{__html}} />
}

export class Button extends SquareButton {
  buttonClassName = styles['play-action-button']
}

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

    return <div className={`${styles['timeline-control-block']} ${(props.isToggled ? styles['is-toggled'] : '')}`}>
      <div />
      <div className={`${styles['circle-stats-block']}`}>
        <div className={styles['circle-block']}>
          <CircleIndicator percent={currentEvent.networkSuperiority} />
        </div>

        <div className={styles['stats-block']}>
          <ShareButtons data={currentEvent.compromisedAssets}
                        type={props.isToggled ? 'vertical-black' : ''} />
          <div className={styles['buttoned-item']}>
            <Icon>{downloadedSvg}</Icon>
            <span>
                {currentEvent.compromisedDataGB}
              <small>GB</small>
              </span>
          </div>
        </div>
        <div className={`${styles['right-buttons']} ${styles['black-buttons']}`}>
          <Button onClick={this.onPrev} reversed title="jump to previous event">
            {nextStorySvg}
          </Button>
          <Button onClick={this.onLongPrev} reversed title="long jump backward">
            {nextFlagSvg}
          </Button>
        </div>
        <div className={`${styles['left-buttons']} ${styles['black-buttons']}`}>
          <Button onClick={this.onNext} title="jump to next event">
            {nextStorySvg}
          </Button>
          <Button onClick={this.onLongNext} title="long jump forward">
            {nextFlagSvg}
          </Button>
        </div>
      </div>

      <div />
      <div className={styles['play-buttons-block']}>
        <Button onClick={this.onRecordButtonClicked}>{circleButtonSvgIcon}</Button>
        <CurrentTime {...{time}} />
        <Button onClick={this.onPlay} title={state.playingInterval ? 'pause' : 'play'}>
          {playSvg}
        </Button>
        <div className={`${styles['left-buttons']} ${styles['show-zoom-menu']}`}>
          <Button className={styles['no-hover']} title="Current speed">
            {`${props.currentSpeed}x`}
          </Button>
          <div className={styles['zoom-menu']}>
            {[0.5, 1, 2, 4].map(number => (
              <div key={number}>
                {number !== props.currentSpeed &&
                <Button onClick={() => this.onSpeedUpdated(number)}
                        title="Change play speed">
                  {`${number}x`}
                </Button>
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
