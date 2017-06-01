import React from 'react'
import './QuickInformation.scss'

const QuickInformation = selectedElement => <div styleName="quick-information">
  {JSON.stringify(selectedElement)}
</div>

export default QuickInformation
