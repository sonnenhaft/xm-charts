import React, { Component, PropTypes } from 'react'

import styles from './ShareButtons.scss'
import saveSvgIcon from '../../../assets/icons/asset-data.svg'
import deviceSvgIcon from '../../../assets/icons/asset-device.svg'
import networkSvgIcon from '../../../assets/icons/asset-network.svg'

const Icon = ({ children: __html }) => <span className={ styles['icon'] } dangerouslySetInnerHTML={ { __html } } />

export default class ShareButtons extends Component {
  static propTypes = { type: PropTypes.oneOf(['vertical', 'dark-icons', '']) }
  static defaultProps = { type: '' };

  render () {
    const { type } = this.props
    return <div className={ `${styles['share-buttons']  } ${  styles[type]}` }>
      <div className={ styles['share-button'] }>
        <Icon>{saveSvgIcon}</Icon>
        <span>213</span>
      </div>
      <div className={ styles['share-button'] }>
        <Icon>{deviceSvgIcon}</Icon>
        <span>12</span>
      </div>
      <div className={ styles['share-button'] }>
        <Icon>{networkSvgIcon}</Icon>
        <span>32</span>
      </div>
    </div>
  }
}
