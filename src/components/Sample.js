import React from 'react'
import './Sample.scss'
import TimelineChartWrapper from './TimelineChartWrapper/TimelineChartWrapper'
import GenerateStub from './GenerateStub'

const Sample = () => (
  <div>
    {/*<div styleName="root">sample</div>*/}
    <TimelineChartWrapper data={GenerateStub(true)}/>
    <br/>
    <TimelineChartWrapper data={GenerateStub()}/>
    <style>{`
      body {
        margin: 0;
      }`}
    </style>
  </div>
)

export default Sample
