import React from 'react'
import './NetworkTooltip.scss'

const NetworkTooltip = ({ item, coordsFn, children, offsets, isDark }) => {
  const style = coordsFn ? coordsFn(item, offsets.h, offsets.x, offsets.y) : {}
  return (
    <div>
      {item && <div styleName="node-tooltip" style={style}>
        <div styleName={`node-information ${isDark ? 'dark' : ''}`}>
          {children}
        </div>
        <svg styleName="tooltip-svg">
          <path d="M 0 75 L  55 0 L 90 0" fill="none" stroke="black" strokeWidth="4.5" transform="translate(0,2) scale(0.5)"/>
        </svg>
      </div>}
    </div>
  )
}

export default NetworkTooltip
