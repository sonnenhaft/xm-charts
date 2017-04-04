import {timeFormat} from 'd3'
import React, {Component, PropTypes} from 'react'
import styles from './TooltipContent.scss'
import ShareButtons from '../ShareButtons/ShareButtons'

const string = React.PropTypes.string
export default class TooltipContent extends Component {
  static propTypes = {
    tooltipData: PropTypes.shape({
      name: string,
      method: string,
      source: string,
      date: PropTypes.number, // date number, line Date.now()
      value: PropTypes.number,
    }),
  }
  static defaultProps = {tooltipData: {}};

  render() {
    const {tooltipData} = this.props
    return <div className={styles['tooltip-content']}>
      {tooltipData.name && <div>
        <div>
          <div className={styles['title']}>{tooltipData.name}</div>
          <div className={styles['tooltip-event-icons']}>
            <ShareButtons type="vertical" />
          </div>
          <div className={styles['content']}>
            <div>
              <span className={styles['title']}>Method: </span>
              <span>{tooltipData.method}</span>
            </div>
            <div>
              <span className={styles['title']}>Source: </span>
              <span>{tooltipData.source}</span>
            </div>
          </div>
          <div>
            <b>{timeFormat('%H:%M:%S')(tooltipData.date)}</b>
          </div>
        </div>
      </div>}
      {!tooltipData.name && <div>
        <ShareButtons type="dark-icons" />
        {/*<div>count {tooltipData.value}</div>*/}
        <b>{timeFormat('%H:%M:%S')(tooltipData.date)}</b>
      </div>}
    </div>
  }
}
