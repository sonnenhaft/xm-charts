import React, {Component} from 'react'
import * as d3 from 'd3'

export default class NetworkGrid extends Component {
  setSvg = svg => this.svg = svg;
  setZoomRect = zoomRect => {
    this.zoomRect = zoomRect
    d3.select(zoomRect).call(this.zoom)
  }

  onZoomChanged =() => {
    this.currentZoom = d3.zoomTransform(this.zoomRect)
    this.forceUpdate()
  }

  constructor(props) {
    super(props)
    this.zoom = d3.zoom().scaleExtent([1, 1000 * 1000 * 1000]).on('zoom', this.onZoomChanged)
    this.componentWillReceiveProps()
  }

  static defaultProps = {
    currentTime: 0,
  }

  componentWillReceiveProps() {
    const {chartData: {events, nodes}, currentTime} = this.props
    const gridSize = Math.ceil(Math.sqrt(nodes.length))
    this.nodeColors = nodes.reduce((map, {agentId}) => {
      map[agentId] = 'white'
      return map
    }, {})
    this.currentTime = currentTime
    events
      .filter(({date}) => this.currentTime > date)
      .forEach(item => {
        const {compromized, nodeId} = item
        if (this.nodeColors[nodeId] !== 'red') {
          this.nodeColors[nodeId] = compromized ? 'red' : 'blue'
        }
      })

    this.lines = nodes.reduce((array, item, index) => {
      array[(index % gridSize)].push(item)
      return array
    }, d3.range(0, gridSize).map(() => []))
  }

  render() {
    let size = this.lines.length

    let width = 200
    let height = 200

    const WIDTH_SIZE = 0.5
    const HEIGHT_SIZE = 0.8

    const w = width * WIDTH_SIZE / size
    const h = height * HEIGHT_SIZE / size
    const wOffset = width * (1 - WIDTH_SIZE) / size / 2
    const hOffset = height * (1 - HEIGHT_SIZE) / size / 2

    this.zoom.translateExtent([[0, 0], [width, height]]).extent([[0, 0], [width, height]])
    const xScale = d3.scaleLinear().domain([0, size]).range([0, height - hOffset])
    const yScale = d3.scaleLinear().domain([0, size]).range([0, width - wOffset])
    if (this.currentZoom) {
      xScale.domain(this.currentZoom.rescaleX(xScale).domain())
      yScale.domain(this.currentZoom.rescaleY(yScale).domain())
    }

    return <svg {...{width, height}} ref={this.setSvg}>
      {this.lines.map((data, yCoord) => {
        return <g key={yCoord}>
          {data.map(({agentId}, xCoord) => {
            let nodeColor = this.nodeColors[agentId]
            return <rect {...{
              stroke: 'black',
              strokeWidth: 1,
              rx: 1,
              ry: 1,
              height: h,
              width: w,
              fill: nodeColor,
              x: xScale(yCoord) + wOffset,
              y: yScale(xCoord) + wOffset,
              key: `${xCoord} ${yCoord}`,
            }} />
          })}
        </g>
      })}
      <rect className={'zoomRect'} fill="black" opacity={0}
            {...{width, height}} ref={this.setZoomRect} />
    </svg>
  }
}