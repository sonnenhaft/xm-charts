import React, { Component, PropTypes as P } from "react";
import d3, { Transform } from "charts/utils/decorated.d3.v4";
import { getNodesEventsDataMap } from "../../utils/nodeEventData";
import { Circle, Desktop, Diskette, Snow } from "./IconsGroup";
import "./NetworkGrid.scss";
import WindowDependable from "../common/WindowDependable";
import NetworkTooltip from "./NetworkTooltip/NetworkTooltip";
import calculateClusterCoords, { getArrows } from "./calculateClusterCoords";
import ShareButtons from "../Timeline/common/ShareButtons";

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

  constructor(props) {
    super(props)
    this.zoom = d3.zoom().scaleExtent([1, 1000]).on('zoom', this.onZoomFactorChanged)
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

  componentWillUpdate({events, nodes, currentTime}, state) {
    console.time('willupdate')
    const props = this.props;
    const nodesChanged = props.nodes !== nodes;
    const currentTimeChanged = props.currentTime !== currentTime;

    if ( nodesChanged ) {
      this.cachedClusters = calculateClusterCoords(nodes)
    }

    if ( currentTimeChanged ) {
      this.setSelectedElement(undefined)
    }
    const eventsChanged = props.events !== events;
    const disableD3Repaint = !(eventsChanged || nodesChanged || currentTimeChanged)

    if ( !disableD3Repaint ) {
      this.repaintNodesAndArrows({events, currentTime})
    }

    const selectedNode = getSelectionByType(state.selectedElement, 'node')
    this.d3Nodes.select('.wrapper').classed('is-selected', ({ node }) => node === selectedNode)

    const selectedCluster = getSelectionByType(state.selectedElement, 'cluster')
    this.d3Clusters.classed('active', cluster => cluster === selectedCluster)

    const selectedArrow = getSelectionByType(state.selectedElement, 'arrow')
    this.d3Arrows.classed('is-black', arrow => selectedArrow === arrow)
      .select('.arrow').attr('marker-end', arrow => {
      let type = 'red'
      type = arrow.event.type === 'newDiscoveredNode' ? 'blue' : type
      type = selectedArrow === arrow ? 'black' : type
      return `url(#${type}-arrow)`
    })
    console.timeEnd('willupdate')
  }

  componentDidUpdate() {
    const props = this.props;
    const { clientWidth: width, clientHeight: height } = this.rootBlock.node()

    if ( !props.nodes.length || !height ) { // we just can calculate anything with 0 height
      return
    }

    const { shiftY, shiftX, currentZoom } = this.getScalesAndTransforms()

    this.svg.attrs({ width, height }).classed('icons-visible', currentZoom.k < ZOOM_CHANGE)
    this.svg.selectAll('.grid-shifter').attr('transform', `translate(${shiftX}, ${shiftY})`)
    this.svg.selectAll('.zoom-scale').attr('transform', currentZoom.toString())
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

  repaintNodesAndArrows({events, currentTime}) {
    const {coordinatedClusters, coordinatedNodes} = this.cachedClusters;
    const arrowsData = getArrows(
      events,
      coordinatedNodes,
      currentTime,
      (1 / 2 - 0.14) / 1.5,
      (1 - 0.25) / 1.5
    )
    const status = getNodesEventsDataMap(events, currentTime)

    const scale = x => x * NODE_WIDTH

    this.d3Clusters = this.svg.select('.clusters').bindData('g.cluster-group', coordinatedClusters, {
      click: cluster => this.setSelectedElement('cluster', cluster),
      html: ({ x, y, width, height, cluster }) => `<g>
        <g transform="translate(${scale(x)}, ${scale(y)})">
          <rect class="cluster" rx="3" ry="3" 
            width="${scale(width)}" height="${scale(height)}"></rect>
          <text class="cluster-labels">
            ${getClusterName(cluster)}
          </text>
        </g>
      </g>`
    })

    const hasStatus = (key, val1, val2 = 'missed') => ({ node: { agentId } }) => {
      const val = status[agentId] && status[agentId][key]
      return val === val1 || val === val2
    }

    this.d3Nodes = this.svg.select('.grid').bindData('g.node', coordinatedNodes, {
      transform: ({ x, y }) => `translate(${scale(x)},${scale(y)})`,
      click: ({ node }) => this.setSelectedElement('node', node),
      mouseout: () => this.setState({ hoveredNode: null }),
      mouseover: node => {
        if ( !this.isSelected(node) ) {
          this.setState({ hoveredNode: node })
        }
      },
      html: () => `<g transform="scale(0.65)">
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
    })
      .classed('is-compromised', hasStatus('state', 'compromised'))
      .classed('is-undiscovered', hasStatus('state', 'undiscovered'))
      .classed('is-discovered', hasStatus('state', 'discovered'))
      .classed('is-data-discovered', hasStatus('data', 'discovered', 'compromised'))
      .classed('is-device-discovered', hasStatus('device', 'discovered', 'compromised'))
      .classed('is-network-discovered', hasStatus('network', 'discovered', 'compromised'))
      .classed('is-starting-point', hasStatus('isStartingPoint', true))

    this.d3Arrows = this.svg.select('g.arrows').bindData('g.arrow-line', arrowsData, {
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
      .classed('is-compromised', ({ attackPathNumber }) => attackPathNumber)
      .classed('is-blue', arrow => arrow.event.type === 'newDiscoveredNode')
  }

  render() {
    const { className } = this.props
    const hoveredNode = this.state.hoveredNode
    const selectedCluster = getSelectionByType(this.state.selectedElement, 'cluster')
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

        <NetworkTooltip item={hoveredNode} coordsFn={getCoordsFn} offsets={{ x: 0.23, y: 0.02 }}>
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
            <marker id="black-arrow" markerWidth="10" markerHeight="10" refX="9.4" refY="3.35" orient="auto" markerUnits="strokeWidth" className="arrow-marker">
              <g transform="scale(0.2)">
                <g transform="translate(50 1) rotate(90)">
                  <path
                    d="M 2.65877 11.8328C 2.95253 12.1309 3.43349 12.1309 3.72726 11.8328L 8.46563 7.02378C 8.7594 6.72564 9.24035 6.72564 9.53411 7.02378L 14.2725 11.8328C 14.5663 12.1309 15.0472 12.1309 15.341 11.8328L 17.4813 9.66054C 17.769 9.36857 17.769 8.89972 17.4813 8.60775L 9.53424 0.542201C 9.24047 0.244058 8.75953 0.244058 8.46576 0.542201L 0.518641 8.60777C 0.230967 8.89973 0.230958 9.36856 0.51862 9.66054L 2.65877 11.8328Z"/>
                </g>
              </g>
            </marker>
            <marker id="blue-arrow" markerWidth="10" markerHeight="10" refX="9.4" refY="3.35" orient="auto" markerUnits="strokeWidth" className="arrow-marker">
              <g transform="scale(0.2)">
                <g transform="translate(50 1) rotate(90)">
                  <path
                    d="M 2.65877 11.8328C 2.95253 12.1309 3.43349 12.1309 3.72726 11.8328L 8.46563 7.02378C 8.7594 6.72564 9.24035 6.72564 9.53411 7.02378L 14.2725 11.8328C 14.5663 12.1309 15.0472 12.1309 15.341 11.8328L 17.4813 9.66054C 17.769 9.36857 17.769 8.89972 17.4813 8.60775L 9.53424 0.542201C 9.24047 0.244058 8.75953 0.244058 8.46576 0.542201L 0.518641 8.60777C 0.230967 8.89973 0.230958 9.36856 0.51862 9.66054L 2.65877 11.8328Z"/>
                </g>
              </g>
            </marker>
            <marker id="red-arrow" markerWidth="10" markerHeight="10" refX="9.4" refY="3.35" orient="auto" markerUnits="strokeWidth" className="arrow-marker">
              <g transform="scale(0.2)">
                <g transform="translate(50 1) rotate(90)">
                  <path
                    d="M 2.65877 11.8328C 2.95253 12.1309 3.43349 12.1309 3.72726 11.8328L 8.46563 7.02378C 8.7594 6.72564 9.24035 6.72564 9.53411 7.02378L 14.2725 11.8328C 14.5663 12.1309 15.0472 12.1309 15.341 11.8328L 17.4813 9.66054C 17.769 9.36857 17.769 8.89972 17.4813 8.60775L 9.53424 0.542201C 9.24047 0.244058 8.75953 0.244058 8.46576 0.542201L 0.518641 8.60777C 0.230967 8.89973 0.230958 9.36856 0.51862 9.66054L 2.65877 11.8328Z"/>
                </g>
              </g>
            </marker>
          </defs>
          <g className="grid-shifter">
            <g className="zoom-scale">
              <g className="clusters" styleName="clusters-wrapper"/>
              <g className="arrows"/>
              <g className="grid"/>
            </g>
          </g>
        </svg>
      </WindowDependable>
    )
  }
}
