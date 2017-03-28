import React, {Component} from 'react'

import styles from './TimelineChartWrapper.scss'
import TimelineChart from '../TimelineChart/TimelineChart'
import SquareButtonsBlock from '../SquareButtonsBlock/SquareButtonsBlock'
import TimelineControlBlock from '../TimlineControlBlock/TimelineControlBlock'

export default class TimelineChartWrapper extends Component {
  constructor(props) {
    super(props)
    this.state = {isToggled: false}
  }

  onToggle = () => this.setState({isToggled: !this.state.isToggled})

  render() {
    const [{isToggled}, {data: chartData}, {onToggle}] = [this.state, this.props, this]
    return <div className={styles['timeline-chart-wrapper']}>
      <TimelineControlBlock {...{isToggled}}/>
      <TimelineChart {...{isToggled, chartData}}/>
      <SquareButtonsBlock {...{onToggle, isToggled}}/>
    </div>
  }
}
