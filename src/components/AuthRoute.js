import React from 'react'
import PropTypes from 'prop-types';
import {connect} from "react-redux";
import {Redirect, Route} from "react-router-dom";
import withSuspense from '../components/HOC/withSuspense';

// imporing related to session timeout
import IdleTimer from 'react-idle-timer';
import { instanceOf } from 'prop-types';
import { withCookies, Cookies } from 'react-cookie';
import {
  TIMEOUT_VALUE,
  LAST_ACTIVE_TIME_COOKIE_NAME,
  USER_LEAVE_TIMEOUT_GUESSING_VALUE,
  LAST_BEFORE_UNLOAD_EVENT_TIME_COOKIE_NAME
} from '../constants/Privileges';
import {logout as logOutActionCreator} from "../redux/AuthRedux";
import RestApi from "../service/RestApi";
import {withAuthApiLoadingNotification} from "./HOC/withLoadingAndNotification";


class AuthRoute extends React.Component {

  static propTypes = {
    cookies: instanceOf(Cookies).isRequired,
    component: PropTypes.elementType.isRequired,
    exact: PropTypes.bool,
    path: PropTypes.string.isRequired,
    dataKey: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  };

  static defaultProps = {exact: false};

  constructor(props) {
    super(props);

    this.state = {
      timeout: TIMEOUT_VALUE,
      isTimedOut: false,
    };

    const { cookies } = this.props;
    let oldTimeVal = cookies.get(LAST_ACTIVE_TIME_COOKIE_NAME) || 0;
    let curTimeVal = Date.now();
    if (curTimeVal < oldTimeVal || curTimeVal - oldTimeVal > TIMEOUT_VALUE) {
      this.props.logout();
    }

    // removed the below code. the aim of the below code to log the user out when the user leaves website and later the user opens the website.
    // but when the user opens 2 tabs and close a tab, after a few seconds later, the user will be kicked off from other tab due to the below code.
    // let lastBeforeUnloadEventTimeVal = cookies.get(LAST_BEFORE_UNLOAD_EVENT_TIME_COOKIE_NAME) || 0;
    // if (lastBeforeUnloadEventTimeVal != 0 && curTimeVal - lastBeforeUnloadEventTimeVal > USER_LEAVE_TIMEOUT_GUESSING_VALUE) {
    //   this.props.logout();
    // }

    this.idleTimer = null;
    this.onAction = this._onAction.bind(this);
    this.onActive = this._onActive.bind(this);
    this.onIdle = this._onIdle.bind(this);

    // Activate the event listener
    this.setupBeforeUnloadListener();
  }

  // Setup the `beforeunload` event listener
  setupBeforeUnloadListener = () => {
    window.addEventListener("beforeunload", (ev) => {
      const { cookies } = this.props;
      cookies.set(LAST_BEFORE_UNLOAD_EVENT_TIME_COOKIE_NAME, Date.now(), { path: '/' });
    });
  };

  _onAction(e) {
    this.setState({isTimedOut: false});

    this.setActiveTimeToCookie()
  }

  _onActive(e) {
    this.setState({isTimedOut: false});

    this.setActiveTimeToCookie()
  }

  setActiveTimeToCookie() {
    const { cookies } = this.props;
    cookies.set(LAST_ACTIVE_TIME_COOKIE_NAME, Date.now(), { path: '/' });
    cookies.set(LAST_BEFORE_UNLOAD_EVENT_TIME_COOKIE_NAME, 0, { path: '/' });
  }

  async _onIdle(e) {
    if (!this.state.isTimedOut) {
      const { cookies } = this.props;
      const oldTimeVal = cookies.get(LAST_ACTIVE_TIME_COOKIE_NAME) || 0;
      const curTimeVal = Date.now();
      console.log('>>> old time value: ', oldTimeVal)
      console.log('>>> cur time value: ', curTimeVal)

      this.idleTimer.reset();
      await this.props.callApi2(RestApi.logout, this.props.profile.id)
      this.props.logout();
      this.setState({isTimedOut: true})
    }
  }

  render() {
    const WrappedComponent = this.props.component;
    const checkPaths = ['/login', '/register'];
    const renderRedirect = this.props.authenticated ? checkPaths.includes(this.props.path) : !checkPaths.includes(this.props.path);
    const redirectUrl = this.props.authenticated ? '/dashboard' : '/login';

    return (<>
            <IdleTimer
              ref={ref => { this.idleTimer = ref }}
              element={document}
              onActive={this.onActive}
              onIdle={this.onIdle}
              onAction={this.onAction}
              debounce={250}
              timeout={this.state.timeout} />
            <Route exact={this.props.exact}
                   path={this.props.path}
                   key = {this.props.dataKey}
                   name = {this.props.name}
                   render={ () => (renderRedirect ? <Redirect to={redirectUrl}/> : <WrappedComponent />) }
            />
          </>
    )
  }
}

export default withSuspense(connect(
  (state) => ({ authenticated: state.auth.isAuthenticated || false,
              profile: state.auth.profile || 0}),   // StateToProps
  dispatch => ({
    logout: () => dispatch(logOutActionCreator()),
  })
)(withAuthApiLoadingNotification(withCookies(AuthRoute))))
