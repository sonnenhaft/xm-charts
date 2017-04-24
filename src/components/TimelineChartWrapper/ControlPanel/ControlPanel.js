import React, {Component, PropTypes} from 'react'

import CurrentTime from './CurrentTime/CurrentTime'
import downloadedSvg from '../../../assets/icons/asset-downloaded.svg'

import playSvg from './../../../assets/icons/play.svg'
import nextFlagSvg from './../../../assets/icons/next-flag.svg'
import nextStorySvg from './../../../assets/icons/next-story.svg'

import circleButtonSvgIcon from '../../../assets/icons/circle-button.svg'
import ShareButtons from '../../common/ShareButtons/ShareButtons'
import styles from './ControlPanel.scss'
import CircleIndicator from './CircleIndicator/CircleIndicator'
import {Button as SquareButton} from './../SquareButtons/SquareButtons'

const Icon = ({children: __html}) => {
  return <span className={styles['icon']} dangerouslySetInnerHTML={{__html}} />
}

export class Button extends SquareButton {
  buttonClassName = styles['play-action-button']
}

const RequiredCallback = PropTypes.func.isRequired
export default class ControlPanel extends Component {
  static propTypes = {
    isToggled: PropTypes.bool.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    zoomFactor: PropTypes.number.isRequired,
    currentSpeed: PropTypes.number.isRequired,
    events: PropTypes.array,
    onSpeedUpdated: RequiredCallback,
    onPrev: RequiredCallback,
    onNext: RequiredCallback,
    onLongPrev: RequiredCallback,
    onLongNext: RequiredCallback,
    stopPlaying: RequiredCallback,
    startPlaying: RequiredCallback,
    onResetPosition: RequiredCallback,
  }

  static defaultProps = {events: []}

  onPlay =() => {
    if (this.props.isPlaying) {
      this.props.stopPlaying()
    } else {
      this.props.startPlaying()
    }
  }

  render() {
    const {
      isToggled, currentTime,
      onPrev, onNext, onLongPrev, onLongNext,
      onResetPosition, onSpeedUpdated, isPlaying,
      currentSpeed,
      selectedEvent: {compromisedAssets, compromisedDataGB = 0, networkSuperiority} = {},
    } = this.props

    const onPlay = this.onPlay

    return <div>
      {!isToggled && <div className={styles['timeline-control-block']}>
        <div />
        <div className={`${styles['circle-stats-block']} ${isToggled ? styles['stats-hidden'] : ''}`}>
          <div className={styles['circle-block']}>
            <CircleIndicator percent={networkSuperiority} />
          </div>

          <div className={styles['stats-block']}>
            <ShareButtons data={compromisedAssets} />
            <div className={styles['buttoned-item']}>
              <Icon>{downloadedSvg}</Icon>
              <span>
                {compromisedDataGB}
                <small>GB</small>
              </span>
            </div>
          </div>
          <div className={`${styles['right-buttons']} ${styles['black-buttons']}`}>
            <Button onClick={onPrev} reversed title="jump to previous event">
              {nextStorySvg}
            </Button>
            <Button onClick={onLongPrev} reversed title="long jump backward">
              {nextFlagSvg}
            </Button>
          </div>
          <div className={`${styles['left-buttons']} ${styles['black-buttons']}`}>
            <Button onClick={onNext} title="jump to next event">
              {nextStorySvg}
            </Button>
            <Button onClick={onLongNext} title="long jump forward">
              {nextFlagSvg}
            </Button>
          </div>
        </div>

        <div />
        <div className={styles['play-buttons-block']}>
          <Button onClick={onResetPosition}>{circleButtonSvgIcon}</Button>
          <CurrentTime {...{currentTime, offset: this.props.events[0].date}} />
          <Button onClick={onPlay} title={isPlaying ? 'pause' : 'play'}>{playSvg}</Button>
          <div className={`${styles['left-buttons']} ${styles['show-zoom-menu']}`}>
            <Button className={styles['no-hover']} title="Current speed">
              {`${currentSpeed}x`}
            </Button>
            <div className={styles['zoom-menu']}>
              {[0.5, 1, 2, 4].map(number => (
                <div key={number}>
                  {number !== currentSpeed &&
                  <Button onClick={() => onSpeedUpdated(number)}
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

      {isToggled && <div className={`${styles['timeline-control-block']  } ${  styles['toggled-control']}`}>
        <div className={styles['play-buttons-block']}>
          <Button>{circleButtonSvgIcon}</Button>
          <div className={`${styles['circle-block']  } ${  styles['small-circle-block']}`}>
            <CircleIndicator percent={0.4} small={true} />
          </div>
          <ShareButtons type="vertical-black" data={compromisedAssets}>
            <Icon>{downloadedSvg}</Icon>
            <span>{compromisedDataGB}</span>
          </ShareButtons>

          <CurrentTime {...{currentTime}} />
          <div className={styles['toggled-buttons-wrapper']}>
            <div className={styles['toggled-buttons']}>
              <Button onClick={onLongPrev}>{nextFlagSvg}</Button>
              <Button onClick={onLongNext} nextFlagSvg>{nextFlagSvg}</Button>
              <div className={styles['middle-buttons']}>
                <Button onClick={onPlay}>{playSvg}</Button>
                <Button onClick={onResetPosition} title="Reset Zoom">1x</Button>
              </div>
              <Button onClick={onPrev}>{nextStorySvg}</Button>
              <Button onClick={onNext} reversed>{nextStorySvg}</Button>
            </div>
            Controls
          </div>
        </div>
      </div>
      }
    </div>
  }
}
