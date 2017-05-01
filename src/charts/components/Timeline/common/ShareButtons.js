import React, { PropTypes } from 'react'

import './ShareButtons.scss'
import { Snow, Desktop, Diskette } from '../../NetworkGrid/IconsGroup'

const Icon = ({ children: __html }) => <svg styleName="icon" dangerouslySetInnerHTML={{ __html }} />

const ShareButtons = ({ type = '', data: { data, device, network } = {}, children }) => {
  return <div styleName={`share-buttons ${type}`}>
    <div styleName="share-button">
      <Icon>{Diskette}</Icon>
      <span>{data}</span>
    </div>
    <div styleName="share-button">
      <Icon>{Desktop}</Icon>
      <span>{device}</span>
    </div>
    <div styleName="share-button">
      <Icon>{Snow}</Icon>
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
