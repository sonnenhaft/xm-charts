import React, { Component } from 'react'
import * as d3 from 'd3'
import 'common/d3.shims'
import { Snow, Desktop, Diskette } from './IconsGroup'
import './NetworkGrid.scss'
import { Transform } from 'd3-zoom/src/transform'

export default class NetworkGrid extends Component {
  refRootBlock = rootBlock => {
    this.rootBlock = d3.select(rootBlock)
    this.svg = this.rootBlock.select('.svg')
    this.svg.select('.zoomRect').call(this.zoom)
  }

  onZoomFactorChanged = () => {
    this.currentZoom = d3.zoomTransform(this.svg.select('.zoomRect').node())
    this.forceUpdate()
  }

  constructor(props) {
    super(props)
    this.zoom = d3.zoom().scaleExtent([1, 1000]).on('zoom', this.onZoomFactorChanged)
    this.currentZoom = d3.zoomIdentity
    this.heightZoom = new Transform(1, 0, 0)
    this.componentWillReceiveProps(props)
    this.state = {
      selectedNodeIndex: null,
    }
  }

  shouldComponentUpdate({ currentTime, events, nodes }, { selectedNodeIndex }) {
    const { props, state } = this
    return props.currentTime !== currentTime
      || props.events !== events
      || props.nodes !== nodes
      || state.selectedNodeIndex !== selectedNodeIndex
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
        data.push({ x, y, item, index: nodes.indexOf(item) })
      })
    })
    this.data = data
  }

  componentDidUpdate() {
    this.renderChart()
  }

  componentDidMount() {
    this.renderChart()
  }

  renderChart() {
    let size = this.lines.length

    let width = this.rootBlock.node().clientWidth
    let height = 150

    this.svg.attrs({ width, height })
    this.svg.select('.zoomRect').attrs({ width, height })

    const w = 40
    const h = w * 2

    this.zoom.translateExtent([[0, 0], [width, height]]).extent([[0, 0], [width, height]])
    const xScale = d3.scaleLinear().domain([0, size]).range([0, this.gridSize * w * 2])
    const yScale = d3.scaleLinear().domain([0, size]).range([0, h * size * 0.9])
    xScale.domain(this.currentZoom.rescaleX(xScale).domain())
    yScale.domain(this.currentZoom.rescaleY(yScale).domain())

    let kk = Math.min(height / (h * this.gridSize) * 2, (width - 10) / (w * this.gridSize) / 2)
    this.heightZoom.k = kk
    xScale.domain(this.heightZoom.rescaleX(xScale).domain())
    yScale.domain(this.heightZoom.rescaleY(yScale).domain())

    const k = this.currentZoom.k * kk
    const FILLED_SPACE = 0.7
    const MAX_STROKE = 2
    const strokeWidth = Math.min(MAX_STROKE, Math.max(MAX_STROKE * k, MAX_STROKE / 4))
    const offset = strokeWidth * 3 * 1.1
    const rx = offset
    const hh = h * FILLED_SPACE * k
    const ww = w * FILLED_SPACE * k
    const simpleRectAttrs = {
      rx,
      ry: rx,
      strokeWidth,
      stroke: 'black',
      height: hh,
      width: ww,
    }

    const enteredSelection = this.svg.select('.grid').selectAll('.singleRectGroup')
      .data(this.data, ({ item: { _id: id } }) => id)
    enteredSelection.exit().remove()

    const mergedSelection = enteredSelection.enter().append('g')
      .attr('class', 'singleRectGroup').html(() => `<g>
        <rect class="wrapperRect"></rect>
        <rect class="simpleRect"></rect>
        <g class="iconsGroup">
          <g>
            <g transform="translate(4,3)  scale(0.7, 0.7)">
              ${Desktop}<circle cx="15" cy="13" r="8"></circle>
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
    allElements.attrs({
      transform: ({ x, y }) => `translate(${xScale(x)},${yScale(y)})`,
      cursor: 'pointer',
      click: ({ index }) => {
        const { clientX: left, clientY: top } = d3.event

        const rect = this.rootBlock.select('.gridTooltip')
        rect.style('top', top - 50).style('left', left).style('display', 'block')
        this.setState({ selectedNodeIndex: index })
      },
      fill: ({ item: { agentId } }) => this.nodeColors[agentId],
    })

    allElements.select('.simpleRect').attrs(simpleRectAttrs)
    allElements.select('.wrapperRect').attrs({
      ...simpleRectAttrs,
      fill: 'white',
      width: ww + offset,
      height: hh + offset,
      transform: `translate(${-offset / 2}, ${-offset / 2})`,
      stroke: ({ index }) => index === this.state.selectedNodeIndex ? 'black' : 'none',
    })

    const iconsGroup = allElements.select('.iconsGroup')
    iconsGroup.attrs({
      transform: `scale(${k}, ${k})`,
      fill: ({ item: { agentId } }) => this.nodeColors[agentId] === 'white' ? 'black' : 'white',
    })
    iconsGroup.selectAll('path').attrs({ visibility: k >= 1.2 ? 'visible' : 'hidden' })
    iconsGroup.selectAll('circle').attrs({ visibility: k < 1.2 ? 'visible' : 'hidden' })
  }

  render() {
    const selectedItem = this.props.nodes[this.state.selectedNodeIndex]
    const { name } = selectedItem || {}

    return <div ref={this.refRootBlock}>
      <div styleName="grid-tooltip" className="gridTooltip">
        <div styleName="device-name">{name}</div>
        <div>
          <svg width="100" height="50">
            <g stroke="black">
              <line x1="0" y1="50" x2="70" y2="0" strokeWidth="1" />
              <line x1="70" y1="0" x2="100" y2="0" strokeWidth="2.5" />
            </g>
          </svg>
        </div>
      </div>
      <div style={{ fontWeight: 'bold', textTransform: 'uppercase', fontFamily: 'sans-serif', padding: '0 5px' }}>
        {this.props.children}
      </div>
      <svg className="svg">
        <rect className="zoomRect" fill="#e5e5e5" cursor="move" />
        <g transform="translate(10, 10)">
          <g className="grid" />
        </g>
      </svg>
    </div>
  }
}
