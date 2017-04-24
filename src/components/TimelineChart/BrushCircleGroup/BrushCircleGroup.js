import React, {PropTypes, Component} from 'react'
import * as d3 from 'd3'
import styles from './BrushCircleGroup.scss'

const ScaleObjectFunction = PropTypes.func.isRequired
export default class BrushCircleGroup extends Component {
  static propTypes = {
    xScale: ScaleObjectFunction,
    yScale: ScaleObjectFunction,
    xScaleMini: ScaleObjectFunction,
    onTimeChanged: PropTypes.func.isRequired,
    currentSpeed: PropTypes.number.isRequired,
    isToggled: PropTypes.bool.isRequired,
    isPlaying: PropTypes.bool.isRequired,
    currentTime: PropTypes.number.isRequired,
  }
  static translate = (x, y = 0) => ({transform: `translate(${x}, ${y})`})
  static middleValue = (min, middle, max) => Math.min(Math.max(min, middle), max)

  getWidth = () => this.props.xScale.range()[1]
  getHeight = () => this.props.yScale.range()[0]
  setDrag = element => {
    this.drag = d3.select(element)
    this.drag.call(this._onDrag)
  }
  refWhiteLine = whiteLine => this.whiteLine = d3.select(whiteLine)

  _onDrag = d3.drag().on('drag', () => {
    const props = this.props
    const {middleValue} = BrushCircleGroup
    const currentDate = props.xScaleMini.invert(middleValue(0, d3.event.x, this.getWidth()))
    props.onTimeChanged(currentDate.getTime())
  })

  componentDidUpdate() {
    const props = this.props
    const {translate} = BrushCircleGroup
    let td = x => x
    if (props.isPlaying) {
      td = x => x.transition().ease(d3.easeLinear).duration(400 / this.props.currentSpeed)
    }
    td(this.whiteLine).attrs(translate(props.xScale(props.currentTime)))
    td(this.drag).attrs(translate(props.xScaleMini(props.currentTime)))
  }


  render() {
    const props = this.props
    const {translate} = BrushCircleGroup
    const [width, height] = [this.getWidth(), this.getHeight()]
    let y = -(height + 50)
    let x = props.xScale(props.currentTime)
    const visibility = x < 0 || x > width ? 'hidden' : 'visible'
    const whiteLineAttrs = {height: -(y + 13), y, visibility}

    if (props.isToggled) {
      Object.assign(whiteLineAttrs, {height: 15, y: y + 30})
    }

    return <g>
      <rect width="1" fill="white" className="whiteLine" {...whiteLineAttrs} ref={this.refWhiteLine} />
      <g className="brushCircleGroup" ref={this.setDrag}>
        <rect className={styles['brush-circle']} height="14" width="14" rx="9" ry="12"
              strokeWidth="1" transform="translate(-6.5, -5)" />
        <rect width="1" fill="white" height="50" {...translate(0, props.isToggled ? 17 : 27)} />
      </g>
    </g>
  }
}
