import * as d3 from 'd3'
import React, {Component} from 'react'

import styles from './TimelineChartWrapper.scss'
import dataTsv from 'raw-loader!./data.tsv'

import TimelineChart from '../TimelineChart/TimelineChart'

export default class TimelineChartWrapper extends Component {
  constructor(props) {
    super(props)
    this.state = {isToggled: false, chartData: []}
  }

  componentDidMount() {
    const chartData = d3.tsvParse(dataTsv, ({date, type}) => ({data: (date - 0), type}))
    this.setState({chartData})
    this.interval = setInterval(() => {
      const chartData = this.state.chartData
      const data = chartData[chartData.length - 1].data + Math.random()
      chartData.push({data, type: 'good'})
      this.setState({chartData})
    }, 5000)
  }

  componentWillUnmount() {
    clearInterval(this.interval)
  }

  toggleChart = ()=> this.setState({isToggled: !this.state.isToggled})
  resetChartData = ()=> this.setState({chartData: this.state.chartData.slice(0, 4)})

  render() {
    const {isToggled, chartData} = this.state
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
      {!isToggled &&
      <button className={styles['reset-button']} onClick={this.resetChartData}>
        Reset
      </button>}
    </div>
  }
}
