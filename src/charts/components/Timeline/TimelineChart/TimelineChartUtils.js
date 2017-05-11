import d3 from 'charts/utils/decorated.d3.v4'
import styles from './TimelineChart.scss'

export const composeCircles = (data, width, groupWidth) => {
  const firstInSubnet = data.filter(({ firstInSubnet }) => firstInSubnet)
  const rounderRange = d3.scaleQuantile()
    .domain([data[0].date, data[data.length - 1].date])
    .range(d3.range(0, width / groupWidth))

  const groupedRedLines = firstInSubnet.reduce((map, item) => {
    const groupedRedLines = rounderRange(item.date)
    if ( map[groupedRedLines] ) {
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
      const date = Math.round(d3.sum(items, ({ date }) => date) / items.length)
      items.forEach(item => {
        firstInSubnet.splice(firstInSubnet.indexOf(item), 1)
      })
      return { date, value: items.length, id: date }
    })

  return { bulkLines, firstInSubnet }
}

export const calculatePath = ({ min, max, data, events }) => {
  if ( data.length ) {
    let [first] = data
    let last = first
    if ( data.length > 1 ) {
      last = data[data.length - 1]
    }
    data = [
      { date: min, networkSuperiority: first.networkSuperiority },
      ...data,
      { date: max, networkSuperiority: last.networkSuperiority },
    ]
  } else if ( events.length ) {
    const minIdx = events.findIndex(({ date }) => date > min)
    const { networkSuperiority } = events[Math.max(minIdx - 1, 0)]
    data = [{ date: min, networkSuperiority }, { date: max, networkSuperiority }]
  }
  return data
}

export const renderCircles = ({ g, data, x, height, bulkLines, firstInSubnet, actions, isToggled }) => {
  const lastInSubnet = data.filter(({ lastInSubnet }) => lastInSubnet)
  const radius = 8
  height = isToggled ? 54 : height + radius * 2
  const offset = isToggled ? -40 : 0

  const allCirclesData = [...firstInSubnet, ...lastInSubnet, ...bulkLines]
  const enteredSelection = g.selectAll('.bulkBlock').data(allCirclesData, ({ id }) => id)
  enteredSelection.exit().remove()

  const mergedSelection = enteredSelection.enter().append('g')
    .attr('class', 'bulkBlock').html(({ value }) => `<g class="${styles['circle-group-wrapper']}">
     <g>
      <rect class="whiteShadowRect ${styles['white-shadow-rect']}" width="${(radius + 1) * 2}"></rect>
      <circle class="${styles['circle-wrapper']} ${value ? '' : styles['no-value']}" r="${radius}"></circle>
      <rect class="${styles['red-bulk-line']}" width="${radius / 4}"></rect>
    </g>
    <g>
      <circle class="${styles['red-bulk-circle']}" r="${value ? radius : radius / 2}"></circle>
      <text class="${styles['circle-text']}">${value || ''}</text>     
    </g>
</g>`)

  const opt_attrs = { transform: d => `translate(${x(d)}, ${-radius * 2 + offset})`, ...actions }
  const allElements = mergedSelection.attrs(opt_attrs).merge(enteredSelection)
  allElements.attrs(opt_attrs, true)

  allElements.each(function () {
    const g = d3.select(this)
    const { firstInSubnet } = g.datum()
    g.select('.whiteShadowRect').attrs({ opacity: firstInSubnet ? 0.2 : 0, height })
    g.select(`.${styles['red-bulk-line']}`).attrs({ height: height - radius / 2 - 2 })
  })
}
