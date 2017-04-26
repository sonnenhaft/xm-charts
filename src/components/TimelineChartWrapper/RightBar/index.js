import React, {Component, PropTypes as P} from 'react'

import overviewSvgIcon from '../../../assets/icons/overview.svg'
import triangleSvgIcon from '../../../assets/icons/asset-downloaded.svg'
import styles from './RightBar.scss'
import customArrowTop from './custom-arrow-top.svg'
import {Button} from './RightBar.Button'

class RightBar extends Component {
  static propTypes = {
    zoomFactor: P.number.isRequired,
    onZoomFactorChanged: P.func.isRequired,

    isToggled: P.bool.isRequired,
    onToggledChanged: P.func.isRequired,
  }

  shouldComponentUpdate({isToggled}) {
    return this.props.isToggled !== isToggled
  }

  onToggled = () => this.props.onToggledChanged(!this.props.isToggled)

  onZoomIn = () => this.multiplyZoom(2)
  onZoomOut = () => this.multiplyZoom(0.5)

  multiplyZoom(zoomMultiplier) {
    this.props.onZoomFactorChanged(this.props.zoomFactor * zoomMultiplier)
  }

  onZoomReset = e => {
    e.preventDefault()
    this.props.onZoomFactorChanged(1)
  }

  getToggledButtonClassName() {
    return `${ styles['no-top-border'] } ${ this.props.isToggled ? styles['is-toggled'] : '' }`
  }

  onTriangleClicked = () => console.log('TODO: add triangle action')
  onOverviewClicked = () => console.log('TODO: add overview action')

  render() {
    const toggledClass = this.props.isToggled ? styles['is-toggled'] : ''
    return <div className={styles['right-bar']}>
      <div />
      <div className={`${ styles['small-buttons'] } ${ toggledClass }`}>
        <div onContextMenu={this.onZoomReset} className={styles['text-shifted-to-top']}>
          <Button onClick={this.onZoomIn}>+</Button>
          <Button onClick={this.onZoomOut}>-</Button>
        </div>
        { !this.props.isToggled &&
        <div>
          <Button className={styles['active']} onClick={this.onOverviewClicked}>
            { overviewSvgIcon }
          </Button>
          <Button onClick={this.onTriangleClicked}>
            { triangleSvgIcon }
          </Button>
        </div>
        }
      </div>
      <div className={`${ styles['no-top-border'] } ${ toggledClass }`}>
        <Button onClick={this.onToggled}>{ customArrowTop }</Button>
      </div>
    </div>
  }
}

export {Button}
export {RightBar}

