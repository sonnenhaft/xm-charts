import React, { Component, PropTypes as P } from 'react'
import d3, { Transform } from 'charts/utils/decorated.d3.v4'

export default class ZoomableSVG extends Component {
  static propTypes = {
    marginLeft: P.number.isRequired,

    minZoom: P.number.isRequired,
    maxZoom: P.number.isRequired,

    zoomFactor: P.number.isRequired,
    zoomPosition: P.number.isRequired,
    onZoomFactorChangedAndMoved: P.func.isRequired,
  }

  componentWillMount() {
    this.zoom = d3.zoom()
      .scaleExtent([this.props.minZoom, this.props.maxZoom])
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
        zoomPosition: x - this.props.marginLeft,
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
    const x_ = zoomPosition + this.props.marginLeft
    if ( k !== zoomFactor || x !== x_ ) {
      this.isDisabled = true
      this.zoom.transform(this.zoomRect, new Transform(zoomFactor, x_, y))
      this.isDisabled = false
    }
  }

  getCurrentZoom() {
    return d3.zoomTransform(this.zoomRect.node())
  }

  refZoomableSVG = zoomRect => {
    this.zoomRect = d3.select(zoomRect)
    this.zoomRect.call(this.zoom)
  }

  render() {
    return <svg ref={this.refZoomableSVG} className={this.props.className}
                height={this.props.height}>
      {this.props.children}
    </svg>
  }
}
