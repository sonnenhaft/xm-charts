import '../common/d3.shims'
import React, {PropTypes, Component} from 'react'

export default class WindowDependable extends Component {
  static propTypes = {onWindowResize: PropTypes.func.isRequired}

  componentDidMount() {
    window.addEventListener('resize', this.onWindowResize)
  }

  onWindowResize = () => this.props.onWindowResize()

  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize)
  }

  render() {
    const {children, style} = this.props

    return <div style={style}>{children}</div>
  }
}
