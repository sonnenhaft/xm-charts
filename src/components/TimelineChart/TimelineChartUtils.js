import * as d3 from 'd3'
import '../common/d3.shims'
import styles from './TimelineChart.scss'

export const composeCircles = (data, width, groupWidth) => {
  const firstInSubnet = data.filter(({firstInSubnet}) => firstInSubnet)
  const rounderRange = d3.scaleQuantile()
    .domain([data[0].date, data[data.length - 1].date])
    .range(d3.range(0, width / groupWidth))

  const groupedRedLines = firstInSubnet.reduce((map, item) => {
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
    .filter(items => items.length > 2 || items[1].date - items[0].date <= groupWidth)
    .map(items => {
      const date = Math.round(d3.sum(items, ({date}) => date) / items.length)
      items.forEach(item => {
        firstInSubnet.splice(firstInSubnet.indexOf(item), 1)
      })
      return {date, value: items.length, id: date}
    })

  return {bulkLines, firstInSubnet}
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

  td(linePath).attr('d', d3.line().x(x).y(y).curve(d3.curveBundle.beta(0.97))(data))
}

export const renderCircles = ({g, data, x, height, duration, bulkLines, firstInSubnet, actions, isToggled, opacity}) => {
  const lastInSubnet = data.filter(({lastInSubnet}) => lastInSubnet)
  const radius = 8
  height = isToggled ? 54 : height + radius * 2
  const offset = isToggled ? -40 : 0

  const allCirclesData = [...firstInSubnet, ...lastInSubnet, ...bulkLines]
  const enteredSelection = g.selectAll('.bulkBlock').data(allCirclesData, ({id}) => id)
  enteredSelection.exit().remove()

  const mergedSelection = enteredSelection.enter().append('g')
    .attr('class', 'bulkBlock').html(({value}) => `<g transform="translate(1, 0)">
    <rect fill="#EB001E"  pointer-events="none" class="white-shadow-rect"
        transform="translate(${-(radius + 1)})"    width="${(radius + 1) * 2}"></rect>
     <circle class="circleWrapper" fill="#252525"  stroke-opacity="${value ? 0.3 : 1}"
        stroke-width="${value ? 4 : 2}"  r="${radius}" stroke="#EB001E"></circle>
     <circle class="${styles['red-bulk-circle']}" r="${value ? radius : radius / 2}" fill="#EB001E"></circle>
     <rect class="${styles['red-bulk-line']}" width="${radius / 4}" pointer-events="none"
        transform="translate(${-radius / 8}, ${radius - 1})" ></rect>
     <text transform="translate(0, 3.5)" class="${styles['circle-text']}">${value || ''}</text>
  </g>`)

  const opt_attrs = {opacity, transform: d => `translate(${x(d)}, ${-radius * 2 + offset})`, ...actions}
  const allElements = mergedSelection.attrs(opt_attrs).merge(enteredSelection)
  allElements.transition().duration(duration).attrs(opt_attrs, true)

  const td = selection => selection.transition().duration(duration)
  allElements.each(function() {
    const g = d3.select(this)
    const {firstInSubnet} = g.datum()
    td(g.select('.white-shadow-rect')).attrs({opacity: firstInSubnet ? 0.2 : 0, height})
    td(g.select(`.${styles['red-bulk-line']}`)).attrs({height: height - radius / 2 - 2})
  })
}
