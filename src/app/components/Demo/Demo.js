import React, { Component } from 'react'
import SimulationChart from 'charts/components/SimulationChart'
import './Demo.scss'
import Chance from 'chance'

const chance = new Chance()

const STUB_CLUSTER_NAMES = [
  'Testing',
  'Testing AB',
  'Archive',
  'Production ',
  '',
]

const addDemoClusters = node => ({
  ...node,
  cluster: chance.weighted(STUB_CLUSTER_NAMES, [1, 2, 3, 4, 2]),
})

const version = `${process.env.npm_package_name} v${process.env.npm_package_version}`
const options = [
  { value: 1, title: 1 },
  { value: 2, title: 2 },
  { value: 3, title: 3 },
]

const DemoHeader = ({ className, value, ...rest }) => (
  <div className={className}>
    <div styleName="toolbar-header">
      Toolbar here ({version})
      <select value={value} {...rest} styleName="section">
        {options.map(({ value, title }) =>
          <option key={value} value={value}>Data set #{title}</option>
        )}
      </select>
    </div>
  </div>
)

class Demo extends Component {
  state = {
    nodes: [],
    events: [],
    option: options[0].value,
  }

  componentDidMount() {
    this.onLoadData()
  }

  onLoadData(value = this.state.option) {
    const events = require(`./events${value}.json`)
    const nodes = require(`./nodes${value}.json`)

    this.setState({ option: value, events, nodes: nodes.map(addDemoClusters) })
  }

  render() {
    const { option, events, nodes } = this.state

    return (
      <div styleName="root">
        <DemoHeader styleName="toolbar" value={option}
             onChange={event => this.onLoadData(event.target.value)}/>
        <SimulationChart styleName="simulation-chart" events={events} nodes={nodes}/>
      </div>
    )
  }
}

export default Demo
