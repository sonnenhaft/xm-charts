import React, { PropTypes as P, Component } from 'react'
import d3, { Transform }  from 'charts/utils/decorated.d3.v4'
import styles from './TimelineChart.scss'
import TooltipContentBlock from './TooltipContent'
import { composeCircles, renderCircles, renderPath } from './TimelineChartUtils'
import WindowDependable from '../../common/WindowDependable'
import BrushCircleGroup from './BrushCircleGroup/BrushCircleGroup'
import ZoomRect from '../../common/ZoomRect'
import BrushGroup from './BrushGroup'
import Axes from './Axes/Axes'

const MARGIN_RIGHT = 10
const MARGIN_BOTTOM = 60

const getMarginLeft = isToggled => isToggled ? 15 : 30
const getMarginTop = isToggled => isToggled ? 70 : 30

export default class TimelineChart extends Component {
  static propTypes = {
    zoomFactor: P.number.isRequired,
    isToggled: P.bool.isRequired,
    events: P.array.isRequired,
    nodes: P.array.isRequired,
    onZoomFactorChanged: P.func.isRequired,
    maxZoom: P.number.isRequired,
    minZoom: P.number.isRequired,
  }

  state = { tooltipData: undefined }

  zoom = new Transform(1, 0, 0)
  xScale = d3.scaleTime()
  xScaleMini = d3.scaleTime()
  yScale = d3.scaleLinear().domain([0, 1])

  setEvents({ events }) {
    this.events = events
    this.domain = d3.extent(this.events, ({ date }) => date)
  }

  componentWillReceiveProps(props) {
    if ( props.events !== this.props.events ) {
      this.setEvents(props)
    }
  }

  closeTooltip = () => {
    this.tooltipOpened = false
    setTimeout(() => {
      if ( this.tooltipOpened ) { return }
      this.find('.tooltipBlock').classed(styles['visible-tooltip'], false).transition().duration(750).style('opacity', 0)
    }, 100)
  }
  openTooltip = tooltipData => {
    const svgBounding = this.find('svg').node().getBoundingClientRect()
    const left = `${this.xScale(tooltipData.date) + svgBounding.left + getMarginLeft(this.props.isToggled)  }px`
    this.isZoomDisabled = true
    this.setState({ tooltipData }, () => {
      this.isZoomDisabled = false
      this.tooltipOpened = true
      const TRIANGLE_HEIGHT = 22
      const top = TRIANGLE_HEIGHT + svgBounding.top
      let tooltipHeight = this.find('.tooltipBlock').style('height').replace('px', '') - 0
      this.find('.tooltipBlock')
        .styles({ left, top: `${ top - (tooltipHeight > top ? 0 : 20) }px` })
        .classed(styles['bottom-triangle'], tooltipHeight <= top)
        .classed(styles['visible-tooltip'], true)
        .transition().duration(100).styles({ opacity: 1 })
    })
  }

  setD3Node = node => this.d3rootNode = d3.select(node)

  componentWillUpdate({ isToggled, zoomFactor }) {
    const { clientWidth: realWidth } = this.d3rootNode.node()
    const realHeight = isToggled ? 100 : 200
    const width = Math.max(realWidth - getMarginLeft(isToggled) - MARGIN_RIGHT, 0)
    const height = Math.max(realHeight - getMarginTop(isToggled) - MARGIN_BOTTOM, 0)
    Object.assign(this, { width, height, realWidth, realHeight })

    this.xScale.domain(this.domain).rangeRound([0, width])
    this.xScaleMini.domain(this.domain).rangeRound([0, width])
    this.yScale.rangeRound([height, 0])

    zoomFactor = Math.min(this.props.maxZoom, Math.max(zoomFactor, this.props.minZoom))
    if ( zoomFactor === 1 ) {
      this.zoom.k = 1
      this.zoom.x = 0
    } else if ( this.zoom.k !== zoomFactor ) {
      const k1 = this.zoom.k
      const k2 = zoomFactor
      this.zoom.k = zoomFactor
      this.zoom.x = (this.zoom.x - width / 2) * k2 / k1 + width / 2
    }

    this.xScale.domain(this.zoom.rescaleX(this.xScale).domain())
  }

  componentDidUpdate() {
    const props = this.props
    const { xScale, yScale, events, campainSelected } = this
    const { width, height } = this
    const td = d3Selection => d3Selection

    const g = this.find('.mainGroup')
    td(this.find('.brushLineGroup')).attr('transform', `translate(0,${  height + 40  })`)
    this.find('.brushLine').attrs({ width })
    this.find('.clickableArea').on('click', () => {
      const x = d3.event.offsetX - getMarginLeft(props.isToggled)
      this.props.onCurrentTimeChanged(this.xScale.invert(x).getTime())
    })

    const svgNode = this.find('svg')
    td(svgNode).attrs({ height: this.realHeight })

    const [min, max] = xScale.domain()

    let filterVisible = ({ date }) => min <= date && date <= max
    const data = events.filter(filterVisible)

    const fill = ({ type }) => {
      if ( type === 'nodeMarkAsRed' ) {
        return '#EB001E'
      } else if ( type === 'newDiscoveredNode' ) {
        return '#4660DF'
      } else {
        return 'none'
      }
    }
    const lineAttrs = { width: 2, height: 10, fill }
    const x = ({ date }) => xScale(date)
    const y = ({ networkSuperiority }) => yScale(networkSuperiority / 100)

    let opacity = 1
    if ( campainSelected ) {
      opacity = ({ isEventSelected }) => isEventSelected ? 1 : 0.3
    }

    renderPath({ td, min, max, linePath: this.find('.linePath'), data, x, y, events })
    const moveTooltip = this.openTooltip
    this.find('.tooltipBlock').attrs({
      mouseout: this.closeTooltip,
      mouseover: () => this.tooltipOpened = true,
    })

    const actions = {
      mouseout: this.closeTooltip,
      click: ({ date }) => {
        this.props.onCurrentTimeChanged(date)
        d3.event.stopPropagation()
      },
      mouseover: function(d) {
        d3.select(this).moveToFront()
        if ( d3.event.target.tagName !== 'rect' ) {
          moveTooltip(d)
        }
      },
    }

    const attrs = { x, y, ...lineAttrs, opacity, click: actions.click }
    g.bindData(`rect.${styles['small-line']}`, data.filter(filterVisible), attrs, 0)

    const groupWidth = 25 / this.zoom.k
    let prevGroupWidth = width / groupWidth
    if ( this.prevGroupWidth !== prevGroupWidth ) {
      this.prevGroupWidth = prevGroupWidth
      this.composedData = composeCircles(events, width, groupWidth)
    }

    let { bulkLines, firstInSubnet } = this.composedData
    renderCircles({
      g,
      data,
      x,
      height,
      duration: 0,
      bulkLines: bulkLines.filter(filterVisible),
      firstInSubnet: firstInSubnet.filter(filterVisible),
      actions,
      isToggled: props.isToggled,
      opacity,
    })
  }

  find(selector) {
    return this.d3rootNode.select(selector)
  }

  componentDidMount() {
    setTimeout(() => {
      this.setEvents(this.props)
      this.forceUpdate()
    }, 0)
  }

  onZoomFactorChangedAndMoved = ({ zoomFactor, zoomPosition }) => {
    zoomFactor = Math.min(this.props.maxZoom, Math.max(zoomFactor, this.props.minZoom))
    zoomPosition = zoomFactor === 1 ? 0 : zoomPosition
    Object.assign(this.zoom, { x: zoomPosition, k: zoomFactor })
    this.props.onZoomFactorChanged(zoomFactor)
  }

  render() {
    const { xScale, yScale, xScaleMini, realHeight, onZoomFactorChangedAndMoved } = this
    const { x: zoomPosition, k: zoomFactor } = this.zoom
    const {
      currentTime, onCurrentTimeChanged,
      isToggled, isPlaying, currentSpeed,
    } = this.props
    const marginTop = getMarginTop(isToggled)
    const marginLeft = getMarginLeft(isToggled)
    return <WindowDependable className={styles['root']} refCb={this.setD3Node}
                             onDimensionsChanged={() => this.forceUpdate()}>
      <svg styleName={`${(isToggled ? 'toggled' : '')} timeline-chart`}>
        <rect styleName={isToggled ? 'toggled-background' : 'black-background'}
              width="100%" height="100%"/>
        <g className="brushLineGroup">
          <rect height="50" width="100%"
                styleName={`black-line-between-x-axes ${isToggled ? 'hidden' : 'visible'}`}/>
          <rect className="brushLine" styleName="brush-line" height="5" rx="3" ry="3"
                transform={`translate(${marginLeft},${isToggled ? 26 : 15})`}/>
        </g>
        <g fill="white" className="mainGroup"
           transform={`translate(${marginLeft}, ${marginTop})`}>
          <Axes {...{ xScale, yScale, xScaleMini, isToggled, realHeight, zoomFactor }}>
            <path className="linePath" styleName="line-path"/>
          </Axes>
          <g className="clickableArea">
            <ZoomRect {...{
              xScale, yScale, isToggled, marginTop,
              zoomFactor, zoomPosition, onZoomFactorChangedAndMoved,
            }} />
          </g>
          <g className="smalRects" styleName="small-rects"/>
        </g>
        <BrushGroup {...{
          xScale: xScaleMini, yScale, isToggled, marginLeft,
          zoomFactor, zoomPosition, onZoomFactorChangedAndMoved,
        }}>
          <BrushCircleGroup {...{
            xScale, yScale, xScaleMini, isToggled, currentSpeed, isPlaying,
            currentTime, onCurrentTimeChanged,
          }} />
        </BrushGroup>
      </svg>

      <div className="tooltipBlock" styleName="tooltip">
        <div styleName="triangle-wrapper">
          <div styleName="triangle">
            <div styleName="triangle triangle-content"/>
          </div>
        </div>
        <TooltipContentBlock tooltipData={this.state.tooltipData}/>
      </div>
    </WindowDependable>
  }
}
