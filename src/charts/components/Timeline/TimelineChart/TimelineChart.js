import React, { PropTypes, Component } from 'react'
import d3 from '../../../utils/d3.shims'
import styles from './TimelineChart.scss'
import TooltipContentBlock from './TooltipContent'
import { composeCircles, renderCircles, renderPath } from './TimelineChartUtils'
import WindowDependable from '../../common/WindowDependable'
import BrushCircleGroup from './BrushCircleGroup/BrushCircleGroup'
import ZoomRect from '../../common/ZoomRect'
import BrushGroup from './BrushGroup'
import Axes from './Axes/Axes'
import { Transform as zoomTransform } from 'd3-zoom/src/transform'

const MAX_ZOOM = Math.min(Math.pow(10, 5) * 5)
const MIN_ZOOM = 1

const translate = (x, y = 0) => ({ transform: `translate(${x}, ${y})` })
const margin = { top: 30, right: 10, bottom: 60, left: 30 }
const getMarginLeft = ({ isToggled }) => {
  return isToggled ? margin.left / 2 : margin.left
}

const getMarginTop = ({ isToggled }) => {
  return isToggled ? 70 : margin.top
}

export default class TimelineChart extends Component {
  static propTypes = {
    zoomFactor: PropTypes.number.isRequired,
    isToggled: PropTypes.bool.isRequired,
    events: PropTypes.array.isRequired,
    nodes: PropTypes.array.isRequired,
    onZoomFactorChanged: PropTypes.func.isRequired,
  }

  constructor(props) {
    super(props)
    this.zoom = new zoomTransform(1, 0, 0)
    this.xScale = d3.scaleTime()
    this.xScaleMini = d3.scaleTime()
    this.yScale = d3.scaleLinear().domain([0, 1])
    this.state = { noDuration: true }
    this.setEvents(props)
  }

  setEvents({ events }) {
    this.events = events
      .map(item => ({ ...item }))
    const maxValue = d3.max(this.events, ({ date }) => date)
    const minValue = d3.min(this.events, ({ date }) => date)
    this.domain = [minValue, maxValue]
  }

  componentWillReceiveProps(props) {
    if ( props.events !== this.props.events ) {
      this.setEvents(props)
    }
  }

  highlightCampaign( ) {
  // highlightCampaign(_campainId) {
  //   return
    // TODO: rollback logic when we will know what means campain
    // this.campainSelected = _campainId !== null
    // this.events
    //   .forEach(event => event.isEventSelected = false)
    // this.events
    //   .filter(({ campainId }) => campainId === _campainId)
    //   .forEach(event => event.isEventSelected = true)
  }

  closeTooltip = () => {
    this.tooltipOpened = false
    setTimeout(() => {
      if ( this.tooltipOpened ) { return }
      this.tooltipBlock.classed(styles['visible-tooltip'], false).transition().duration(750).style('opacity', 0)
    }, 100)
  }
  openTooltip = tooltipData => {
    if ( this.campainSelected && !tooltipData.isEventSelected ) {
      return
    }
    const svgBounding = this.find('svg').node().getBoundingClientRect()
    const left = `${this.xScale(tooltipData.date) + svgBounding.left + getMarginLeft(this.props)  }px`
    this.isZoomDisabled = true
    this.setState({ tooltipData }, () => {
      this.isZoomDisabled = false
      this.tooltipOpened = true
      const TRIANGLE_HEIGHT = 22
      const top = TRIANGLE_HEIGHT + svgBounding.top
      let tooltipHeight = this.tooltipBlock.style('height').replace('px', '') - 0
      this.tooltipBlock
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
    const width = Math.max(realWidth - getMarginLeft({ isToggled }) - margin.right, 0)
    const height = Math.max(realHeight - getMarginTop({ isToggled }) - margin.bottom, 0)
    Object.assign(this, { width, height, realWidth, realHeight })

    this.xScale.domain(this.domain).rangeRound([0, width])
    this.xScaleMini.domain(this.domain).rangeRound([0, width])
    this.yScale.rangeRound([height, 0])

    zoomFactor = Math.min(MAX_ZOOM, Math.max(zoomFactor, MIN_ZOOM))
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
    const noDuration = true
    const { isToggled } = this.props

    const { xScale, yScale, events, campainSelected } = this
    const { width, height } = this
    const duration = noDuration ? 0 : 500
    let td = (d3Selection => d3Selection.transition().duration(duration))
    if ( !duration ) {
      td = d3Selection => d3Selection
    }

    const g = this.find('.mainGroup')
    g.attrs(translate(getMarginLeft(this.props), getMarginTop({ isToggled })))
    td(this.find('.brushLineGroup')).attr('transform', `translate(0,${  height + 40  })`)
    this.find('.brushLine').attrs({ width })
    this.find('.clickableArea').on('click', () => {
      const x = d3.event.offsetX - getMarginLeft(isToggled)
      this.props.onCurrentTimeChanged(this.xScale.invert(x).getTime())
    })

    const svgNode = this.find('svg')
    td(svgNode).attrs({ height: this.realHeight })
    svgNode.on('click', () => this.highlightCampaign(null))

    const [min, max] = xScale.domain()

    let filterVisible = ({ date }) => min <= date && date <= max
    const data = events.filter(filterVisible)

    const fill = ({ type }) => {
      if (type === 'nodeMarkAsRed') {
        return '#EB001E'
      } else if (type === 'newDiscoveredNode') {
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
    const mouseout = this.closeTooltip
    const moveTooltip = this.openTooltip
    this.tooltipBlock.attrs({ mouseout, mouseover: () => this.tooltipOpened = true })
    const actions = {
      mouseout,
      click: ({ campainId, date }) => {
        dataClick({ date })
        if ( campainId ) {
          this.highlightCampaign(campainId)
          d3.event.stopPropagation()
        }
      },
      mouseover: function(d) {
        d3.select(this).moveToFront()
        if ( d3.event.target.tagName !== 'rect' ) {
          moveTooltip(d)
        }
      },
    }

    let dataClick = ({ date }) => {
      this.props.onCurrentTimeChanged(date)
      d3.event.stopPropagation()
    }
    const attrs = { x, y, ...lineAttrs, opacity, click: dataClick }
    g.bindData(`rect.${styles['small-line']}`, data.filter(filterVisible), attrs, duration)

    const groupWidth = 25 / this.zoom.k
    let prevGroupWidth = width / groupWidth
    if ( this.prevGroupWidth !== prevGroupWidth ) {
      this.prevGroupWidth = prevGroupWidth
      this.composedData = composeCircles(events, width, groupWidth)
    }

    let { bulkLines, firstInSubnet } = this.composedData
    bulkLines = bulkLines.filter(filterVisible)
    firstInSubnet = firstInSubnet.filter(filterVisible)
    renderCircles({ g, data, x, height, duration, bulkLines, firstInSubnet, actions, isToggled, opacity })
  }

  onDimensionsChanged = () => this.forceUpdate()

  find(selector) {
    return this.d3rootNode.select(selector)
  }

  componentDidMount() {
    this.tooltipBlock = this.find('.tooltipBlock')
    setTimeout(() => {
      this.forceUpdate()
    }, 0)
  }

  onZoomFactorChangedAndMoved = ({ zoomFactor, zoomPosition }) => {
    zoomFactor = Math.min(MAX_ZOOM, Math.max(zoomFactor, MIN_ZOOM))
    zoomPosition = zoomFactor === 1 ? 0 : zoomPosition
    this.zoom.x = zoomPosition
    this.zoom.k = zoomFactor
    this.props.onZoomFactorChanged(zoomFactor)
  }

  render() {
    const {
      props: {
        currentTime, onCurrentTimeChanged,
        isToggled, isPlaying, currentSpeed,
      }, state: { tooltipData = {} },
      onDimensionsChanged, setD3Node, xScale, yScale, xScaleMini, realHeight,
    } = this
    const zoomPosition = this.zoom.x
    const zoomFactor = this.zoom.k
    const { onZoomFactorChangedAndMoved } = this
    const marginTop = getMarginTop(this.props)
    const marginLeft = getMarginLeft(this.props)
    const visibility = isToggled ? 'hidden' : 'visible'
    return <WindowDependable refCb={setD3Node} style={{ position: 'relative', width: '100%' }}
                             {...{ onDimensionsChanged }}>
      <svg styleName={`${(isToggled ? 'toggled' : '')} timeline-chart`}>
        <rect width="100%" height="100%"
              styleName={isToggled ? 'toggled-background' : 'black-background'} />
        <g className="brushLineGroup">
          <rect height="50" fill="#252525" width="100%" visibility={visibility} />
          <rect className="brushLine" pointerEvents="none" height="5" rx="3" ry="3" fill="#141414"
                transform={`translate(${marginLeft},${isToggled ? 26 : 15})`} />
        </g>
        <g fill="white" className="mainGroup">
          <Axes {...{ xScale, yScale, xScaleMini, isToggled, realHeight, zoomFactor }}>
            <path className="linePath" styleName="line-path" />
          </Axes>
          <g className="clickableArea">
            <ZoomRect {...{
              xScale, yScale, isToggled, marginTop,
              zoomFactor, zoomPosition, onZoomFactorChangedAndMoved,
            }} />
          </g>
          <g className="smalRects" transform="translate(0, -5)" />
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
            <div styleName="triangle triangle-content" />
          </div>
        </div>
        <TooltipContentBlock tooltipData={tooltipData} />
      </div>
    </WindowDependable>
  }
}
