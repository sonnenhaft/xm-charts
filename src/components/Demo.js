import React from 'react'
import TimelineChartWrapper from './TimelineChartWrapper/TimelineChartWrapper'
import generateDemoData from './TimelineChartWrapper/generateDemoData'

const Demo = () => (
  <div>
    <br />
    <br />
    <TimelineChartWrapper data={generateDemoData(true)} />
    <br />
    <br />
    <TimelineChartWrapper data={generateDemoData()} />
    <style>{`
      body {
        margin: 0;
      }`}
    </style>
  </div>
)

export default Demo
