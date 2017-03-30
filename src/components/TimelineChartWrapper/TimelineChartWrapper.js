import React, { Component } from 'react'

import styles from './TimelineChartWrapper.scss'
import TimelineChart from '../TimelineChart/TimelineChart'
import SquareButtons from './SquareButtons/SquareButtons'
import TimelineControl from './TimlineControl/TimelineControl'

export default class TimelineChartWrapper extends Component {
  constructor (props) {
    super(props)
    this.state = { isToggled: false }
  }

  onToggle = () => this.setState({ isToggled: !this.state.isToggled })

  render () {
    const { state: { isToggled }, props: { data: chartData }, onToggle } = this
    return <div className={ styles['timeline-chart-wrapper'] }>
      <TimelineControl { ...{ isToggled } } />
      <TimelineChart { ...{ isToggled, chartData } } />
      <SquareButtons { ...{ onToggle, isToggled } } />
    </div>
  }
}
