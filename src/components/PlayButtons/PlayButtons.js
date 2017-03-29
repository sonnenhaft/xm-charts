import React, { Component } from 'react'

import styles from './PlayButtons.scss'
import triangleSvgIcon from './play-button.svg'
import forwardSvgIcon from './forward-button.svg'
import backwardSvgIcon from './backward-button.svg'

const Button = ({ onClick, children: __html, className }) => {
  className = `${className } ${   styles['play-action-button']}`
  return <button { ...{ className, onClick } } dangerouslySetInnerHTML={ { __html } } />
}

export default class PlayButtons extends Component {
  render () {
    return <div className={ styles['play-buttons-block'] }>
      <Button>{backwardSvgIcon}</Button>
      <Button>{triangleSvgIcon}</Button>
      <Button>{forwardSvgIcon}</Button>
    </div>
  }
}
