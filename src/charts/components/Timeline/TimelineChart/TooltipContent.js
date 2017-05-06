import d3 from 'charts/utils/decorated.d3.v4'
import React, { Component, PropTypes as P } from 'react'
import './TooltipContent.scss'
import ShareButtons from '../common/ShareButtons'

export default class TooltipContent extends Component {
  static propTypes = {
    tooltipData: P.shape({
      type: P.string,
      method: P.string,
      source: P.string,
      date: P.number,
      value: P.number,
    }),
  }
  static defaultProps = { tooltipData: {} };

  render() {
    const { type, source, method, date } = this.props.tooltipData
    return <div>
      <div styleName="tooltip-content">
        {type && <div>
          <div>
            <div styleName="title">{type}</div>
            <div styleName="tooltip-event-icons">
              <ShareButtons type="vertical"/>
            </div>
            <div styleName="content">
              {method && <div>
                <span styleName="title">Method: </span>
                <span>{method}</span>
              </div>}
              {source && <div>
                <span styleName="title">Source: </span>
                <span>{source}</span>
              </div>}
            </div>
            <div>
              <b>{d3.timeFormat('%H:%M:%S')(date)}</b>
            </div>
          </div>
        </div>}
        {!type && <div>
          <ShareButtons type="dark-icons"/>
          <b>{d3.timeFormat('%H:%M:%S')(date)}</b>
        </div>}
      </div>
    </div>
  }
}
