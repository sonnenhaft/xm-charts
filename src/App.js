import React from 'react'
import Router from 'react-router-dom/HashRouter'
import { Route } from 'react-router-dom'
import Demo from './app/components/Demo'
import Animations from './animations/components/Sample'

const App = () => (
  <Router>
    <div>
      <Route exact path="/" component={Demo} />
      <Route exact path="/animations" component={Animations} />
    </div>
  </Router>
)

export default  App
