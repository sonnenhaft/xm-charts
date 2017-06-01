import React from 'react'
import './QuickInformation.scss'

const QuickInformation = ({ selectedElement }) => {
  return <div styleName="quick-information">
    {selectedElement && <div>
      {selectedElement.type === 'node' && <div>
        <div styleName="header-with-name">
          <div styleName="grey-small-text">Device</div>
          <div>(resize icon)</div>
        </div>
        <div styleName="name">{selectedElement.element.name}</div>
        <div>event state icons</div>
        <div>
          <div><b>Status:</b><span>N/A</span></div>
          <div><b>Method:</b><span>N/A</span></div>
          <div><b>Source:</b><span>N/A</span></div>
        </div>
        <hr/>
        <div>
          <div><b>Data Assets:</b><span>N/A</span></div>
          <div><b>Staging:</b><span>N/A</span></div>
          <div><b>OS:</b><span>N/A</span></div>
          <div><b>IP:</b><span>N/A</span></div>
        </div>
      </div>}
    </div>}
  </div>
}


export default QuickInformation
