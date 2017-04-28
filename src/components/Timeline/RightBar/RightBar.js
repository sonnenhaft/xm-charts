import React from 'react'
import { onlyUpdateForKeys } from 'recompose'

import overviewSvgIcon from 'assets/icons/overview.svg'
import triangleSvgIcon from 'assets/icons/asset-downloaded.svg'
import customArrowTop from 'assets/icons/custom-arrow-top.svg'
import './RightBar.scss'

const Icon = ({ children: __html }) => <span dangerouslySetInnerHTML={{ __html }} />

const RightBar = ({
                    onToggledChanged, isToggled,
                    onZoomFactorChanged, zoomFactor,
                   maxZoom, minZoom,
                  }) => {
  console.log(minZoom, maxZoom, zoomFactor)
  const toggledClass = isToggled ? 'is-toggled' : ''
  const styleName = 'square-button'
  return <div styleName="right-bar">
    <div />
    <div styleName={`small-buttons ${ toggledClass }`}>
      <div styleName="text-shifted-to-top" onContextMenu={e => {
        e.preventDefault()
        onZoomFactorChanged(1)
      }}>

        <button styleName="square-button"
                disabled={zoomFactor >= maxZoom}
                onClick={() => onZoomFactorChanged(zoomFactor * 2)}>
          <span>+</span>
        </button>
        <button styleName="square-button"
                disabled={zoomFactor <= minZoom}
                onClick={() => onZoomFactorChanged(zoomFactor * 0.5)}>
          <span>-</span>
        </button>
      </div>
      { !isToggled &&
      <div>
        <button onClick={() => console.warn('TODO: add overview action')} styleName={`${styleName} active`}>
          <Icon>{ overviewSvgIcon }</Icon>
        </button>
        <button onClick={() => console.warn('TODO: add triangle action')} styleName="square-button">
          <Icon>{ triangleSvgIcon }</Icon>
        </button>
      </div>
      }
    </div>
    <div styleName={`no-top-border ${ toggledClass }`}>
      <button onClick={() => onToggledChanged(!isToggled)} styleName="square-button">
        <Icon>{ customArrowTop }</Icon>
      </button>
    </div>
  </div>
}

const OptimizedRightBar = onlyUpdateForKeys(['zoomFactor', 'isToggled'])(RightBar)
export default OptimizedRightBar
