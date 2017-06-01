import React from 'react'
import './TabsHeader.scss'
import { compose, onlyUpdateForKeys } from 'recompose'

const TabsHeader = ({ campainVisible, setCampainVisible, type }) => <div styleName="tabs">
  <div styleName={!campainVisible ? 'active-tab' : ''} onClick={() => setCampainVisible(false)}>
    {type}
  </div>
  <div styleName={campainVisible ? 'active-tab' : ''} onClick={() => setCampainVisible(true)}>
    Campain
  </div>
</div>

export default compose(
  onlyUpdateForKeys(['type', 'campainVisible'])
)(TabsHeader)
