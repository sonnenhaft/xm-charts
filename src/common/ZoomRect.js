import React, { PropTypes, Component } from 'react'
import * as d3 from 'd3'
import 'common/d3.shims'
import { zoomTransform } from 'd3-zoom'

const ScaleObjectFunction = PropTypes.func.isRequired
export default class ZoomRect extends Component {
  static propTypes = {
    xScale: ScaleObjectFunction,
    yScale: ScaleObjectFunction,

    isToggled: PropTypes.bool,
    marginTop: PropTypes.number,
    minimalZoom: PropTypes.number,
    zoomFactor: PropTypes.number,
    zoomPosition: PropTypes.number,
    onZoomFactorChangedAndMoved: PropTypes.func.isRequired,
  }

  static defaultProps = {
    marginTop: 0,
    minimalZoom: 0,
    isToggled: false,
  }

  getWidth = () => this.props.xScale.range()[1]
  getHeight = () => this.props.yScale.range()[0]

  componentWillMount() {
    this.zoom = d3.zoom().scaleExtent([this.props.minimalZoom, 1000 * 1000 * 1000])
      .on('zoom', this.onZoomFactorChangedAndMoved)
  }

  onZoomFactorChangedAndMoved = () => {
    if ( this.isDisabled ) {
      return
    }
    const { sourceEvent } = d3.event
    if ( !sourceEvent || sourceEvent.type === 'brush' ) {
      return
    }
    const currentZoom = this.getCurrentZoom()
    const { k, x, y } = currentZoom
    if ( k !== this.props.zoomFactor || x !== this.props.zoomPosition ) {
      this.props.onZoomFactorChangedAndMoved({
        zoomFactor: k,
        zoomPosition: x,
        y,
      })
    }
  }

  componentDidMount() {
    this.setZoom(this.props)
  }

  componentWillReceiveProps(props) {
    this.setZoom(props)
  }

  setZoom({ zoomFactor, zoomPosition }) {
    const currentZoom = this.getCurrentZoom()
    const { k, x, y } = currentZoom
    if ( k !== zoomFactor || x !== zoomPosition ) {
      this.isDisabled = true
      this.zoom.transform(this.zoomRect, new zoomTransform(zoomFactor, zoomPosition, y))
      this.isDisabled = false
    }
  }

  getCurrentZoom() {return d3.zoomTransform(this.zoomRect.node())}

  componentDidUpdate() {
    const [width, height] = [this.getWidth(), this.getHeight()]
    this.zoom.translateExtent([[0, 0], [width, height]]).extent([[0, 0], [width, height]])
    const marginTop = this.props.marginTop
    const attrs = { width, height: height + marginTop, y: -marginTop }
    this.zoomRect.attrs(attrs)
  }

  refZoomRect = zoomRect => {
    this.zoomRect = d3.select(zoomRect)
    this.zoomRect.call(this.zoom)
  }

  render() {
    return <rect ref={this.refZoomRect} cursor="move" pointerEvents="all" fill="none" />
  }
}
