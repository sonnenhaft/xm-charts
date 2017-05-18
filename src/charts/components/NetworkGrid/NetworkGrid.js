import React, { Component, PropTypes as P } from 'react'
import d3, { Transform } from 'charts/utils/decorated.d3.v4'
import { getNodesEventsDataMap } from '../../utils/nodeEventData'
import { Circle, Desktop, Diskette, Snow } from './IconsGroup'
import './NetworkGrid.scss'
import WindowDependable from '../common/WindowDependable'
import calculateClusterCoords, { getArrows, moveArrowsToCorners } from './calculateClusterCoords'

const NODE_WIDTH = 40
const ZOOM_CHANGE = 1.2

export default class NetworkGrid extends Component {
  state = {
    hoveredNode: null,
    selectedEvent: null,
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
                        { hoveredNode, selectedEvent }) {
    const { props, state } = this
    return props.currentTime !== currentTime
      || props.events !== events
      || props.nodes !== nodes
      || state.hoveredNode !== hoveredNode
      || state.selectedEvent !== selectedEvent
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

  renderChart() {
    const { nodes, events, currentTime } = this.props
    const { clientWidth: width, clientHeight: height } = this.rootBlock.node()
    const xScale = d3.scaleLinear().domain([0, 1]).range([0, NODE_WIDTH])
    const yScale = d3.scaleLinear().domain([0, 1]).range([0, NODE_WIDTH])

    if ( !nodes.length || !height ) { // we just can calculate anything with 0 height
      return
    }

    this.svg.attrs({ width, height })

    const centralizeZoomFactor = Math.min(
      height / (NODE_WIDTH * this.cachedClusters.totalHeight),
      width / (NODE_WIDTH * this.cachedClusters.totalWidth)
    )
    const { k, x, y } = d3.zoomTransform(this.svg.node())
    const shiftX = (width - this.cachedClusters.totalWidth * NODE_WIDTH * centralizeZoomFactor ) * k / 2
    const shiftY = (height - this.cachedClusters.totalHeight * NODE_WIDTH * centralizeZoomFactor ) * k / 2
    this.svg.selectAll('.grid-shifter').attr('transform', `translate(${shiftX}, ${shiftY})`)

    const currentZoom = new Transform(centralizeZoomFactor * k, x, y)
    this.zoom.translateExtent([[0, 0], [width, height]]).extent([[0, 0], [width, height]])

    this.svg.selectAll('.zoom-scale').attr('transform', currentZoom.toString())
    xScale.domain(currentZoom.rescaleX(xScale).domain())
    yScale.domain(currentZoom.rescaleY(yScale).domain())

    const status = getNodesEventsDataMap(events, currentTime)
    this.paintAndReturnNodes(this.cachedClusters, status, currentZoom)

    const getCoords = (coords, zo, xo = 0, yo = 0) => {
      if ( !coords ) {
        return {}
      }
      const { x, y } = coords
      const offsets = this.rootBlock.node().getBoundingClientRect()
      return {
        top: `${yScale(y + yo) - zo + shiftY + offsets.top  }px`,
        left: `${xScale(x + xo) + shiftX + offsets.left  }px`,
      }
    }

    const node = this.state.hoveredNode
    this.rootBlock.select('.nodeTooltip').styles(getCoords(node, 74, 0.1755, 0.38))
    const arrow = this.cachedArrows.find(({ event }) => event === this.state.selectedEvent)
    this.rootBlock.select('.arrowTooltip').styles(getCoords((arrow || {}).middlePoint, 64))
  }

  paintAndReturnNodes({ coordinatedClusters: clusters, coordinatedNodes: nodes }, status, currentZoom) {
    const scale = x => x * NODE_WIDTH

    const { mergedSelection: sel } = this.svg.select('.clusters')._bindData('g.cluster-group', clusters, {
      html: ({ x, y, width, height, cluster }) => {
        return `
          <g>
            <g transform="translate(${scale(x)}, ${scale(y)})">
              <rect class="cluster" rx="3" ry="3" 
                width="${scale(width)}" height="${scale(height)}"></rect>
              <text class="cluster-labels">
                ${cluster === 'undefined' ? 'Unidentified' : cluster}
              </text>
            </g>
          </g>
          <g class="grid"></g>
          <g class="arrow"></g>`
      },
    })

    // .data(nodes, ({ node: { _id: id } }) => id)

    const { mergedSelection: newNodes } = sel.select('.grid')._bindData('g.node', ({ coordinatedNodes }) => coordinatedNodes, {
      transform: ({ x, y }) => `translate(${scale(x)},${scale(y)})`,
      click: ({node}) => {
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
    </g>`},
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
    this.svg.selectAll('g.node').each(function(){
      const svgNode = d3.select(this)
      const datum = svgNode.datum()
      svgNode.select('.wrapper').classed('is-selected', datum.node === currentNode)
    })

    this.svg.selectAll('.icons').classed('icons-visible',  currentZoom.k < ZOOM_CHANGE)

    const stroke = ({ event }) => {
      if ( this.state.selectedEvent === event ) {
        return 'black'
      } else if ( event.type === 'newDiscoveredNode' ) {
        return 'blue'
      } else {
        return 'red'
      }
    }

    const { mergedSelection: arrowsNew, enteredSelection: arrowsEntered } = this.svg.select('.arrows')._bindData('g.arrow-line', this.cachedArrows, {
      cursor: 'pointer',
      click: ({ event }) => {
        this.setState({ selectedEvent: this.state.selectedEvent === event ? null : event })
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
    const selectedEvent = this.state.selectedEvent

    return (
      <WindowDependable className={className} refCb={this.refRootBlock}
                        onDimensionsChanged={() => this.forceUpdate()}>
        <div styleName="node-tooltip" className="nodeTooltip">
          {hoveredNode && <div>
            <div styleName="node-information">
              <div>Name: {hoveredNode.node.name}</div>
              <div>Node ID: {hoveredNode.node.agentId}</div>
            </div>
            <svg styleName="tooltip-svg">
              <line x1="0" y1="50" x2="70" y2="0"/>
              <line x1="70" y1="0" x2="100" y2="0" strokeWidth="2.5"/>
            </svg>
          </div>}
        </div>

        <div styleName="node-tooltip" className="arrowTooltip">
          {selectedEvent && <div>
            <div styleName="node-information">
              <div>Type: {selectedEvent.type}</div>
            </div>
            <svg styleName="tooltip-svg">
              <line x1="0" y1="50" x2="70" y2="0"/>
              <line x1="70" y1="0" x2="100" y2="0" strokeWidth="2.5"/>
            </svg>
          </div>}
        </div>

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
