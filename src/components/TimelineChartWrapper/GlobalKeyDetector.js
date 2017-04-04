import React, {Component, PropTypes} from 'react'

export default class GlobalKeyDetector extends Component {
  static propTypes = {
    onKeyDown: PropTypes.func.isRequired,
    children: PropTypes.any.isRequired,
    className: PropTypes.string,
  }

  static defaultProps = {className: ''}

  onMouseEnter = () => document.addEventListener('keydown', this.onKeyDown)
  onMouseLeave = () => document.removeEventListener('keydown', this.onKeyDown)
  onKeyDown = e => this.props.onKeyDown(e)

  render() {
    const {onMouseEnter, onMouseLeave} = this
    const {className} = this.props

    return <div {...{onMouseEnter, onMouseLeave, className}}>
      {this.props.children}
    </div>
  }
}
