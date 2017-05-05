import d3 from 'charts/utils/decorated.d3.v4'
import React, { Component, PropTypes } from 'react'
import styles from './TooltipContent.scss'
import ShareButtons from '../common/ShareButtons'

const string = React.PropTypes.string
export default class TooltipContent extends Component {
  static propTypes = {
    tooltipData: PropTypes.shape({
      type: string,
      method: string,
      source: string,
      date: PropTypes.number,
      value: PropTypes.number,
    }),
  }
  static defaultProps = { tooltipData: {} };

  render() {
    const { type, source, method, date } = this.props.tooltipData
    return <div styleName="tooltip-content">
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
  }
}
