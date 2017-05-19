import React, { Component, PropTypes as P } from 'react'
import d3, { Transform } from 'charts/utils/decorated.d3.v4'
import { getNodesEventsDataMap } from '../../utils/nodeEventData'
import { Circle, Desktop, Diskette, Snow } from './IconsGroup'
import './NetworkGrid.scss'
import WindowDependable from '../common/WindowDependable'
import NetworkTooltip from './NetworkTooltip/NetworkTooltip'
import calculateClusterCoords, { getArrows, moveArrowsToCorners } from './calculateClusterCoords'

const NODE_WIDTH = 40
const ZOOM_CHANGE = 1.2

const getClusterName = cluster => cluster === 'undefined' ? 'Unidentified' : cluster
export default class NetworkGrid extends Component {
  state = {
    hoveredNode: null,
    selectedArrow: null,
    selectedCluster: null,
  }

  static propTypes = {
    events: P.array,
    nodes: P.array,
    currentTime: P.number,
    selectedNodeIndex: P.number,
    onSelectedNodeIndexChanged: P.func,
  }

  zoom = undefined

  cachedClusters = undefined

  cachedArrows = undefined


  constructor(props) {
    super(props)
    this.zoom = d3.zoom().scaleExtent([1, 1000]).on('zoom', this.onZoomFactorChanged)
  }

  componentDidMount() {
    this.calculateClusters(this.props)
    this.calculateArrows(this.props, this.cachedClusters)
  }

  calculateClusters({ nodes }) {
    this.cachedClusters = calculateClusterCoords(nodes)
  }

  calculateArrows({ events, currentTime }, cachedClusters) {
    let arrows = getArrows(
      events,
      cachedClusters.coordinatedNodes,
      currentTime
    )
    this.cachedArrows = moveArrowsToCorners(arrows, 1 / 2 - 0.14, 1 - 0.25)
  }

  // TODO(vlad): remove code below
  shouldComponentUpdate({ currentTime, events, nodes, selectedNodeIndex },
                        { hoveredNode, selectedArrow, selectedCluster }) {
    const { props, state } = this
    return props.currentTime !== currentTime
      || props.events !== events
      || props.nodes !== nodes
      || state.hoveredNode !== hoveredNode
      || state.selectedCluster !== selectedCluster
      || state.selectedArrow !== selectedArrow
      || props.selectedNodeIndex !== selectedNodeIndex
  }


  componentWillReceiveProps({ nodes, events, currentTime }) {
    if ( this.props.nodes !== nodes ) {
      this.calculateClusters({ nodes })
    }

    if ( this.props.nodes !== nodes ||
      this.props.events !== events ||
      this.props.currentTime !== currentTime
    ) {
      this.calculateArrows({ events, currentTime }, this.cachedClusters)
    }
  }

  componentDidUpdate() {
    this.renderChart()
  }

  refRootBlock = rootBlock => {
    this.rootBlock = d3.select(rootBlock)
    this.svg = this.rootBlock.select('.svg')
    this.svg.call(this.zoom)

    setTimeout(() => {
      // think that better to remember height in here and on window changed
      this.forceUpdate()
    }, 1600)
  }

  onZoomFactorChanged = () => {
    this.forceUpdate()
  }

  getScalesAndTransforms() {
    const { clientWidth: width, clientHeight: height } = this.rootBlock.node()
    const centralizeZoomFactor = Math.min(
      height / (NODE_WIDTH * this.cachedClusters.totalHeight),
      width / (NODE_WIDTH * this.cachedClusters.totalWidth)
    )
    const { k, x, y } = d3.zoomTransform(this.svg.node())
    const shiftX = (width - this.cachedClusters.totalWidth * NODE_WIDTH * centralizeZoomFactor ) * k / 2
    const shiftY = (height - this.cachedClusters.totalHeight * NODE_WIDTH * centralizeZoomFactor ) * k / 2
    const currentZoom = new Transform(centralizeZoomFactor * k, x, y)
    this.zoom.translateExtent([[0, 0], [width, height]]).extent([[0, 0], [width, height]])
    const xScale = d3.scaleLinear().domain([0, 1]).range([0, NODE_WIDTH])
    const yScale = d3.scaleLinear().domain([0, 1]).range([0, NODE_WIDTH])
    xScale.domain(currentZoom.rescaleX(xScale).domain())
    yScale.domain(currentZoom.rescaleY(yScale).domain())

    const getCoordsFn = (coords, heightOffset, xCoordOffset = 0, yCoordOffset = 0) => {
      if ( !coords ) {
        return {}
      }
      const { x, y } = coords
      const offsets = this.rootBlock.node().getBoundingClientRect()
      return {
        top: `${yScale(y + yCoordOffset) - heightOffset + shiftY + offsets.top  }px`,
        left: `${xScale(x + xCoordOffset) + shiftX + offsets.left  }px`,
      }
    }

    return { xScale, yScale, shiftY, shiftX, currentZoom, getCoordsFn }
  }

  renderChart() {
    const { nodes, events, currentTime } = this.props
    const { clientWidth: width, clientHeight: height } = this.rootBlock.node()

    if ( !nodes.length || !height ) { // we just can calculate anything with 0 height
      return
    }

    this.svg.attrs({ width, height })
    const { shiftY, shiftX, currentZoom } = this.getScalesAndTransforms()

    this.svg.selectAll('.grid-shifter').attr('transform', `translate(${shiftX}, ${shiftY})`)
    this.svg.selectAll('.zoom-scale').attr('transform', currentZoom.toString())

    const status = getNodesEventsDataMap(events, currentTime)
    this.paintAndReturnNodes(this.cachedClusters, status, currentZoom)
  }

  paintAndReturnNodes({ coordinatedClusters: clusters, coordinatedNodes: nodes }, status, currentZoom) {
    const scale = x => x * NODE_WIDTH

    const { mergedSelection: sel } = this.svg.select('.clusters')._bindData('g.cluster-group', clusters, {
      click: cluster => {
        if ( d3.select(d3.event.target).classed('cluster') ) {
          this.setState({ selectedCluster: cluster === this.state.selectedCluster ? null : cluster })
        }
      },
      html: ({ x, y, width, height, cluster }) => {
        return `
          <g>
            <g transform="translate(${scale(x)}, ${scale(y)})">
              <rect class="cluster" rx="3" ry="3" 
                width="${scale(width)}" height="${scale(height)}"></rect>
              <text class="cluster-labels">
                ${getClusterName(cluster)}
              </text>
            </g>
          </g>
          <g class="grid"></g>
          <g class="arrow"></g>`
      },
    })

    const selectedCluster = this.state.selectedCluster
    this.svg.selectAll('g.cluster-group').each(function() {
      const svgCluster = d3.select(this)
      svgCluster.classed('active', svgCluster.datum() === selectedCluster)
    })

    const { mergedSelection: newNodes } = sel.select('.grid')._bindData('g.node', ({ coordinatedNodes }) => coordinatedNodes, {
      transform: ({ x, y }) => `translate(${scale(x)},${scale(y)})`,
      click: ({ node }) => {
        this.props.onSelectedNodeIndexChanged(this.props.nodes.findIndex(item => node === item))
      },
      mouseout: () => this.setState({ hoveredNode: null }),
      mouseover: item => {
        if ( item !== this.state.hoveredNode ) {
          this.setState({ hoveredNode: item })
        }
      },
      html: () => {
        return `<g>
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
    </g>`
      },
    })

    const hasStatus = (key, val1, val2) => ({ node: { agentId } }) => {
      return status[agentId] && status[agentId][key] === val1 && (!val2 || status[agentId][key] === val2 )
    }

    newNodes
      .classed('is-compromised', hasStatus('state', 'compromised'))
      .classed('is-undiscovered', hasStatus('state', 'undiscovered'))
      .classed('is-discovered', hasStatus('state', 'discovered'))
      .classed('is-data-discovered', hasStatus('data', 'discovered', 'compromised'))
      .classed('is-device-discovered', hasStatus('device', 'discovered', 'compromised'))
      .classed('is-network-discovered', hasStatus('network', 'discovered', 'compromised'))
      .classed('is-starting-point', hasStatus('isStartingPoint', true))

    this.svg.selectAll('g.node')
      .classed('is-small', () => currentZoom.k < ZOOM_CHANGE)

    const currentNode = this.props.nodes[this.props.selectedNodeIndex]
    this.svg.selectAll('g.node').each(function() {
      const svgNode = d3.select(this)
      const datum = svgNode.datum()
      svgNode.select('.wrapper').classed('is-selected', datum.node === currentNode)
    })

    this.svg.selectAll('.icons').classed('icons-visible', currentZoom.k < ZOOM_CHANGE)

    const stroke = arrow => {
      if ( this.state.selectedArrow === arrow ) {
        return 'black'
      } else if ( arrow.event.type === 'newDiscoveredNode' ) {
        return 'blue'
      } else {
        return 'red'
      }
    }

    const { mergedSelection: arrowsNew, enteredSelection: arrowsEntered } = this.svg.select('.arrows')._bindData('g.arrow-line', this.cachedArrows, {
      cursor: 'pointer',
      click: arrow => {
        this.setState({ selectedArrow: this.state.selectedArrow === arrow ? null : arrow })
      },
      html: ({ value, middlePoint: { x, y }, startNode: { x: x1, y: y1 }, endNode: { x: x2, y: y2 } }) => {
        x1 = scale(x1)
        x2 = scale(x2)
        y1 = scale(y1)
        y2 = scale(y2)
        x = scale(x)
        y = scale(y)

        return `
        <line class="arrow" x1="${x1}" x2="${x2}" y1="${y1}" y2="${y2}"></line>
        <line class="arrow-highlight" x1="${x1}" x2="${x2}" y1="${y1}" y2="${y2}"></line>
        <g class="text-value" visibility="${value ? 'visible' : 'hidden'}">
          <circle class="arrow-circle" r="8" cx="${x}" cy="${y}"></circle>
          <text class="arrow-circle-text" x="${x}" y="${y}" dy="3.5">${value}</text>
        </g>`
      },
    })

    const arrowAttrs = {
      stroke,
      'marker-end': line => `url(#${stroke(line)}-arrow)`,
      'stroke-width': ({ isCompormised }) => isCompormised ? 3 : 1,
    }
    arrowsNew.select('line.arrow').attrs(arrowAttrs)
    arrowsEntered.select('line.arrow').attrs(arrowAttrs)
    arrowsNew.select('circle.arrow-circle').attrs({ fill: stroke })
    arrowsEntered.select('circle.arrow-circle').attrs({ fill: stroke })
  }

  render() {
    const { className } = this.props
    const hoveredNode = this.state.hoveredNode
    const selectedArrow = this.state.selectedArrow
    const selectedCluster = this.state.selectedCluster

    const { getCoordsFn } = this.rootBlock ? this.getScalesAndTransforms() : () => {}

    return (
      <WindowDependable className={className} refCb={this.refRootBlock}
                        onDimensionsChanged={() => this.forceUpdate()}>
        <NetworkTooltip item={hoveredNode} coordsFn={getCoordsFn} offsets={{ h: 74, x: 0.1755, y: 0.38 }}>
          {hoveredNode && <div>
            <div>Name: {hoveredNode.node.name}</div>
            <div>Node ID: {hoveredNode.node.agentId}</div>
          </div>}
        </NetworkTooltip>
        <NetworkTooltip item={selectedArrow && selectedArrow.middlePoint}
                        coordsFn={getCoordsFn} offsets={{ h: 64 }}>
          {selectedArrow && <div>Type: {selectedArrow.event.type}</div>}
        </NetworkTooltip>
        <NetworkTooltip item={selectedCluster} coordsFn={getCoordsFn}
                        offsets={{ h: 64, x: this.state.selectedCluster ? this.state.selectedCluster.width : 0 }}>
          {selectedCluster && <div>
            #{getClusterName(selectedCluster.coordinatedNodes.length)}
          </div>}
        </NetworkTooltip>

        <svg className="svg zoomRect">
          <defs>
            <marker id="red-arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
              <g transform="translate(7,0)" strokeWidth="1.2" fill="none">
                <path d="M 0 0 L 2.5 3 L 0 6" stroke="red"/>
              </g>
            </marker>
            <marker id="black-arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
              <g transform="translate(7,0)" strokeWidth="1.2" fill="none">
                <path d="M 0 0 L 2.5 3 L 0 6" stroke="black"/>
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
              <g className="arrows"/>
            </g>
          </g>
        </svg>
      </WindowDependable>
    )
  }
}
