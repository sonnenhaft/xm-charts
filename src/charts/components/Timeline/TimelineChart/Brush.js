import React, { PropTypes, Component } from 'react'
import d3, { Transform } from 'charts/utils/decorated.d3.v4'

const ScaleObjectFunction = PropTypes.func.isRequired
export default class Brush extends Component {
  static defaultProps = { isToggled: false, width: 0 }
  static propTypes = {
    xScale: ScaleObjectFunction,
    yScale: ScaleObjectFunction,
    isToggled: PropTypes.bool,

    zoomFactor: PropTypes.number.isRequired,
    zoomPosition: PropTypes.number.isRequired,
    onZoomFactorChangedAndMoved: PropTypes.func.isRequired,
  }

  setBrushGroup = brushGroup => this.brushGroup = d3.select(brushGroup)
  setBrusher = brusher => {
    this.brusher = d3.select(brusher)
    this.brusher.on('click', () => d3.event.stopPropagation())
  }
  getWidth = () => this.props.xScale.range()[1]
  getHeight = () => this.props.yScale.range()[0]

  _centralizeBrush = center => {
    if ( this.isDisabled ) {
      return
    }
    let brusherWidth = this.brusher.select('.selection').attr('width') * 1
    const width = this.getWidth()
    if ( brusherWidth === width ) {
      brusherWidth /= 2
    }
    const halfWidth = brusherWidth / 2
    center = Math.max(halfWidth, Math.min(center, width - halfWidth))
    this._onBrushed([center - halfWidth, center + halfWidth])
  }

  componentDidMount() {
    this.brush = d3.brushX().on('brush end', this.onBrushed)
    this.zoom = new Transform(1, 0, 0)
    this.setZoom(this.props)
    this.brusher.call(this.brush)
    const centralizeBrush = this._centralizeBrush
    const clickedInsideTheBrush = function() {
      centralizeBrush(d3.mouse(this)[0])
      d3.event.stopPropagation()
    }
    this.brusher.selectAll('.overlay')
      .each(d => d.type = 'selection')
      .on('mousedown touchstart', clickedInsideTheBrush)
  }

  setZoom({ zoomFactor: k, zoomPosition: x }) {
    Object.assign(this.zoom, { k, x })
  }

  onBrushed = () => {
    if ( this.isDisabled ) {
      return
    }
    const { sourceEvent } = d3.event
    if ( !sourceEvent || sourceEvent.type === 'zoom' ) {
      return
    }
    this._onBrushed(d3.event.selection || [])
  }

  _onBrushed([min, max]) {
    if ( !min && !max ) {
      return
    }

    const width = this.getWidth()
    if ( min + max === width ) {
      max = max / 2
    }
    this.prevBrush = null
    const zoomPosition = d3.zoomIdentity.scale(width / (max - min)).translate(-min, 0)

    const { k, x } = zoomPosition
    if ( this.zoom.x !== x || this.zoom.k !== k ) {
      this.props.onZoomFactorChangedAndMoved({
        zoomFactor: k,
        zoomPosition: x,
      })
    }
  }

  componentDidUpdate() {
    const zoom = this.zoom
    this.setZoom(this.props)
    const [width, height] = [this.getWidth(), this.getHeight()]
    this.brush.extent([[0, 0], [width, Math.max(100, height)]])
    this.isDisabled = true
    this.brusher.call(this.brush)
    this.brusher.call(this.brush.move, this.props.xScale.range().map(zoom.invertX, zoom))
    this.isDisabled = false
    const brusherSelection = this.brusher.select('.selection')
    const brusherWidth = brusherSelection.attr('width') * 1

    const tooBig = brusherWidth === width
    const MIN_WIDTH = 6
    const tooSmall = brusherWidth < MIN_WIDTH
    brusherSelection.attrs({
      width: tooSmall ? MIN_WIDTH : brusherWidth,
      stroke: 'none',
      transform: `translate(${tooSmall ? (brusherWidth - MIN_WIDTH) / 2 : 0}, ${this.props.isToggled ? -4 : 0})`,
      'fill-opacity': 0.3,
      'pointer-events': tooBig ? 'none' : 'all',
    })
    this.brusher.selectAll('.handle').attr('pointer-events', brusherWidth < 16 ? 'none' : 'all')
  }

  render() {
    return <g className="brushGroup" ref={this.setBrushGroup}
              transform={`translate(0, ${this.getHeight()})`}>
        <g className="brusher" ref={this.setBrusher}
           transform={`translate(0, ${this.props.isToggled ? 0 : -15})`}/>
        {this.props.children}
    </g>
  }
}
