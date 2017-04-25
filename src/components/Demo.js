import React, {Component} from 'react'
import TimelineChartWrapper from './TimelineChartWrapper/TimelineChartWrapper'
import generateDemoData from './TimelineChartWrapper/generateDemoData/generateDemoData'
import styles from './Demo.scss'

const version = `${process.env.npm_package_name} v${process.env.npm_package_version}`

class Demo extends Component {
  constructor(props) {
    super(props)
    this.demoDataArray = [generateDemoData()]
  }

  addSomeValues = () => {
    this.demoDataArray = this.demoDataArray.map(data => ({...data}))
    this.demoDataArray.forEach(({events}) => {
      const lastevent = events[events.length - 1]
      const event = Object.assign({}, lastevent)
      event.date += (lastevent.date - events[0].date) / events.length
      event.networkSuperiority += event.networkSuperiority / events.length
      event.compromized = !Math.round(Math.random())
      event._id = Date.now()
      events.push(event)
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

      <div className={styles['version']}>{version}</div>
      <style>{'body{margin:0}'}</style>
    </div>
  }
}

export default Demo
