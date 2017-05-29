import React, { PropTypes } from 'react'

import './ShareButtons.scss'
import { Desktop, Diskette, Snow } from '../../NetworkGrid/IconsGroup'

const Icon = ({ children: __html }) => <svg styleName="icon" dangerouslySetInnerHTML={{ __html }}/>

const iconsMap = {
  data: Diskette,
  device: Desktop,
  network: Snow,
}
const iconsArray = ['data', 'device', 'network']
const isActive = (type, onlyIcon) => (!onlyIcon || onlyIcon === type) ? 'active' : ''

const ShareButtons = ({ type = '', data = {}, children, onlyIcon }) => {
  return <div styleName={`share-buttons ${type}`}>
    {iconsArray.map(icon => (
      <div key={icon} styleName={`share-button ${isActive(icon, onlyIcon)}`}>
        <Icon>{iconsMap[icon]}</Icon>
        <span styleName="limited-text" title={data[icon]}>{data[icon]}</span>
      </div>
    ))}
    {children && <div styleName="share-button active">
      {children}
    </div>}
  </div>
}

ShareButtons.propTypes = {
  type: PropTypes.oneOf(['vertical', 'dark-icons', '', 'vertical-black']),
  data: PropTypes.object,
  onlyIcon: PropTypes.string,
  children: PropTypes.any,
}

export default ShareButtons
