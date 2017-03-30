import * as d3 from 'd3'
import React, { Component } from 'react'
import styles from './TooltipContent.scss'
import ShareButtons from '../ShareButtons/ShareButtons'

export default class TooltipContent extends Component {
  render () {
    const { tooltipData } = this.props
    return <div className={ styles['tooltip-content'] }>
      {tooltipData.name && <div>
        <div>
          <div className={ styles['title'] }>{tooltipData.name}</div>
          <div className={ styles['content'] }>
            <div>
              <span className={ styles['title'] }>Method: </span>
              <span>{tooltipData.method}</span>
            </div>
            <div>
              <span className={ styles['title'] }>Source: </span>
              <span>{tooltipData.source}</span>
            </div>
          </div>
          <div className={ styles['tooltip-event-icons'] }>
            <ShareButtons type="vertical" />
            <div className={ styles['separator'] } />
            <b>{d3.timeFormat('%H:%M:%S')(tooltipData.date)}</b>
          </div>
        </div>
      </div>}
      {!tooltipData.name && <div>
        <ShareButtons type="dark-icons" />
        {/*<div>count {tooltipData.value}</div>*/}
        <b>{d3.timeFormat('%H:%M:%S')(tooltipData.date)}</b>
      </div>}
    </div>
  }
}

export const DemoTooltipContent = () =>  <TooltipContent tooltipData={ {
  name: 'demo',
  method: 'method',
  source: 'source',
  date: Date.now(),
} } />
