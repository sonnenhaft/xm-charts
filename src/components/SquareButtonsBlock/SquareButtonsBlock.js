import React, {Component} from 'react'

import styles from './SquareButtonsBlock.scss'
import customArrowTop from './custom-arrow-top.svg'
import overviewSvgIcon from '../../assets/overview.svg'

import triangleSvgIcon from '../../assets/asset-downloaded.svg'



const Button = ({onClick, children: __html, className}) => {
  className=  `${className } ${   styles['square-button']}`
  return <button {...{className, onClick}} dangerouslySetInnerHTML={{__html}}/>
}

export default class SquareButtonsBlock extends Component {
  render() {
    const {onToggle, isToggled} = this.props

    return <div className={styles['square-buttons-block']}>
      {!isToggled && <div>
        <Button className="active">{overviewSvgIcon}</Button>
        <Button>{triangleSvgIcon}</Button>
      </div>}
      <Button onClick={onToggle}>{customArrowTop}</Button>
    </div>
  }
}
