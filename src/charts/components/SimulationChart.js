import React from 'react'
import Timeline from './Timeline'
import NetworkGrid from './NetworkGrid'
import {compose, withPropsOnChange} from 'recompose'

import './SimulationChart.scss'
import eventsAndNodesAdapter from '../utils/eventsAndNodesAdapter'

class SimulationChart extends React.Component {

  state = {currentTime: 0}

  onCurrentTimeChanged = currentTime => this.setState({currentTime})

  componentWillReceiveProps({nodes, events}){
    if(nodes !== this.props.nodes || events !== this.props.events){
      this.setState({currentTime: events.length && events[events.length - 1].date})
    }
  }

  render(){
    const {props: {events, nodes, className}, state: {currentTime}, onCurrentTimeChanged } = this
    return (
      <div className={className} styleName="root">
        <NetworkGrid styleName="network" {...{events, nodes, currentTime}}/>
        <Timeline styleName="timeline" {...{events, nodes, currentTime, onCurrentTimeChanged}} />
      </div>
    )
  }
}

const enhance = compose(
  withPropsOnChange(['nodes', 'events'], ({nodes, events}) => eventsAndNodesAdapter({events, nodes})),
)

export default enhance(SimulationChart)

