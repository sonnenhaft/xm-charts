import React, {Component, PropTypes as P} from 'react'

import overviewSvgIcon from '../../../assets/icons/overview.svg'
import triangleSvgIcon from '../../../assets/icons/asset-downloaded.svg'
import './RightBar.scss'
import customArrowTop from './custom-arrow-top.svg'

const Icon = ({children: __html}) => <span dangerouslySetInnerHTML={{__html}} />

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

  onTriangleClicked = () => console.log('TODO: add triangle action')
  onOverviewClicked = () => console.log('TODO: add overview action')

  render() {
    const toggledClass = this.props.isToggled ? 'is-toggled' : ''
    return <div styleName="right-bar">
      <div />
      <div styleName={`small-buttons ${ toggledClass }`}>
        <div onContextMenu={this.onZoomReset} styleName="text-shifted-to-top">
          <button onClick={this.onZoomIn} styleName="square-button">+</button>
          <button onClick={this.onZoomOut} styleName="square-button">-</button>
        </div>
        { !this.props.isToggled &&
        <div>
          <button onClick={this.onOverviewClicked} styleName="square-button active">
            <Icon>{ overviewSvgIcon }</Icon>
          </button>
          <button onClick={this.onTriangleClicked} styleName="square-button">
            <Icon>{ triangleSvgIcon }</Icon>
          </button>
        </div>
        }
      </div>
      <div styleName={`no-top-border ${ toggledClass }`}>
        <button onClick={this.onToggled} styleName="square-button">
          <Icon>{ customArrowTop }</Icon>
        </button>
      </div>
    </div>
  }
}

export {RightBar}

