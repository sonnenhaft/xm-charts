import React, {Component, PropTypes} from 'react'

import styles from './ShareButtons.scss'
import saveSvgIcon from '../../../assets/icons/asset-data.svg'
import deviceSvgIcon from '../../../assets/icons/asset-device.svg'
import networkSvgIcon from '../../../assets/icons/asset-network.svg'

const Icon = ({children: __html}) => <span className={styles['icon']} dangerouslySetInnerHTML={{__html}} />

export default class ShareButtons extends Component {
  static propTypes = {
    type: PropTypes.oneOf(['vertical', 'dark-icons', '', 'vertical-black']),
  }
  static defaultProps = {type: '', data: {}};

  render() {
    const {type, data: _data, children} = this.props
    const {data, device, network} = _data

    let className = styles['share-button']
    return <div className={`${styles['share-buttons']} ${styles[type]}`}>
      <div {...{className}}>
        <Icon>{saveSvgIcon}</Icon>
        <span>{data}</span>
      </div>
      <div {...{className}}>
        <Icon>{deviceSvgIcon}</Icon>
        <span>{device}</span>
      </div>
      <div {...{className}}>
        <Icon>{networkSvgIcon}</Icon>
        <span>{network}</span>
      </div>
      {children && <div {...{className}}>
        {children}
      </div>}
    </div>
  }
}
