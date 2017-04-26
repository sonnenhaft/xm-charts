import React from 'react'
import {utcFormat as formatTime} from 'd3'

import './CurrentTime.scss'

const CurrentTime = ({time}) => {
  const days = Math.floor(time / 1000 / 60 / 60 / 24)

  return <div styleName="current-time">
    <div styleName="current-time-value">
      &nbsp;{ `${ days }:${ formatTime('%H:%M:%S')(time) }` }
    </div>
    <div styleName="current-time-legend">
      { days && <span>D</span> }
      <span>H</span>
      <span>M</span>
      <span>S</span>
    </div>
  </div>
}

export default CurrentTime
