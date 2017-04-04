import {scaleQuantile} from 'd3'

const NANO = 0.001
const MICRO = 1
const SECOND = 1000
const MINUTE = SECOND * 60
const HOUR = MINUTE * 60
const DAY = HOUR * 24
const YEAR = 1000 * 60 * 60 * 24 * 365
const MONTH = YEAR / 12

export default scaleQuantile()
  .domain([YEAR, MONTH, DAY, HOUR, MINUTE, SECOND, MICRO, NANO].reverse())
  .range(['Years', 'Months', 'Days', 'Minutes', 'Seconds', 'Millis', 'Micros', 'Nanos'].reverse())
