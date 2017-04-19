import React, {Component, PropTypes} from 'react'

import CurrentTime from './CurrentTime/CurrentTime'
import triangleSvgIcon from '../../../assets/icons/asset-downloaded.svg'
import playButtonSvgIcon from './button-icons/play-button.svg'
import backwardButtonSvgIcon from './button-icons/backward-button.svg'
import backwardLinedButtonSvgIcon from './button-icons/backward-lined-button.svg'
import forwardLinedButtonSvgIcon from './button-icons/forward-lined-button.svg'
import circleButtonSvgIcon from './button-icons/circle-button.svg'
import ShareButtons from '../../common/ShareButtons/ShareButtons'
import styles from './ControlPanel.scss'
import CircleIndicator from './CircleIndicator/CircleIndicator'

const Icon = ({children: __html}) => <span className={styles['icon']} dangerouslySetInnerHTML={{__html}} />
const Button = ({onClick, children: __html, className, title}) => {
  className = `${className } ${   styles['play-action-button']}`
  return <button {...{className, onClick, title}} dangerouslySetInnerHTML={{__html}} />
}

export default class ControlPanel extends Component {
  static propTypes = {
    isToggled: PropTypes.bool.isRequired,
    zoomFactor: PropTypes.number.isRequired,
    currentTime: PropTypes.number,
    onReset: PropTypes.func.isRequired,
    onPrev: PropTypes.func.isRequired,
    onNext: PropTypes.func.isRequired,
    onLongPrev: PropTypes.func.isRequired,
    onLongNext: PropTypes.func.isRequired,
    onPlay: PropTypes.func.isRequired,
    onResetPosition: PropTypes.func.isRequired,
  }

  render() {
    const {isToggled, zoomFactor, currentTime, offsetTime, onReset} = this.props
    let zoomFactorText = zoomFactor
    if (zoomFactorText > 1000) {
      zoomFactorText = `${Math.round(zoomFactorText / 1000)  }k`
    } else if (zoomFactor < 10) {
      zoomFactorText = Math.round(zoomFactor * 10) / 10
    } else {
      zoomFactorText = Math.round(zoomFactor)
    }
    zoomFactorText = `x${  zoomFactorText}`

    const {onPrev, onNext, onLongPrev, onLongNext, onPlay, onResetPosition} = this.props
    return <div>
      {!isToggled && <div className={styles['timeline-control-block']}>
        <div />
        <div className={`${styles['circle-stats-block']} ${isToggled ? styles['stats-hidden'] : ''}`}>
          <div className={styles['circle-block']}>
            <CircleIndicator percent={0.4} />
          </div>

          <div className={styles['stats-block']}>
            <ShareButtons />
            <div className={`${styles['buttoned-item']}`}>
              <Icon>{triangleSvgIcon}</Icon>
              <span>
              <span>2,173.2 <small>GB</small></span>
            </span>
            </div>
          </div>
          <div className={`${styles['black-buttons']}`}>
            <Button onClick={onLongPrev}>{backwardButtonSvgIcon}</Button>
            <Button onClick={onPrev}>{backwardLinedButtonSvgIcon}</Button>
          </div>
          <div className={`${styles['left-buttons']} ${styles['black-buttons']}`}>
            <Button onClick={onLongNext}>{playButtonSvgIcon}</Button>
            <Button onClick={onNext}>{forwardLinedButtonSvgIcon}</Button>
          </div>
        </div>

        <div />
        <div className={styles['play-buttons-block']}>
          <Button onClick={onResetPosition}>{circleButtonSvgIcon}</Button>
          <CurrentTime {...{currentTime, offsetTime}} />
          <Button onClick={onPlay}>{playButtonSvgIcon}</Button>
          <div className={`${styles['left-buttons']}`}>
            <Button onClick={onReset} title="Reset Zoom">{zoomFactorText}</Button>
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
          <ShareButtons type="vertical-black">
            <Icon>{triangleSvgIcon}</Icon>
            <span>2,173.2</span>
          </ShareButtons>

          <CurrentTime {...{currentTime}} />
          <div className={styles['toggled-buttons-wrapper']}>
            <div className={styles['toggled-buttons']}>
              <Button onClick={onLongPrev}>{backwardLinedButtonSvgIcon}</Button>
              <Button onClick={onLongNext}>{forwardLinedButtonSvgIcon}</Button>
              <div className={styles['middle-buttons']}>
                <Button onClick={onPlay}>{playButtonSvgIcon}</Button>
                <Button onClick={onReset} title="Reset Zoom">{zoomFactorText}</Button>
              </div>
              <Button onClick={onPrev}>{backwardButtonSvgIcon}</Button>
              <Button onClick={onNext}>{playButtonSvgIcon}</Button>
            </div>
            Controls
          </div>
        </div>
      </div>
      }
    </div>
  }
}
