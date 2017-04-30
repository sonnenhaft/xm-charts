import React, {Component} from 'react'
import SimulationChart from 'charts/components/SimulationChart'
import generateDemoData from './generateDemoData'
import './Demo.scss'

const data = generateDemoData()
const version = `${process.env.npm_package_name} v${process.env.npm_package_version}`

const Bar = ({className}) => (<div className={className}>Toolbar here ({version})</div>)

class Demo extends Component {
  render() {
    return (
      <div styleName="root">
        <Bar styleName="toolbar"/>
        <SimulationChart styleName="simulation-chart" events={data.events} nodes={data.nodes}/>
      </div>
    )
  }
}

export default Demo
