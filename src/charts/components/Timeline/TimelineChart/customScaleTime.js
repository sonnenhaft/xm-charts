import d3 from 'charts/utils/decorated.d3.v4'

// please note that similar, but not customizable code you will find in d3 js library itself
// unfortunately this code does not depend on local object
const {
  timeFormat,
  timeYear,
  timeMonth,
  timeWeek,
  timeDay,
  timeHour,
  timeMinute,
  timeSecond,
} = d3

const formatMillisecond = timeFormat('.%L')
const formatSecond = timeFormat(':%S')
const formatMinute = timeFormat('%H:%M')
const formatHour = timeFormat('%H:%M')
const formatDay = timeFormat('%a %d')
const formatWeek = timeFormat('%b %d')
const formatMonth = timeFormat('%B')
const formatYear = timeFormat('%Y')

export const tickFormat = date => {
  const formatDate = (timeSecond(date) < date ? formatMillisecond
    : timeMinute(date) < date ? formatSecond
      : timeHour(date) < date ? formatMinute
        : timeDay(date) < date ? formatHour
          : timeMonth(date) < date ? (timeWeek(date) < date ? formatDay : formatWeek)
            : timeYear(date) < date ? formatMonth : formatYear)

  return formatDate(date)
}
