import d3 from 'charts/utils/decorated.d3.v4'
import React, { Component, PropTypes as P } from 'react'
import styles from './Tooltip.scss'
import ShareButtons from '../../common/ShareButtons'

export default class TooltipContent extends Component {
  static propTypes = {
    coords: P.object,
    isOpened: P.bool,
    data: P.shape({
      type: P.string,
      method: P.string,
      source: P.string,
      date: P.number,
      value: P.number,
    }),
  }

  static defaultProps = {
    data: {},
    coords: { left: 0, top: 0 },
  };

  state = {
    isOpenedBecauseHovered: false,
  }

  refRootNode = node => {
    this.rootNode = d3.select(node)
    this.rootNode.attrs({
      mouseout: () => this.setState({ isOpenedBecauseHovered: false }),
      mouseover: () => this.setState({ isOpenedBecauseHovered: true }),
    })
  }

  componentDidUpdate() {
    const coords = this.props.coords
    const top = coords.top + 22
    const {clientWidth, clientHeight} = this.rootNode.node()
    const maxLeft = window.innerWidth - clientWidth/2
    this.rootNode
      .styles({ left: Math.min(coords.left, maxLeft), top: `${ top - (clientHeight > top ? 0 : 22) }px` })
      .classed(styles['bottom-triangle'], clientHeight <= top)

    this.rootNode.select('.triangleWrapper').styles({left: Math.max(0, coords.left - maxLeft)})

    if ( this.isOpened() ) {
      this.rootNode.classed(styles['visible-tooltip'], true)
    } else {
      setTimeout(() => {
        if (!this.isOpened()) {
          this.rootNode.classed(styles['visible-tooltip'], false)
        }
      }, 100)
    }
  }

  isOpened() {
    return this.props.isOpened || this.state.isOpenedBecauseHovered
  }

  render() {
    const { type, source, method, date } = this.props.data
    return <div className="tooltipBlock" styleName="tooltip" ref={this.refRootNode}>
      <div styleName="triangle-wrapper" className="triangleWrapper">
        <div styleName="triangle">
          <div styleName="triangle triangle-content"/>
        </div>
      </div>
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
