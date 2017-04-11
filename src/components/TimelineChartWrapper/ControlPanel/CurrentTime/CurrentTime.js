import React, {Component, PropTypes} from 'react'
import {timeFormat} from 'd3'

import styles from './CurrentTime.scss'

export default class CurrentTime extends Component {
  static propTypes = {currentTime: PropTypes.number}

  render() {
    const {currentTime} = this.props
    const days = Math.floor(currentTime / 1000 / 60 / 60 / 24)

    return <div className={styles['day-time-wrapper']}>
      <div className={styles['day-time']}>
        &nbsp;
        {`${days}:${timeFormat('%H:%M:%S')(currentTime)}`}
      </div>
      <div className={styles['day-icon']}>
        <span>D</span>
        <span>H</span>
        <span>M</span>
        <span>S</span>
      </div>
    </div>
  }
}
