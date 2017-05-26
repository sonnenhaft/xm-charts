import React from 'react'
import './Navigation.scss'

const Navigation = () => (
  <div styleName="container">
    <div styleName="item">
      <div styleName="icon campaign-overview"></div>
      <div styleName="label">Battleground</div>
    </div>
    <div styleName="item">
      <div styleName="icon campaign-hub"></div>
      <div styleName="label">Campaign Hub</div>
    </div>
    <div styleName="item">
      <div styleName="icon performances"></div>
      <div styleName="label">Statistics</div>
    </div>
    <div styleName="item">
      <div styleName="icon settings"></div>
      <div styleName="label">Settings</div>
    </div>

    <div styleName="item">
      <div styleName="icon exit"></div>
    </div>
  </div>
)

export default Navigation
