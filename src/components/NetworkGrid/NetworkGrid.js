import React, { Component } from 'react'
import * as d3 from 'd3'
import 'common/d3.shims'
import { Snow, Desktop, Diskette } from './IconsGroup'

export default class NetworkGrid extends Component {
  setSvg = svg => {
    this.svg = d3.select(svg);
    this.svg.select('.zoomRect').call(this.zoom)
  }

  onZoomFactorChanged = () => {
    this.currentZoom = d3.zoomTransform(this.svg.select('.zoomRect').node())
    this.forceUpdate()
  }

  constructor(props) {
    super(props)
    this.zoom = d3.zoom().scaleExtent([0.001, 1000]).on('zoom', this.onZoomFactorChanged)
    this.currentZoom = d3.zoomIdentity
    this.componentWillReceiveProps(props)
  }

  shouldComponentUpdate({ currentTime, events, nodes }) {
    const props = this.props
    return props.currentTime !== currentTime
      || props.events !== events
      || props.nodes !== nodes
  }

  componentWillReceiveProps({ events, nodes, currentTime }) {
    const gridSize = this.gridSize = Math.ceil(Math.sqrt(nodes.length))
    this.nodeColors = nodes.reduce((map, { agentId }) => {
      map[agentId] = 'white'
      return map
    }, {})
    events
      .filter(({ date }) => currentTime > date)
      .forEach(item => {
        const { compromized, nodeId } = item
        const red = 'rgb(242, 30, 39)'
        const blue = 'rgb(70, 96, 223)'
        if ( this.nodeColors[nodeId] !== red ) {
          this.nodeColors[nodeId] = compromized ? red : blue
        }
      })

    let count = 0
    let lines = [[]]

    nodes.forEach(item => {
      if ( count === Math.round(gridSize * 0.5) ) {
        lines.push([])
        count = 0
      }
      lines[lines.length - 1].push(item)
      count += 1
    })

    this.lines = lines
    const data = this.data = []
    lines.forEach((items, x) => {
      items.forEach((item, y) => {
        data.push({ x, y, item })
      })
    })
    this.data = data
  }

  componentDidUpdate() {
    this.setClickAction();
  }

  componentDidMount() {
    this.setClickAction()
  }

  setClickAction() {
    let size = this.lines.length

    let width = 800
    let height = 400

    this.svg.attrs({ width, height })
    this.svg.select('.zoomRect').attrs({ width, height })

    const w = 40
    const h = w * 2

    this.zoom.translateExtent([[0, 0], [width, height]]).extent([[0, 0], [width, height]])
    const xScale = d3.scaleLinear().domain([0, size]).range([0, this.gridSize * w * 2])
    const yScale = d3.scaleLinear().domain([0, size]).range([0, h * size * 0.9])
    xScale.domain(this.currentZoom.rescaleX(xScale).domain())
    yScale.domain(this.currentZoom.rescaleY(yScale).domain())
    const k = this.currentZoom.k

    const FILLED_SPACE = 0.7
    const MAX_STROKE = 2
    const strokeWidth = Math.min(MAX_STROKE, Math.max(MAX_STROKE * k, MAX_STROKE / 4))
    const rx = strokeWidth * 3
    const simpleRectAttrs = {
      rx,
      ry: rx,
      strokeWidth,
      stroke: 'black',
      height: h * FILLED_SPACE * k,
      width: w * FILLED_SPACE * k,
      cursor: 'pointer',
      click: ({ item }) => console.log(item),
      fill: ({ item: { agentId } }) => this.nodeColors[agentId]
    }

    const enteredSelection = this.svg.select('.grid').selectAll('.singleRectGroup')
      .data(this.data, ({ item: { _id: id } }) => id)
    enteredSelection.exit().remove()

    const mergedSelection = enteredSelection.enter().append('g')
      .attr('class', 'singleRectGroup').html(({ value }) => `<g>
        <rect class="simpleRect"></rect>
        <g class="iconsGroup">
          <g>
            <g transform="translate(4,3)  scale(0.7, 0.7)">
              ${Desktop} <circle cx="15" cy="13" r="8"></circle>
              <g transform="translate(0, 23)">
                ${Diskette}<circle cx="15" cy="13" r="8"></circle>
              </g>
              <g transform="translate(0, 45)">
                ${Snow}<circle cx="15" cy="13" r="8"></circle>
              </g>
            </g>
          </g>
        </g>
      </g>`)

    const allElements = mergedSelection.merge(enteredSelection)
    allElements.attrs({ transform: ({ x, y }) => `translate(${xScale(x)},${yScale(y)})` })
    allElements.select('.simpleRect').attrs(simpleRectAttrs);

    const iconsGroup = allElements.select('.iconsGroup');
    iconsGroup.attrs({
      transform: `scale(${k}, ${k})`,
      fill: ({ item: { agentId } }) => this.nodeColors[agentId] === 'white' ? 'black' : 'white',
    });
    const isTooSmall = k < 1.4
    const selectAll = iconsGroup.selectAll('path');
    selectAll.attrs({ visibility: !isTooSmall ? 'visible' : 'hidden' })
    iconsGroup.selectAll('circle').attrs({ visibility: isTooSmall ? 'visible' : 'hidden' })
  }

  render() {
    return <div>
      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'sans-serif', padding: '0 5px' }}>
        {this.props.children}
      </div>
      <svg ref={this.setSvg}>
        <rect className="zoomRect" fill="black" opacity={0} cursor="move"/>
        <g className="grid"/>
      </svg>
    </div>
  }
}
