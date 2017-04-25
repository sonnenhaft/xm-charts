import React, {Component, PropTypes} from 'react'

import overviewSvgIcon from '../../../assets/icons/overview.svg'
import triangleSvgIcon from '../../../assets/icons/asset-downloaded.svg'
import styles from './SquareButtons.scss'
import customArrowTop from './custom-arrow-top.svg'

export class Button extends Component {
  buttonClassName = styles['square-button']

  render() {
    const {children: __html, onClick} = this.props
    const className = `${ this.props.className } ${ this.buttonClassName }`

    return <button {...{className, onClick}} dangerouslySetInnerHTML={{__html}} />
  }
}

export default class SquareButtons extends Component {
  static propTypes = {
    zoomFactor: PropTypes.number.isRequired,
    onZoomChanged: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
  }

  zoomIn = () => this.props.onZoomChanged(this.props.zoomFactor * 2)
  onZoomOut = () => this.props.onZoomChanged(this.props.zoomFactor / 2)
  onZoomReset = e => {
    e.preventDefault()
    this.props.onReset()
  }

  shouldComponentUpdate({isToggled}) { return this.props.isToggled !== isToggled }

  render() {
    const props = this.props
    const toggleButtonClassName = `${styles['no-top-border']} ${props.isToggled ? styles['is-toggled'] : ''}`

    return <div className={styles['square-buttons-block']}>
      <div />
      <div className={`${styles['small-buttons']  } ${  props.isToggled ? styles['is-toggled'] : ''}`}>
        <div onContextMenu={this.onZoomReset} className={styles['text-shifted-to-top']}>
          <Button onClick={this.zoomIn}>+</Button>
          <Button onClick={this.onZoomOut}>-</Button>
        </div>
        {!props.isToggled &&
        <div>
          <Button className={styles['active']}>{overviewSvgIcon}</Button>
          <Button>{triangleSvgIcon}</Button>
        </div>
        }
      </div>
      <div className={toggleButtonClassName}>
        <Button onClick={props.onToggled}>{customArrowTop}</Button>
      </div>
    </div>
  }
}
