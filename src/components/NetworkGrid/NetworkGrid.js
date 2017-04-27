import React, { Component } from 'react'
import * as d3 from 'd3'
import IconsGroup from './IconsGroup'

export default class NetworkGrid extends Component {
  setSvg = svg => this.svg = svg;
  setZoomRect = zoomRect => {
    this.zoomRect = zoomRect
    d3.select(zoomRect).call(this.zoom)
  }

  onZoomFactorChanged = () => {
    this.currentZoom = d3.zoomTransform(this.zoomRect)
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
  }

  render() {
    let size = this.lines.length

    let width = 800
    let height = 400

    const w = 40
    const h = w * 2

    this.zoom.translateExtent([[0, 0], [width, height]]).extent([[0, 0], [width, height]])
    const xScale = d3.scaleLinear().domain([0, size]).range([0, this.gridSize * w * 2])
    const yScale = d3.scaleLinear().domain([0, size]).range([0, h * size])
    xScale.domain(this.currentZoom.rescaleX(xScale).domain())
    yScale.domain(this.currentZoom.rescaleY(yScale).domain())
    const k = this.currentZoom.k

    const FILLED_SPACE = 0.8
    const MAX_STROKE = 2
    const strokeWidth = Math.min(MAX_STROKE, Math.max(MAX_STROKE * k, MAX_STROKE / 4))
    const rx = strokeWidth * 3
    const attrs = {
      rx,
      ry: rx,
      strokeWidth,
      stroke: 'black',
      height: h * FILLED_SPACE * k,
      width: w * FILLED_SPACE * k,
    }

    return <div>
      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'sans-serif', padding: '0 5px' }}>
        {this.props.children}
      </div>
      <svg {...{ width, height }} ref={this.setSvg}>
        {this.lines.map((data, xCoord) => {
          return <g key={xCoord}>
            {data.map(({ agentId }, yCoord) => {
              const fill = this.nodeColors[agentId]
              const isWhite = fill === 'white'
              return <g key={`${xCoord} ${yCoord}`}
                        transform={`translate(${xScale(xCoord)},${yScale(yCoord)})`}>
                <rect {...{ ...attrs, fill }} />
                <IconsGroup {...{ k, fill: isWhite ? 'black' : 'white' }} />
              </g>
            })}
          </g>
        })}
        <rect className="zoomRect" fill="black" opacity={0} cursor="move"
              {...{ width, height }} ref={this.setZoomRect} />
      </svg>
    </div>
  }
}
