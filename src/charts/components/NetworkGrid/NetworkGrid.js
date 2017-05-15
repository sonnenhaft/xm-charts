import React, { Component, PropTypes as P } from 'react'
import d3, { Transform } from 'charts/utils/decorated.d3.v4'
import { getNodesEventsDataMap } from '../../utils/nodeEventData'
import { Circle, Desktop, Diskette, Snow } from './IconsGroup'
import './NetworkGrid.scss'
import WindowDependable from '../common/WindowDependable'
import _calculateClusterCoords, { getArrows } from './calculateClusterCoords'

import { memoize } from 'lodash'
const calculateClusterCoords = memoize(_calculateClusterCoords)

const NODE_WIDTH = 40
const ZOOM_CHANGE = 1.2

export default class NetworkGrid extends Component {
  state = {
    hoveredNodeIndex: null,
  }

  static propTypes = {
    events: P.array,
    nodes: P.array,
    currentTime: P.number,
    selectedNodeIndex: P.number,
    onSelectedNodeIndexChanged: P.func,
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

  shouldComponentUpdate({ currentTime, events, nodes, selectedNodeIndex }, { hoveredNodeIndex }) {
    const { props, state } = this
    return props.currentTime !== currentTime
      || props.events !== events
      || props.nodes !== nodes
      || state.hoveredNodeIndex !== hoveredNodeIndex
      || props.selectedNodeIndex !== selectedNodeIndex
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
        _x - 0.1 < x && _y - 0.1 < y && _x + 0.4 > x && _y + 0.8 >= y
      )
    }

    this.svg.select('.zoomRect').attrs({
      mousemove: () => {
        const hoveredNodeIndex = findNodeByMouse(d3.event)
        const rect = this.rootBlock.select('.nodeTooltip')

        if ( hoveredNodeIndex !== -1 ) {
          const { x, y } = coordinatedNodes[hoveredNodeIndex]
          const offsets = this.rootBlock.node().getBoundingClientRect()
          rect.styles({
            top: yScale(y + 0.38) - 74 + shiftY + offsets.top,
            left: xScale(x + 0.1755) + shiftX + offsets.left,
            display: 'block',
          })
          this.svg.select('.zoomRect').style('cursor', 'pointer')
          if ( this.state.hoveredNodeIndex !== hoveredNodeIndex ) {
            this.setState({ hoveredNodeIndex })
          }
        } else if ( hoveredNodeIndex === -1 ) {
          rect.style('display', 'none')
          this.svg.select('.zoomRect').style('cursor', 'move')
        }
      },
      click: () => this.props.onSelectedNodeIndexChanged(findNodeByMouse(d3.event)),
    })

    const status = getNodesEventsDataMap(events, currentTime)
    const allElements = this.paintAndReturnNodes(this.cachedClusters, status, currentZoom)

    allElements.select('.wrapper')
      .classed('is-selected', (_, index) => index === this.props.selectedNodeIndex)
    allElements.select('.icons')
      .classed('is-icon', () => currentZoom.k < ZOOM_CHANGE)
      .classed('is-dot', () => currentZoom.k >= ZOOM_CHANGE)
  }

  paintAndReturnNodes({ coordinatedClusters: clusters, coordinatedNodes: nodes }, status, currentZoom) {
    const scale = x => x * NODE_WIDTH

    this.svg.select('.clusters').bindData('rect.cluster', clusters, {
      rx: 3,
      ry: 3,
      transform: ({ x, y }) => `translate(${scale(x)}, ${scale(y)})`,
      width: ({ width }) => scale(width),
      height: ({ height }) => scale(height),
    })

    const x = ({ x }) => scale(x + 1 / 6)
    const y = ({ y }) => scale(y + 1 / 4)


    const stroke = ({ event: { type } }) => type === 'newDiscoveredNode' ? 'blue' : 'red'
    this.svg.select('.arrows').bindData('line.arrow', getArrows(
      this.props.events,
      nodes,
      this.props.currentTime
    ), {
      x1: (({ startNode }) => x(startNode)),
      y1: (({ startNode }) => y(startNode)),
      x2: (({ endNode }) => x(endNode)),
      y2: (({ endNode }) => y(endNode)),
      stroke,
      'stroke-width': ({isCompormised}) => isCompormised ? 4 : 1.5,
      'marker-end': line => `url(#${stroke(line)}-arrow)`,
    })


    this.svg.select('.clusterLabels').bindData('text.clusterLabel', clusters, {
      transform: ({ x, y }) => `translate(${scale(x)}, ${scale(y)})`,
      text: ({ cluster }) => cluster === 'undefined' ? 'Unidentified' : cluster,
    })

    const hasStatus = (key, val1, val2) => ({ node: { agentId } }) => {
      return status[agentId] && status[agentId][key] === val1 && (!val2 || status[agentId][key] === val2 )
    }

    const enteredSelection = this.svg.select('.grid').selectAll('.node').data(nodes, ({ node: { _id: id } }) => id)
    enteredSelection.exit().remove()

    return enteredSelection.enter().append('g').attr('class', 'node').html(`<g>
      <rect class="outerHover visible-large" stroke-width="1" width="21.3" height="35.91"
        rx="6.35" ry="6.35" x="-3.35" y="-3.35"></rect>
      <rect class="outerHover visible-small" stroke-width="3" width="27.8" height="42.41"
        rx="9.61" ry="9.61" x="-6.6" y="-6.6"></rect>
      <rect class="innerHover visible-large" stroke-width="1.5" width="18.8" height="33.41"
        rx="5.1" ry="5.1" x="-2.1" y="-2.1"></rect>
      <rect class="innerHover visible-small" stroke-width="6" width="18.8" height="33.41"
        rx="5.1" ry="5.1" x="-2.1" y="-2.1"></rect>
      <g class="wrapper">
        <rect class="visible-large" stroke-width="0.73" width="17.8" height="32.41"
          rx="4.7" ry="4.7" x="-1.6" y="-1.6"></rect> 
        <rect class="visible-small" stroke-width="1.5" width="21.3" height="35.91"
          rx="6.35" ry="6.35" x="-3.35" y="-3.35"></rect>
      </g>
      <rect class="content" rx="3.2" ry="3.2" width="14.6" height="29.2"></rect>
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
      .classed('is-starting-point', hasStatus('isStartingPoint', true))
      .classed('is-small', () => currentZoom.k < ZOOM_CHANGE)
  }

  render() {
    const { className, nodes } = this.props
    const selectedItem = nodes[this.state.hoveredNodeIndex]
    const { name, agentId } = selectedItem || {}

    return (
      <WindowDependable className={className} refCb={this.refRootBlock}
                        onDimensionsChanged={() => this.forceUpdate()}>
        <div styleName="node-tooltip" className="nodeTooltip">
          <div styleName="node-information">
            <div>Name: {name}</div>
            <div>Node ID: {agentId}</div>
          </div>
          <svg styleName="tooltip-svg">
            <line x1="0" y1="50" x2="70" y2="0"/>
            <line x1="70" y1="0" x2="100" y2="0" strokeWidth="2.5"/>
          </svg>
        </div>
        <svg className="svg">
          <defs>
            <marker id="red-arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
              <g transform="translate(7,0)" strokeWidth="1.2" fill="none">
                <path d="M 0 0 L 2.5 3 L 0 6" stroke="red"/>
              </g>
            </marker>
            <marker id="blue-arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
              <g transform="translate(7,0)" strokeWidth="1.2" fill="none">
                <path d="M 0 0 L 2.5 3 L 0 6" stroke="blue"/>
              </g>
            </marker>
          </defs>
          <g className="grid-shifter">
            <g className="zoom-scale">
              <g className="clusters" styleName="clusters-wrapper"/>
              <g className="clusterLabels" styleName="cluster-labels"/>
              <g className="grid"/>
              <g className="arrows"/>
            </g>
          </g>
          <rect className="zoomRect" styleName="zoom-rect"/>
        </svg>
      </WindowDependable>
    )
  }
}
