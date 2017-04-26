import React, { Component } from 'react'

import { arc, select, interpolate, interpolateRound } from 'd3'
import '../../../common/d3.shims'
import './CircleIndicator.scss'
import between from 'airbnb-prop-types/build/between'

const d3 = { arc, select, interpolate, interpolateRound }

let counter = 0

const RADIUS = 107
const WIDTH = 14

const td = selection => selection.transition().duration(150)

const Gradient = ({ startColor, stopColor, x1, x2, y1, y2, id }) => {
  return <linearGradient gradientUnits="objectBoundingBox" {...{ x1, x2, y1, y2, id }}>
    <stop offset="0%" stopColor={startColor} />
    <stop offset="100%" stopColor={stopColor} />
  </linearGradient>
}

export default class CircleIndicator extends Component {
  static defaultProps = { percent: 0 }
  static propTypes = { percent: between({ gte: 0, lte: 100 }) }

  constructor(props) {
    super(props)
    this.id = counter++
    const arc = this.arc = d3.arc()
      .innerRadius(RADIUS - WIDTH)
      .outerRadius(RADIUS)
      .startAngle(0)
      .cornerRadius(-10)

    this.arcTween = newAngle => d => {
      const interpolate = d3.interpolate(d.endAngle, newAngle)
      return function(t) {
        d.endAngle = interpolate(t)
        return arc(d)
      }
    }
  }

  componentDidMount() {
    const endAngle = -(2 * Math.PI)
    this.root.select('.path').datum({ endAngle }).attr('d', this.arc)
    setTimeout(() => this.componentDidUpdate())
  }

  shouldComponentUpdate({ percent }) {
    return this.props.percent !== percent
  }

  componentDidUpdate() {
    this.root.select('.g').attr('visibility', 'visible') // prevents bad view before app loaded
    const percent = this.props.percent
    const percentNumbered = percent / 100

    td(this.root.select('.path')).attrTween('d', this.arcTween(-(1 - percentNumbered) * 2 * Math.PI))
    td(this.root.select('.circle')).attr('opacity', percent > 80 ? 1 : 0)

    const textBlock = this.root.select('.textBlock')
    td(textBlock).tween('text', function() {
      const i = d3.interpolate(this.textContent - 0, percent * 10)
      return t => {
        let percentTime = i(t) / 10
        if ( percentTime > 10 ) {
          percentTime = Math.round(percentTime)
        } else {
          percentTime = percentTime.toFixed(1)
        }
        textBlock.text(percentTime)
      }
    })
  }

  render() {
    const strokeWidth = WIDTH
    const r = RADIUS - strokeWidth / 2
    const id = this.id

    return <div styleName="circle-indicator" ref={root => this.root = d3.select(root)}>
      <svg viewBox="-10 -10 220 220">
        <defs>
          <Gradient id={`redyel${id}`} startColor="#35ABEC" stopColor="#356ADE" x1="0" y1="0" x2="1" y2="1" />
          <Gradient id={`yelgre${id}`} startColor="#356ADE" stopColor="#3547D7" x1="0" y1="0" x2="0" y2="1" />
          <Gradient id={`grecya${id}`} startColor="#3547D7" stopColor="#713DBD" x1="1" y1="0" x2="0" y2="1" />
          <Gradient id={`cyablu${id}`} startColor="#713DBD" stopColor="#D91E5D" x1="1" y1="1" x2="0" y2="0" />
          <Gradient id={`blumag${id}`} startColor="#D91E5D" stopColor="#EB0021" x1="0" y1="1" x2="0" y2="0" />
          <Gradient id={`magred${id}`} startColor="#EB0021" stopColor="#EB001E" x1="0" y1="1" x2="1" y2="0" />
        </defs>

        <g fill="none" strokeWidth="11" transform="translate(100,100)" visibility="hidden"
           className="g">
          <path d="M 0,-100 A 100,100 0 0,1 86.6,-50" stroke={`url(#redyel${id})`} />
          <path d="M 86.6,-50 A 100,100 0 0,1 86.6,50" stroke={`url(#yelgre${id})`} />
          <path d="M 86.6,50 A 100,100 0 0,1 0,100" stroke={`url(#grecya${id})`} />
          <path d="M 0,100 A 100,100 0 0,1 -86.6,50" stroke={`url(#cyablu${id})`} />
          <path d="M -86.6,50 A 100,100 0 0,1 -86.6,-50" stroke={`url(#blumag${id})`} />
          <path d="M -86.6,-50 A 100,100 0 0,1 0,-100" stroke={`url(#magred${id})`} />

          <circle className="circle" stroke="red" {...{ strokeWidth, r }} />
          <path className="path" fill="#1C1C1C" />
        </g>
      </svg>
      <div styleName="circle-text">
        <div styleName="circle-text-wrapper">
          <span styleName="circle-text-number" className="textBlock">0</span>
          <small>%</small>
        </div>
      </div>
    </div>
  }
}
