import React, {Component} from 'react'

import styles from './TimelineChartWrapper.scss'
import TimelineChart from '../TimelineChart/TimelineChart'

export default class TimelineChartWrapper extends Component {
  constructor(props) {
    super(props)
    this.state = {isToggled: false}
  }

  toggleChart = ()=> this.setState({isToggled: !this.state.isToggled})

  render() {
    const [{isToggled}, {data: chartData}] = [this.state, this.props]
    return <div className={styles['timeline-row']}>
      <div className={styles['button-area']}></div>
      <div className={styles['chart-area']}>
        <TimelineChart {...{isToggled, chartData}}/>
      </div>
      <div className={styles['button-area']}>
        <button className={styles['toggle-button']} onClick={this.toggleChart}>
          <svg width="23" height="20">
            <rect width="2" height="18" fill="white" transform="translate(12, 0)"/>
            <rect width="2" height="12" fill="white" transform="translate(12, 0) rotate(55, 0, 0)"/>
            <rect width="2" height="15" fill="white" transform="translate(11, 0) rotate(-55, 0, 0)"/>
          </svg>
        </button>
      </div>
    </div>
  }
}
