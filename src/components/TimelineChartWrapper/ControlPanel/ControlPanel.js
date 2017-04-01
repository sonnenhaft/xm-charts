import React, { Component, PropTypes } from 'react'
import { timeFormat } from 'd3'

import triangleSvgIcon from '../../../assets/icons/asset-downloaded.svg'
import playButtonSvgIcon from './button-icons/play-button.svg'
import circleButtonSvgIcon from './button-icons/circle-button.svg'
import ShareButtons from '../../common/ShareButtons/ShareButtons'
import styles from './ControlPanel.scss'
import CircleIndicator from './CircleIndicator/CircleIndicator'

const Icon = ({ children: __html }) => <span className={ styles['icon'] } dangerouslySetInnerHTML={ { __html } } />
const Button = ({ onClick, children: __html, className, title }) => {
  className = `${className } ${   styles['play-action-button']}`
  return <button { ...{ className, onClick, title } } dangerouslySetInnerHTML={ { __html } } />
}

export default class ControlPanel extends Component {
  static propTypes = {
    isToggled: PropTypes.bool,
    zoomFactor: PropTypes.number,
    currentTime: PropTypes.number,
    onReset: PropTypes.func.isRequired,
  }
  static defaultProps = { zoomFactor: 1, isToggled: false };

  render () {
    const { isToggled, zoomFactor, currentTime, onReset } = this.props
    let zoomFactorText = zoomFactor
    if (zoomFactorText > 1000) {
      zoomFactorText = `${Math.round(zoomFactorText / 1000)  }k`
    } else if (zoomFactor < 10) {
      zoomFactorText = Math.round(zoomFactor * 10) / 10
    } else {
      zoomFactorText = Math.round(zoomFactor)
    }
    zoomFactorText = `x${  zoomFactorText}`
    return <div className={ styles['timeline-control-block'] }>
      <div />
      <div className={ `${styles['circle-stats-block']} ${isToggled ? styles['stats-hidden'] : ''}` }>
        <div className={ styles['circle-block'] }>
          <CircleIndicator percent={ 0.4 } />
        </div>

        <div className={ styles['stats-block'] }>
          <ShareButtons />
          <div className={ `${styles['buttoned-item']}` }>
            <Icon>{triangleSvgIcon}</Icon>
            <span>
              <span>2,173.2 <small>GB</small></span>
            </span>
          </div>
        </div>
        <div>
          <Button>{playButtonSvgIcon}</Button>
          <Button>{playButtonSvgIcon}</Button>
          <Button>{playButtonSvgIcon}</Button>
        </div>
        <div>
          <Button>{playButtonSvgIcon}</Button>
          <Button>{playButtonSvgIcon}</Button>
          <Button>{playButtonSvgIcon}</Button>
        </div>
      </div>

      <div />

      <div className={ styles['play-buttons-block'] }>
        <Button>{circleButtonSvgIcon}</Button>
        <div className={ styles['day-time-wrapper'] }>
          <div className={ styles['day-time'] }>
            &nbsp;
            {timeFormat('%d:%H:%M:%S')(currentTime)}
            &nbsp;
          </div>
          <div className={ styles['day-icon'] }>
            <span>D</span>
            <span>H</span>
            <span>M</span>
            <span>S</span>
          </div>
        </div>
        <Button>{playButtonSvgIcon}</Button>
        <Button onClick={ onReset } title="Reset Zoom">{zoomFactorText}</Button>
      </div>
    </div>
  }
}
