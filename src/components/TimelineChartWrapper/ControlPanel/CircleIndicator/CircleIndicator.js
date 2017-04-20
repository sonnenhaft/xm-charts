import React, {Component, PropTypes} from 'react'
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

  static defaultProps = {percent: 0, small: false}
  static propTypes = {percent: between({gte: 0, lte: 100}), small: PropTypes.bool}

  static RADIUS = 107
  static WIDTH = 14
  static ANIMATION_DURATION = 150
  static td = selection => selection.transition().duration(CircleIndicator.ANIMATION_DURATION)

  constructor(props) {
    super(props)
    this.id = CircleIndicator.counter++
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
    const {percent} = this.props
    const td = CircleIndicator.td
    const {path, circle, text: textBlock} = this
    const percentNumbered = percent/100

    td(path).attrTween('d', this.arcTween(-(1 - percentNumbered) * this.TAU))
    td(circle).attr('opacity', percent > 80 ? 1 : 0)
    td(textBlock).tween('text', function() {
      const i = d3.interpolate(this.textContent - 0, percent*10)
      return t => {
        let percentTime = i(t)/10
        if (percentTime > 10) {
          percentTime = Math.round(percentTime)
        } else {
          percentTime = percentTime.toFixed(1)
        }
        textBlock.text(percentTime)
      }
    })
  }

  render() {
    const {Gradient, WIDTH: strokeWidth, RADIUS} = CircleIndicator
    const r = RADIUS - strokeWidth / 2
    const id = this.id
    const isSmall = this.props.small

    let smallClass = isSmall ? styles['small-circle'] : ' '
    return <div className={styles['circle-indicator']}>
      <svg viewBox="-10 -10 220 220" ref={svg => this.svg = d3.select(svg)}>
        <defs>
          <Gradient id={`redyel${id}`} startColor="#35ABEC" stopColor="#356ADE" x1="0" y1="0" x2="1" y2="1" />
          <Gradient id={`yelgre${id}`} startColor="#356ADE" stopColor="#3547D7" x1="0" y1="0" x2="0" y2="1" />
          <Gradient id={`grecya${id}`} startColor="#3547D7" stopColor="#713DBD" x1="1" y1="0" x2="0" y2="1" />
          <Gradient id={`cyablu${id}`} startColor="#713DBD" stopColor="#D91E5D" x1="1" y1="1" x2="0" y2="0" />
          <Gradient id={`blumag${id}`} startColor="#D91E5D" stopColor="#EB0021" x1="0" y1="1" x2="0" y2="0" />
          <Gradient id={`magred${id}`} startColor="#EB0021" stopColor="#EB001E" x1="0" y1="1" x2="1" y2="0" />
        </defs>

        <g fill="none" strokeWidth="11" transform="translate(100,100)" visibility="hidden"
           ref={g => this.g = d3.select(g)}>
          <path d="M 0,-100 A 100,100 0 0,1 86.6,-50" stroke={`url(#redyel${id})`} />
          <path d="M 86.6,-50 A 100,100 0 0,1 86.6,50" stroke={`url(#yelgre${id})`} />
          <path d="M 86.6,50 A 100,100 0 0,1 0,100" stroke={`url(#grecya${id})`} />
          <path d="M 0,100 A 100,100 0 0,1 -86.6,50" stroke={`url(#cyablu${id})`} />
          <path d="M -86.6,50 A 100,100 0 0,1 -86.6,-50" stroke={`url(#blumag${id})`} />
          <path d="M -86.6,-50 A 100,100 0 0,1 0,-100" stroke={`url(#magred${id})`} />

          <circle ref={circle => this.circle = d3.select(circle)} stroke="red" {...{strokeWidth, r}} />
          <path ref={path => this.path = d3.select(path)} fill="#1C1C1C" />
        </g>
      </svg>
      <div className={styles['circle-text']}>
        <div className={styles['circle-text-wrapper']}>
          <span className={`${styles['circle-text-number']  } ${  smallClass}`} ref={text => this.text = d3.select(text)}>0</span>
          {!isSmall && <small>%</small>}
        </div>
      </div>
    </div>
  }
}
