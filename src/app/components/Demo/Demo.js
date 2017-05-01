import React, {Component} from 'react'
import SimulationChart from 'charts/components/SimulationChart'
import './Demo.scss'

import nodes from './nodes1.json'
import events from './events1.json'


const version = `${process.env.npm_package_name} v${process.env.npm_package_version}`

const Bar = ({className}) => (<div className={className}>Toolbar here ({version})</div>)

class Demo extends Component {
  render() {
    return (
      <div styleName="root">
        <Bar styleName="toolbar"/>
        <SimulationChart styleName="simulation-chart" events={events} nodes={nodes}/>
      </div>
    )
  }
}

export default Demo
