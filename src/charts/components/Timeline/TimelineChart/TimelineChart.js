import React, { PropTypes as P, Component } from 'react'
import d3, { Transform }  from 'charts/utils/decorated.d3.v4'
import styles from './TimelineChart.scss'
import Tooltip from './Tooltip/Tooltip'
import { composeCircles, renderCircles, calculatePath } from './TimelineChartUtils'
import WindowDependable from '../../common/WindowDependable'
import BrushCircleGroup from './BrushCircleGroup/BrushCircleGroup'
import ZoomRect from '../../common/ZoomRect'
import BrushGroup from './Brush'
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

  state = {
    tooltipData: undefined,
    tooltipCoords: undefined,
    isTooltipOpened: false,
  }

  zoom = new Transform(1, 0, 0)
  xScale = d3.scaleTime()
  xScaleMini = d3.scaleTime()
  yScale = d3.scaleLinear().domain([0, 1])

  componentDidMount() { setTimeout(() => { this.forceUpdate() }, 0) }

  refRootNode = node => this.rootNode = d3.select(node)

  componentWillUpdate({ isToggled, zoomFactor }) {
    const { clientWidth: realWidth } = this.rootNode.node()
    const realHeight = isToggled ? 100 : 200
    const width = Math.max(realWidth - getMarginLeft(isToggled) - MARGIN_RIGHT, 0)
    const height = Math.max(realHeight - getMarginTop(isToggled) - MARGIN_BOTTOM, 0)
    Object.assign(this, { width, height, realWidth, realHeight })

    const minMaxValues = d3.extent(this.props.events, ({ date }) => date)
    this.xScale.domain(minMaxValues).rangeRound([0, width])
    this.xScaleMini.domain(minMaxValues).rangeRound([0, width])
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
    const { xScale, yScale, campainSelected } = this
    const events = props.events
    const { width, height } = this

    const g = this.find('.mainGroup')
    this.find('.brushLineGroup').attr('transform', `translate(0,${  height + 40  })`)
    this.find('.brushLine').attrs({ width })
    this.find('.clickableArea').on('click', () => {
      const x = d3.event.offsetX - getMarginLeft(props.isToggled)
      this.props.onCurrentTimeChanged(this.xScale.invert(x).getTime())
    })

    this.find('svg').attrs({ height: this.realHeight })

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

    const pathData = calculatePath({ min, max, data, events })
    this.find('.linePath').attr('d', d3.line().x(x).y(y).curve(d3.curveBundle.beta(0.97))(pathData))

    const moveTooltip = tooltipData => { // need to keep context in here
      const svgBounding = this.find('svg').node().getBoundingClientRect()
      const x = this.xScale(tooltipData.date)
      this.setState({
        tooltipData,
        isTooltipOpened: true,
        tooltipCoords: {
          top: svgBounding.top,
          left: `${x + svgBounding.left + getMarginLeft(props.isToggled)}px`,
        },
      })
    }
    const actions = {
      mouseout: () => this.setState({ isTooltipOpened: false }),
      click: ({ date }) => {
        this.props.onCurrentTimeChanged(date)
        d3.event.stopPropagation()
      },
      mouseover: function(tooltipData) {
        d3.select(this).moveToFront()
        if ( d3.event.target.tagName !== 'rect' ) {
          moveTooltip(tooltipData)
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
      g, data, x, height, actions, opacity,
      duration: 0,
      bulkLines: bulkLines.filter(filterVisible),
      firstInSubnet: firstInSubnet.filter(filterVisible),
      isToggled: props.isToggled,
    })
  }

  find(selector) {
    return this.rootNode.select(selector)
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
    const state = this.state
    const {
      currentTime, onCurrentTimeChanged,
      isToggled, isPlaying, currentSpeed,
    } = this.props
    const marginTop = getMarginTop(isToggled)
    const marginLeft = getMarginLeft(isToggled)
    return <WindowDependable className={styles['root']} refCb={this.refRootNode}
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
      <Tooltip data={state.tooltipData} coords={state.tooltipCoords} isOpened={state.isTooltipOpened}/>
    </WindowDependable>
  }
}
