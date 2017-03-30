import React from 'react'
import Router from 'react-router-dom/HashRouter'
import { Route } from 'react-router-dom'
import Demo from './components/Demo'

const App = () => (
  <Router>
    <Route exact path="/" component={ Demo } />
  </Router>
)

export default  App


