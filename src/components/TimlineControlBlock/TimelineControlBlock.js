import React, {Component} from 'react'

import styles from './TimelineControlBlock.scss'

import saveSvgIcon from '../../assets/asset-data.svg'
import deviceSvgIcon from '../../assets/asset-device.svg'
import networkSvgIcon from '../../assets/asset-network.svg'
import triangleSvgIcon from '../../assets/asset-downloaded.svg'

const Icon = ({children: __html}) => <span className={styles['icon']} dangerouslySetInnerHTML={{__html}}/>

export default class TimelineControlBlock extends Component {
  render() {
    const {isToggled} = this.props
    return <div className={styles['timeline-control-block']}>
      <div className={`${styles['circle-stats-block']} ${isToggled ? styles['stats-hidden'] : ''}`}>
        <div className={styles['circle-block']}>circle</div>

        <div className={styles['stats-block']}>
          <div className={styles['stats-item']}>
            <Icon>{saveSvgIcon}</Icon>
            <span>213</span>
          </div>

          <div className={styles['stats-item']}>
            <Icon>{deviceSvgIcon}</Icon>
            <span>12</span>
          </div>

          <div className={styles['stats-item']}>
            <Icon>{networkSvgIcon}</Icon>
            <span>32</span>
          </div>

          <div className={`${styles['stats-item']} ${styles['buttoned-item']}`}>
            <Icon>{triangleSvgIcon}</Icon>
            <span>
              <span>2,173.2 <small>GB</small></span>
            </span>
          </div>
        </div>
      </div>

      <div/>

      <div className={styles['play-action-block']}>bottom control</div>
    </div>
  }
}
