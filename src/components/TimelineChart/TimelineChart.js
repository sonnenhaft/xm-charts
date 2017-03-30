import * as d3 from 'd3'
import React, { Component } from 'react'
import './d3.shims'
import styles from './TimelineChart.scss'
import TooltipContentBlock from '../common/TooltipContent/TooltipContent'

export default class TimelineChart extends Component {
  static margin = { top: 30, right: 10, bottom: 75, left: 30 }

  constructor (props) {
    super(props)
    Object.assign(this, {
      xScale: d3.scaleTime(),
      yScale: d3.scaleLinear().domain([0, 1]),
      margin: TimelineChart.margin,
      zoom: d3.zoom().scaleExtent([1, 1000000]),
      marginLeft: TimelineChart.margin.left,
      brush: d3.brushX(),
    })
    this.state = {}
  }

  componentWillReceiveProps ({ isToggled, chartData = [] }) {
    this.isToggled = isToggled
    let events = chartData.reduce((arr, { events }) => arr.concat(events), [])
    const numberOfItems = events.length
    this.chartData = events
      .sort(({ date: a }, { date: b }) => a > b ? 1 : -1)
      .map((item, index) => ({ ...item, index: index / numberOfItems }))
    this.oldK = false

    this.setWidth()
    const noDuration = isToggled !== this.props.isToggled
    if (noDuration) {
      this.disabledBrush = true
      setTimeout(() => {
        this.disabledBrush = false
      }, 250)
    }
    this.renderChart(!noDuration)
  }

  componentDidMount () {
    this.d3svg = d3.select(this.svg)
    window.addEventListener('resize', this.onWindowResize)
    this.setWidth()
    this.componentWillReceiveProps(this.props)
    this.brush.on('brush end', this.brushed)
  }

  brushed = () => {
    const sourceEvent = d3.event.sourceEvent
    if (this.disabledBrush || (sourceEvent && sourceEvent.type === 'zoom')) {
      return
    }
    const [min, max] = d3.event.selection || this.brushSelection
    this.brushSelection = d3.event.selection || [min, max]
    const zoomPosition = d3.zoomIdentity.scale(this.width / (max - min)).translate(-min, 0)
    this.zoomRect.call(this.zoom.transform, zoomPosition)
  }

  setWidth () {
    const realWidth = this.svg.parentNode.clientWidth
    let realHeight
    if (this.isToggled) {
      realHeight = 50
    } else {
      realHeight = Math.max(Math.min(200, realWidth / 2), 160)
    }

    const { zoom, margin, xScale, yScale } = this
    const { left, top, right, bottom } = margin
    this.marginLeft = left //this.isToggled ? left/2 : left
    const width = realWidth - this.marginLeft - right
    const height = Math.max(realHeight - top - bottom, 0)
    xScale.rangeRound([0, width])
    yScale.rangeRound([height, 0])
    Object.assign(this, { width, height, realWidth, realHeight })

    this.brushLine.attrs({ width })
    const zoomer = zoom
      .translateExtent([[0, 0], [width, height]])
      .extent([[0, 0], [width, height]])
      .on('zoom', this.zoomed)
    this.zoomRect.attrs({ width, height }).call(zoomer)
  }

  zoomed = () => {
    this.zoomBehavior = d3.event.transform
    this.renderChart(true, this.oldK !== this.zoomBehavior.k)
    this.oldK = this.zoomBehavior.k
  }

  onWindowResize = () => {
    this.setWidth()
    this.renderChart(true)
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.onWindowResize)
  }

  static generateBlueLines (allBlueLines, width, number) {
    let maxValue = allBlueLines.length ? allBlueLines[allBlueLines.length - 1].date : 0
    let minValue = allBlueLines.length ? allBlueLines[0].date : 0
    const rounderRange = d3.scaleLinear()
      .domain([minValue, maxValue])
      .range([0, width / number])
    const map = allBlueLines.reduce((map, item) => {
      const mapKey = Math.round(rounderRange(item.date))
      if (map[mapKey]) {
        map[mapKey].push(item)
      } else {
        map[mapKey] = [item]
      }
      return map
    }, {})
    return Object.keys(map).reduce((result, key) => {
      const items = map[key]
      if (items.length > 1) {
        let val = items[0].date
        result.redBulkLines.push({ date: val, value: items.length, id: val })
      } else {
        result.blueLines.push(items[0])
      }
      return result
    }, { redBulkLines: [], blueLines: [] })
  }

  _updateBrush () {
    const { brush, xScale, zoomBehavior, brushCircle, brusher, width, notFirstRun } = this
    brusher.call(brush).call(brush.move, xScale.range())
    if (zoomBehavior) {
      brusher.call(brush.move, xScale.range().map(zoomBehavior.invertX, zoomBehavior))
    }
    const brusherSelection = brusher.select('.selection')
    const brusherWidth = brusherSelection.attr('width') * 1
    const tooBig = brusherWidth === width
    brusherSelection.attrs({
      stroke: 'none',
      'fill-opacity': tooBig ? 0 : 0.3,
      'pointer-events': tooBig ? 'none' : 'all',
    })
    brushCircle.attrs({
      width: 10,
      transform: `translate(${brusherSelection.attr('x') / 1 + (tooBig ? 0 : (brusherWidth - 10) / 2) },-2)`,
    })
    brusher.selectAll('.handle').attr('pointer-events', brusherWidth < 16 ? 'none' : 'all')
    if (!notFirstRun) {
      const timelineChart = this
      brusher.selectAll('.overlay').each(d => d.type = 'selection').on('mousedown touchstart', function centralizeBrush () {
        const brusherWidth = brusherSelection.attr('width') * 1
        if (timelineChart.width === brusherWidth) {
          return
        }
        const [center] = d3.mouse(this)
        const halfWidth = brusherWidth / 2
        brusher.call(brush.move, [center - halfWidth, center + halfWidth])
      })
    }
  }

  renderChart (noDuration, zoomed) {
    const { width, height, xScale, yScale, margin, chartData, zoomBehavior } = this
    this.g.attr('transform', `translate(${  this.marginLeft  },${  margin.top  })`)
    const maxValue = d3.max(chartData, ({ date }) => date)
    const minValue = d3.min(chartData, ({ date }) => date)
    xScale.domain([minValue, maxValue])
    let number = 25
    if (zoomBehavior) {
      xScale.domain(zoomBehavior.rescaleX(xScale).domain())
      number = number / zoomBehavior.k
    }
    this._updateBrush()

    const maxTop = -margin.top / 2
    const data = chartData.filter(({ date }) => {
      const [min, max] = xScale.domain()
      return min < date && date < max
    })
    const blueLines = data.filter(({ compromized }) => !compromized)

    if (zoomed || !this.oldData) {
      this.oldData = TimelineChart.generateBlueLines(
        data.filter(({ compromized }) => compromized), width, number
      )
    }
    let { redBulkLines, blueLines: redLines } = this.oldData


    const duration = noDuration ? 0 : 500
    let td
    if (this.notFirstRun) {
      td = (d3Selection => d3Selection.transition().duration(duration))
    } else {
      this.notFirstRun = true
      td = (d3Selection => d3Selection)
    }

    td(this.brushGroup).attr('transform', `translate(0,${  this.isToggled ? height + 5 : height + 50 + 5   })`)
    this.brushBack.attrs({ width: this.realWidth })

    td(this.xAxis).attr('transform', `translate(0,${  height  })`).call(d3.axisBottom(xScale))
    td(this.d3svg).attr('height', this.realHeight)
    td(this.axises).style('opacity', this.isToggled ? 0 : 1)
    td(this.yAxis).call(d3.axisLeft(yScale).ticks(5, '%').tickSize(-width)).selectAll('.tick')
      .attr('class', (date, idx) => `tick ${(idx === 4 ? styles['extra-white'] : '')}`)

    const x = ({ date }) => xScale(date)
    const y = ({ index }) => this.isToggled ? 0 : yScale(index)

    const lineAttrs = {
      width: 2,
      height: 10,
      'pointer-events': 'none',
    }
    this.smalRects.bindData(`rect.${styles['blue-line']}`, blueLines, { x, y, ...lineAttrs }, duration)
    this.smalRects.bindData(`rect.${styles['red-line']}`, redLines, { x, y, ...lineAttrs }, duration)

    const mouseout = () => {
      this.tooltipOpened = false
      setTimeout(() => {
        if (this.tooltipOpened) {
          return
        }
        this.tooltipBlock.classed(styles['visible-tooltip'], false).transition().duration(750).style('opacity', 0)
      }, 10)
    }

    this.tooltipBlock.attrs({ mouseout, mouseover: () => this.tooltipOpened = true })

    const moveTooltip = d => {
      const svgBounding = this.svg.getBoundingClientRect()
      const left = `${this.xScale(d.date) + svgBounding.left + this.marginLeft  }px`

      this.setState({ tooltipData: d }, () => {
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

    const firstInSubnet = data.filter(({ firstInSubnet }) => firstInSubnet)
    const lastInSubnet = data.filter(({ lastInSubnet }) => lastInSubnet)
    this.g.bindData('g.bulkBlock', redBulkLines.concat(firstInSubnet).concat(lastInSubnet), {
      transform: d => `translate(${x(d)}, -12)`,
      mouseover: function (d) {
        d3.select(this).moveToFront()
        if (d3.event.target.tagName !== 'rect') {
          moveTooltip(d)
        }
      },
    }, duration).singleBind('rect.white-shadow-rect', {
        y: maxTop,
        fill: '#EB001E',
        'pointer-events': 'none',
        opacity: ({ firstInSubnet }) => firstInSubnet ? 0.2 : 0,
        width: 18,
        height: Math.max(height - maxTop + 12 - 16 + 8, 0) + (this.isToggled ? 5 : 0),
        transform: 'translate(-9, 11)',
      },
      duration
    ).singleBind('circle.circleWrapper', {
      stroke: '#EB001E',
      'stroke-opacity': ({ value }) => value ? 0.3 : 1,
      'stroke-width': ({ value }) => !value ? 2 : 4,
      transform: 'translate(0, -4)',
      fill: 'black',
      r: 8,
    }).singleBind(`circle.${styles['red-bulk-circle']}`, {
      transform: 'translate(0, -4)',
      r: ({ value }) => !value ? 4 : 8,
    }).singleBind(`rect.${styles['red-bulk-line']}`, {
        y: maxTop,
        height: Math.max(height - maxTop + 12 - 16, 0) + (this.isToggled ? 5 : 0),
        width: 2,
        transform: 'translate(-1,18)',
        'pointer-events': 'none',
      },
      duration
    ).singleBind(`text.${styles['circle-text']}`, {
      text: ({ value }) => value,
      transform: 'translate(0, -1)',
    })

    let pathData = data.length === 1 ? [data[0], data[0]] : data
    if (data.length === 0 && this.brushSelection && chartData.length) {
      const currentDot = this.xScale.invert(this.brushSelection[0])
      const closestValue = chartData.find(({ date }) => date > currentDot) || chartData[0]
      pathData = [closestValue, closestValue]
    }
    const lineX = (item, idx) => {
      if (pathData.length === 2) {
        return this.xScale.range()[idx]
      } else if (idx === 0) {
        return 0
      } else if (idx === pathData.length - 1) {
        return this.xScale.range()[1]
      } else {
        return x(pathData[idx])
      }
    }
    const lineFn = d3.line().x(lineX).y(y).curve(d3.curveBundle.beta(0.95))

    this.linePath.transition().duration(duration).attr('d', lineFn(pathData))
  }

  render () {
    const { isToggled, state: { tooltipData = {} } } = this
    return <div style={ { position: 'relative', width: '100%' } }>
      <svg ref={ svg => this.svg = svg }
           className={ `${(isToggled ? styles['toggled'] : '')} ${styles['timeline-chart']}` }>
        <rect width="100%" height="100%" className={ styles['black-background'] } />
        <g ref={ g => this.brushGroup = d3.select(g) }>
          <rect fill="#252525" height="50" ref={ g => this.brushBack = d3.select(g) } />
          {isToggled && <rect height="20" fill="#252525" transform="translate(0,-20)" width="100%" />}
          <g transform={ `translate(${this.marginLeft},20)` }>
            <g ref={ g => this.brusher = d3.select(g) } transform="translate(0,-20)" />
            <rect height="7" rx="3" ry="3" fill="#141414" ref={ g => this.brushLine = d3.select(g) }
                  pointerEvents="none" />
            <rect className={ styles['brush-circle'] } ref={ g => this.brushCircle = d3.select(g) } pointerEvents="none"
                  height="10" rx="5" ry="5"
            />
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
