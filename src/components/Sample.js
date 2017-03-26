import React from 'react'
import './Sample.scss'
import TimelineChartWrapper from './TimelineChartWrapper/TimelineChartWrapper'

const Sample = () => (
  <div>
    {/*<div styleName="root">sample</div>*/}
    <TimelineChartWrapper/>
    <style>{`
      body {
        margin: 0;
      }`}
    </style>
  </div>
)

export default Sample
