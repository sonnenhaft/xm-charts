import React, { Component } from 'react'
import SimulationChart from 'charts/components/SimulationChart'
import './Demo.scss'

const addDemoClusters = node => ({ ...node })
const rand = arr => arr[Math.round(Math.random() * (arr.length - 1))]
const version = `${process.env.npm_package_name} v${process.env.npm_package_version}`
const options = [
  { value: 1, title: 1 },
  { value: 2, title: 2 },
  { value: 3, title: 3 },
]

class DemoHeader extends Component {
  state = {
    interval: null,
  }

  clearInterval = () => {
    if ( this.state.interval ) {
      clearInterval(this.state.interval)
      this.setState({ interval: null })
    }
  }

  runInterval = () => {
    if ( this.state.interval ) {
      this.clearInterval()
    } else {
      this.setState({ interval: setInterval(this.props.onNextAddTick, 100) })
    }
  }

  componentDidMount() {
    document.addEventListener('visibilitychange', this.clearInterval)
    window.onblur = this.clearInterval
  }

  componentWillUnmount() {
    this.clearInterval()
  }

  render() {
    const { className, value, events, onChange } = this.props
    return (
      <div className={className}>
        <div styleName="toolbar-header">
          Toolbar here ({version})
          <select value={value} styleName="section" onChange={onChange}>
            {options.map(({ value, title }) =>
              <option key={value} value={value}>Data set #{title}</option>
            )}
          </select>
          <div>
            {events.length &&
            <button onClick={this.runInterval}>
              {this.state.interval ? 'Stop ' : 'Start '} generating events
            </button>
            }
          </div>
        </div>
      </div>
    )
  }
}

class Demo extends Component {
  state = {
    nodes: [],
    events: [],
    option: options[1].value,
  }

  componentDidMount() {
    this.onLoadData()
  }

  onLoadData(value = this.state.option) {
    const events = require(`./events${value}.json`)
    const nodes = require(`./nodes${value}.json`)

    this.setState({ option: value, events, nodes: nodes.map(addDemoClusters) })
  }

  onNextAddTick = () => {
    const events = this.state.events.slice()
    const event = rand(events)
    const node = rand(this.state.nodes)
    const lastEvent = events[events.length - 1]
    const date = new Date(new Date(lastEvent.timestamp).getTime() + 1000)
    events.push({
      ...event,
      id: Date.now(),
      timestamp: new Date(date),
      data: {
        ...(event.data || {}),
        sourceNode: { id: node.agentId },
      },
      networkSuperiority: Math.min((lastEvent.networkSuperiority + Math.random()), 100),
    })
    this.setState({ events })
  }

  render() {
    const { option, events, nodes } = this.state

    return (
      <div styleName="root">
        <DemoHeader styleName="toolbar" value={option}
                    onNextAddTick={this.onNextAddTick}
                    onChange={event => this.onLoadData(event.target.value)} events={events}/>
        <SimulationChart styleName="simulation-chart" events={events} nodes={nodes}/>
      </div>
    )
  }
}

export default Demo
