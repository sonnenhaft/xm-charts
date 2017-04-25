import React, {Component, PropTypes as P} from 'react'
import {utcFormat as formatTime} from 'd3'

import styles from './CurrentTime.scss'

export default class CurrentTime extends Component {
  static propTypes = {
    time: P.number.isRequired,
  }

  render() {
    const time = this.props.time
    const days = Math.floor(time / 1000 / 60 / 60 / 24)

    return <div className={styles['current-time']}>
      <div className={styles['current-time-value']}>
        &nbsp;{ `${ days }:${ formatTime('%H:%M:%S')(time) }` }
      </div>
      <div className={styles['current-time-legend']}>
        { days && <span>D</span> }
        <span>H</span>
        <span>M</span>
        <span>S</span>
      </div>
    </div>
  }
}
