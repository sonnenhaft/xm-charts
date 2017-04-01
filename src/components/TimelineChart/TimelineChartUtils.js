import * as d3 from 'd3'
import '../common/d3.shims'
import styles from './TimelineChart.scss'

export const composeCircles = (data, width, groupWidth) => {
  const blueLines = data.filter(({compromized}) => !compromized)
  const redLines = data.filter(({compromized}) => compromized)

  const rounderRange = d3.scaleQuantile()
    .domain([redLines[0].date, redLines[redLines.length - 1].date])
    .range(d3.range(0, width / groupWidth))

  const groupedRedLines = redLines.reduce((map, item) => {
    const groupedRedLines = rounderRange(item.date)
    if (map[groupedRedLines]) {
      map[groupedRedLines].push(item)
    } else {
      map[groupedRedLines] = [item]
    }
    return map
  }, {})

  const bulkLines = Object.keys(groupedRedLines)
    .map(key => groupedRedLines[key])
    .filter(items => items.length > 1)
    .filter(items =>  items.length > 2 || items[1].date - items[0].date <= groupWidth)
    .map(items => {
      const date = Math.round(d3.sum(items, ({date}) => date) / items.length)
      return {date, value: items.length, id: date}
    })

  return {bulkLines, redLines, blueLines}
}

export const updateBrush = ({brusher, brushBehavior, brushCircle, xScale, currentZoom, width}) => {
  brusher.call(brushBehavior).call(brushBehavior.move, xScale.range().map(currentZoom.invertX, currentZoom))
  const brusherSelection = brusher.select('.selection')
  const brusherWidth = brusherSelection.attr('width') * 1
  const tooBig = brusherWidth === width
  brusherSelection.attrs({
    stroke: 'none',
    'fill-opacity': tooBig ? 0 : 0.3,
    'pointer-events': tooBig ? 'none' : 'all',
  })
  brushCircle.attrs({
    width: 10,
    transform: `translate(${brusherSelection.attr('x') / 1 + (tooBig ? 0 : (brusherWidth - 10) / 2) },-2)`,
  })
  brusher.selectAll('.handle').attr('pointer-events', brusherWidth < 16 ? 'none' : 'all')
}

export const renderPath = ({td, min, max, linePath, data, x, y, chartData}) => {
  if (data.length) {
    let first, last
    last = first = data[0]
    if (data.length > 1) {
      last = data[data.length - 1]
    }
    data = [{date: min, index: first.index}, ...data, {date: max, index: last.index}]
  } else if (chartData.length) {
    const minIdx = chartData.findIndex(({date}) => date > min)
    const index = chartData[Math.max(minIdx - 1, 0)].index
    data = [{date: min, index}, {date: max, index}]
  }

  td(linePath).attr('d', d3.line().x(x).y(y).curve(d3.curveBundle.beta(0.9))(data))
}

export const renderCircles = ({g, data, x, height, duration, bulkLines, actions, isToggled}) => {
  const firstInSubnet = data.filter(({firstInSubnet}) => firstInSubnet)
  const lastInSubnet = data.filter(({lastInSubnet}) => lastInSubnet)
  let radius = 8
  height = height + radius * 2
  if (isToggled) {
    height = 22
  }

  g.bindData('g.bulkBlock', bulkLines.concat(firstInSubnet).concat(lastInSubnet), {
    transform: d => `translate(${x(d)}, ${-radius * 2})`,
    ...actions,
  }, duration).singleBind('rect.white-shadow-rect', {
      fill: '#EB001E',
      'pointer-events': 'none',
      opacity: ({firstInSubnet}) => firstInSubnet ? 0.2 : 0,
      width: (radius + 1) * 2,
      height,
      transform: `translate(${-(radius + 1)})`,
    },
    duration
  ).singleBind('circle.circleWrapper', {
    stroke: '#EB001E',
    fill: 'black',
    'stroke-opacity': ({value}) => value ? 0.3 : 1,
    'stroke-width': ({value}) => !value ? 2 : 4,
    r: radius,
  }).singleBind(`circle.${styles['red-bulk-circle']}`, {
    r: ({value}) => !value ? radius / 2 : radius,
  }).singleBind(`rect.${styles['red-bulk-line']}`, {
      width: radius / 4,
      height: height - radius / 2 - 2,
      'pointer-events': 'none',
      transform: `translate(${-radius / 8}, ${radius - 1})`,
    },
    duration
  ).singleBind(`text.${styles['circle-text']}`, {
    transform: 'translate(0, 3)',
    text: ({value}) => value,
  })
}
