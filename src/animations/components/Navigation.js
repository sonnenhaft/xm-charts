import React from 'react'
import campaignHubIcon from 'assets/icons/campaign-hub.svg'
import campaignOverviewIcon from 'assets/icons/campaign-overview.svg'
import performancesIcon from 'assets/icons/performances.svg'
import settingsIcon from 'assets/icons/settings.svg'
import exitIcon from 'assets/icons/exit.svg'
import './Navigation.scss'

const Icon = ({ children: __html }) => <span dangerouslySetInnerHTML={{ __html }}/>

const Navigation = () => (
  <div styleName="container">
    <div styleName="item">
      <div styleName="icon">
        <Icon>{ campaignOverviewIcon }</Icon>
      </div>
      <div styleName="label">Battleground</div>
    </div>
    <div styleName="item">
      <div styleName="icon">
        <Icon>{ campaignHubIcon }</Icon>
      </div>
      <div styleName="label">Campaign Hub</div>
    </div>
    <div styleName="item">
      <div styleName="icon">
        <Icon>{ performancesIcon }</Icon>
      </div>
      <div styleName="label">Statistics</div>
    </div>
    <div styleName="item">
      <div styleName="icon">
        <Icon>{ settingsIcon }</Icon>
      </div>
      <div styleName="label">Settings</div>
    </div>

    <div styleName="item exit">
      <div styleName="icon">
        <Icon>{ exitIcon }</Icon>
      </div>
    </div>
  </div>
)

export default Navigation
