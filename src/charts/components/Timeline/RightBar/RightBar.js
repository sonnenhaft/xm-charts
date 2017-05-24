import React, { PropTypes as P } from 'react'
import { compose, onlyUpdateForKeys, setPropTypes, withHandlers, withState } from 'recompose'

import overviewSvgIcon from 'assets/icons/overview.svg'
import triangleSvgIcon from 'assets/icons/asset-downloaded.svg'
import customArrowTop from 'assets/icons/custom-arrow-top.svg'
import './RightBar.scss'

const Icon = ({ children: __html }) => <span dangerouslySetInnerHTML={{ __html }}/>

const styleName = 'square-button'
const ZOOM_STEP = 2
const RightBar = ({
                    onToggledChanged, isToggled,
                    zoomFactor,
                    maxZoom, minZoom,
                    onZoomIn, onZoomOut,
                    cleanLongPressedButton,
                    setLongPressedButton,
                    zoomCompletely,
                  }) => {
  const toggledClass = isToggled ? 'is-toggled' : ''

  const longPress = key => () => {
    setLongPressedButton({ key, time: Date.now() })
    setTimeout(() => { zoomCompletely(key) }, 1500)
  }

  return <div styleName="right-bar">
    <div />
    <div styleName={`zoom-buttons ${ toggledClass }`}>
      <div styleName="text-shifted-to-top">

        <button styleName="zoom-button"
                disabled={zoomFactor >= maxZoom}
                onMouseDown={longPress('longZoomIn')}
                onMouseUp={cleanLongPressedButton}
                onClick={onZoomIn}>
          <span>+</span>
        </button>
        <button styleName="zoom-button"
                disabled={zoomFactor <= minZoom}
                onMouseDown={longPress('longZoomOut')}
                onMouseUp={cleanLongPressedButton}
                onClick={onZoomOut}>
          <span>-</span>
        </button>
      </div>
      {/*TODO: unhide switch to gigabytes when logic is defined*/}
      { !isToggled && false &&
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

export default compose(
  setPropTypes({
    onToggledChanged: P.func.isRequired,
    isToggled: P.bool.isRequired,
    onZoomFactorChanged: P.func.isRequired,
    minZoom: P.number.isRequired,
    maxZoom: P.number.isRequired,
    zoomFactor: P.number.isRequired,
  }),
  onlyUpdateForKeys(['zoomFactor', 'isToggled']),
  withState('longPressedButton', 'setLongPressedButton', null),
  withHandlers({
    onZoomIn: ({ zoomFactor, onZoomFactorChanged }) => () => {
      onZoomFactorChanged(zoomFactor * ZOOM_STEP)
    },
    onZoomOut: ({ zoomFactor, onZoomFactorChanged }) => () => {
      onZoomFactorChanged(zoomFactor / ZOOM_STEP)
    },
    zoomCompletely: ({ setLongPressedButton, onZoomFactorChanged, minZoom, maxZoom, longPressedButton }) => key => {
      if ( !longPressedButton || longPressedButton.key !== key ) {
        return
      } else {
        if ( Date.now() - longPressedButton.time >= 2000 ) {
          onZoomFactorChanged(key === 'longZoomIn' ? maxZoom : minZoom)
        }
        setLongPressedButton(null)
      }
    },
  })
)(RightBar)
