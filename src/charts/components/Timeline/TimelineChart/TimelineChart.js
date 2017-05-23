import React, { Component, PropTypes as P } from 'react'
import d3, { Transform } from 'charts/utils/decorated.d3.v4'
import styles from './TimelineChart.scss'
import Tooltip from './Tooltip/Tooltip'
import { calculatePath, composeCircles } from './TimelineChartUtils'
import WindowDependable from '../../common/WindowDependable'
import BrushCircleGroup from './BrushCircleGroup/BrushCircleGroup'
import ZoomableSVG from './ZoomableSVG'
import Brush from './Brush'
import Axes from './Axes/Axes'
import { isAssetCompromised, isStaringPoint } from 'charts/utils/EventUtils'

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

  componentWillReceiveProps({ currentTime }) {
    if ( this.props.currentTime !== currentTime ) {
      const currentTimeX = this.xScale(currentTime)
      if ( currentTimeX >  this.width ) {
        this.onZoomFactorChangedAndMoved({
          zoomFactor: this.zoom.k,
          zoomPosition: this.zoom.x - currentTimeX,
        })
      } else if (currentTimeX < 0) {
        this.onZoomFactorChangedAndMoved({
          zoomFactor: this.zoom.k,
          zoomPosition: this.zoom.x - currentTimeX + this.width,
        })
      }
    }
  }

  componentDidMount() { setTimeout(() => { this.forceUpdate() }, 0) }

  refRootNode = node => this.rootNode = d3.select(node)

  componentWillUpdate({ isToggled, zoomFactor, events }) {
    const { clientWidth: realWidth } = this.rootNode.node()
    this.realWidth = realWidth
    const realHeight = isToggled ? 100 : 200
    const width = Math.max(realWidth - getMarginLeft(isToggled) - MARGIN_RIGHT, 0)
    const height = Math.max(realHeight - getMarginTop(isToggled) - MARGIN_BOTTOM, 0)
    Object.assign(this, { width, height, realWidth, realHeight })

    const minMaxValues = d3.extent(events, ({ date }) => date)
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
    const { xScale, yScale } = this
    const events = props.events
    const { width, height } = this

    const g = this.rootNode.select('.mainGroup')
    this.rootNode.select('.clickableArea').on('click', () => {
      const x = d3.event.offsetX - getMarginLeft(props.isToggled)
      this.props.onCurrentTimeChanged(this.xScale.invert(x).getTime())
    })

    const [min, max] = xScale.domain()
    const filterVisible = ({ date }) => min <= date && date <= max
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

    this.rootNode.select('.linePath').attr('d', d3.line().x(x).y(y).curve(
      d3.curveMonotoneX)(calculatePath({ min, max, data, events }))
    )

    const onTimeChanged = ({ date }) => {
      this.props.onCurrentTimeChanged(date)
      d3.event.stopPropagation()
    }

    const attrs = { x, y, ...lineAttrs, click: onTimeChanged }
    g.bindData(`rect.${styles['small-line']}`, data.filter(filterVisible), attrs, 0)

    const groupWidth = 25 / this.zoom.k
    const { bulkCircles, nonBulkCircles } = composeCircles(events, width, groupWidth)
    const actions = {
      click: onTimeChanged,
      mouseout: () => this.setState({ isTooltipOpened: false }),
      mouseover: this.mouseOverTooltip,
    }

    const RADIUS = 8
    const allCirclesData = [
      ...nonBulkCircles.filter(filterVisible),
      ...bulkCircles.filter(filterVisible),
    ]

    const enteredSelection = g.selectAll('.big-event').data(allCirclesData, ({ id }) => id)
    enteredSelection.exit().remove()
    const mergedSelection = enteredSelection.enter().append('g')
      .attr('class', 'big-event').html(({ value }) => `<g class="${styles['circle-group-wrapper']}">
      <rect class="${styles['red-bulk-line']} redBulkLine" width="${RADIUS / 4}"></rect>
      
      <g class="bulk-or-staring">
        <rect class="whiteShadowRect ${styles['white-shadow-rect']}" width="${(RADIUS + 1) * 2}"></rect>
        <g class="starting-point-data">
           <circle class="${styles['circle-wrapper']} ${styles['no-value']}" r="${RADIUS}"></circle>
           <circle class="${styles['red-bulk-circle']}" r="${RADIUS / 2}"></circle>
        </g>
        <g class="bulk-data">
          <circle class="${styles['circle-wrapper']}" r="${RADIUS}"></circle>
          <circle class="${styles['red-bulk-circle']}" r="${RADIUS}"></circle>
          <text class="${styles['circle-text']}" fill="white">${value}</text>
        </g>
      </g>
      
      <g class="asset-compromised">
        <rect width="10" height="24" rx="4" ry="4"></rect>
        <g class="compromised-circles">
          <circle r="2.3" class="device"></circle>
          <circle r="2.3" class="data"></circle>
          <circle r="2.3" class="network"></circle>
        </g>
      </g>
    </g>`)

    const hasInfo = (event, infoKey) => {
      return isAssetCompromised(event.type) && event.data.asset.ruleGroup === infoKey
    }
    mergedSelection
      .classed('is-asset-compromised', ({ type }) => isAssetCompromised(type))
      .classed('has-device', data => hasInfo(data, 'device'))
      .classed('has-data', data => hasInfo(data, 'data'))
      .classed('has-network', data => hasInfo(data, 'network'))
      .classed('is-starting-point', ({ type }) => isStaringPoint(type))
      .classed('is-bulk-circle', ({ value }) => value)

    const legHeight = this.props.isToggled ? 54 : height + RADIUS * 2
    const allElements = mergedSelection.attrs(actions).merge(enteredSelection)
    allElements.attrs({ transform: d => `translate(${x(d)}, 0)` })
    allElements.select('.whiteShadowRect').attrs({
      opacity: ({ type }) => isStaringPoint(type) ? 0.2 : 0,
      height: legHeight,
    })
    allElements.select('.redBulkLine').attrs({ height: legHeight - RADIUS / 2 - 2 })
  }

  onZoomFactorChangedAndMoved = ({ zoomFactor, zoomPosition }) => {
    zoomFactor = Math.min(this.props.maxZoom, Math.max(zoomFactor, this.props.minZoom))
    zoomPosition = zoomFactor === 1 ? 0 : Math.min(zoomPosition, 0)
    const maxZoomPosition = this.width * (zoomFactor - 1)

    Object.assign(this.zoom, { x: Math.max(zoomPosition, -maxZoomPosition), k: zoomFactor })
    this.props.onZoomFactorChanged(zoomFactor)
  }

  mouseOverTooltip = tooltipData => {
    // d3.select(d3.event.target).moveToFront()
    if ( !tooltipData.type ) {
      return
    }
    if ( d3.event.target.tagName !== 'rect' ) {
      const fixedOffsets = this.rootNode.select('svg').node().getBoundingClientRect()
      const x = this.xScale(tooltipData.date) + getMarginLeft(this.props.isToggled)
      this.setState({
        tooltipData,
        isTooltipOpened: true,
        tooltipCoords: {
          top: fixedOffsets.top,
          left: x + fixedOffsets.left,
        },
      })
    }
  }

  render() {
    const { xScale, yScale, xScaleMini, realHeight, onZoomFactorChangedAndMoved } = this
    const { x: zoomPosition, k: zoomFactor } = this.zoom
    const state = this.state
    const {
      currentTime, onCurrentTimeChanged,
      isToggled, isPlaying, currentSpeed,
      minZoom, maxZoom,
    } = this.props

    return <WindowDependable className={styles['root']} refCb={this.refRootNode}
                             onDimensionsChanged={() => this.forceUpdate()}>
      <ZoomableSVG {...{
        marginLeft: getMarginLeft(isToggled),
        zoomFactor, zoomPosition, onZoomFactorChangedAndMoved,
        minZoom, maxZoom,
      }} styleName={`${(isToggled ? 'toggled' : '')} timeline-chart`}
                   className="clickableArea"
                   height={realHeight}>
        <rect styleName="black-background" width="100%" height="100%"/>
        <g transform={`translate(0,${ this.height || 0 })`}>
          <g className="brushLineGroup" styleName="brush-line-group">
            <rect styleName="black-line-between-x-axes" height="50" width="100%"/>
            <rect className="brushLine" styleName="brush-line"
                  width={this.width} height="5" rx="3" ry="3"/>
          </g>
        </g>
        <g className="mainGroup" styleName="main-group">
          <Axes {...{ xScale, yScale, xScaleMini, isToggled, realHeight, zoomFactor }}>
            <path className="linePath" styleName="line-path"/>
          </Axes>
          <g className="smalRects" styleName="small-rects"/>
        </g>
        <g styleName="brush-group-wrapper">
          <Brush {...{
            xScale: xScaleMini, yScale, isToggled,
            zoomFactor, zoomPosition, onZoomFactorChangedAndMoved,
          }}>
            <BrushCircleGroup {...{
              xScale, yScale, xScaleMini, isToggled, currentSpeed, isPlaying,
              currentTime, onCurrentTimeChanged,
            }} />
          </Brush>
        </g>
      </ZoomableSVG>
      <Tooltip data={state.tooltipData} coords={state.tooltipCoords} isOpened={state.isTooltipOpened}/>
    </WindowDependable>
  }
}
