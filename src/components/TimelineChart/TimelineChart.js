import * as d3 from 'd3'
import React, {Component} from 'react'
import './d3.shims'
import styles from './TimelineChart.scss'

export default class TimelineChart extends Component {
  static margin = {top: 30, right: 10, bottom: 75, left: 40}

  constructor(props) {
    super(props)
    Object.assign(this, {
      xScale: d3.scaleLinear(),
      yScale: d3.scaleLinear().domain([0, 1]),
      margin: TimelineChart.margin,
      zoom: d3.zoom().scaleExtent([0.01, 100]),
    })
  }

  componentWillReceiveProps({isToggled, chartData = []}) {
    this.chartData = chartData
    if (isToggled !== this.props.isToggled) {
      this.isToggled = isToggled
      this.setWidth()
      this.applyDimensionsToScales()
      this.renderChart()
    } else {
      this.renderChart(true)
    }
  }

  componentDidMount() {
    const {margin} = this
    this.d3svg = d3.select(this.svg)
    window.addEventListener('resize', this.onWindowResize)
    this.setWidth()
    this.applyDimensionsToScales()
    this.componentWillReceiveProps(this.props)
  }

  setWidth() {
    const realWidth = this.svg.parentNode.clientWidth
    let realHeight
    if (this.isToggled) {
      realHeight = 50
    } else {
      realHeight = Math.max(Math.min(250, realWidth / 2), 160)
    }

    const {zoom, margin} = this
    const {left, top, right, bottom} = margin
    this.marginLeft = left //this.isToggled ? left/2 : left
    const width = realWidth - this.marginLeft - right
    const height = Math.max(realHeight - top - bottom, 0)
    Object.assign(this, {width, height, realWidth, realHeight})

    this.zoomRect.attrs({width, height})
      .call(zoom
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on('zoom', this.zoomed))
  }

  applyDimensionsToScales() {
    const {width, height, xScale, yScale} = this
    xScale.rangeRound([0, width])
    yScale.rangeRound([height, 0])
  }

  zoomed = () => {
    this.zoomBehavior = d3.event.transform
    this.renderChart(true)
  }

  onWindowResize = () => {
    this.setWidth()
    this.applyDimensionsToScales()
    this.renderChart(true)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.onWindowResize)
  }

  static generateBlueLines(allBlueLines, width, number) {
    let maxValue = allBlueLines.length ? allBlueLines[allBlueLines.length - 1].data : 0
    const rounderRange = d3.scaleLinear()
      .domain([0, maxValue])
      .range([0, width / number])
    const map = allBlueLines.reduce((map, item) => {
      const mapKey = Math.round(rounderRange(item.data))
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
        result.redBulkLines.push({data: rounderRange.invert(key), value: items.length})
      } else {
        result.blueLines.push(items[0])
      }
      return result
    }, {redBulkLines: [], blueLines: []})
  }

  renderChart(noDuration) {
    const {width, height, xScale, yScale, margin} = this
    this.g.attr('transform', `translate(${  this.marginLeft  },${  margin.top  })`)
    let chartData = this.chartData
    const maxValue = d3.max(chartData, ({data}) => data) * 1
    xScale.domain([0, maxValue])
    let number = 20
    if (this.zoomBehavior) {
      this.xScale.domain(this.zoomBehavior.rescaleX(this.xScale).domain())
      number = number / this.zoomBehavior.k
    }
    const maxTop = -margin.top / 2
    const max = Math.max(100, chartData.length)
    chartData = chartData.filter(({data})=>{
      const [min, max] = xScale.domain()
      return min < data && data < max
    })
    const data = chartData.map(({data, type}, index) => ({data, index: index / max, type}))
    const redLines = data.filter(({type}) => type === 'bad')
    const allBlueLines = data.filter(({type}) => type === 'good')
    const {redBulkLines, blueLines} = TimelineChart.generateBlueLines(allBlueLines, width, number)

    const duration = noDuration ? 0 : 500
    let td
    if (this.notFirstRun) {
      td = (d3Selection => d3Selection.transition().duration(duration))
    } else {
      this.notFirstRun = true
      td = (d3Selection => d3Selection)
    }

    td(this.brushGroup).attr('transform', `translate(0,${  this.isToggled ? height + 6 : height + 50 + 6   })`)
    this.brushBack.attrs({width: this.realWidth})
    this.brushLine.attrs({width: width})
    // console.log(this.xScale(max))
    this.brushedZone.attrs({width: width})
    td(this.xAxis).attr('transform', `translate(0,${  height  })`).call(d3.axisBottom(xScale))
    td(this.d3svg).attr('height', this.realHeight)
    td(this.axises).style('opacity', this.isToggled ? 0 : 1)
    td(this.yAxis).call(d3.axisLeft(yScale).ticks(5, '%').tickSize(-width))

    const x = ({data}) => xScale(data)
    const y = ({index}) => this.isToggled ? 0 : yScale(index)

    this.smalRects.bindData(`rect.${styles['blue-line']}`, blueLines, {x, y}, duration)
    this.smalRects.bindData(`rect.${styles['red-line']}`, redLines, {x, y}, duration)
    this.bulkRects.bindData(`rect.${styles['red-bulk-line']}`, redBulkLines,
      {x, y: maxTop, height: Math.max(height - maxTop, 0)},
      duration
    )
    this.g.bindData(`circle.${styles['red-bulk-circle']}`, redBulkLines, {cy: maxTop, cx: x}, duration)
    this.g.bindData(`text.${styles['circle-text']}`, redBulkLines, {
      x, y: maxTop, dy: 4,
      text: ({value}) => value,
    }, duration)
    this.axises.bindData(`rect.${styles['white-horizontal-line']}`, data, {
      y,
      x: (item, idx) => idx === 0 ? 0 : x(data[idx - 1]),
      width: (item, idx) => Math.max(0, idx === 0 ? x(item) : x(item) - x(data[idx - 1])),
    }, duration)
  }

  render() {
    const isToggled = this.isToggled
    const isToggledClass = isToggled ? styles['isToggled'] : ''
    return <div>
      <svg ref={ svg => this.svg = svg } className={`${isToggledClass} ${styles['timeline-chart']}`}>
        <rect width="100%" height="100%" className={styles['black-background']}/>
        <g ref={ g => this.brushGroup = d3.select(g) }>
          <rect fill="#252525" height="50" ref={ g => this.brushBack = d3.select(g) }/>
          {isToggled && <rect height="20" fill="#252525" transform="translate(0,-20)" width="100%"/>}
          <g transform={`translate(${this.marginLeft},20)`}>
            <rect height="7" rx="3" ry="3" fill="#141414" ref={ g => this.brushLine = d3.select(g) }/>
            {!isToggled && <rect fill="#777" stroke="#fff" opacity="0.2" y="-15" width="900" height="5" ref={ g => this.brushedZone = d3.select(g) }/>}
            <circle fill="#4660DF" r="7" cy="3" className={styles['brush-circle']} ref={ g => this.brushCircle = d3.select(g) }/>
          </g>
        </g>
        <g ref={ g => this.g = d3.select(g) } fill="white">
          <g ref={ g => this.axises = d3.select(g) }>
            <g ref={ g => this.xAxis = d3.select(g) } className={`${styles['axis']} ${styles['axis--x']}`}/>
            <g ref={ g => this.yAxis = d3.select(g) } className={`${styles['axis']} ${styles['axis--y']}`}/>
          </g>
          <g ref={ g => this.bulkRects = d3.select(g) } transform="translate(-1, 0)"/>
          <g ref={ g => this.smalRects = d3.select(g) } transform="translate(0, -5)"/>
          <rect ref={ rect => this.zoomRect = d3.select(rect) } className={styles['zoom']}/>
        </g>
      </svg>
    </div>
  }
}
