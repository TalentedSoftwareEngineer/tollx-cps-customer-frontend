import {createAction, createActions, handleActions} from 'redux-actions';
import Actions from '../constants/ReduxActionTypes'
import produce from 'immer';

// Define actions and reducers
const login = createAction(Actions.LOGIN,
  (username, password, overwriteSession, rememberme) => ({username, password, overwriteSession, rememberme})
);

const {logout, loginSuccess, loginFailed, setOverwriteSessionModal,
  cancelOverwriteSessionModal, refreshToken, refreshTokenSuccess, refreshRolesStart,
  refreshRolesSuccess, profileUpdated, template, cadToTadState, selectRo,
  refreshContact, setProgress} =
  createActions({}, Actions.LOGOUT, Actions.LOGIN_SUCCESS, Actions.LOGIN_FAILED, Actions.SET_OVERWRITE_SESSION_MODAL,
    Actions.CANCEL_OVERWRITE_SESSION_MODAL, Actions.REFRESH_TOKEN, Actions.REFRESH_TOKEN_SUCCESS, Actions.REFRESH_ROLES,
    Actions.REFRESH_ROLES_SUCCESS, Actions.PROFILE_UPDATED, Actions.TEMPLATE, Actions.CAD_TO_TAD_STATE, Actions.SELECT_RO,
    Actions.REFRESH_CONTACT, Actions.SET_PROGRESS);

const reducer = handleActions(
  {
    [Actions.LOGIN] : (state, action) => ({isLoggingIn: true, isAuthenticated:false}),
    [Actions.LOGIN_SUCCESS] : (state, {payload}) => ({isLoggingIn: false, overwriteSessionModal: false, ...payload.toState()}),
    [Actions.LOGIN_FAILED] : (state, action) => ({isLoggingIn: false, isAuthenticated: false, overwriteSessionModal: false}),
    [Actions.LOGOUT] : (state) => ({isLoggingIn: false, isAuthenticated: false, overwriteSessionModal: false}),
    [Actions.SET_OVERWRITE_SESSION_MODAL] : (state, action) => ({isLoggingIn: false, isAuthenticated: false, overwriteSessionModal: true}),
    [Actions.CANCEL_OVERWRITE_SESSION_MODAL] : () => ({overwriteSessionModal: false}),
    [Actions.REFRESH_TOKEN] : undefined,
    [Actions.REFRESH_TOKEN_SUCCESS] : (state, {payload}) => ({...state, ...payload.toState()}),
    [Actions.REFRESH_ROLES] : (state, _) => (state),
    [Actions.REFRESH_ROLES_SUCCESS]: (state, {payload}) =>
      (produce(state, s => {
        s.profile.roles = payload
      })),

    // Currently support firstName & lastName update support
    [Actions.PROFILE_UPDATED]: (state, {payload: {firstName, lastName}}) => (
      produce(state, s => {
        s.profile.firstName = firstName;
        s.profile.lastName = lastName;
      })
    ),
    [Actions.TEMPLATE]: (state, {payload: {types, ladData}}) => (
      produce(state, s => {
        s.types = types;
        s.ladData = ladData;
      })
    ),
    [Actions.CAD_TO_TAD_STATE]: (state, {payload: {cadState}}) => (
      produce(state, s => {
        s.cadState = cadState;
      })
    ),
    [Actions.SELECT_RO]: (state, {payload: ro}) => (
      produce(state, s => {
        s.profile.somos.selectRo = ro;
      })
    ),
    [Actions.REFRESH_CONTACT]: (state, {payload: {contactName, contactNumber}}) => (
      produce(state, s => {
        console.log("Refresh Contact");
        console.log("Contact Name: " + contactName);
        console.log("Contact Number: " + contactNumber);

        s.profile.contactName = contactName;
        s.profile.contactNumber = contactNumber;
      })
    ),
    [Actions.SET_PROGRESS]: (state, {payload: progress}) => (
      produce(state, s => {
        s.progress = progress;
      })
    ),
  }, {isLoggingIn: false, isAuthenticated: false, overwriteSessionModal: false}
);

const selector = (state) => (state.auth);

export {
  login,
  logout,
  loginSuccess,
  loginFailed,
  setOverwriteSessionModal,
  cancelOverwriteSessionModal,
  refreshToken,
  refreshTokenSuccess,
  refreshRolesStart,
  refreshRolesSuccess,
  profileUpdated,
  reducer,
  template,
  cadToTadState,
  selectRo,
  refreshContact,
  setProgress,
  selector,
}
