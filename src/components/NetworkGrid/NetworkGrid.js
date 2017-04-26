import React, { Component } from 'react'
import * as d3 from 'd3'
import WindowDependable from 'common/WindowDependable'
import ZoomRect from 'common/ZoomRect'
import { zoomTransform } from 'd3-zoom'

const LINES_RATIO = 2

export default class NetworkGrid extends Component {
  constructor(props) {
    super(props)
    this.state = { zoomFactor: 1, zoomPosition: 0, y: 0 }
    this.zoom = new zoomTransform(1, 0, 0)
    this.linedEvents = []
    this.gridSize = 1
    this.d3rootNode = null
    this.xScale = d3.scaleLinear()
    this.yScale = d3.scaleLinear()
  }

  componentWillUpdate(props) { this.prepareData(props) }

  componentDidUpdate() { this.renderGrid() }

  onZoomFactorChangedAndMoved = ({ zoomFactor, zoomPosition, y }) => {
    Object.assign(this.zoom, { k: zoomFactor, x: zoomPosition, y })
    this.setState({ zoomFactor, zoomPosition, y })
  }

  prepareData(props) {
    const { events, nodes, currentTime } = props
    const gridSize = Math.ceil(Math.sqrt(nodes.length))
    this.gridSize = gridSize
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
      if ( count === Math.round(gridSize * 1.5) ) {
        lines.push([])
        count = 0
      }
      lines[lines.length - 1].push(item)
      count += 1
    })

    const linedEvents = []
    lines.forEach((line, x) => {
      line.forEach((event, y) => {
        linedEvents.push({ x, y, event })
      })
    })

    this.linedEvents = linedEvents

    const height = 400
    const { clientWidth: width } = this.d3rootNode.node()
    const xScale = this.xScale.domain([0, this.gridSize]).range([0, width])
    const yScale = this.yScale.domain([0, this.gridSize]).range([height, 0])
    xScale.domain(this.zoom.rescaleX(xScale).domain())
    yScale.domain(this.zoom.rescaleY(yScale).domain())
  }

  setD3Node = node => {
    this.d3rootNode = d3.select(node)
    this.forceUpdate()
  }

  onDimensionsChanged() { this.forceUpdate() }

  renderGrid() {
    const height = 400
    const xScale = this.xScale
    const yScale = this.yScale

    const { clientWidth: width } = this.d3rootNode.node()
    this.d3rootNode.selectAll('svg').attrs({ width, height })
    const w = width / this.gridSize
    const h = w * LINES_RATIO

    const k = this.zoom.k

    const FILLED_SPACE = 0.8
    const MAX_STROKE = 2
    const strokeWidth = Math.min(MAX_STROKE, Math.max(MAX_STROKE * k, MAX_STROKE / 4))
    const rx = strokeWidth * 3

    const attrs = {
      rx,
      ry: rx,
      strokeWidth,
      stroke: 'black',

      fill: 'grey',

      height: h * FILLED_SPACE * k,
      width: xScale(1),
      transform: ({ x, y }) => `translate(${xScale(x)},${yScale(y)})`,
    }

    let data = this.linedEvents
    this.d3rootNode.select('.rects').bindData('rect.networkRect', data, attrs)
  }

  render() {
    const { zoomFactor, zoomPosition } = this.state
    const { xScale, yScale, onZoomFactorChangedAndMoved } = this

    return <div style={{ width: '100%' }}>
      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'sans-serif', padding: '0 5px' }}>
        {this.props.children}
      </div>
      <WindowDependable refCb={this.setD3Node} style={{ position: 'relative', width: '100%' }} onDimensionsChanged={this.onDimensionsChanged}>
        <svg>
          <g className="rects" />
          {/*   {this.lines.map((data, xCoord) => {
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
           })}*/}
          <ZoomRect {...{
            xScale, yScale,
            zoomFactor, zoomPosition, onZoomFactorChangedAndMoved,
          }} />
        </svg>
      </WindowDependable>
    </div>
  }
}
