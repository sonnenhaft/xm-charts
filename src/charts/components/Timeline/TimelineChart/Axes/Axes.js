import React, { PropTypes, Component } from 'react'
import d3 from 'charts/utils/decorated.d3.v4'
import styles from './Axes.scss'
import {tickFormat} from '../customScaleTime'

const ScaleObjectFunction = PropTypes.func.isRequired
export default class Axes extends Component {
  static propTypes = {
    xScale: ScaleObjectFunction,
    yScale: ScaleObjectFunction,
    xScaleMini: ScaleObjectFunction,
    isToggled: PropTypes.bool,
    realHeight: PropTypes.number,
    zoomFactor: PropTypes.number,
  }

  static defaultProps = {
    realHeight: 0,
  }

  componentDidMount() {
    this.renderAxis()
  }

  componentDidUpdate() {
    this.renderAxis()
  }

  renderAxis() {
    const props = this.props
    const realHeight = props.realHeight
    const visibility = props.zoomFactor !== 1 ? 'visible' : 'hidden'

    const translateY = (y1, y2) => {
      const y = realHeight - (props.isToggled ? y1 : y2)
      return { transform: `translate(0, ${y})` }
    }

    this.xAxis.attrs({ ...translateY(125, 85), visibility })
      .call(d3.axisBottom(props.xScale).tickFormat(tickFormat))
    this.miniMap.attrs(translateY(realHeight - 3, 57))
      .call(d3.axisBottom(props.xScaleMini).tickFormat(tickFormat))

    const width = props.xScale.range()[1]
    this.yAxis.call(d3.axisLeft(props.yScale).ticks(5, '%').tickSize(-width)).selectAll('.tick')
      .attr('class', (ignored, idx) => `tick ${(idx === 4 ? styles['extra-white'] : '')}`)
  }

  refXaxis = xAxis => this.xAxis = d3.select(xAxis)
  refYaxis = yAxis => this.yAxis = d3.select(yAxis)
  refMiniMap = miniMap => this.miniMap = d3.select(miniMap)

  render() {
    return <g>
      <g className="miniMap" styleName="axis axis--x" ref={this.refMiniMap}/>
      <g styleName={this.props.isToggled ? 'invisible' : 'visible'}>
        <g styleName="axis axis--x" className="xAxis" ref={this.refXaxis}/>
        <g styleName="axis axis--y" className="yAxis" ref={this.refYaxis}/>
        {this.props.children}
      </g>
    </g>
  }
}

