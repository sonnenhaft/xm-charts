import React, {Component} from 'react'
import SimulationChart from 'charts/components/SimulationChart'
import './Demo.scss'

const version = `${process.env.npm_package_name} v${process.env.npm_package_version}`
const options = [
  {value: 1, title: 1},
  {value: 2, title: 2},
  {value: 3, title: 3},
]

const Bar = ({className, value, ...rest}) => (
  <div className={className}>
    <select value={value} {...rest}>
      {options.map(({value, title}) => 
        <option key={value} value={value}>{title}</option>
      )}
    </select>
    Toolbar here ({version})
  </div>
)

class Demo extends Component {
  state = {
    events: [],
    nodes: [],
    option: options[0].value,
  }

  componentDidMount() {
    this.onLoadData(this.state.option)
  }

  onLoadData(value) {
    const events = require(`./events${value}.json`)
    const nodes = require(`./nodes${value}.json`)

    this.setState({option: value, events, nodes})
  }

  // onOptionChange = (value) => {
  //   this.setState({option: value}, () => this.onLoadData(value))
  // }

  render() {
    const {option, events, nodes} = this.state

    return (
      <div styleName="root">
        <Bar styleName="toolbar" value={option} onChange={(event) => this.onLoadData(event.target.value)} />
        <SimulationChart styleName="simulation-chart" events={events} nodes={nodes}/>
      </div>
    )
  }
}

export default Demo
