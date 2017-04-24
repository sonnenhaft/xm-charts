import React, {Component, PropTypes} from 'react'

import overviewSvgIcon from '../../../assets/icons/overview.svg'
import triangleSvgIcon from '../../../assets/icons/asset-downloaded.svg'
import styles from './SquareButtons.scss'
import customArrowTop from './custom-arrow-top.svg'

const Button = ({onClick, children: __html, className}) => {
  className = `${className } ${   styles['square-button']}`
  return <button {...{className, onClick}} dangerouslySetInnerHTML={{__html}} />
}

export default class SquareButtons extends Component {
  static propTypes = {
    zoomFactor: PropTypes.number.isRequired,
    onZoomChanged: PropTypes.func.isRequired,
  }

  zoomIn = () => this.props.onZoomChanged(this.props.zoomFactor * 2)
  onZoomOut = () => this.props.onZoomChanged(this.props.zoomFactor / 2)
  onZoomReset = e => {
    e.preventDefault()
    this.props.onZoomChanged(1)
  }

  shouldComponentUpdate({isToggled}) { return this.props.isToggled !== isToggled }

  render() {
    const props = this.props
    const toggleButtonClassName = `${styles['no-top-border']  } ${  props.isToggled ? styles['is-toggled'] : ''}`

    return <div className={styles['square-buttons-block']}>
      <div />
      {!props.isToggled && <div className={styles['small-buttons']}>
        <div onContextMenu={this.onZoomReset}>
          <Button onClick={this.zoomIn}>+</Button>
          <Button onClick={this.onZoomOut}>-</Button>
        </div>
        <div>
          <Button className={styles['active']}>{overviewSvgIcon}</Button>
          <Button>{triangleSvgIcon}</Button>
        </div>
      </div>}
      <div className={toggleButtonClassName}>
        <Button onClick={props.onToggled}>{customArrowTop}</Button>
      </div>
    </div>
  }
}
