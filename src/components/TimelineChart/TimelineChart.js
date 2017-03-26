// import {scaleLinear, select, tsvParse, max, axisBottom, axisLeft, zoom} from 'd3'
import * as d3 from 'd3'
import React, { Component } from 'react'
import './d3.shims'
/* eslint-disable */
import dataTsv from 'raw-loader!./data.tsv'
import styles from 'raw-loader!./TimelineChart.plain-css'
/* eslint-enable */

// const d3 = {scaleLinear, select, tsvParse, max, axisBottom, axisLeft, zoom}

export default class TimelineChart extends Component {
  constructor(props) {
    super(props)
    const xScale = d3.scaleLinear()
    const yScale = d3.scaleLinear().domain([0, 1])
    const margin = { top: 30, right: 30, bottom: 30, left: 40 }
    const zoom = d3.zoom().scaleExtent([1, 10])

    Object.assign(this, { xScale, yScale, margin, zoom })
  }

  componentWillReceiveProps({ toggled }) {
    if (toggled !== this.props.toggled) {
      this.isToggled = toggled
      this.setWidth()
      this.applyDimensionsToScales()
      this.renderChart()
    }
  }

  componentDidMount() {
    const { margin } = this
    this.g.attr('transform', `translate(${  margin.left  },${  margin.top  })`)
    window.addEventListener('resize', this.onWindowResize)
    this.setWidth()
    this.applyDimensionsToScales()

    this.initData = d3.tsvParse(dataTsv, ({ date, type }) => ({ data: (date - 0), type }))
    this.renderChart()
    this.interval = setInterval(() => {
      const { type, data } = this.initData[this.initData.length - 1]
      const last = { type, data: data + Math.random() }
      this.initData.push({ data: last.data, type: 'good' })
      this.renderChart()
    }, 1000)
  }

  setWidth() {
    this.d3svg = d3.select(this.svg)
    const w = this.svg.parentNode.clientWidth
    let h
    if (this.isToggled) {
      h = 65
    } else {
      h = Math.max(Math.min(200, w / 2), 110)
    }
    this.realHeight = h

    const { zoom, margin } = this
    const width = w - margin.left - margin.right
    const height = h - margin.top - margin.bottom
    Object.assign(this, { width, height })

    this.zoomRect.attrs({ width, height })
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
      .call(zoom
        .translateExtent([[0, 0], [width, height]])
        .extent([[0, 0], [width, height]])
        .on('zoom', this.zoomed))
  }

  applyDimensionsToScales() {
    const { width, height, xScale, yScale } = this
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
    if (this.initData) {
      this.renderChart(true)
    }
  }

  componentWillUnmount() {
    clearInterval(this.interval)
    window.removeEventListener('resize', this.onWindowResize)
  }

  static generateBlueLines(allBlueLines, width, number) {
    const rounderRange = d3.scaleLinear()
      .domain([0, allBlueLines[allBlueLines.length - 1].data])
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
        result.redBulkLines.push({ data: rounderRange.invert(key), value: items.length })
      } else {
        result.blueLines.push(items[0])
      }
      return result
    }, { redBulkLines: [], blueLines: [] })
  }


  renderChart(noDuration) {
    const { width, height, xScale, yScale, initData, margin } = this
    const maxValue = d3.max(initData, ({ data }) => data) * 1
    xScale.domain([0, maxValue])
    let number = 20
    if (this.zoomBehavior) {
      this.xScale.domain(this.zoomBehavior.rescaleX(this.xScale).domain())
      number = number / this.zoomBehavior.k
    }
    const maxTop = -margin.top / 2
    const max = Math.max(100, initData.length)
    const data = initData.map(({ data, type }, index) => ({ data, index: index / max, type }))
    const redLines = data.filter(({ type }) => type === 'bad')
    const allBlueLines = data.filter(({ type }) => type === 'good')
    const { redBulkLines, blueLines } = TimelineChart.generateBlueLines(allBlueLines, width, number)

    const duration = noDuration ? 0 : 500
    if (!this.notFirstRun) {
      this.notFirstRun = true
      this.xAxis.attr('transform', `translate(0,${  height  })`)
    }
    const td = (s => s.transition().duration(duration))
    td(this.xAxis).attr('transform', `translate(0,${  height  })`).call(d3.axisBottom(xScale))
    td(this.d3svg).attr('height', this.realHeight)
    td(this.axises).style('opacity', this.isToggled ? 0 : 1)
    td(this.yAxis).call(d3.axisLeft(yScale).ticks(5, '%').tickSize(-width))

    const x = ({ data }) => xScale(data)
    const y = ({ index }) => this.isToggled ? 0 : yScale(index)

    this.smalRects.bindData('rect.blue-line', blueLines, { x, y }, duration)
    this.smalRects.bindData('rect.red-line', redLines, { x, y }, duration)
    this.bulkRects.bindData('rect.red-bulk-line', redBulkLines,
      { x, y: maxTop, height: Math.max(height - maxTop, 0) },
      duration
    )
    this.g.bindData('circle.red-bulk-circle', redBulkLines, { cy: maxTop, cx: x }, duration)
    this.g.bindData('text.circle-text', redBulkLines, {
      x, y: maxTop, dy: 4,
      text: ({ value }) => value,
    }, duration)
    this.axises.bindData('rect.white-horizontal-line', data, {
      y,
      x: (item, idx) => idx === 0 ? 0 : x(data[idx - 1]),
      width: (item, idx) => Math.max(0, idx === 0 ? x(item) : x(item) - x(data[idx - 1])),
    }, duration)
  }

  render() {
    const toggledClass = this.isToggled ? 'toggled' : ''
    return <div>
      <svg ref={ svg => this.svg = svg } className={`${toggledClass} timeline-chart`}>
        <rect width="100%" height="100%" className="black-background"/>
        <g ref={ g => this.g = d3.select(g) } fill="white">
          <g ref={ g => this.axises = d3.select(g) }>
            <g ref={ g => this.xAxis = d3.select(g) } className="axis axis--x"/>
            <g ref={ g => this.yAxis = d3.select(g) } className="axis axis--y"/>
          </g>
          <g ref={ g => this.bulkRects = d3.select(g) } transform="translate(-1, 0)"/>
          <g ref={ g => this.smalRects = d3.select(g) } transform="translate(0, -5)"/>
        </g>
        <rect ref={ rect => this.zoomRect = d3.select(rect) } className="zoom"/>
      </svg>
      {!this.isToggled &&
      <button style={{ position: 'absolute', top: '30px' }} onClick={() => this.initData = this.initData.slice(0, 4)}>
        Reset
      </button>}
      <style>{styles}</style>
    </div>
  }
}
