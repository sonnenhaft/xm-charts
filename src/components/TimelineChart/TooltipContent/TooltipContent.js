import * as d3 from 'd3'
import React, { Component } from 'react'
import styles from './TooltipContent.scss'

export default class TooltipContent extends Component {
  render () {
    const { tooltipData } = this.props
    return <div className={ styles['tooltip-content'] }>
      {tooltipData.name && <div>
        <div>
          <b>{tooltipData.name}</b>
          <br />
          <br />
          <span>Method:</span> <span>{tooltipData.method}</span>
          <br />
          <span>Source:</span> <span>{tooltipData.source}</span>
          <br />
          <br />
          <div className={ styles['tooltip-event-icons'] }>
            <div>icons</div>
            <b>{d3.timeFormat('%H:%M:%S')(tooltipData.date)}</b>
          </div>
        </div>
      </div>}
      {!tooltipData.name && <div>
        <div>count {tooltipData.value}</div>
        <br />
        <b>{d3.timeFormat('%H:%M:%S')(tooltipData.date)}</b>
      </div>}
    </div>
  }
}
