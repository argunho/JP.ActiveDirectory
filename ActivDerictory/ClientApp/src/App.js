import React, { Component } from 'react';
import { Route } from 'react-router';
import { Layout } from './components/Layout';
import { Switch, withRouter } from 'react-router-dom';
import { Home } from './components/pages/Home';
import { Login } from './components/pages/Login';
import { UserManager } from './components/pages/UserManager';
import { Search } from './components/pages/Search';

import './css/custom.css'

class App extends Component {
  static displayName = App.name;

  constructor() {
    super();
    this.state = {};
  }

  componentDidMount() {
    var token = sessionStorage.getItem("token");
    this.setState({ isAuthorized: (token !== null && token !== undefined) })
  }

  componentDidUpdate(prevProps) {
    if (this.props.location.pathname !== prevProps.location.pathname) {
      var token = sessionStorage.getItem("token");

      setTimeout(() => {
        this.setState({ isAuthorized: (token !== null && token !== undefined) })
      }, 100)
    }
  }

  render() {
    const { isAuthorized } = this.state;
    return (
      <Layout isAuthorized={this.state.isAuthorized}>
        <Switch>
          <Route exact path='/' render={(props) => <Home {...props} isAuthorized={isAuthorized} />} />
          <Route exact path='/login' component={Login} />
          <Route exact path='/find-user' component={Search} />
          <Route exact path='/manage-user/:id' component={UserManager} />
        </Switch>
      </Layout>
    );
  }
}

export default withRouter((props) => <App {...props} />);