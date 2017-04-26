import React, { Component, PropTypes as P } from 'react'

import Timeline from './../Timeline'
import NetworkGrid from './../NetworkGrid'

export default class XmChart extends Component {
  static defaultProps = { events: [], nodes: [] }
  static propTypes = { events: P.array, nodes: P.array }

  constructor(props) {
    super(props)
    let currentTime = 0
    if ( props.events.length ) {
      currentTime = props.events[props.events.length - 1].date
    }
    this.state = { currentTime }
  }

  onCurrentTimeChanged = currentTime => this.setState({ currentTime })

  render() {
    const { events, nodes } = this.props
    const { currentTime } = this.state
    const { onCurrentTimeChanged } = this
    return <div>
      <NetworkGrid {...{ events, nodes, currentTime }}>Marketing</NetworkGrid>
      <Timeline {...{ events, nodes, currentTime, onCurrentTimeChanged }} />
    </div>
  }
}
