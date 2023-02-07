import React, {Component} from 'react';
import {BrowserRouter, Switch} from 'react-router-dom';
import './App.scss';

// Containers
import AuthRoute from './components/AuthRoute';

import {history} from './redux/CreateStore';
import {ConnectedRouter} from 'connected-react-router';
import {ToastContainer, toast} from "react-toastify";
import {connect} from "react-redux";
import 'react-toastify/dist/ReactToastify.min.css'
import {NativeEventSource, EventSourcePolyfill} from 'event-source-polyfill';
import {Position, Type} from "./constants/Notifications";
import CookiesProvider from "react-cookie/lib/CookiesProvider";
import Config from './Config';


const Layout = React.lazy(() => import('./views/Layout/Layout'));
const Login = React.lazy(() => import('./views/Login/Login'));
const LAD = React.lazy(() => import('./views/Customer_admin/LAD'));
const CPR = React.lazy(() => import('./views/Customer_admin/CPR'));
const EventSource = NativeEventSource || EventSourcePolyfill;
// OR: may also need to set as global property
global.EventSource =  NativeEventSource || EventSourcePolyfill;

class App extends Component {

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.notification.created !== prevProps.notification.created) {
      const message = this.props.notification.message;
      toast(message, { type: this.props.notification.type, position: this.props.notification.position});
    }
    if (this.props.token !== prevProps.token) {
      this.subscribeNotification();
    }
  }

  componentDidMount() {
    this.subscribeNotification();
  }

  subscribeNotification = () => {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    if (!this.props.token) {
      return;
    }
    const eventSource = new EventSource(Config.eventSourceEndPoint + '/notification/subscribe?access_token=' + this.props.token, {withCredentials: false});
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.message) {toast(data.message, {type: data.type || Type.INFO, position: Position.TOP_RIGHT, autoClose: false});}
      } catch(ex){console.log(ex);}
    };
    this.eventSource = eventSource
  };

  render() {
    return (
      <CookiesProvider>
        <BrowserRouter>
        <ConnectedRouter history={history}>
            <Switch>
              <AuthRoute exact path="/login" name="Login Page" component={Login} dataKey="login" key="login" />
              <AuthRoute path="/LAD" name="Label Definition" component={LAD} dataKey="LAD" key="LAD"/>
              <AuthRoute path="/CPR" name="Call Processing" component={CPR} dataKey="CPR" key="CPR" />
              <AuthRoute path="/" name="Home" component={Layout} dataKey="home" key="home" />
            </Switch>
        </ConnectedRouter>
        </BrowserRouter>
        <ToastContainer autoClose={2000} hideProgressBar/>
      </CookiesProvider>
    );
  }
}

export default connect((state) => ({notification: state.notification, token: state.auth.token}))(App);
