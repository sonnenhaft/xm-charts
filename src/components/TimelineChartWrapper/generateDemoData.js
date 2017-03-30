import loremIpsum from 'lorem-ipsum'

export default isYearly => {
  const r = number => Math.round(number / 2 + Math.random() * number / 2)
  const rr = number => Math.round(Math.random() * number)
  const randBool = () => !![true, false][rr(1)]

  const CAMPAINS_NUMBER = r(10)
  const START_DATE = Date.now()
  const campains = []

  let startedAt = START_DATE
  for (let campainId = 1; campainId < CAMPAINS_NUMBER; campainId++) {
    startedAt += rr(1000)
    const events = []
    const campain = { id: campainId, startedAt, events }

    const EVENTS_NUMBER = r(isYearly ? 100 : 30)
    const HOURLY = 1000 * 60 * 60
    const YEARLY = HOURLY * 24 * 365
    let eventStartedAd = startedAt
    for (let eventId = 1; eventId < EVENTS_NUMBER; eventId++) {
      eventStartedAd += (eventId ? rr(isYearly ? YEARLY : HOURLY) : 0)
      events.push({
        id: `${eventId  }_${  campainId}`,
        name: loremIpsum({ count: 2, units:'words' }).split(' ').join('-'),
        method: loremIpsum({ count: 2, units:'words' }),
        source: loremIpsum({ count: 2, units:'words' }),
        campainId,
        flag: ['asset', 'deviceSvgIcon'][r(1)],
        compromized: randBool(),
        date: eventStartedAd,
      })
    }

    const compromizedEvents = events.filter(({ compromized }) => compromized)
    if (compromizedEvents.length) {
      const firstCompromized = compromizedEvents[0]
      firstCompromized.firstInSubnet = true
    }
    if (compromizedEvents.length > 1) {
      const lastCompromized = compromizedEvents[compromizedEvents.length - 1]
      lastCompromized.lastInSubnet = randBool()
    }

    if (randBool()) {
      campain.terminatedAt = campain.events[campain.events.length - 1].date
    }

    campains.push(campain)
  }
  return campains
}
