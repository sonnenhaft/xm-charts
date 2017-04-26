import './d3.shims'
import React, { PropTypes, Component } from 'react'

export default class WindowDependable extends Component {
  static propTypes = { onDimensionsChanged: PropTypes.func.isRequired }

  componentDidMount() {
    window.addEventListener('resize', this.onDimensionsChanged)
  }

  onDimensionsChanged = () => {
    this.props.onDimensionsChanged()
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onDimensionsChanged)
  }

  render() {
    const { children, style, refCb: ref } = this.props
    return <div {...{ style, ref }}>{children}</div>
  }
}
