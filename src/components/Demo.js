import React from 'react'
import TimelineChartWrapper from './TimelineChartWrapper/TimelineChartWrapper'
import generateDemoData from './TimelineChartWrapper/generateDemoData'

import packageJson from '../../package.json'



const Demo = () => (
  <div>
    <br />
    <br />
    <TimelineChartWrapper data={generateDemoData(true)} />
    <br />
    <br />
    <TimelineChartWrapper data={generateDemoData()} />

    <div className="version">{packageJson.name} v{packageJson.version}</div>
    <style>{`
      body {
        margin: 0;
      }
      .version {
        display: block;
        position: fixed;
        font-size: 25px;
        font-family: sans-serif;
        right: 5px;
        bottom: 5px;
        background: white;
        color: black;
      }
      `}
    </style>
  </div>
)

export default Demo
