import React, {Component} from 'react'

import overviewSvgIcon from '../../../assets/icons/overview.svg'
import triangleSvgIcon from '../../../assets/icons/asset-downloaded.svg'
import styles from './SquareButtons.scss'
import customArrowTop from './custom-arrow-top.svg'

const Button = ({onClick, children: __html, className}) => {
  className=  `${className } ${   styles['square-button']}`
  return <button {...{className, onClick}} dangerouslySetInnerHTML={{__html}} />
}

export default class SquareButtons extends Component {
  render() {
    const {onToggled, isToggled} = this.props
    const toggleButtonClassName = `${styles['no-top-border']  } ${  isToggled ? styles['is-toggled'] : ''}`
    return <div className={styles['square-buttons-block']}>
      <div />
      {!isToggled && <div>
        <Button className={styles['active']}>{overviewSvgIcon}</Button>
        <Button>{triangleSvgIcon}</Button>
      </div>}
      <div className={toggleButtonClassName}>
        <Button onClick={onToggled}>{customArrowTop}</Button>
      </div>
    </div>
  }
}
