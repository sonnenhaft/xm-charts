import React, { Component, PropTypes as P } from 'react'
import d3, { Transform } from 'charts/utils/decorated.d3.v4'
import { getNodesEventsDataMap } from '../../utils/nodeEventData'
import { Circle, Desktop, Diskette, Snow } from './IconsGroup'
import './NetworkGrid.scss'
import WindowDependable from '../common/WindowDependable'
import NetworkTooltip from './NetworkTooltip/NetworkTooltip'
import calculateClusterCoords, { getArrows } from './calculateClusterCoords'
import ShareButtons from '../Timeline/common/ShareButtons'

const NODE_WIDTH = 40
const ZOOM_CHANGE = 1.2

const getClusterName = cluster => cluster === 'undefined' ? 'Unidentified' : cluster
const getSelectionByType = (selectedElement, type) =>
(selectedElement && selectedElement.type === type && selectedElement.element) || undefined

export default class NetworkGrid extends Component {
  state = {
    hoveredNode: null,
    selectedElement: null,
  }

  static propTypes = {
    events: P.array,
    nodes: P.array,
    currentTime: P.number,
    onSelectedElementChanged: P.func,
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
    this.cachedArrows = getArrows(
      events,
      cachedClusters.coordinatedNodes,
      currentTime,
      1 / 2 - 0.14,
      1 - 0.25
    )
  }

  // TODO(vlad): remove code below
  shouldComponentUpdate({ currentTime, events, nodes },
                        { hoveredNode, selectedElement }) {
    const { props, state } = this
    return props.currentTime !== currentTime
      || props.events !== events
      || props.nodes !== nodes
      || state.hoveredNode !== hoveredNode
      || state.selectedElement !== selectedElement
  }


  componentWillReceiveProps({ nodes, events, currentTime }) {
    if ( this.props.nodes !== nodes ) {
      this.calculateClusters({ nodes })
    }

    if ( currentTime !== this.props.currentTime ) {
      this.setSelectedElement(undefined)
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
    this.svg.on('click', () => this.setSelectedElement(undefined))
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
      width / (NODE_WIDTH * this.cachedClusters.totalWidth),
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

    const getCoordsFn = (coords, heightOffset = 0, xCoordOffset = 0, yCoordOffset = 0) => {
      if ( !coords ) {
        return {}
      }
      const { x, y } = coords
      const offsets = this.rootBlock.node().getBoundingClientRect()
      return {
        top: `${yScale(y + yCoordOffset) - heightOffset - 52 + shiftY + offsets.top  }px`,
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

  getClusterData(coordinatedCluster) {
    const status = getNodesEventsDataMap(this.props.events, this.props.currentTime)

    const hasStatus = ({ node: { agentId } }, key, val1, val2 = 'missed') => {
      const val = status[agentId] && status[agentId][key]
      return val === val1 || val === val2
    }

    const nodes = coordinatedCluster ? coordinatedCluster.coordinatedNodes : []
    // TODO(vlad): fix devices algorithm
    return nodes
      .filter(({ node }) => status[node.agentId])
      .map(data => ({
        data: hasStatus(data, 'data', 'discovered', 'compromised'),
        device: hasStatus(data, 'device', 'discovered', 'compromised'),
        network: hasStatus(data, 'network', 'discovered', 'compromised'),
      })).reduce((sum, data) => {
        Object.keys(sum).forEach(key => sum[key] += (data[key] ? 1 : 0))
        return sum
      }, { device: 0, network: 0, data: 0 })
  }

  setSelectedElement = (type, element) => {
    if ( this.isSelected(element) ) {
      return
    }

    const selectedElement = type && { type, element }
    this.setState({ selectedElement })
    this.props.onSelectedElementChanged(selectedElement)

    if ( d3.event ) {
      d3.event.stopPropagation()
      return false
    }

  }

  isSelected = element => this.state.selectedElement && this.state.selectedElement.element === element
  || (!this.state.selectedElement && !element)


  paintAndReturnNodes({ coordinatedClusters: clusters }, status, currentZoom) {
    const scale = x => x * NODE_WIDTH

    this.svg.select('.clusters').bindData('g.cluster-group', clusters, {
      click: cluster => this.setSelectedElement('cluster', cluster),
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
          </g>`
      },
    })

    const selectedCluster = getSelectionByType(this.state.selectedElement, 'cluster')
    const selectedNode = getSelectionByType(this.state.selectedElement, 'node')
    //const selectedArrow = getSelectionByType(this.state.selectedElement, 'arrow')

    this.svg.selectAll('g.cluster-group').each(function() {
      const svgCluster = d3.select(this)
      svgCluster.classed('active', svgCluster.datum() === selectedCluster)
    })

    this.svg.select('.grid').bindData('g.node', this.cachedClusters.coordinatedNodes, {
      transform: ({ x, y }) => `translate(${scale(x)},${scale(y)})`,
      click: ({ node }) => this.setSelectedElement('node', node),
      mouseout: () => this.setState({ hoveredNode: null }),
      mouseover: node => {
        if ( !this.isSelected(node) ) {
          this.setState({ hoveredNode: node })
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

    const hasStatus = ({ node: { agentId } }, key, val1, val2 = 'missed') => {
      const val = status[agentId] && status[agentId][key]
      return val === val1 || val === val2
    }

    this.svg.selectAll('g.node')
      .classed('is-small', () => currentZoom.k < ZOOM_CHANGE)
      .each(function() {
        const svgNode = d3.select(this)
        const data = svgNode.datum()
        svgNode
          .classed('is-compromised', hasStatus(data, 'state', 'compromised'))
          .classed('is-undiscovered', hasStatus(data, 'state', 'undiscovered'))
          .classed('is-discovered', hasStatus(data, 'state', 'discovered'))
          .classed('is-data-discovered', hasStatus(data, 'data', 'discovered', 'compromised'))
          .classed('is-device-discovered', hasStatus(data, 'device', 'discovered', 'compromised'))
          .classed('is-network-discovered', hasStatus(data, 'network', 'discovered', 'compromised'))
          .classed('is-starting-point', hasStatus(data, 'isStartingPoint', true))
      })


    this.svg.selectAll('g.node').each(function() {
      const svgNode = d3.select(this)
      const datum = svgNode.datum()
      svgNode.select('.wrapper').classed('is-selected', datum.node === selectedNode)
    })

    this.svg.selectAll('.icons').classed('icons-visible', currentZoom.k < ZOOM_CHANGE)

    const groupedArrows = this.cachedArrows.reduce((groupedArrows, arrow) => {
      const key = arrow.event.type === 'newDiscoveredNode' ? '.blue-arrows' : '.red-arrows'
      groupedArrows[key].push(arrow)
      return groupedArrows
    }, { '.blue-arrows': [], '.red-arrows': [] })

    Object.keys(groupedArrows).map(className => {
      return { cachedArrows: groupedArrows[className], className }
    }).map(({ className, cachedArrows }) => {
      const arrows = this.svg.select(className).bindData('g.arrow-line', cachedArrows, {
        cursor: 'pointer',
        click: arrow => this.setSelectedElement('arrow', arrow),
        html: ({ attackPathNumber, middlePoint: { x, y }, startNode: { x: x1, y: y1 }, endNode: { x: x2, y: y2 } }) => {
          x1 = scale(x1)
          x2 = scale(x2)
          y1 = scale(y1)
          y2 = scale(y2)
          x = scale(x)
          y = scale(y)

          return `
        <line class="arrow" x1="${x1}" x2="${x2}" y1="${y1}" y2="${y2}"></line>
        <line class="arrow-highlight" x1="${x1}" x2="${x2}" y1="${y1}" y2="${y2}"></line>
        <g class="attack-circle">
          <circle class="arrow-circle" r="8" cx="${x}" cy="${y}"></circle>
          <text class="arrow-circle-text" x="${x}" y="${y}" dy="3.5">${attackPathNumber}</text>
        </g>`
        },
      })

      const selectedArrow = getSelectionByType(this.state.selectedElement, 'arrow')

      arrows
        .classed('is-compromised', ({ attackPathNumber }) => attackPathNumber)
        .classed('is-black', arrow => selectedArrow === arrow)
        .classed('is-blue', arrow => arrow.event.type === 'newDiscoveredNode')

      arrows.select('.arrow').attrs({
        'marker-end': arrow => {
          let type = 'red'
          type = arrow.event.type === 'newDiscoveredNode' ? 'blue' : type
          type = selectedArrow === arrow ? 'black' : type
          return `url(#${type}-arrow)`
        },
      })
    })
  }

  render() {
    const { className } = this.props
    const hoveredNode = this.state.hoveredNode
    const selectedCluster = getSelectionByType(this.state.selectedElement, 'cluster')
    //const selectedNode = getSelectionByType(this.state.selectedElement, 'node')
    const selectedArrow = getSelectionByType(this.state.selectedElement, 'arrow')

    const { getCoordsFn } = this.rootBlock ? this.getScalesAndTransforms() : () => {}

    return (
      <WindowDependable className={className} refCb={this.refRootBlock}
                        onDimensionsChanged={() => this.forceUpdate()}>

        <NetworkTooltip item={selectedCluster} coordsFn={getCoordsFn} isDark={true}
                        offsets={{ h: -4, x: selectedCluster ? selectedCluster.width : 0 }}>
          {selectedCluster && <div>
            {selectedCluster.coordinatedNodes.length}
            <div styleName="share-buttons">
              <ShareButtons data={this.getClusterData(selectedCluster)} type="dark-icons"/>
            </div>
          </div>}
        </NetworkTooltip>

        <NetworkTooltip item={hoveredNode} coordsFn={getCoordsFn} offsets={{ x: 0.35, y: 0.03 }}>
          {hoveredNode && <div>
            <div>{hoveredNode.node.name}</div>
          </div>}
        </NetworkTooltip>
        <NetworkTooltip item={selectedArrow && selectedArrow.tipPoint}
                        coordsFn={getCoordsFn} offsets={{}}>
          {selectedArrow && <div>
            {selectedArrow.event.data && <div>{selectedArrow.event.data.method}</div>}
            {!selectedArrow.event.data && <div>Type: {selectedArrow.event.type}</div>}
          </div>}
        </NetworkTooltip>

        <svg className="svg zoomRect">
          <defs>
            <marker id="black-arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth" className="arrow-marker">
              <path d="M 0 0 L 2.5 3 L 0 6"/>
            </marker>
            <marker id="blue-arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth" className="arrow-marker">
              <path d="M 0 0 L 2.5 3 L 0 6"/>
            </marker>
            <marker id="red-arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth" className="arrow-marker">
              <path d="M 0 0 L 2.5 3 L 0 6"/>
            </marker>
          </defs>
          <g className="grid-shifter">
            <g className="zoom-scale">
              <g className="clusters" styleName="clusters-wrapper"/>
              <g className="blue-arrows"/>
              <g className="grid"/>
              <g className="red-arrows"/>
            </g>
          </g>
        </svg>
      </WindowDependable>
    )
  }
}
