import React from 'react'
import Router from 'react-router-dom/HashRouter'
import { Route } from 'react-router-dom'
import Sample from './components/Sample'

const App = () => (
  <Router>
    <Route exact path="/" component={ Sample } />
  </Router>
)


export default App


