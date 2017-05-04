import React, { Component } from 'react'
import d3, { Transform } from '../../utils/decorated.d3.v4'
import { getNodesEventsDataMap } from '../../utils/nodeEventData'
import { Snow, Desktop, Diskette, Circle } from './IconsGroup'
import './NetworkGrid.scss'
import WindowDependable from '../common/WindowDependable'
import _calculateClusterCoords from './calculateClusterCoords'

import { memoize } from 'lodash'
const calculateClusterCoords = memoize(_calculateClusterCoords)

const NODE_WIDTH = 40

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
    this.rootBlock.select('.nodeTooltip').style('display', 'none')
    this.forceUpdate()
  }

  constructor(props) {
    super(props)
    this.zoom = d3.zoom().scaleExtent([1, 1000]).on('zoom', this.onZoomFactorChanged)
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

  calculateEvents({ nodes }) {
    if ( !nodes.length ) {
      return
    }

    this.cachedClusters = calculateClusterCoords(nodes)
  }

  renderChart() {
    const { nodes, events, currentTime } = this.props
    const { clientWidth: width, clientHeight: height } = this.rootBlock.node()
    const xScale = d3.scaleLinear().domain([0, 1]).range([0, NODE_WIDTH])
    const yScale = d3.scaleLinear().domain([0, 1]).range([0, NODE_WIDTH])

    if ( !nodes.length || !height ) { // we just can calculate anything with 0 height
      return
    }

    // uncomment to see optimal feeling of empty space in action
    // this.cachedClusters = _calculateClusterCoords(nodes, height/width) // memoize eats one arg
    const cachedClusters = this.cachedClusters
    const coordinatedNodes = cachedClusters.coordinatedNodes

    this.svg.attrs({ width, height })
    this.svg.select('.zoomRect').attrs({ width, height })


    const centralizeZoomFactor = Math.min(
      height / (NODE_WIDTH * this.cachedClusters.totalHeight),
      width / (NODE_WIDTH * this.cachedClusters.totalWidth)
    )
    const { k, x, y } = d3.zoomTransform(this.svg.select('.zoomRect').node())
    const shiftX = (width - this.cachedClusters.totalWidth * NODE_WIDTH * centralizeZoomFactor ) * k / 2
    const shiftY = (height - this.cachedClusters.totalHeight * NODE_WIDTH * centralizeZoomFactor ) * k / 2
    this.svg.select('.grid-shifter').attr('transform', `translate(${shiftX}, ${shiftY})`)

    const currentZoom = new Transform(centralizeZoomFactor * k, x, y)
    this.zoom.translateExtent([[0, 0], [width, height]]).extent([[0, 0], [width, height]])


    this.svg.select('.zoom-scale').attr('transform', currentZoom.toString())
    xScale.domain(currentZoom.rescaleX(xScale).domain())
    yScale.domain(currentZoom.rescaleY(yScale).domain())

    const findNodeByMouse = ({ offsetX, offsetY }) => {
      const x = xScale.invert(offsetX - shiftX)
      const y = yScale.invert(offsetY - shiftY)
      return coordinatedNodes.findIndex(({ x: _x, y: _y }) =>
        _x - 0.5 < x && _y < y && _x + 0.5 > x && _y + 0.8 >= y
      )
    }

    this.svg.select('.zoomRect').attrs({
      mousemove: () => {
        const hoveredNodeIndex = findNodeByMouse(d3.event)
        const rect = this.rootBlock.select('.nodeTooltip')

        if ( hoveredNodeIndex !== -1 && this.state.hoveredNodeIndex !== hoveredNodeIndex ) {
          const { x: _x, y: _y } = coordinatedNodes[hoveredNodeIndex]
          rect.styles({
            top: yScale(_y + 0.4) - 80 + shiftY,
            left: xScale(_x + 0.20) + shiftX,
            display: 'block',
          })
          this.setState({ hoveredNodeIndex })
        } else if ( hoveredNodeIndex === -1 ) {
          // rect.style('display', 'none')
        }
      },
      click: () => this.setState({ selectedNodeIndex: findNodeByMouse(d3.event) }),
    })

    const status = getNodesEventsDataMap(events, currentTime)
    const allElements = this.paintAndReturnNodes(this.cachedClusters, status)

    allElements.select('.wrapper').classed('is-selected', (_, index) => index === this.state.selectedNodeIndex)
    allElements.select('.icons')
      .classed('is-icon', () => currentZoom.k < 1.2)
      .classed('is-dot', () => currentZoom.k >= 1.2)
  }

  paintAndReturnNodes({ coordinatedClusters: clusters, coordinatedNodes: nodes }, status) {
    const scale = x => x * NODE_WIDTH

    this.svg.select('.clusters').bindData('rect.cluster', clusters, {
      rx: 3,
      ry: 3,
      transform: ({ x, y }) => `translate(${scale(x)}, ${scale(y)})`,
      width: ({ width }) => scale(width),
      height: ({ height }) => scale(height),
    })

    this.svg.select('.cluster-labels').bindData('text.clusterLabel', clusters, {
      transform: ({ x, y }) => `translate(${scale(x)}, ${scale(y)})`,
      text: ({ cluster }) => cluster,
    })

    const hasStatus = (key, val1, val2) => ({ node: { agentId } }) => {
      return status[agentId] && status[agentId][key] === val1 && (!val2 || status[agentId][key] === val2 )
    }

    const enteredSelection = this.svg.select('.grid').selectAll('.node').data(nodes, ({ node: { _id: id } }) => id)
    enteredSelection.exit().remove()

    return enteredSelection.enter().append('g').attr('class', 'node').html(`<g>
      <rect class="wrapper" stroke-width="0.73" width="17.8" height="32.41"
        rx="4.7" ry="4.7" x="-1.6" y="-1.6"></rect> 
      <rect class="content" rx="3.2" ry="3.2" stroke-width="0.73" width="14.6" height="29.2"></rect>
      <g class="icons" transform="translate(2,1.5) scale(0.35, 0.35)">
        <g class="device">${Desktop}${Circle}</g>
        <g class="data" transform="translate(0, 23)">${Diskette}${Circle}</g>
        <g class="network" transform="translate(0, 45)">${Snow}${Circle}</g>
      </g>
    </g>`).merge(enteredSelection)
      .attrs({ transform: ({ x, y }) => `translate(${scale(x)},${scale(y)})` })
      .classed('is-compromised', hasStatus('state', 'compromised'))
      .classed('is-undiscovered', hasStatus('state', 'undiscovered'))
      .classed('is-discovered', hasStatus('state', 'discovered'))
      .classed('is-data-discovered', hasStatus('data', 'discovered', 'compromised'))
      .classed('is-device-discovered', hasStatus('device', 'discovered', 'compromised'))
      .classed('is-network-discovered', hasStatus('network', 'discovered', 'compromised'))
  }

  render() {
    const { className, nodes } = this.props
    const selectedItem = nodes[this.state.hoveredNodeIndex]
    const { name, agentId } = selectedItem || {}

    return (
      <WindowDependable onDimensionsChanged={() => this.forceUpdate()} refCb={this.refRootBlock} className={className}>
        <div styleName="inner-content">
          <div styleName="node-tooltip" className="nodeTooltip">
            <div styleName="node-information">
              <div>Name: {name}</div>
              <div>Node ID: {agentId}</div>
            </div>
            <div>
              <svg width="100" height="50">
                <g stroke="#7c7c7c">
                  <line x1="0" y1="50" x2="70" y2="0" strokeWidth="1"/>
                  <line x1="70" y1="0" x2="100" y2="0" strokeWidth="2.5"/>
                </g>
              </svg>
            </div>
          </div>
          <div styleName="grid-overflow-wrapper">
            <svg className="svg">
              <g className="grid-shifter">
                <g className="zoom-scale">
                  <g className="clusters" fill="none" stroke="#efefef" strokeWidth="1"/>
                  <g className="cluster-labels" fill="black" fontSize="33" fontFamily="sans-serif"
                     transform="translate(0, -5)"/>
                  <g className="grid"/>
                </g>
              </g>
              <rect className="zoomRect" fill="#e5e5e5" opacity="0" cursor="move"/>
            </svg>
          </div>
        </div>
      </WindowDependable>
    )
  }
}
