import React, {Component, PropTypes as P} from 'react'

import styles from './RightBar.scss'

export class Button extends Component {
  buttonClassName = styles['square-button']

  static propTypes = {
    className: P.string,
    onClick: P.func,
  }

  static defaultProps = {className: ''}

  render() {
    const {children: __html, onClick} = this.props
    const className = `${ this.props.className } ${ this.buttonClassName }`

    return <button {...{className, onClick}} dangerouslySetInnerHTML={{__html}} />
  }
}
