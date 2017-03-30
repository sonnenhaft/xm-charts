import React, { Component } from 'react'

import triangleSvgIcon from '../../../assets/icons/asset-downloaded.svg'
import ShareButtons from '../../common/ShareButtons/ShareButtons'
import styles from './TimelineControl.scss'
import PlayButtons from '../PlayButtons/PlayButtons'

const Icon = ({ children: __html }) => <span className={ styles['icon'] } dangerouslySetInnerHTML={ { __html } } />

export default class TimelineControl extends Component {
  render () {
    const { isToggled } = this.props
    return <div className={ styles['timeline-control-block'] }>
      <div />
      <div className={ `${styles['circle-stats-block']} ${isToggled ? styles['stats-hidden'] : ''}` }>
        <div className={ styles['circle-block'] }>circle</div>

        <div className={ styles['stats-block'] }>
          <ShareButtons />
          <div className={ `${styles['buttoned-item']}` }>
            <Icon>{triangleSvgIcon}</Icon>
            <span>
              <span>2,173.2 <small>GB</small></span>
            </span>
          </div>
        </div>
      </div>

      <div />

      <PlayButtons />
    </div>
  }
}
