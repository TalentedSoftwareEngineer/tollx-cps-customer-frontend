import apisauce from 'apisauce';
import qs from 'qs'
import Config from '../Config';

const _instance = (baseURL) => {
  // ------
  // STEP 1
  // ------
  //
  // Create and configure an apisauce-based api object.
  //
  return apisauce.create({
    // base URL is read from the "constructor"
    baseURL,
    headers: {
      'Content-Type': 'application/json'
    },
    // 60 second timeout...
    timeout: 200 * 1000

  });
};

const instance = _instance.bind(null, Config.apiEndPoint);

// Define api functions.

//login
const login = (api, username, password, overwriteSession) => api.post('/session/login', {username, password, overwriteSession});
const logout = (api, id) => api.post('/session/logout', {id});
const refreshToken = (api, token) => api.post('/session/refresh', {refreshToken: token});
const updatePassword = (api, req) => api.put('/profile/password', req);
const updateContact = (api, req) => api.put('/profile/update_contact', req);

const getDashboardData = (api, req) => api.get('/somos/dashboard', req);

// get user information from the server
const userInfo = (api, req) => api.get('/somos/userInfo', req);

const sendRequestNew = (api, req) => api.post('/somos/send_new', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});

const activityLog = (api, req) => api.get('/somos/automation/result/list', req);
const viewMnp = (api, req) => api.get('/somos/automation/result/view', req);
const deleteReport = (api, req) => api.delete('/somos/automation/result/delete', req);

// SOMOS API calling
const getReservedNumberList = (api, req) => api.post('/somos/num/rnl', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});

const getRespOrgEntityLst = (api, req) => api.get('/somos/org/resporg/respOrgEntity', req);
const getRespOrgForEntity = (api, req) => api.get('/somos/org/resporg/forEntity', req);
const getRespOrgUnitList = (api, req) => api.get('/somos/org/resporg/respOrgUnit', req);
const getRespOrgForUnit = (api, req) => api.get('/somos/org/resporg/forUnit', req);
const getRespOrgForNumber = (api, req) => api.get('/somos/org/resporg/forNumber', req);

const getTmplRecLstForEntity = (api, req) => api.get('/somos/cus/tpl/list/entity', req);

const getTmplRecLstForRoId = (api, req) => api.get('/somos/cus/tpl/list', req);
const queryTmplRec = (api, req) => api.get('/somos/cus/tpl/query', req);
const retrieveTmplRec = (api, req) => api.get('/somos/cus/tpl', req);
const createTmplRec = (api, req) => api.post('/somos/cus/tpl', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const updateTmplRec = (api, req) => api.put('/somos/cus/tpl', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const copyTmplRec = (api, req) => api.post('/somos/cus/tpl/copy', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const transferTmplRec = (api, req) => api.post('/somos/cus/tpl/transfer', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const disconnectTmplRec = (api, req) => api.post('/somos/cus/tpl/disconnect', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const deleteTmplRec = (api, req) => api.delete('/somos/cus/tpl', req);
const lockTmplRec = (api, req) => api.put('/somos/cus/tpl/lock', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const unlockTmplRec = (api, req) => api.put('/somos/cus/tpl/unlock', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});

const retrievePtrRec = (api, req) => api.get('/somos/cus/ptr', req);
const updatePtrRec = (api, req) => api.put('/somos/cus/ptr', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const createPtrRec = (api, req) => api.post('/somos/cus/ptr', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const copyPtrRec = (api, req) => api.post('/somos/cus/ptr/copy', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const transferPtrRec = (api, req) => api.post('/somos/cus/ptr/transfer', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const disconnectPtrRec = (api, req) => api.post('/somos/cus/ptr/disconnect', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const deletePtrRec = (api, req) => api.delete('/somos/cus/ptr', req);
const lockPtrRec = (api, req) => api.put('/somos/cus/ptr/lock', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const unlockPtrRec = (api, req) => api.put('/somos/cus/ptr/unlock', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const convertPtrRec = (api, req) => api.put('/somos/cus/ptr/cnv', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const resultOfConvertedPtrRec = (api, req) => api.get('/somos/cus/ptr/cnv', req);

const retrieveCadRec = (api, req) => api.get('/somos/cus/rec', req);
const updateCadRec = (api, req) => api.put('/somos/cus/rec', req, qs.stringify(Object.assign({}, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const createCadRec = (api, req) => api.post('/somos/cus/rec', req, qs.stringify(Object.assign({}, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const copyCadRec = (api, req) => api.post('/somos/cus/rec/copy', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const transferCadRec = (api, req) => api.post('/somos/cus/rec/transfer', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const disconnectCadRec = (api, req) => api.post('/somos/cus/rec/disconnect', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const deleteCadRec = (api, req) => api.delete('/somos/cus/rec', req);
const lockCadRec = (api, req) => api.put('/somos/cus/rec/lock', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const unlockCadRec = (api, req) => api.put('/somos/cus/rec/unlock', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const convertCadRec = (api, req) => api.post('/somos/cus/rec/cnv', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const resultOfConvertedCadRec = (api, req) => api.get('/somos/cus/rec/cnv', req);

const numberQuery = (api, req) => api.put('/somos/num/tfn/query', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const numberUpdate = (api, req) => api.put('/somos/num/tfn/update', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});

const performFromReservedNumbers = (api, req) => api.post('/somos/frn/mnp', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
// this 3 below apis are not Somos api calling
const frnActivityLog = (api, req) => api.get('/somos/frn/result/list', req);
const deleteFrnResult = (api, req) => api.delete('/somos/frn/result/delete', req);
const viewFrnResult = (api, req) => api.get('/somos/frn/result/view', req);

const oneClickActivate = (api, req) => api.post('/somos/num/oca', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
// this 3 below apis are not Somos api calling
const ocaActivityLog = (api, req) => api.get('/somos/oca/result/list', req);
const deleteOcaResult = (api, req) => api.delete('/somos/oca/result/delete', req);
const viewOcaResult = (api, req) => api.get('/somos/oca/result/view', req);

const performNUS = (api, req) => api.post('/somos/num/nus', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const reserve = (api, req) => api.post('/somos/num/nus/reserve', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
// this 3 below apis are not Somos api calling
const nusActivityLog = (api, req) => api.get('/somos/nus/result/list', req);
const deleteNusResult = (api, req) => api.delete('/somos/nus/result/delete', req);
const viewNusResult = (api, req) => api.get('/somos/nus/result/view', req);

const queryTRQ = (api, req) => api.post('/somos/num/trq', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
// this 3 below apis are not Somos api calling
const trqActivityLog = (api, req) => api.get('/somos/trq/result/list', req);
const deleteTrqResult = (api, req) => api.delete('/somos/trq/result/delete', req);
const viewTrqResult = (api, req) => api.get('/somos/trq/result/view', req);

const numberAutomation = (api, req) => api.put('/somos/num/automation', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});

// save template to cps database
const saveTmplToDB = (api, req) => api.post('/somos/cus/tpl/saveToDB', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});

// Multi Dial Number File Upload
const uploadFileMnp = (api, req) => api.post('/somos/mnp_upload', req);

const importNumberList = (api, req) => api.post('/somos/numbers_list/import', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const confirmNumImporting = (api, req) => api.post('/somos/numbers_list/import/confirm', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const cancelNumImporting = (api, req) => api.post('/somos/numbers_list/import/cancel', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});

const sqlScripts = (api, req) => api.get('/somos/numbers_list/sql_scripts', req);
const numberList = (api, req) => api.get('/somos/numbers_list/template', req);
const numberListById = (api, req) => api.get('/somos/numbers_list/template/edit', req);
const numberListSave = (api, req) => api.post('/somos/numbers_list/template/save', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const numberListDelete = (api, req) => api.delete('/somos/numbers_list/template/delete', req);
const numberListUpdate = (api, req) => api.post('/somos/numbers_list/template/update', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const numberListUpdateName = (api, req) => api.get('/somos/numbers_list/template/update_name', req);
const numberListViewById = (api, req) => api.get('/somos/numbers_list/template/id', req);

const activityList = (api, req) => api.get('/somos/activity/list', req);
const deleteActivity = (api, req) => api.delete('/somos/activity/delete', req);
const viewActivity = (api, req) => api.get('/somos/activity/view', req);

const taskList = (api, req) => api.get('/somos/task/list', req);

const sqlScriptExecutionList = (api, req) => api.get('/somos/sqlScriptExecution/list', req);

const getAutoReserveInfo = (api, req) => api.get('/somos/num/atrsrv/infolist', req);
const getAutoReserveNumbers = (api, req) => api.get('/somos/num/atrsrv/numberlist', req);
const createAutoReserveInfo = (api, req) => api.post('/somos/num/atrsrv/create', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});
const deleteAutoReserveInfo = (api, req) => api.delete('/somos/num/atrsrv/delete', req);
const deleteAutoReserveSchedules = (api, req) => api.post('/somos/num/atrsrv/deleteList', qs.stringify(Object.assign({}, req, {timeout: "60"})), {headers: {'Content-Type': 'application/x-www-form-urlencoded'}});

  export default{
  instance, login, logout, refreshToken, userInfo, getDashboardData,
  getRespOrgEntityLst, getRespOrgForEntity, getRespOrgUnitList, getRespOrgForUnit, getRespOrgForNumber, getTmplRecLstForEntity,
  getTmplRecLstForRoId, queryTmplRec, retrieveTmplRec, createTmplRec, updateTmplRec, copyTmplRec, transferTmplRec, disconnectTmplRec, deleteTmplRec, lockTmplRec, unlockTmplRec,
  createPtrRec, retrievePtrRec, updatePtrRec, copyPtrRec, transferPtrRec, disconnectPtrRec, deletePtrRec, lockPtrRec, unlockPtrRec, convertPtrRec, resultOfConvertedPtrRec,
  createCadRec, retrieveCadRec, updateCadRec, copyCadRec, transferCadRec, disconnectCadRec, deleteCadRec, lockCadRec, unlockCadRec, convertCadRec, resultOfConvertedCadRec,
  numberAutomation, numberQuery, numberUpdate,
  performFromReservedNumbers, frnActivityLog, deleteFrnResult, viewFrnResult,
  oneClickActivate, ocaActivityLog, deleteOcaResult, viewOcaResult,
  performNUS, nusActivityLog, deleteNusResult, viewNusResult, reserve, queryTRQ, trqActivityLog, deleteTrqResult, viewTrqResult,
  saveTmplToDB,
  sendRequestNew, getReservedNumberList,
  uploadFileMnp, activityLog, viewMnp, deleteReport, updatePassword,
  importNumberList, confirmNumImporting, cancelNumImporting, sqlScripts, numberList, numberListById, updateContact,
  numberListSave, numberListDelete, numberListUpdateName, numberListViewById, numberListUpdate,
  activityList, deleteActivity, viewActivity, taskList, sqlScriptExecutionList, getAutoReserveNumbers, getAutoReserveInfo, createAutoReserveInfo, deleteAutoReserveInfo, deleteAutoReserveSchedules
}

