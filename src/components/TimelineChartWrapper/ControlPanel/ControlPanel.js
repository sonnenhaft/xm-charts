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
    isToggled: PropTypes.bool,
    zoomFactor: PropTypes.number,
    currentTime: PropTypes.number,
    onReset: PropTypes.func.isRequired,
  }
  static defaultProps = {zoomFactor: 1, isToggled: false};

  render() {
    const {isToggled, zoomFactor, currentTime, onReset} = this.props
    let zoomFactorText = zoomFactor
    if (zoomFactorText > 1000) {
      zoomFactorText = `${Math.round(zoomFactorText / 1000)  }k`
    } else if (zoomFactor < 10) {
      zoomFactorText = Math.round(zoomFactor * 10) / 10
    } else {
      zoomFactorText = Math.round(zoomFactor)
    }
    zoomFactorText = `x${  zoomFactorText}`
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
            <Button>{backwardLinedButtonSvgIcon}</Button>
            <Button>{backwardButtonSvgIcon}</Button>
          </div>
          <div className={`${styles['left-buttons']} ${styles['black-buttons']}`}>
            <Button>{forwardLinedButtonSvgIcon}</Button>
            <Button>{playButtonSvgIcon}</Button>
          </div>
        </div>

        <div />
        <div className={styles['play-buttons-block']}>
          <Button>{circleButtonSvgIcon}</Button>
          <CurrentTime {...{currentTime}} />
          <Button>{playButtonSvgIcon}</Button>
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
              <Button>{backwardLinedButtonSvgIcon}</Button>
              <Button>{forwardLinedButtonSvgIcon}</Button>
              <div className={styles['middle-buttons']}>
                <Button>{playButtonSvgIcon}</Button>
                <Button onClick={onReset} title="Reset Zoom">{zoomFactorText}</Button>
              </div>
              <Button>{backwardButtonSvgIcon}</Button>
              <Button>{playButtonSvgIcon}</Button>
            </div>
            Controls
          </div>
        </div>
      </div>
      }
    </div>
  }
}
