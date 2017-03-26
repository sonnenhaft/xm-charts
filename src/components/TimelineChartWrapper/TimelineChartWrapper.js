import React, { Component } from 'react'
import TimelineChart from '../TimelineChart/TimelineChart'
/* eslint-disable */
import styles from 'raw-loader!./TimelineChartWrapper.plain-css'
/* eslint-enable */

// const d3 = {scaleLinear, select, tsvParse, max, axisBottom, axisLeft, zoom}

export default class TimelineChartWrapper extends Component {
  constructor(props) {
    super(props)
    this.state = { toggled: false }
  }

  toggle =()=>{
    this.setState({toggled: !this.state.toggled})
  }

  render() {
    const isToggled = this.state.toggled
    return <div>
      <div className={'timeline-row chart-block'}>
        <div className="chart-area">
          <TimelineChart toggled={isToggled}/>
        </div>
        <div className="button-area">
          <button className="toggle-button" onClick={this.toggle}>
            <svg width="23" height="20">
              <g transform={this.state.toggled ? 'rotate(180, 12, 10)' : ''}>
                <rect width="2" height="18" fill="white" transform="translate(12, 0)"/>
                <rect width="2" height="12" fill="white" transform="translate(12, 0) rotate(55, 0, 0)"/>
                <rect width="2" height="15" fill="white" transform="translate(11, 0) rotate(-55, 0, 0)"/>
              </g>
            </svg>
          </button>
          {!isToggled && <button className="toggle-button">Toggle button</button>}
        </div>
      </div>
      {!isToggled && <div className="timeline-row control-row">
        <div className="chart-area">

        </div>
        <div className="button-area">
          <button className="toggle-button" onClick={this.toggle}>
            <svg width="23" height="20">
              <rect width="2" height="18" fill="white" transform="translate(12, 0)"/>
              <rect width="2" height="12" fill="white" transform="translate(12, 0) rotate(55, 0, 0)"/>
              <rect width="2" height="15" fill="white" transform="translate(11, 0) rotate(-55, 0, 0)"/>
            </svg>
          </button>
        </div>
      </div>}
      <style>{styles}</style>
    </div>
  }
}
