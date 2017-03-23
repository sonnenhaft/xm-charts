// import {scaleLinear, select, tsvParse, max, axisBottom, axisLeft} from 'd3'
import * as d3 from 'd3'
import React, { Component } from 'react'
import './d3.shims'
/* eslint-disable */
import dataTsv from 'raw-loader!./data.tsv'
import styles from 'raw-loader!./TimelineChart.plain-css'
/* eslint-enable */

// const d3 = {scaleLinear, select, tsvParse, max, axisBottom, axisLeft}

export default class TimelineChart extends Component {
    constructor (props) {
        super(props)
        const xScale = d3.scaleLinear( )
        const yScale = d3.scaleLinear( ).domain([0, 1])
        const margin = { top: 20, right: 20, bottom: 30, left: 40 }
        Object.assign(this, { xScale, yScale, margin })
    }

    componentDidMount ( ) {
        const margin = this.margin
        this.g.attr('transform', `translate(${  margin.left  },${  margin.top  })`)
        window.addEventListener('resize', this.onWindowResize)
        this.setWidth( )
        this.applyDimensionsToScales( )

        const initData = d3.tsvParse(dataTsv, ({ date, type }) => ({ data: (date - 0), type }))
        this.initData = initData
        this.renderChart( )
        let isLong = false
        this.interval = setInterval(( ) => {
            isLong = !isLong
            if (isLong) {
                let maxIdx = initData.length - 1
                this.initData = initData.map(({ data, type }) => ({ data: data / 4 * 3, type }))
                this.initData[maxIdx] = initData[maxIdx]
            } else {
                this.initData = initData
            }
            this.renderChart( )
        }, 1000)
    }

    setWidth ( ) {
        const svg = d3.select(this.svg)
        const { margin } = this
        let w = this.svg.parentNode.clientWidth
        let h = Math.max(Math.min(200, w / 2))
        svg.attr('height', h)

        const width = w - margin.left - margin.right
        const height = h - margin.top - margin.bottom
        Object.assign(this, { width, height })
    }

    applyDimensionsToScales ( ) {
        const { width, height, xScale, yScale } = this
        xScale.rangeRound([0, width])
        yScale.rangeRound([height, 0])
        this.xAxis.attr('transform', `translate(0,${  height  })`)
    }

    renderChart (noDuration) {
        const { width, height, xScale, yScale, initData } = this
        const number = d3.max(initData, ({ data }) => data) * 1.5
        xScale.domain([0, number])

        this.xAxis.call(d3.axisBottom(xScale))
        this.yAxis.call(d3.axisLeft(yScale).ticks(5, '%').tickSize(-width))
        const data = initData.map(({ data, type }, index) => ({ data, index: index / 100, type }))
        const redData = data.filter(({ type }) => type === 'bad')
        const blueData = data.filter(({ type }) => type === 'good')
        const bulk = data.filter(({ type }) => type === 'bulk')

        this.g.transition( ).duration(noDuration ? 0 : 1000).each(( ) => {
            let x = ({ data }) => xScale(data)
            let y = ({ index }) => yScale(index)
            this.smalRects.bindData('rect', blueData, { 'class': 'bar', x, y: height }).attrs({ y })
            this.smalRects.bindData('rect', redData, { 'class': 'red-bar', x, y: height }).attrs({ y })
            this.bulkRects.bindData('rect', bulk, { 'class': 'red-bar-bulk', x, y: 0, height }).attrs({ x, height })
            this.g.bindData('circle', bulk, { 'class': 'red-circle', cy: 0, cx: x })
            this.g.bindData('rect', data, {
                'class': 'white-rect', y,
                x: (item, idx) => idx === 0 ? 0 : x(data[idx - 1]),
                width: (item, idx) => idx === 0 ? x(item) : x(item) - x(data[idx - 1]),
            })
        })
    }

    onWindowResize = ( ) => {
        this.setWidth( )
        this.applyDimensionsToScales( )
        if (this.initData) {
            this.renderChart(true)
        }
    }

    componentWillUnmount ( ) {
        clearInterval(this.interval)
        window.removeEventListener('resize', this.onWindowResize)
    }

    render ( ) {
        return <div>
            Timeline chart in here
            <svg ref={ svg => this.svg = svg }>
                <rect width="100%" height="100%" fill="#141414" />
                <g ref={ g => this.g = d3.select(g) } fill="white">
                    <g ref={ g => this.xAxis = d3.select(g) } className="axis axis--x" />
                    <g ref={ g => this.yAxis = d3.select(g) } className="axis axis--y" />
                    <g ref={ g => this.bulkRects = d3.select(g) } transform="translate(-1, 0)" />
                    <g ref={ g => this.smalRects = d3.select(g) } transform="translate(0, -5)" />
                </g>
            </svg>
            <style>{styles}</style>
        </div>
    }
}
