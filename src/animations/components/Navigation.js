import React from 'react'
import './Navigation.scss'

const Navigation = () => (
  <div styleName="container">
    <div styleName="item campaign-overview">
      <div styleName="icon"></div>
      <div styleName="label">Battleground</div>
    </div>
    <div styleName="item campaign-hub">
      <div styleName="icon"></div>
      <div styleName="label">Campaign Hub</div>
    </div>
    <div styleName="item performances">
      <div styleName="icon"></div>
      <div styleName="label">Statistics</div>
    </div>
    <div styleName="item settings">
      <div styleName="icon"></div>
      <div styleName="label">Settings</div>
    </div>

    <div styleName="item exit">
      <div styleName="icon"></div>
    </div>
  </div>
)

export default Navigation
