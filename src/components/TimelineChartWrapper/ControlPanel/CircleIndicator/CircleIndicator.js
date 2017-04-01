import React, {Component} from 'react'
import {arc, select, interpolate, interpolateRound} from 'd3'
import '../../../common/d3.shims'
import styles from './CircleIndicator.scss'
import between from 'airbnb-prop-types/build/between'

const d3 = {arc, select, interpolate, interpolateRound}

export default class CircleIndicator extends Component {
  static counter = 0
  static Gradient = ({startColor, stopColor, x1, x2, y1, y2, id}) => {
    return <linearGradient gradientUnits="objectBoundingBox" {...{x1, x2, y1, y2, id}}>
      <stop offset="0%" stopColor={startColor} />
      <stop offset="100%" stopColor={stopColor} />
    </linearGradient>
  }

  static defaultProps = {percent: 0}
  static propTypes = {percent: between({gte: 0, lte: 1})}

  static RADIUS = 108
  static WIDTH = 16
  static ANIMATION_DURATION = 750
  static td = selection => selection.transition().duration(CircleIndicator.ANIMATION_DURATION)

  constructor(props) {
    super(props)
    CircleIndicator.counter++
    this.id = CircleIndicator.counter
    const {RADIUS, WIDTH} = CircleIndicator
    const arc = d3.arc().innerRadius(RADIUS - WIDTH).outerRadius(RADIUS).startAngle(0)
      .cornerRadius(-10)
    const TAU = 2 * Math.PI
    const arcTween = newAngle => d => {
      const interpolate = d3.interpolate(d.endAngle, newAngle)
      return function(t) {
        d.endAngle = interpolate(t)
        return arc(d)
      }
    }

    Object.assign(this, {arcTween, TAU, RADIUS, arc, WIDTH})
  }

  componentDidMount() {
    const endAngle = -this.TAU
    this.path.datum({endAngle}).attr('d', this.arc)
    setTimeout(() => this.componentDidUpdate())
  }

  shouldComponentUpdate({percent}) {
    return this.props.percent !== percent
  }

  componentDidUpdate() {
    this.g.attr('visibility', 'visible') // prevents bad view before app loaded
    const percent = this.props.percent
    const td = CircleIndicator.td
    const {path, circle, text: textBlock} = this

    td(path).attrTween('d', this.arcTween(-(1 - percent) * this.TAU))
    td(circle).attr('opacity', percent > 0.8 ? 1 : 0)
    td(textBlock).tween('text', function() {
      const i = d3.interpolateRound(this.textContent - 0, percent * 100)
      return t => textBlock.text((i(t)))
    })
  }

  render() {
    const {Gradient, WIDTH: strokeWidth, RADIUS} = CircleIndicator
    const r = RADIUS - strokeWidth / 2

    return <div className={styles['circle-indicator']}>
      <svg viewBox="-10 -10 220 220" ref={svg => this.svg = d3.select(svg)}>
        <defs>
          <Gradient id={`redyel${this.id}`} startColor="#35ABEC" stopColor="#356ADE" x1="0" y1="0" x2="1" y2="1" />
          <Gradient id={`yelgre${this.id}`} startColor="#356ADE" stopColor="#3547D7" x1="0" y1="0" x2="0" y2="1" />
          <Gradient id={`grecya${this.id}`} startColor="#3547D7" stopColor="#713DBD" x1="1" y1="0" x2="0" y2="1" />
          <Gradient id={`cyablu${this.id}`} startColor="#713DBD" stopColor="#D91E5D" x1="1" y1="1" x2="0" y2="0" />
          <Gradient id={`blumag${this.id}`} startColor="#D91E5D" stopColor="#EB0021" x1="0" y1="1" x2="0" y2="0" />
          <Gradient id={`magred${this.id}`} startColor="#EB0021" stopColor="#EB001E" x1="0" y1="1" x2="1" y2="0" />
        </defs>

        <g fill="none" strokeWidth="15" transform="translate(100,100)" visibility="hidden"
           ref={g => this.g = d3.select(g)}>
          <path d="M 0,-100 A 100,100 0 0,1 86.6,-50" stroke={`url(#redyel)${this.id}`} />
          <path d="M 86.6,-50 A 100,100 0 0,1 86.6,50" stroke={`url(#yelgre)${this.id}`} />
          <path d="M 86.6,50 A 100,100 0 0,1 0,100" stroke={`url(#grecya)${this.id}`} />
          <path d="M 0,100 A 100,100 0 0,1 -86.6,50" stroke={`url(#cyablu)${this.id}`} />
          <path d="M -86.6,50 A 100,100 0 0,1 -86.6,-50" stroke={`url(#blumag)${this.id}`} />
          <path d="M -86.6,-50 A 100,100 0 0,1 0,-100" stroke={`url(#magred)${this.id}`} />

          <circle ref={circle => this.circle = d3.select(circle)} stroke="red" {...{strokeWidth, r}} />
          <path ref={path => this.path = d3.select(path)} fill="#1C1C1C" />
        </g>
      </svg>
      <div className={styles['circle-text']}>
        <div className={styles['circle-text-wrapper']}>
          <span className={styles['circle-text-number']} ref={text => this.text = d3.select(text)}>0</span>
          <small>%</small>
        </div>
      </div>
    </div>
  }
}
