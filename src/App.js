import React from 'react'
import Router from 'react-router-dom/HashRouter'
import { Route } from 'react-router-dom'
import Demo from './app/components/Demo'
import Animations from './animations/components/Sample'
import Loader from './animations/components/Loader'
import Navigation from './animations/components/Navigation'

const App = () => (
  <Router>
    <div>
      <Route exact path="/" component={Demo} />
      <Route exact path="/animations" component={Animations} />
      <Route exact path="/loader" component={Loader} />
      <Route exact path="/navigation" component={Navigation} />
    </div>
  </Router>
)

export default  App
