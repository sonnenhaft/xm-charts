import React, { PropTypes, Component } from 'react'
import d3, { Transform }  from 'charts/utils/decorated.d3.v4'

export default class ZoomRect extends Component {
  static propTypes = {
    marginLeft: PropTypes.number,
    minimalZoom: PropTypes.number,
    zoomFactor: PropTypes.number,
    zoomPosition: PropTypes.number,
    onZoomFactorChangedAndMoved: PropTypes.func.isRequired,
  }

  static defaultProps = {
    minimalZoom: 0,
  }

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

  _getLeftOffset(){
    return 30
  }

  setZoom({ zoomFactor, zoomPosition }) {
    const currentZoom = this.getCurrentZoom()
    const { k, x, y } = currentZoom
    const x_ = zoomPosition + this.props.marginLeft
    if ( k !== zoomFactor || x !== x_) {
      this.isDisabled = true
      this.zoom.transform(this.zoomRect, new Transform(zoomFactor, x_, y))
      this.isDisabled = false
    }
  }

  getCurrentZoom() {return d3.zoomTransform(this.zoomRect.node())}

  refZoomRect = zoomRect => {
    this.zoomRect = d3.select(zoomRect)
    this.zoomRect.call(this.zoom)
  }

  render() {
    return <svg ref={this.refZoomRect} className={this.props.className} height={this.props.height}
    width={this.props.width}>
      {this.props.children}
    </svg>
  }
}
