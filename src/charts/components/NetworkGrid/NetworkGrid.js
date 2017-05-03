import React, { Component } from 'react'
import d3, {Transform} from '../../utils/decorated.d3.v4'
import {getNodesEventsDataMap} from '../../utils/nodeEventData'
import { Snow, Desktop, Diskette, Circle } from './IconsGroup'
import './NetworkGrid.scss'
import WindowDependable from '../common/WindowDependable'
import _calculateClusterCoords from './calculateClusterCoords'

import {memoize} from 'lodash'
const calculateClusterCoords = memoize(_calculateClusterCoords)

const CHART_PADDING = 0

const NodeHtml = (
  `<g>
    <rect 
      class="wrapper"
      rx="6.4"
      ry="6.4"
      stroke-width="1"
      width="24.4"
      height="44.4"
    ></rect>
    <rect
      class="content"
      rx="4.4"
      ry="4.4"
      stroke-width="1"
      width="20"
      height="40"
    >
    </rect>
    <g class="icons">
      <g>
        <g transform="translate(4,3) scale(0.7, 0.7)">
          <g class="device">
          ${Desktop}${Circle}
          </g>
          <g class="data" transform="translate(0, 23)">
            ${Diskette}${Circle}
          </g>
          <g class="network" transform="translate(0, 45)">
            ${Snow}${Circle}
          </g>
        </g>
      </g>
    </g>
  </g>`
)

export default class NetworkGrid extends Component {
  state = {
    hoveredNodeIndex: null,
    selectedNodeIndex: null,
  }

  refRootBlock = rootBlock => {
    this.rootBlock = d3.select(rootBlock)
    this.svg = this.rootBlock.select('.svg')
    this.svg.select('.zoomRect').call(this.zoom)

    setTimeout(() => {
      // think that better to remember height in here and on window changed
      this.forceUpdate()
    }, 800)
  }

  onZoomFactorChanged = () => {
    this.rootBlock.select('.gridTooltip').style('display', 'none')
    this.currentZoom = d3.zoomTransform(this.svg.select('.zoomRect').node())
    this.forceUpdate()
  }

  constructor(props) {
    super(props)
    this.zoom = d3.zoom().scaleExtent([1, 1000]).on('zoom', this.onZoomFactorChanged)
    this.currentZoom = d3.zoomIdentity
    this.heightZoom = new Transform(1, 0, 0)
  }

  shouldComponentUpdate({ currentTime, events, nodes }, { hoveredNodeIndex, selectedNodeIndex }) {
    const { props, state } = this
    return props.currentTime !== currentTime
      || props.events !== events
      || props.nodes !== nodes
      || state.hoveredNodeIndex !== hoveredNodeIndex
      || state.selectedNodeIndex !== selectedNodeIndex
  }

  componentWillReceiveProps(nextProps) {
    this.calculateEvents(nextProps)
  }

  componentDidUpdate() {
    this.renderChart()
  }

  componentDidMount() {
    this.calculateEvents(this.props)
  }

  calculateEvents({nodes}) {
    if (!nodes.length) {
      return
    }

    this.cachedClusters = calculateClusterCoords(nodes)
  }

  renderChart() {
    const {nodes, events, currentTime} = this.props
    const status = getNodesEventsDataMap(events, currentTime)
    const {clientWidth: width, clientHeight: height} = this.rootBlock.node()
    const singleSquareWidth = 40
    const xScale = d3.scaleLinear().domain([0, 1]).range([0, singleSquareWidth])
    const yScale = d3.scaleLinear().domain([0, 1]).range([0, singleSquareWidth])

    if ( !nodes.length || !height ) { // we just can calculate anything with 0 height
      return
    }

    // uncomment to see optimal feeling of empty space in action
    // this.cachedClusters = _calculateClusterCoords(nodes, height/width) // memoize eats one arg
    const cachedClusters = this.cachedClusters

    this.svg.attrs({ width, height })
    this.svg.select('.zoomRect').attrs({width, height})
    this.zoom.translateExtent([[0, 0], [width, height]]).extent([[0, 0], [width, height]])
    xScale.domain(this.currentZoom.rescaleX(xScale).domain())
    yScale.domain(this.currentZoom.rescaleY(yScale).domain())

    const gee = ({offsetX, offsetY}) => {
      const x = xScale.invert(offsetX)
      const y = yScale.invert(offsetY)
      return cachedClusters.coordinatedNodes.findIndex(({ x: _x, y: _y }) =>
        _x - 0.5 < x && _y < y && _x + 0.5 > x && _y + 0.8 >= y
      )
    }

    this.svg.select('.zoomRect').on('mousemove', () => {
      const hoveredNodeIndex = gee(d3.event)
      const rect = this.rootBlock.select('.gridTooltip')

      if (hoveredNodeIndex !== -1 && this.state.hoveredNodeIndex !== hoveredNodeIndex) {
        const {x: _x, y: _y} = cachedClusters.coordinatedNodes[hoveredNodeIndex]
        rect.style('top', yScale(_y + 0.4) + 37).style('left', xScale(_x + 0.20)).style('display', 'block')
        this.setState({hoveredNodeIndex})
      } else if (hoveredNodeIndex === -1) {
        rect.style('display', 'none')
      }
    }).on('click', () => {
      const selectedNodeIndex = gee(d3.event)
      this.setState({selectedNodeIndex})
    })

    let kk = Math.min(height / (singleSquareWidth * cachedClusters.totalHeight), (width) / (singleSquareWidth * cachedClusters.totalWidth))
    this.heightZoom.k = kk

    xScale.domain(this.heightZoom.rescaleX(xScale).domain())
    yScale.domain(this.heightZoom.rescaleY(yScale).domain())

    const k = this.currentZoom.k * kk
    const FILLED_SPACE = 0.73
    const offset = 4.4

    const clasters = cachedClusters.coordinatedClusters
    this.svg.select('.clusters').bindData('rect.cluster', clasters, {
      rx: 3,
      ry: 3,
      transform: ({x, y}) => `translate(${xScale(x)}, ${yScale(y)})`,
      width: ({width}) => Math.abs(xScale(width) - xScale(0)),
      height: ({height}) =>  Math.abs(xScale(height) - xScale(0)),
    })

    this.svg.select('.cluster-labels').bindData('text.clusterLabel', clasters, {
      transform: ({x, y}) => `translate(${xScale(x)}, ${yScale(y)}) scale(${k}, ${k})`,
      text: ({cluster}) => cluster,
    })

    const enteredSelection = this.svg.select('.grid').selectAll('.node')
      .data(cachedClusters.coordinatedNodes, ({ node: { _id: id } }) => id)

    enteredSelection.exit().remove()

    const mergedSelection = enteredSelection
                              .enter()
                              .append('g')
                              .attr('class', 'node')
                              .html(() => NodeHtml)

    const allElements = mergedSelection.merge(enteredSelection)

    allElements
      .attrs({
        transform: ({x, y}) => `translate(${xScale(x)},${yScale(y)})`,
      })
      .classed('is-compromised', ({node: {agentId}}) => status[agentId] && status[agentId].state === 'compromised')
      .classed('is-undiscovered', ({node: {agentId}}) => status[agentId] && status[agentId].state === 'undiscovered')
      .classed('is-discovered', ({node: {agentId}}) => status[agentId] && status[agentId].state === 'discovered')
      .classed('is-data-discovered', ({node: {agentId}}) => status[agentId] && status[agentId].data === 'discovered')
      .classed('is-data-discovered', ({node: {agentId}}) => status[agentId] && status[agentId].data === 'compromised')
      .classed('is-device-discovered', ({node: {agentId}}) => status[agentId] && status[agentId].device === 'discovered')
      .classed('is-device-discovered', ({node: {agentId}}) => status[agentId] && status[agentId].device === 'compromised')
      .classed('is-network-discovered', ({node: {agentId}}) => status[agentId] && status[agentId].network === 'discovered')
      .classed('is-network-discovered', ({node: {agentId}}) => status[agentId] && status[agentId].network === 'compromised')

    allElements.select('.content').attrs({
      transform: `scale(${FILLED_SPACE * k})`,
    })

    allElements.select('.wrapper')
      .classed('is-selected', (_, index) => index === this.state.selectedNodeIndex)
      .attrs({
        transform: `translate(${-offset * k * FILLED_SPACE / 2}, ${-offset * k * FILLED_SPACE/ 2}) scale(${FILLED_SPACE * k})`,
      })

    allElements.select('.icons')
      .attrs({transform: `scale(${k / 2}, ${k / 2})`})
      .classed('is-icon', () => k < 1.2)
      .classed('is-dot', () => k >= 1.2)
  }

  render() {
    const {className, nodes} = this.props
    const selectedItem = nodes[this.state.hoveredNodeIndex]
    const {name, agentId} = selectedItem || {}

    return (
      <WindowDependable onDimensionsChanged={() => this.forceUpdate()} refCb={this.refRootBlock} className={className}>
        <div styleName="grid-tooltip" className="gridTooltip">
          <div styleName="device-name">
            <div>Name: {name}</div>
            <div>Node ID: {agentId}</div>
          </div>
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
            <g className="clusters" fill="none" stroke="#efefef" strokeWidth="1"/>
            <g className="cluster-labels" fill="black" fontSize="33" fontFamily="sans-serif"
               transform="translate(0, -5)"/>
            <g className="grid"/>
          </g>
          {/*Please, even if I use % in here, don't rely on % in d3 much*/}
          <rect className="zoomRect" fill="#e5e5e5" opacity="0" cursor="move"/>
        </svg>
      </WindowDependable>
    )
  }
}
