import React, { Component } from 'react'
import d3 from '../../utils/d3.shims'
import { Snow, Desktop, Diskette } from './IconsGroup'
import './NetworkGrid.scss'
import { Transform } from 'd3-zoom/src/transform'
import WindowDependable from '../common/WindowDependable'
const calculateClusterCoords = require('./calculateClusterCoords')

const CHART_PADDING = 0
export default class NetworkGrid extends Component {
  refRootBlock = rootBlock => {
    this.rootBlock = d3.select(rootBlock)
    this.svg = this.rootBlock.select('.svg')
    this.svg.select('.zoomRect').call(this.zoom)
    this.forceUpdate()
  }

  onZoomFactorChanged = () => {
    this.currentZoom = d3.zoomTransform(this.svg.select('.zoomRect').node())
    this.forceUpdate()
  }

  constructor(props) {
    super(props)
    this.zoom = d3.zoom().scaleExtent([0.01, 1000]).on('zoom', this.onZoomFactorChanged)
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

    this.cachedClusters = calculateClusterCoords(nodes)
  }

  componentDidUpdate() {
    this.renderChart()
  }

  componentDidMount() {
    this.renderChart()
  }

  renderChart() {
    const refNode = this.rootBlock.node()
    const width = refNode.clientWidth
    const height = refNode.clientHeight
    const cachedClusters = this.cachedClusters

    this.svg.attrs({ width, height })
    this.svg.select('.zoomRect').attrs({ width, height })

    const nodeWidth = 40
    const nodeHeight = nodeWidth

    this.zoom.translateExtent([[0, 0], [width, height]]).extent([[0, 0], [width, height]])

    const xScale = d3.scaleLinear().domain([0, 1]).range([0, nodeWidth])
    const yScale = d3.scaleLinear().domain([0, 1]).range([0, nodeHeight])
    xScale.domain(this.currentZoom.rescaleX(xScale).domain())
    yScale.domain(this.currentZoom.rescaleY(yScale).domain())

    let kk = Math.min(height / (nodeHeight * cachedClusters.totalHeight), (width) / (nodeWidth * cachedClusters.totalWidth))
    this.heightZoom.k = kk

    xScale.domain(this.heightZoom.rescaleX(xScale).domain())
    yScale.domain(this.heightZoom.rescaleY(yScale).domain())

    const k = this.currentZoom.k * kk
    const FILLED_SPACE = 0.8
    const MAX_STROKE = 2
    const strokeWidth = Math.min(MAX_STROKE, Math.max(MAX_STROKE * k, MAX_STROKE / 10))
    const offset = strokeWidth * 3 * 1.1
    const rx = offset
    const scaledNodeHeight = nodeHeight * FILLED_SPACE * k

    const simpleRectAttrs = {
      rx,
      ry: rx,
      strokeWidth,
      stroke: 'black',
      height: scaledNodeHeight,
      width: scaledNodeHeight / 2,
    }

    this.svg.select('.clusters').bindData('rect.clusters', cachedClusters.coordinatedClusters, {
      width: ({ width }) => nodeWidth * k * width,
      height: ({ height }) => nodeWidth * k * height,
      transform: ({ x, y }) => `translate(${xScale(x)}, ${yScale(y)})`,
      'stroke-width': strokeWidth,
    },)

    const enteredSelection = this.svg.select('.grid').selectAll('.singleRectGroup')
      .data(cachedClusters.coordinatedNodes, ({ node: { _id: id } }) => id)

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
      transform: ({ x, y }) => `translate(${xScale(x + 0.5 - (1 - FILLED_SPACE))},${yScale(y + (1 - FILLED_SPACE) / 2)})`,
      cursor: 'pointer',
      click: ({ index }) => {
        const { clientX: left, clientY: top } = d3.event

        const rect = this.rootBlock.select('.gridTooltip')
        rect.style('top', top - 50).style('left', left).style('display', 'block')
        this.setState({ selectedNodeIndex: index })
      },
      fill: ({ node: { agentId } }) => this.nodeColors[agentId],
    })

    allElements.select('.simpleRect').attrs(simpleRectAttrs)
    allElements.select('.wrapperRect').attrs({
      ...simpleRectAttrs,
      fill: 'white',
      width: scaledNodeHeight / 2 + offset,
      height: scaledNodeHeight + offset,
      transform: `translate(${-offset / 2}, ${-offset / 2})`,
      stroke: ({ index }) => index === this.state.selectedNodeIndex ? 'black' : 'none',
    })

    const iconsGroup = allElements.select('.iconsGroup')
    iconsGroup.attrs({
      transform: `scale(${k / 2}, ${k / 2})`,
      fill: ({ node: { agentId } }) => this.nodeColors[agentId] === 'white' ? 'black' : 'white',
    })
    iconsGroup.selectAll('path').attrs({ visibility: k >= 1.2 ? 'visible' : 'hidden' })
    iconsGroup.selectAll('circle').attrs({ visibility: k < 1.2 ? 'visible' : 'hidden' })
  }

  render() {
    const { className, nodes } = this.props
    const selectedItem = nodes[this.state.selectedNodeIndex]
    const { name } = selectedItem || {}

    return (
      <WindowDependable onDimensionsChanged={() => this.forceUpdate()} refCb={this.refRootBlock} className={className}>
        <div styleName="grid-tooltip" className="gridTooltip">
          <div styleName="device-name">{name}</div>
          <div>
            <svg width="100" height="50">
              <g stroke="black">
                <line x1="0" y1="50" x2="70" y2="0" strokeWidth="1"/>
                <line x1="70" y1="0" x2="100" y2="0" strokeWidth="2.5"/>
              </g>
            </svg>
          </div>
        </div>
        <svg className="svg">
          <g transform={`translate(${CHART_PADDING}, ${CHART_PADDING})`}>
            <g className="clusters" fill="#e5e5e5" stroke="black"/>
            <g className="grid"/>
          </g>
          <rect className="zoomRect" fill="#e5e5e5" opacity={0} cursor="move"/>
        </svg>
      </WindowDependable>
    )
  }
}
