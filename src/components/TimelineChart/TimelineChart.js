import * as d3 from 'd3'
import '../common/d3.shims'
import styles from './TimelineChart.scss'
import React, {PropTypes, Component} from 'react'
import TooltipContentBlock from '../common/TooltipContent/TooltipContent'
import {composeCircles, updateBrush, renderCircles, renderPath} from './TimelineChartUtils'
import YearTextScale from './YearTextScale'
import WindowDependable from './WindowDependable'

export default class TimelineChart extends Component {
  static margin = {top: 30, right: 10, bottom: 60, left: 30}
  static TOGGLED_MARGIN_LEFT = 15
  static propTypes = {
    zoomFactor: PropTypes.number.isRequired,
    isToggled: PropTypes.bool.isRequired,
    chartData: PropTypes.arrayOf(PropTypes.object).isRequired,
    onZoomed: PropTypes.func.isRequired,
  }

  updateMarginLeft({isToggled}) {
    this.marginLeft = isToggled ? TimelineChart.TOGGLED_MARGIN_LEFT : TimelineChart.margin.left
  }

  constructor(props) {
    super(props)
    this.xScale = d3.scaleTime()
    this.updateMarginLeft(props)
    this.yScale = d3.scaleLinear().domain([0, 1])
    this.zoomBehavior = d3.zoom().scaleExtent([1, 1000 * 1000 * 1000]).on('zoom', this.onZoomChanged)
    this.brushBehavior = d3.brushX().on('brush end', this.onBrushed)
    this.state = {noDuration: true, zoomFactor: 1}
  }

  componentDidMount() {
    this.zoomRect = this.find('.zoomRect')
    this.brusher = this.find('.brusher')
    this.tooltipBlock = this.find('.tooltipBlock')

    this.zoomRect.call(this.zoomBehavior)
    setTimeout(() => {
      this.componentWillReceiveProps(this.props)
      this.componentDidUpdate()
      const timelineChart = this

      this.brusher.selectAll('.overlay').each(d => d.type = 'selection').on('mousedown touchstart', function centralizeBrush() {
        const brusherWidth = timelineChart.brusher.select('.selection').attr('width') * 1
        let [center] = d3.mouse(this)
        if (this.isBrushDisabled) {
          return
        }
        const halfWidth = brusherWidth / 2
        center = Math.max(halfWidth, Math.min(center, timelineChart.width - halfWidth))
        timelineChart.brusher.call(timelineChart.brushBehavior.move, [center - halfWidth, center + halfWidth])
      })
    }, 0)
  }

  componentWillReceiveProps(props) {
    const {zoomFactor, isToggled, chartData, currentTime} = props

    if (chartData !== this.props.chartData || props === this.props) {
      const events = chartData.reduce((arr, {events}) => arr.concat(events), [])
      const numberOfItems = events.length
      this.chartData = events
        .sort(({date: a}, {date: b}) => a > b ? 1 : -1)
        .map((item, index) => ({...item, index: index / numberOfItems}))
      const maxValue = d3.max(this.chartData, ({date}) => date)
      const minValue = d3.min(this.chartData, ({date}) => date)
      this.domain = [minValue, maxValue]
    }
    if (this.currentTime !== currentTime && currentTime) {
      const delta = this.currentTime - currentTime
      this.currentTime = currentTime
      const currentZoom = d3.zoomTransform(this.zoomRect.node())
      this.isZoomDisabled = true
      this.zoomBehavior.translateBy(this.zoomRect, delta > 0 ? 20 : -20, currentZoom.y)
      this.updateChart()
      this.isZoomDisabled = false
    } else if (this.zoomFactor !== zoomFactor) {
      this.rezoom(zoomFactor)
    } else if (this.props.isToggled !== isToggled) {
      this.updateMarginLeft({isToggled})
      this.setState({noDuration: true})
    }
  }

  rezoom(zoomFactor) {
    this.isZoomDisabled = true
    this.zoomFactor = zoomFactor
    this.zoomBehavior.scaleTo(this.zoomRect, zoomFactor)
    this.updateChart()
    this.isZoomDisabled = false
  }

  shouldComponentUpdate({chartData}, {noDuration, tooltipData}) {
    const {state, props} = this
    return props.chartData !== chartData
      || (noDuration && !state.noDuration)
      || state.tooltipData !== tooltipData
  }

  highlightCampaign(_campainId) {
    this.isBrushDisabled = true
    this.campainSelected = _campainId !== null
    this.chartData
      .forEach(event => event.isEventSelected = false)
    this.chartData
      .filter(({campainId}) => campainId === _campainId)
      .forEach(event => {
        event.isEventSelected = true
      })
    this.setState({noDuration: true}, () => this.isBrushDisabled = false)
  }

  componentDidUpdate() {
    let {noDuration} = this.state
    this.updateChart(noDuration)
    this.setState({noDuration: false})
  }

  find(selector) {
    return this.d3rootNode.select(selector)
  }

  updateChart(noDuration = true) {
    const margin = TimelineChart.margin
    const {isToggled} = this.props

    if (isToggled) {
      noDuration = true
    }
    const {zoomBehavior, brushBehavior, xScale, yScale, zoomRect, chartData, campainSelected} = this
    const {clientWidth: realWidth} = this.d3rootNode.node()
    const realHeight = isToggled ? 50 : 200
    const width = Math.max(realWidth - this.marginLeft - margin.right, 0)
    const height = Math.max(realHeight - margin.top - margin.bottom, 0)
    Object.assign(this, {width, height, realWidth, realHeight})

    this.xScale.domain(this.domain).rangeRound([0, width])
    yScale.rangeRound([height, 0])

    zoomBehavior.translateExtent([[0, 0], [width, height]]).extent([[0, 0], [width, height]])
    brushBehavior.extent([[0, 0], [width, Math.max(100, height)]])

    zoomRect.attrs({width, height: height + margin.top, y: -margin.top})

    const currentZoom = d3.zoomTransform(this.zoomRect.node())
    xScale.domain(currentZoom.rescaleX(xScale).domain())
    this.currentTime = xScale.domain()[0] - 0
    this.props.onTimeChanged(this.currentTime)

    const duration = noDuration ? 0 : 500
    let td = (d3Selection => d3Selection.transition().duration(duration))
    if (!duration) {
      td = d3Selection => d3Selection
    }

    let translate = (x, y) => ({transform: `translate(${x}, ${y})`})
    const g = this.find('.mainGroup')
    g.attrs(translate(this.marginLeft, margin.top))
    td(this.find('.brushGroup')).attr('transform', `translate(0,${  isToggled ? height + 13 : height + 40  })`)
    td(this.find('.brushLineGroup')).attr('transform', `translate(0,${  isToggled ? height + 13 : height + 40  })`)
    this.find('.brushLine').attrs({width})
    td(this.find('.xAxis')).attrs(translate(0, realHeight - 57)).call(d3.axisBottom(xScale))

    const svgNode = this.find('svg')
    td(svgNode).attrs({height: this.realHeight})
    svgNode.on('click', () => this.highlightCampaign(null))
    const whiteLineNode = this.find('.whiteLine')
    if (isToggled) {
      td(whiteLineNode).attrs({height: 37, y: -height - 20})
    } else {
      td(whiteLineNode).attrs({height: height + 50, y: -height - 50})
    }

    td(this.find('.yAxis')).call(d3.axisLeft(yScale).ticks(5, '%').tickSize(-width)).selectAll('.tick')
      .attr('class', (date, idx) => `tick ${(idx === 4 ? styles['extra-white'] : '')}`)

    const [min, max] = xScale.domain()
    td(this.find('.axisLabel')).attrs({
      ...translate(width + 5, height + 20),
      text: YearTextScale(max - min),
      'text-anchor': 'end',
    })

    let filterVisible = ({date}) => min <= date && date <= max
    const data = chartData.filter(filterVisible)

    const blueLines = data.filter(({compromized}) => !compromized).filter(filterVisible)
    const redLines = data.filter(({compromized}) => compromized).filter(filterVisible)

    const lineAttrs = {width: 2, height: 10, 'pointer-events': 'none'}
    const x = ({date}) => xScale(date)
    const y = ({index}) => yScale(index)

    let opacity = 1
    if (campainSelected) {
      opacity = ({isEventSelected}) => isEventSelected ? 1 : 0.3
    }

    const attrs = {x, y, ...lineAttrs, opacity}
    const smallRects = this.find('.smalRects')
    smallRects.bindData(`rect.${styles['blue-line']}`, blueLines, attrs, duration)
    smallRects.bindData(`rect.${styles['red-line']}`, redLines, attrs, duration)
    renderPath({td, min, max, linePath: this.find('.linePath'), data, x, y, chartData})
    const mouseout = this.closeTooltip
    const moveTooltip = this.openTooltip
    this.tooltipBlock.attrs({mouseout, mouseover: () => this.tooltipOpened = true})
    const actions = {
      mouseout,
      click: ({campainId}) => {
        if (campainId) {
          this.highlightCampaign(campainId)
          d3.event.stopPropagation()
        }
      },
      mouseover: function(d) {
        d3.select(this).moveToFront()
        if (d3.event.target.tagName !== 'rect') {
          moveTooltip(d)
        }
      },
    }


    const groupWidth = 25 / currentZoom.k
    let prevGroupWidth = width / groupWidth
    if (this.prevGroupWidth !== prevGroupWidth) {
      this.prevGroupWidth = prevGroupWidth
        this.composedData = composeCircles(chartData, width, groupWidth)
    }

    let {bulkLines, firstInSubnet} = this.composedData
    bulkLines = bulkLines.filter(filterVisible)
    firstInSubnet = firstInSubnet.filter(filterVisible)
    renderCircles({g, data, x, height, duration, bulkLines, firstInSubnet, actions, isToggled, opacity})
    const {brusher} = this
    const brushCircle = this.find('.brushCircleGroup')
    updateBrush({brusher, brushBehavior, brushCircle, xScale, currentZoom, width, isToggled})
  }

  closeTooltip = () => {
    this.tooltipOpened = false
    setTimeout(() => {
      if (this.tooltipOpened) { return }
      this.tooltipBlock.classed(styles['visible-tooltip'], false).transition().duration(750).style('opacity', 0)
    }, 100)
  }
  openTooltip = tooltipData => {
    if (this.campainSelected && !tooltipData.isEventSelected) {
      return
    }
    const svgBounding = this.find('svg').node().getBoundingClientRect()
    const left = `${this.xScale(tooltipData.date) + svgBounding.left + this.marginLeft  }px`
    this.isZoomDisabled = true
    this.isBrushDisabled = true
    this.setState({tooltipData}, () => {
      this.isZoomDisabled = false
      this.isBrushDisabled = false
      this.tooltipOpened = true
      const TRIANGLE_HEIGHT = 22
      const top = TRIANGLE_HEIGHT + svgBounding.top
      let tooltipHeight = this.tooltipBlock.style('height').replace('px', '') - 0
      this.tooltipBlock
        .styles({left, top: `${ top - (tooltipHeight > top ? 0 : 20) }px`})
        .classed(styles['bottom-triangle'], tooltipHeight <= top)
        .classed(styles['visible-tooltip'], true)
        .transition().duration(100).styles({opacity: 1})
    })
  }
  onBrushed = () => {
    if (this.isBrushDisabled) {
      return
    }

    const {sourceEvent} = d3.event
    if (!sourceEvent || sourceEvent.type === 'zoom') {
      return
    }
    // pev bursh necessary for centralizing the brush
    let [min, max] = d3.event.selection || this.prevBrush
    if (min + max === this.width) {
      max = max / 2
    }
    this.prevBrush = [min, max]
    const zoomPosition = d3.zoomIdentity.scale(this.width / (max - min)).translate(-min, 0)
    zoomPosition.k = Math.round(zoomPosition.k * 100) / 100
    this.isBrushing = true
    this.zoomRect.call(this.zoomBehavior.transform, zoomPosition)
    this.isBrushing = false
  }
  onZoomChanged = () => {
    if (this.isZoomDisabled) {
      return
    }
    this.isZoomDisabled = true
    const newZoomFactor = d3.zoomTransform(this.zoomRect.node()).k
    let zoomFactor = this.zoomFactor
    if (zoomFactor !== newZoomFactor) {
      if (!this.isBrushing) {
        let k = Math.max(0.05, Math.log2(newZoomFactor))
        if (newZoomFactor > 300) {
          k = 1000
        } else if (newZoomFactor > 30000) {
          k = 10000
        }
        if (newZoomFactor > zoomFactor) {
          zoomFactor += k
        } else {
          zoomFactor -= k
        }
        zoomFactor = Math.max(zoomFactor, 1)
        this.zoomBehavior.scaleTo(this.zoomRect, zoomFactor)
      } else {
        zoomFactor = newZoomFactor
      }
      this.setState({noDuration: true})
      this.props.onZoomed(zoomFactor)
    } else {
      this.onWindowResize()
    }

    this.isZoomDisabled = false
  }
  onWindowResize = () => this.setState({noDuration: true})

  setD3Node = node => this.d3rootNode = d3.select(node)

  render() {
    const {props: {isToggled}, state: {tooltipData = {}}, onWindowResize, setD3Node} = this
    const backgroundClass = isToggled ? styles['toggled-background'] : styles['black-background']
    const visibility = isToggled ? 'hidden' : 'visible'
    return <div ref={setD3Node} style={{position: 'relative', width: '100%'}}>
      <WindowDependable onWindowResize={onWindowResize}>
        <svg className={`${(isToggled ? styles['toggled'] : '')} ${styles['timeline-chart']}`}>
          <rect width="100%" height="100%" className={backgroundClass} />
          <g className="brushLineGroup">
            <rect height="50" fill="#252525" width="100%" visibility={visibility} />
            <rect className="brushLine" pointerEvents="none" height="5" rx="3" ry="3" fill="#141414"
                  transform={`translate(${this.marginLeft},15)`} />
          </g>
          <g fill="white" className="mainGroup">
            <g visibility={visibility}>
              <g className={`xAxis ${styles['axis']} ${styles['axis--x']}`} />
              <g className={`yAxis ${styles['axis']} ${styles['axis--y']}`} />
              <path className={`linePath ${styles['line-path']}`} />
              <text className="axisLabel" visibility={visibility} />
            </g>
            <rect className={`${styles['zoom']} zoomRect`} />
            <g className="smalRects" transform="translate(0, -5)" />
          </g>
          <g className="brushGroup">
            <g transform={`translate(${this.marginLeft},15)`}>
              <g className="brusher" transform={`translate(0,${isToggled ? 0 : -15})`} />
              <g className="brushCircleGroup">
                <rect width="1" fill="white" className="whiteLine" />
                <rect className={styles['brush-circle']} height="14" width="14" rx="9" ry="12" />
              </g>
            </g>
          </g>
        </svg>

        <div className={`tooltipBlock ${styles['tooltip']}`}>
          <div className={styles['triangle-wrapper']}>
            <div className={styles['triangle']}>
              <div className={`${styles['triangle']  } ${  styles['triangle-content']}`} />
            </div>
          </div>
          <TooltipContentBlock tooltipData={tooltipData} />
        </div>
      </WindowDependable>
    </div>
  }
}
