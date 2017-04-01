import loremIpsum from 'lorem-ipsum'
import Chance from 'chance'

const chance = new Chance()

export default isYearly => {
  const CAMPAINS_NUMBER = isYearly ? 10 : 3
  const EVENTS_IN_CAMPAIN = isYearly ? 100 : 30
  const campains = []

  for (let campainId = 1; campainId < CAMPAINS_NUMBER; campainId++) {
    let events = []
    const campain = { id: campainId, events }

    let maxDate = new Date()
    const DAY = 60*60*1000*24
    const minDate = new Date(Date.now() - (isYearly ? 365*DAY : DAY))

    for (let eventId = 1; eventId < EVENTS_IN_CAMPAIN; eventId++) {
      events.push({
        id: `${eventId  }_${  campainId}`,
        name: loremIpsum({ count: 2, units:'words' }).split(' ').join('-'),
        method: loremIpsum({ count: 2, units:'words' }),
        source: loremIpsum({ count: 2, units:'words' }),
        campainId,
        flag: chance.pickone(['asset', 'deviceSvgIcon']),
        compromized: chance.bool(),
        date: chance.hammertime({ min: minDate, max: maxDate }),
      })
    }
    events = events.sort((a, b) => a.date > b.date ? 1 : -1)

    const compromizedEvents = events.filter(({ compromized }) => compromized)
    if (compromizedEvents.length) {
      const firstCompromized = compromizedEvents[0]
      firstCompromized.firstInSubnet = true
    }
    if (compromizedEvents.length > 1) {
      const lastCompromized = compromizedEvents[compromizedEvents.length - 1]
      lastCompromized.lastInSubnet = chance.bool()
    }

    if (chance.bool()) {
      campain.terminatedAt = campain.events[campain.events.length - 1].date
    }

    campains.push(campain)
  }
  return campains
}
