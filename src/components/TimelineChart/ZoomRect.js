import React, {PropTypes, Component} from 'react'
import * as d3 from 'd3'

const ScaleObjectFunction = PropTypes.func.isRequired
export default class ZoomRect extends Component {
  static propTypes = {
    xScale: ScaleObjectFunction,
    yScale: ScaleObjectFunction,
    isToggled: PropTypes.bool,
    margin: PropTypes.object.isRequired,
    onZoomed: PropTypes.func.isRequired,
    zoomFactor: PropTypes.number,
    zoomPosition: PropTypes.number,
  }

  getWidth = () => this.props.xScale.range()[1]
  getHeight = () => this.props.yScale.range()[0]

  componentWillMount() {
    this.zoom = d3.zoom().scaleExtent([1, 1000 * 1000 * 1000]).on('zoom', this.onZoomed)
  }

  onZoomed = () => {
    if (this.isDisabled) {
      return
    }
    const {sourceEvent} = d3.event
    if (!sourceEvent || sourceEvent.type === 'brush') {
      return
    }
    const currentZoom = this.getCurrentZoom()
    const {k, x} = currentZoom
    if (k !== this.props.zoomFactor || x !== this.props.zoomPosition) {
      this.props.onZoomed(currentZoom)
    }
  }

  componentDidMount() {
    this.setZoom(this.props)
  }

  componentWillReceiveProps(props) {
    this.setZoom(props)
  }

  setZoom({zoomFactor, zoomPosition}) {
    const currentZoom = this.getCurrentZoom()
    const {k, x} = currentZoom
    if (k !== zoomFactor || x !== zoomPosition) {
      this.isDisabled = true
      this.zoom.scaleTo(this.zoomRect, zoomFactor)
      this.isDisabled = false
    }
  }

  getCurrentZoom() {return d3.zoomTransform(this.zoomRect.node())}

  refZoomRect = zoomRect => {
    this.zoomRect = d3.select(zoomRect)
    this.zoomRect.call(this.zoom)
  }

  render() {
    const [width, height] = [this.getWidth(), this.getHeight()]
    this.zoom.translateExtent([[0, 0], [width, height]]).extent([[0, 0], [width, height]])

    const margin = this.props.margin
    const attrs = {width, height: height + margin.top, y: -margin.top}

    return <rect ref={this.refZoomRect}  {...attrs}
                 cursor="move" pointerEvents="all" fill="none" />
  }
}
