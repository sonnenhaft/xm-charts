import React, {Component, PropTypes} from 'react'
import {timeFormat} from 'd3'

import styles from './CurrentTime.scss'

export default class CurrentTime extends Component {
  static propTypes = {
    currentTime: PropTypes.number,
  }

  render() {
    const {currentTime} = this.props

    return  <div className={styles['day-time-wrapper']}>
      <div className={styles['day-time']}>
        &nbsp;
        {timeFormat('%d:%H:%M:%S')(currentTime)}
        &nbsp;
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
