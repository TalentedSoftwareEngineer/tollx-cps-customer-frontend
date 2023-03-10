const actionTypes = {
  // AUTHENTICATION RELATED.
  LOGIN: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILED: 'LOGIN_FAILED',
  LOGOUT: 'LOGOUT',
  SET_OVERWRITE_SESSION_MODAL: 'SET_OVERWRITE_SESSION_MODAL',
  CANCEL_OVERWRITE_SESSION_MODAL: 'CANCEL_OVERWRITE_SESSION_MODAL',
  REFRESH_TOKEN: 'REFRESH_TOKEN_START',
  REFRESH_TOKEN_SUCCESS: 'REFRESH_TOKEN_SUCCESS',
  PROFILE_UPDATED:'PROFILE_UPDATED',

  REFRESH_ROLES: 'REFRESH_ROLES_START',
  REFRESH_ROLES_SUCCESS: 'REFRESH_ROLES_SUCCESS',

  // GENERIC API CALLING
  CALL_API: 'CALL_API',

  CALL_API_HIDE_LOADING: 'CALL_API_HIDE_LOADING',

  // IN-APP NOTIFICATION
  SHOW_NOTIFICATION: 'SHOW_NOTIFICATION',

  // LOADING INDICATOR
  SHOW_LOADING: 'SHOW_LOADING',
  HIDE_LOADING: 'HIDE_LOADING',
  RESET_LOADING: 'RESET_LOADING',

  TEMPLATE: 'TEMPLATE',
  CAD_TO_TAD_STATE: 'CAD_TO_TAD_STATE',
  SELECT_RO: 'SELECT_RO',

  REFRESH_CONTACT: 'REFRESH_CONTACT',

  // Automation Progress
  SET_PROGRESS: 'SET_PROGRESS',
};

export default actionTypes;
