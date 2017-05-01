import React, { Component } from 'react'
import d3 from '../../utils/d3.shims'
import { Snow, Desktop, Diskette } from './IconsGroup'
import './NetworkGrid.scss'
import { Transform } from 'd3-zoom/src/transform'
import WindowDependable from '../common/WindowDependable'
import calculateClusterCoords from './calculateClusterCoords'

const CHART_PADDING = 0

export default class NetworkGrid extends Component {

  state = {
    hoveredNodeIndex: null,
    canShowChart: false,
    selectedNodeIndex: null,
  }

  refRootBlock = rootBlock => {
    this.rootBlock = d3.select(rootBlock)
    this.svg = this.rootBlock.select('.svg')
    this.svg.select('.zoomRect').call(this.zoom)
    this.forceUpdate()
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

  shouldComponentUpdate({ currentTime, events, nodes }, { hoveredNodeIndex, selectedNodeIndex, canShowChart }) {
    const { props, state } = this
    return props.currentTime !== currentTime
      || props.events !== events
      || props.nodes !== nodes
      || state.hoveredNodeIndex !== hoveredNodeIndex
      || state.selectedNodeIndex !== selectedNodeIndex
      || state.canShowChart !== canShowChart
  }

  componentWillReceiveProps(nextProps) {
    this.calculateEvents(nextProps)
  }

  componentDidUpdate() {
    this.setState({canShowChart: true}, () => {
      if (this.isUpdating) {
        return
      }
      this.isUpdating = true
      setTimeout(() => {
        this.renderChart()
        this.isUpdating = false
      }, 50)
    })
  }

  componentDidMount() {
    this.calculateEvents(this.props)
  }

  calculateEvents({ events, nodes, currentTime }) {
    if (!nodes.length) {
      return
    }

    this.cachedClusters = calculateClusterCoords(nodes)

    this.nodeColors = nodes.reduce((map, { agentId }) => {
      map[agentId] = 'white'
      return map
    }, {})

    events
      .filter(({ date }) => currentTime > date)
      .forEach(item => {
        const { type, nodeId } = item
        const red = 'rgb(242, 30, 39)'
        const blue = 'rgb(70, 96, 223)'
        if ( this.nodeColors[nodeId] !== red ) {
          if (type === 'nodeMarkAsRed') {
            this.nodeColors[nodeId] = red
          } else if (type === 'newDiscoveredNode') {
            this.nodeColors[nodeId] = blue
          }
        }
      })
  }

  renderChart() {
    const {nodes} = this.props
    if (!nodes.length) {
      return
    }

    const refNode = this.rootBlock.node()
    const width = refNode.clientWidth
    const h = refNode.clientHeight;
    const height = Math.max(h, 100)
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

    const gee = ({offsetX, offsetY}) => {
      const x = xScale.invert(offsetX)
      const y = yScale.invert(offsetY)
      return cachedClusters.coordinatedNodes.findIndex(({x: _x, y: _y}) => {
        return _x - 0.5 < x && _y <  y && _x + 0.5 > x && _y + 0.8 >= y
      })
    }

    this.svg.select('.zoomRect').on('mousemove', ( ) => {
      const hoveredNodeIndex = gee(d3.event)

      const rect = this.rootBlock.select('.gridTooltip')
      if (hoveredNodeIndex !== -1 && this.state.hoveredNodeIndex !== hoveredNodeIndex) {
        const {x: _x, y: _y} = cachedClusters.coordinatedNodes[hoveredNodeIndex]
        rect.style('top', yScale(_y + 0.4)  + 37).style('left', xScale(_x + 0.20)).style('display', 'block')
        this.setState({ hoveredNodeIndex })
      } else if (hoveredNodeIndex === -1) {
        rect.style('display', 'none')
      }
    }).on('click', () => {
      const selectedNodeIndex = gee(d3.event)
      this.setState({ selectedNodeIndex })
    })

    let kk = Math.min(height / (nodeHeight * cachedClusters.totalHeight), (width) / (nodeWidth * cachedClusters.totalWidth))
    this.heightZoom.k = kk

    xScale.domain(this.heightZoom.rescaleX(xScale).domain())
    yScale.domain(this.heightZoom.rescaleY(yScale).domain())

    const k = this.currentZoom.k * kk
    const FILLED_SPACE = 0.73
    const offset = 4.4

    const simpleRectAttrs = {
      rx: offset,
      ry: offset,
      strokeWidth: 2,
      stroke: 'black',
      height: nodeHeight,
      width: nodeHeight / 2,
    }

    this.svg.select('.cluster-labels').bindData('text.clusterLabel', cachedClusters.coordinatedClusters, {
      fill: 'black',
      'font-size': 33,
      'font-family': 'sans-serif',
      dx: 0,
      dy: 14,
      transform: ({ x, y }) => `translate(${xScale(x)}, ${yScale(y)}) scale(${k}, ${k})`,
      text: ({cluster}) => cluster,
    })

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
      transform: ({ x, y }) => `translate(${xScale(x)},${yScale(y)})`,
      cursor: 'pointer',
      fill: ({ node: { agentId } }) => this.nodeColors[agentId],
    })

    allElements.select('.simpleRect').attrs({
      ...simpleRectAttrs,
      transform: `scale(${FILLED_SPACE * k})`,
    })
    allElements.select('.wrapperRect').attrs({
      ...simpleRectAttrs,
      fill: 'white',
      'stroke-width': 1,
      width: nodeHeight / 2 + offset,
      height: nodeHeight + offset,
      transform: `translate(${-offset / 2}, ${-offset / 2}) scale(${FILLED_SPACE * k})`,
      stroke: (ignored, index) => index === this.state.selectedNodeIndex ? 'black' : 'none',
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
    const  {canShowChart} = this.state
    const { className, nodes } = this.props
    const selectedItem = nodes[this.state.hoveredNodeIndex]
    const { name } = selectedItem || {}

    return (
      <WindowDependable onDimensionsChanged={() => this.forceUpdate()} style={{opacity: canShowChart ? 1 : 0}} refCb={this.refRootBlock} className={className}>
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
            <g className="clusters" opacity={0}/>
            <g className="cluster-labels"/>
            <g className="grid"/>
          </g>
          <rect className="zoomRect" fill="#e5e5e5" opacity={0} cursor="move"/>
        </svg>
      </WindowDependable>
    )
  }
}
