import {timeFormat} from 'd3'
import React, {Component, PropTypes} from 'react'
import styles from './TooltipContent.scss'
import ShareButtons from '../ShareButtons/ShareButtons'

const string = React.PropTypes.string
export default class TooltipContent extends Component {
  static propTypes = {
    tooltipData: PropTypes.shape({
      type: string,
      method: string,
      source: string,
      date: PropTypes.number, // date number, line Date.now()
      value: PropTypes.number,
    }),
  }
  static defaultProps = {tooltipData: {}};

  render() {
    const {type, source, method, date} = this.props.tooltipData
    return <div className={styles['tooltip-content']}>
      {type && <div>
        <div>
          <div className={styles['title']}>{type}</div>
          <div className={styles['tooltip-event-icons']}>
            <ShareButtons type="vertical" />
          </div>
          <div className={styles['content']}>
            {method && <div>
              <span className={styles['title']}>Method: </span>
              <span>{method}</span>
            </div>}
            {source && <div>
              <span className={styles['title']}>Source: </span>
              <span>{source}</span>
            </div>}
          </div>
          <div>
            <b>{timeFormat('%H:%M:%S')(date)}</b>
          </div>
        </div>
      </div>}
      {!type && <div>
        <ShareButtons type="dark-icons" />
        {/*<div>count {value}</div>*/}
        <b>{timeFormat('%H:%M:%S')(date)}</b>
      </div>}
    </div>
  }
}
