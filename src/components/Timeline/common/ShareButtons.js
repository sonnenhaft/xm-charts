import React, { PropTypes } from 'react'

import './ShareButtons.scss'
import saveSvgIcon from 'assets//icons/asset-data.svg'
import deviceSvgIcon from 'assets//icons/asset-device.svg'
import networkSvgIcon from 'assets//icons/asset-network.svg'

const Icon = ({ children: __html }) => <span styleName="icon" dangerouslySetInnerHTML={{ __html }} />

const ShareButtons = ({ type = '', data: { data, device, network } = {}, children }) => {
  return <div styleName={`share-buttons ${type}`}>
    <div styleName="share-button">
      <Icon>{saveSvgIcon}</Icon>
      <span>{data}</span>
    </div>
    <div styleName="share-button">
      <Icon>{deviceSvgIcon}</Icon>
      <span>{device}</span>
    </div>
    <div styleName="share-button">
      <Icon>{networkSvgIcon}</Icon>
      <span>{network}</span>
    </div>
    {children && <div styleName="share-button">
      {children}
    </div>}
  </div>
}

ShareButtons.propTypes = {
  type: PropTypes.oneOf(['vertical', 'dark-icons', '', 'vertical-black']),
  data: PropTypes.object,
  children: PropTypes.any,
}

export default ShareButtons
