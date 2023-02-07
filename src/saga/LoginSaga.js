import {put, delay, call} from 'redux-saga/effects';
import API from '../service/RestApi';
import Credentials from "../service/Credentials";
import {Type as NotificationType} from '../constants/Notifications';
import {loginSuccess, loginFailed, setOverwriteSessionModal} from "../redux/AuthRedux";
import {showNotification} from "../redux/NotificationRedux";
import * as gFunc from "../utils";

export default function * login(action){
  const {username, password, overwriteSession, rememberme} = action.payload;
  const api = API.instance();

  // yield delay(200);

  gFunc.putLog("Before Login")
  const response = yield call(API.login, api, username, password, overwriteSession);


  if (response.ok && response.data) {

    gFunc.putLog("After Login")

    // Delay 500ms.
    // yield delay(500);

    let profile = response.data.profile;
    if (profile && profile.somos && profile.somos.ro) {
      let ros = profile.somos.ro;
      if (ros.includes(",")) {
        ros = ros.split(",");
        console.log(ros);
        Object.assign(profile.somos, {selectRo: ros[0].trim()} )
      } else {
        Object.assign(profile.somos, {selectRo: ros.trim()} )
      }
    }
    // Dispatch login success message
    const cred = Credentials.fromResponse(response.data);

    // Delete refresh token if remember me is not ticked.
    if (!rememberme)
      cred.refresh = undefined;

    yield put(loginSuccess(Credentials.fromResponse(response.data)));
    yield put(showNotification(NotificationType.SUCCESS, "Login Success"));

    console.log("Incorrect somos info: " + response.data.wrongSomosInfo)
    if (response.data.wrongSomosInfo === true) {
      console.log("wrongSomosInfo: " + response.data.wrongSomosInfo)
      yield put(showNotification(NotificationType.ERROR, "Your somos user and password information is not correct."));
    }

  } else {

    if (response.data && typeof response.data === 'string' && response.data.includes('User is already logged on')) {
      console.log("put(setOverwriteSessionModal())")
      yield put(setOverwriteSessionModal());
      return
    }

    let errorDescription = (response.data && response.data.error_description) ?
        response.data.error_description : response.problem
    const message = (response.data && response.data.message) ||
      (!response.ok && (((response.status && response.status + " : ") || "") +  errorDescription));
      
    // Dispatch login fail.
    yield put(showNotification(NotificationType.ERROR, message));

    // Dispatch login failed action
    yield put(loginFailed());
  }
}
