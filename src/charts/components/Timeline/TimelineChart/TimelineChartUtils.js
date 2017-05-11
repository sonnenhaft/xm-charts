import d3 from 'charts/utils/decorated.d3.v4'

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

