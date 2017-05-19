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
          <line x1="0" y1="50" x2="70" y2="0"/>
          <line x1="70" y1="0" x2="100" y2="0" strokeWidth="2.5"/>
        </svg>
      </div>}
    </div>
  )
}

export default NetworkTooltip
