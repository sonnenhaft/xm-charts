import * as d3 from 'd3'
import '../common/d3.shims'
import styles from './TimelineChart.scss'
import React, { PropTypes, Component } from 'react'
import TooltipContentBlock from '../common/TooltipContent/TooltipContent'
import { composeCircles, updateBrush, renderCircles, renderPath } from './TimelineChartUtils'

export default class TimelineChart extends Component {
  static margin = { top: 30, right: 10, bottom: 60, left: 30 }
  static propTypes = {
    zoomFactor: PropTypes.number,
    chartData: PropTypes.arrayOf(PropTypes.object).isRequired,
    onZoomed: PropTypes.func.isRequired,
  }
  static defaultProps = { zoomFactor: 1, isToggled: true };

  constructor (props) {
    super(props)
    this.marginLeft = TimelineChart.margin.left
    this.xScale = d3.scaleTime()
    this.yScale = d3.scaleLinear().domain([0, 1])
    this.zoomBehavior = d3.zoom().scaleExtent([1, 1000 * 1000 * 1000]).on('zoom', this.onZoomChanged)
    this.brushBehavior = d3.brushX().on('brush end', this.onBrushed)
    this.state = { noDuration: true, zoomFactor: props.zoomFactor }
  }

  componentDidMount () {
    this.zoomRect.call(this.zoomBehavior)
    setTimeout(() => {
      this.componentWillUpdate(this.props)
      this.componentDidUpdate()
      const timelineChart = this

      this.brusher.selectAll('.overlay').each(d => d.type = 'selection').on('mousedown touchstart', function centralizeBrush () {
        const brusherWidth = timelineChart.brusher.select('.selection').attr('width') * 1
        let [center] = d3.mouse(this)
        const halfWidth = brusherWidth / 2
        center = Math.max(halfWidth, Math.min(center, timelineChart.width - halfWidth))
        timelineChart.brusher.call(timelineChart.brushBehavior.move, [center - halfWidth, center + halfWidth])
      })
    }, 0)

    window.addEventListener('resize', this.onWindowResize)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.onWindowResize)
  }

  componentWillReceiveProps ({ zoomFactor }) {
    if (this.state.zoomFactor !== zoomFactor) {
      this.isZoomDisabled = true
      this.zoomBehavior.scaleTo(this.zoomRect, zoomFactor)
      this.setState({ zoomFactor, noDuration: true })
      this.isZoomDisabled = false
    }
  }

  shouldComponentUpdate ({ chartData, isToggled }, { noDuration, zoomFactor, tooltipData }) {
    const { state, props } = this
    return props.chartData !== chartData
      || (noDuration && !state.noDuration)
      || state.zoomFactor !== zoomFactor
      || state.tooltipData !== tooltipData
      || props.isToggled !== isToggled
  }

  componentWillUpdate ({ chartData }) {
    const events = chartData.reduce((arr, { events }) => arr.concat(events), [])

    const numberOfItems = events.length
    const data = this.chartData = events
      .sort(({ date: a }, { date: b }) => a > b ? 1 : -1)
      .map((item, index) => ({ ...item, index: index / numberOfItems }))

    const maxValue = d3.max(data, ({ date }) => date)
    const minValue = d3.min(data, ({ date }) => date)
    this.xScale.domain([minValue, maxValue])
  }

  componentDidUpdate () {
    const { zoomBehavior, brushBehavior, xScale, yScale, zoomRect, chartData } = this
    const { noDuration } = this.state
    this.setState({ noDuration: false })

    const { left, top, right, bottom } = TimelineChart.margin

    this.marginLeft = left
    const realWidth = this.svg.parentNode.clientWidth
    let realHeight = Math.min(Math.max(100, this.svg.parentNode.clientHeight), 200)
    if (this.props.isToggled) {
      realHeight = 50;
    }
    const width = realWidth - this.marginLeft - right
    const height = Math.max(realHeight - top - bottom, 0)
    Object.assign(this, { width, height, realWidth, realHeight })

    xScale.rangeRound([0, width])
    yScale.rangeRound([height, 0])

    zoomBehavior.translateExtent([[0, 0], [width, height]]).extent([[0, 0], [width, height]])
    brushBehavior.extent([[0, 0], [width, height]])

    zoomRect.attrs({ width, height })

    const currentZoom = d3.zoomTransform(this.zoomRect.node())
    xScale.domain(currentZoom.rescaleX(xScale).domain())
    this.props.onTimeChanged(xScale.domain()[0] - 0)

    const duration = noDuration ? 0 : 500
    let td = (d3Selection => d3Selection.transition().duration(duration))

    let translate = (x, y) => ({ transform: `translate(${x}, ${y})` })
    this.g.attrs(translate(this.marginLeft, TimelineChart.margin.top))
    td(this.brushGroup).attr('transform', `translate(0,${  this.isToggled ? height + 5 : height + 40  })`)
    this.brushBack.attrs({ width: realWidth })
    this.brushLine.attrs({ width })
    td(this.xAxis).attrs(translate(0, realHeight - 57)).call(d3.axisBottom(xScale))
    td(this.d3svg).attr('height', this.realHeight)
    td(this.yAxis).call(d3.axisLeft(yScale).ticks(5, '%').tickSize(-width)).selectAll('.tick')
      .attr('class', (date, idx) => `tick ${(idx === 4 ? styles['extra-white'] : '')}`)

    const [min, max] = xScale.domain()
    let filterVisible = ({ date }) => min <= date && date <= max
    const data = chartData.filter(filterVisible)

    let prevGroupWidth = 20 / currentZoom.k;
    if (this.prevGroupWidth !== prevGroupWidth) {
      this.prevGroupWidth = prevGroupWidth
      this.composedData = composeCircles(chartData, width,  prevGroupWidth)
    }

    let { bulkLines, redLines, blueLines } = this.composedData
    bulkLines = bulkLines.filter(filterVisible)
    redLines = redLines.filter(filterVisible)
    blueLines = blueLines.filter(filterVisible)
    const lineAttrs = { width: 2, height: 10, 'pointer-events': 'none' }
    const x = ({ date }) => xScale(date)
    const y = ({ index }) => yScale(index)
    this.smalRects.bindData(`rect.${styles['blue-line']}`, blueLines, { x, y, ...lineAttrs }, duration)
    this.smalRects.bindData(`rect.${styles['red-line']}`, redLines, { x, y, ...lineAttrs }, duration)
    renderPath({ td, min, max, linePath: this.linePath, data, x, y, chartData })
    const { g } = this

    const mouseout = this.closeTooltip
    const moveTooltip = this.openTooltip
    this.tooltipBlock.attrs({ mouseout, mouseover: () => this.tooltipOpened = true })
    const actions = {
      mouseout,
      mouseover: function (d) {
        d3.select(this).moveToFront()
        if (d3.event.target.tagName !== 'rect') {
          moveTooltip(d)
        }
      },
    }
    renderCircles({ g, data, x, height, duration, bulkLines, actions })
    const { brusher, brushCircle } = this
    updateBrush({ brusher, brushBehavior, brushCircle, xScale, currentZoom, width })
  }

  closeTooltip = () => {
    this.tooltipOpened = false
    setTimeout(() => {
      if (this.tooltipOpened) {
        return
      }
      this.tooltipBlock.classed(styles['visible-tooltip'], false).transition().duration(750).style('opacity', 0)
    }, 10)
  }

  openTooltip = tooltipData => {
    const svgBounding = this.svg.getBoundingClientRect()
    const left = `${this.xScale(tooltipData.date) + svgBounding.left + this.marginLeft  }px`
    this.isZoomDisabled = true
    this.isBrushDisabled = true
    this.setState({ tooltipData }, () => {
      this.isZoomDisabled = false
      this.isBrushDisabled = false
      this.tooltipOpened = true
      const top = 22 + svgBounding.top
      let tooltipHeight = this.tooltipBlock.style('height').replace('px', '') - 0
      this.tooltipBlock
        .styles({ left, top: `${ top - (tooltipHeight > top ? 0 : 20) }px` })
        .classed(styles['bottom-triangle'], tooltipHeight <= top)
        .classed(styles['visible-tooltip'], true)
        .transition().duration(100).styles({ opacity: 1 })
    })
  }

  onBrushed = () => {
    if (this.isBrushDisabled) {return}

    const { sourceEvent } = d3.event
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
    if (this.isZoomDisabled) { return }
    this.isZoomDisabled = true
    const newZoomFactor = d3.zoomTransform(this.zoomRect.node()).k
    let zoomFactor = this.state.zoomFactor
    if (zoomFactor !== newZoomFactor) {
      if (!this.isBrushing) {
        let k = Math.max(0.1, Math.log2(newZoomFactor))
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
      this.setState({ noDuration: true, zoomFactor })
      this.props.onZoomed(zoomFactor)
    } else {
      this.onWindowResize()
    }

    this.isZoomDisabled = false
  }
  onWindowResize = () => this.setState({ noDuration: true })

  render () {
    const { isToggled, state: { tooltipData = {} } } = this
    return <div style={ { position: 'relative', width: '100%' } }>
      <svg ref={ svg => {
        this.d3svg = d3.select(svg)
        this.svg = svg
      } }
           className={ `${(isToggled ? styles['toggled'] : '')} ${styles['timeline-chart']}` }>
        <rect width="100%" height="100%" className={ styles['black-background'] } />
        <g ref={ g => this.brushGroup = d3.select(g) }>
          <rect fill="#252525" height="50" ref={ g => this.brushBack = d3.select(g) } />
          {isToggled && <rect height="20" fill="#252525" transform="translate(0,-15)" width="100%" />}
          <g transform={ `translate(${this.marginLeft},15)` }>
            <g ref={ g => this.brusher = d3.select(g) } transform="translate(0,-15)" />
            <rect ref={ g => this.brushLine = d3.select(g) }
                  pointerEvents="none" height="5" rx="3" ry="3" fill="#141414" />
            <rect className={ styles['brush-circle'] } ref={ g => this.brushCircle = d3.select(g) }
                  pointerEvents="none" height="9" rx="5" ry="5" />
          </g>
        </g>
        <g ref={ g => this.g = d3.select(g) } fill="white">
          <g ref={ g => this.axises = d3.select(g) }>
            <g ref={ g => this.xAxis = d3.select(g) } className={ `${styles['axis']} ${styles['axis--x']}` } />
            <g ref={ g => this.yAxis = d3.select(g) } className={ `${styles['axis']} ${styles['axis--y']}` } />
            <path ref={ g => this.linePath = d3.select(g) } className={ styles['line-path'] } />
          </g>
          <rect ref={ rect => this.zoomRect = d3.select(rect) } className={ styles['zoom'] } />
          <g ref={ g => this.smalRects = d3.select(g) } transform="translate(0, -5)" />
        </g>
      </svg>

      <div ref={ div => this.tooltipBlock = d3.select(div) } className={ styles['tooltip'] }>
        <div className={ styles['triangle-wrapper'] }>
          <div className={ styles['triangle'] }>
            <div className={ `${styles['triangle']  } ${  styles['triangle-content']}` } />
          </div>
        </div>
        <TooltipContentBlock tooltipData={ tooltipData } />
      </div>
    </div>
  }
}
