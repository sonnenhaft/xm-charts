import React, {Component} from 'react'
import SimulationChart from 'charts/components/SimulationChart'
import generateDemoData from './generateDemoData'
import './Demo.scss'

const data = generateDemoData()
const version = `${process.env.npm_package_name} v${process.env.npm_package_version}`

const Bar = ({className}) => (<div className={className}>Toolbar here ({version})</div>)

class Demo extends Component {
  render() {
    return (
      <div styleName="root">
        <Bar styleName="toolbar"/>
        <SimulationChart styleName="simulation-chart" events={data.events} nodes={data.nodes}/>
      </div>
    )
  }
}

// class Demo extends Component {
//   constructor(props) {
//     super(props)
//     this.demoDataArray = [generateDemoData()]
//   }
//
//   addSomeValues = () => {
//     this.demoDataArray = this.demoDataArray.map(data => ({ ...data }))
//     this.demoDataArray.forEach(({ events }) => {
//       const lastevent = events[events.length - 1]
//       const event = Object.assign({}, lastevent)
//       event.date += (lastevent.date - events[0].date) / events.length
//       event.networkSuperiority += event.networkSuperiority / events.length
//       event.compromized = !Math.round(Math.random())
//       event._id = Date.now()
//       events.push(event)
//     })
//
//     this.forceUpdate()
//   }
//
//   startInterval = () => {
//     this.interval = setInterval(this.addSomeValues, 500)
//     this.forceUpdate()
//   }
//   stopInterval = () => {
//     clearInterval(this.interval)
//     this.interval = null
//     this.forceUpdate()
//   }
//
//   render() {
//     const { interval, demoDataArray } = this
//     const { addSomeValues } = this
//     const generatorFn = interval ? this.stopInterval : this.startInterval
//
//     return <div>
//       <div className={styles['Demo-buttons']}>
//         <button className={styles['button']} onClick={addSomeValues}>
//           Add some values
//         </button>
//         <button className={styles['button']} onClick={generatorFn}>
//           {interval ? 'Stop' : 'Start'} 1/2s generator
//         </button>
//       </div>
//
//       {demoDataArray.map(({ events, nodes }, index) =>
//         <div key={index}>
//           <SimulationChart {...{ events, nodes }} />
//           <br />
//         </div>)}
//
//       <div className={styles['version']}>{version}</div>
//       <style>{'body{margin:0}'}</style>
//     </div>
//   }
// }

export default Demo
