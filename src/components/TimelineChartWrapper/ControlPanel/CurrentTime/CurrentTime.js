import React, {Component, PropTypes} from 'react'
import {utcFormat as timeFormat} from 'd3'

import styles from './CurrentTime.scss'

export default class CurrentTime extends Component {
  static propTypes = {
    offset: PropTypes.number,
    currentTime: PropTypes.any,
  }

  static defaultProps = {currentTime: 0, offset: 0}

  render() {
    const {currentTime: _currentTime, offset} = this.props
    const currentTime = _currentTime - offset
    const days = Math.floor(currentTime / 1000 / 60 / 60 / 24)

    let formattedTime = timeFormat('%H:%M:%S')(currentTime)
    return <div className={styles['day-time-wrapper']}>
      <div className={styles['day-time']}>
        &nbsp;
        {`${days}:${formattedTime}`}
      </div>
      <div className={styles['day-icon']}>
        {days && <span>D</span>}
        <span>H</span>
        <span>M</span>
        <span>S</span>
      </div>
    </div>
  }
}
