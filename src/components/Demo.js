import React, {Component} from 'react'
import TimelineChartWrapper from './TimelineChartWrapper/TimelineChartWrapper'
import generateDemoData, {createEvent} from './TimelineChartWrapper/generateDemoData/generateDemoData'

import packageJson from '../../package.json'
import styles from './Demo.scss'

class Demo extends Component {
  constructor(props) {
    super(props)
    this.demoDataArray = [
      generateDemoData(true),
      // generateDemoData(),
    ]
  }

  addSomeValues = () => {
    this.demoDataArray = this.demoDataArray.map(data => ({...data}))
    this.demoDataArray.forEach(({nodes, campains, events}) => {
      const lastCampain = campains[campains.length - 1].events
      const {date, campainId} = lastCampain[lastCampain.length - 1]
      const eventId = lastCampain.length
      const maxDate = new Date()
      const minDate = new Date(maxDate + (maxDate - date))
      let event = createEvent({eventId, campainId, minDate, maxDate, nodes})
      events.push(event)
      lastCampain.push(event)
    })

    this.forceUpdate()
  }

  startInterval = () => {
    this.interval = setInterval(this.addSomeValues, 500)
    this.forceUpdate()
  }
  stopInterval = () => {
    clearInterval(this.interval)
    this.interval = null
    this.forceUpdate()
  }

  render() {
    const {interval, demoDataArray} = this
    const {addSomeValues} = this
    const generatorFn = interval ? this.stopInterval : this.startInterval

    return <div>
      <div className={styles['demo-buttons']}>
        <button className={styles['button']} onClick={addSomeValues}>
          Add some values
        </button>
        <button className={styles['button']} onClick={generatorFn}>
          {interval ? 'Stop' : 'Start'} 1/2s generator
        </button>
      </div>

      {demoDataArray.map((chartData, index) =>
        <div key={index}>
          <TimelineChartWrapper {...{chartData}} />
          <br />
        </div>)}

      <div className={styles['version']}>{packageJson.name} v{packageJson.version}</div>
      <style>{'body{margin:0}'}</style>
    </div>
  }
}

export default Demo
