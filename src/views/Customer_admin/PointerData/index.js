
import React, {Component} from 'react';
import {  Button,  Card,  CardBody,  CardHeader,  Col,  FormGroup,  Input,  Label,  Row,  Modal,  ModalHeader,  ModalBody,  ModalFooter,  Collapse,  FormText } from 'reactstrap';
import {connect} from 'react-redux'
import "react-toastify/dist/ReactToastify.css";
import TextField from '@material-ui/core/TextField';

import $ from 'jquery'

// Date Picker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import * as gFunc from "../../../utils";
import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";

// notification
import {NotificationContainer, NotificationManager} from'react-notifications';
import 'react-notifications/lib/notifications.css';

import Cookies from "universal-cookie";
import RestApi from "../../../service/RestApi";
import {timeout} from "../../../service/customer";
import * as gConst from "../../../constants/GlobalConstants";
import {selectRo, template} from "../../../redux/AuthRedux";

const PAD_RETRIEVE_SUCCESSFUL         = "PAD retrieved successfully!"
const PAD_CREATE_SUCCESSFUL           = "PAD created successfully!"
const PAD_UPDATE_SUCCESSFUL           = "PAD updated successfully!"
const PAD_COPY_SUCCESSFUL             = "PAD copied successfully!"
const PAD_TRANSFER_SUCCESSFUL         = "PAD transferred successfully!"
const PAD_DISCONNECT_SUCCESSFUL       = "PAD disconnected successfully!"
const PAD_DELETE_SUCCESSFUL           = "PAD deleted successfully!"

class PointerData extends Component {

  constructor(props) {
    super(props);
    this.state = {
      selectRo:                 this.props.somos.selectRo,
      retrieveCardTitle:        gConst.RETRIEVE_CARD_TITLE_PREFIX,
      resultCardTitle:          gConst.RESULT_CARD_TITLE_PREFIX1,

      bExpRetrieve:             true,    // the flag whether the retrieve card should be expanded or collapsed
      bExpResult:               false,   // the flag whether the result card should be expanded or collapsed
      searchNum:                '',      // num for search
      searchEffDtTm:            0,       // effective date time for search
      bResultHeaderHidden:        false,   // the flag whether the result card is hidden or not
      bEffDtTmListHidden:       true,    // the flag whether effective date time status select field is hidden or not
      bEffDtTmDisable:          false,

      numParam:                 '',      // the state to use as num parameter for calling retrieve pointer record
      effDtTmParam:             '',      // the state to use as effective date time parameter for calling retrieve pointer record
      preEffDtTmStat:           '',      // the state to save previous eff date time state at changing selection on the eff date time state select field

      action:                   gConst.ACTION_NONE,
      // action was triggered: ACTION_NONE, ACTION_COPY, ACTION_TRANSFER
      disable:                  true,    // not editable status

      effDtTmStat:              '',      // current selected effective date time status
      effDtTmStatList:          [],      // effective date time status list
      lstEffDtTms:              [],      // list of effective date times
      status:                   '',      // pointer record status

      num:                   '',      // retrieved num

      bContentModified:         false,   // if user action has triggered for any one input field, this state is true

      // button disable/enable flags
      bRetrieveEnable:          true,     // Retrieve button enable status
      bEditEnable:              false,    // Edit button enable status
      bCopyEnable:              false,    // Copy button enable status
      bTransferEnable:          false,    // Transfer button enable status
      bDeleteEnable:            false,    // Delete button enable status
      bSubmitEnable:            false,    // Submit button enable status
      bSaveEnable:              false,    // Save button enable status
      bRevertEnable:            false,    // Revert button enable status
      bCancelEnable:            false,    // Cancel button enable status

      // Modal Window visible
      createModalVisible:     false,
      modifiedModalVisible:     false,
      copyModalVisible:         false,
      deleteModalVisible:       false,
      cancelModalVisible:       false,
      transferModalVisible:     false,
      convertModalVisible:      false,
      overwriteModalVisible:    false,

      bRevertClicked:           false,

      message:                  '',       // api call result messages

      // copy & transfer modal
      srcNum:                '',       // source num on the copy or transfer modal
      srcEffDtTm:               '',       // source effective date time on the copy or transfer modal
      srcRecVersionId:          '',       // source record version id
      tgtNum:                '',       // num for copying or transferring
      tgtEffDtTm:               '',       // effective date time for copying or transferring
      copyNow:                  false,    // now check for copying or transferring
      validMsg:                 '',       // message for validation on modal
      copyAction:               gConst.COPYACTION_CHANGE,
      bCheckCPREnable:          true,
      bCheckLADEnable:          true,

      tgtRetrieveData:          {},     // retrieve data of target pointer record
      lockParam:                {},     // parameter that was used for calling lock api

      /*********************************** Pointer Record Data *************************************/
      createEffDtTm:            0,       // effective date time value for creating
      effDateErr:               '',       // effective date time error
      createNow:                false,    // now check value

      respOrg:                  '',       // resp organization
      priority:                 false,    // high priority
      customerId:                '',       // customer id

      agent:                     '',       // agent
      telco:                     '',       // telco
      hold:                     'N',    // the flag if holding

      endSub:                   '',       // end subscriber name
      endSubAddr:               '',       // end subscriber address
      svcOrderNum:              '',       // service order num
      suppFormNum:              '',       // support form num

      approval:                 '',       // approval
      lastUpDt:                 '',       // the date time of last changed
      lastUser:                 '',       // last user
      prevUser:                 '',       // prev user

      tmplName:                 '',        // template name

      destNum:                  '',       // destination number
      numTermLine:              '',       // numTermLine
      localServOff:             '',       // local server off
      forServOff:               '',       // foreign server off

      contactName:              '',       // contact name
      contactNumber:            '',       // contact telephone
      notes:                    '',       // notes

      endIntDtTm:               '',       // end intercept date time
      referral:                 '',       // referral

      bSavedToDB: false,                // ptr is already saved to the cps project

      recVersionId:             '',
    };

    this.initialState = JSON.parse(JSON.stringify(this.state));
    this.lastActionState = JSON.parse(JSON.stringify(this.state));

    this.onSearchNumber = this.onSearchNumber.bind(this)
    this.retrievePointerRecord = this.retrievePointerRecord.bind(this)
  }

  /**
   * This is called when has mounted the component
   */
  componentDidMount() {
    this.initialDataLoading();
  }

  initialDataLoading = () => {

    // setInterval(() => { this.monitorRoChange()}, gConst.RO_CHANGE_MONITOR_INTERVAL)

    const cookies = new Cookies();

    let num = cookies.get("ptrNum");
    let effDtTm = cookies.get("ptrEffDtTm");
    let action = cookies.get("action")

    if (action) {
      switch (action) {
        case gConst.RECORD_PAGE_ACTION_RETRIEVE:
          if (effDtTm) {
            let localDtTm = new Date(effDtTm)
            this.setState({searchNum: num, searchEffDtTm: localDtTm.getTime(), bRetrieveEnable: false});

          } else {
            this.setState({searchNum: num, bRetrieveEnable: false});
          }

          if (this.retrievePointerRecord(num, effDtTm, true)) {
            this.setState({message: PAD_RETRIEVE_SUCCESSFUL})
          }
          break

        case gConst.RECORD_PAGE_ACTION_CREATE:
          this.setState({
            action:                   gConst.ACTION_CREATE,
            disable:                  false,
            num:                      num,
            retrieveCardTitle:        "Create a New Pointer Record: " + gFunc.formattedNumber(num),
            bRetrieveCardIconHidden:  true,
            bResultHeaderHidden:        true,
            bExpRetrieve:             false,
            bExpResult:               true,

            bEditEnable:              false,
            bCopyEnable:              false,
            bTransferEnable:          false,
            bDeleteEnable:            false,
          })
          break
      }

      cookies.remove("ptrNum");
      cookies.remove("ptrEffDtTm");
      cookies.remove("action");

    } else {
      $('#searchNum').focus()
    }

  }

  /**
   * This is called when moving to another page or page is disappeared.
   */
  componentWillUnmount() {
    console.log("componentWillUnmount")

    this.unlockPointerRecord()
  }

  /**
   * unlock pointer record
   * @returns {Promise<void>}
   */
  unlockPointerRecord = () => {

    let lockParam = this.state.lockParam

    if (lockParam && lockParam.ptrRecAction) {
      let body = {}

      switch (lockParam.ptrRecAction) {
        case gConst.ACTION_COPY:
        case gConst.ACTION_TRANSFER:
        case gConst.ACTION_DISCONNECT:
          body.num = lockParam.tgtNum
          body.effDtTm = lockParam.tgtEffDtTm
          break

        case gConst.ACTION_UPDATE:
          body.num = lockParam.srcNum
          body.effDtTm = lockParam.srcEffDtTm
          break
      }
      console.log("body: " + JSON.stringify(body))

      this.props.callApiHideLoading(RestApi.unlockPtrRec, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout}).then(res => { })
    }
  }

  /**
   * this is called when changing the ro selection
   * @returns {Promise<void>}
   */
  monitorRoChange = async () => {
    if (this.state.selectRo === this.props.somos.selectRo)
      return

    let searchNum = this.state.searchNum
    let searchEffDtTm = this.state.searchEffDtTm

    if (this.state.bExpResult) {
      searchNum = ''
      searchEffDtTm = ''
    }

    await this.cancelAction()
    await this.setState({ searchNum: searchNum, searchEffDtTm: searchEffDtTm, selectRo: this.props.somos.selectRo })

    $('#searchNum').focus()
  }

  /**
   * // clear basic data
   */
  clearAllData = async () => {
    await this.setState({
      createEffDtTm:            '',       // effective date time value for creating
      effDateErr:               '',       // effective date time error
      createNow:                  false,    // now check value

      respOrg:                  '',       // resp organization
      priority:                 false,    // high priority
      customerId:                '',       // customer id

      agent:                     '',       // agent
      telco:                     '',       // telco
      hold:                     'N',    // the flag if holding

      endSub:                   '',       // end subscriber name
      endSubAddr:               '',       // end subscriber address
      svcOrderNum:              '',       // service order num
      suppFormNum:              '',       // support form num

      lastUpDt:                 '',       // the date time of last changed
      approval:                 '',       // approval
      lastUser:                 '',       // last user
      prevUser:                 '',       // prev user

      tmplName:                 '',        // template name

      destNum:                  '',
      numTermLine:              '',
      localServOff:             '',
      forServOff:               '',

      contactName:              '',       // contact name
      contactNumber:            '',       // contact telephone
      notes:                    '',       // notes

      endIntDtTm:               '',       // end intercept date time
      referral:                 '',       // referral

      message:                  '',
    })
  }

  /**
   * save current state data to last state data.
   */
  backupStateToLastAction = () => {
    this.lastActionState = JSON.parse(JSON.stringify(this.state));
  }

  /**
   * handles collapse or expand status of retrieve card
   */
  toggle_retrieve() {
    this.setState({bExpRetrieve: !this.state.bExpRetrieve});
  }

  /**
   * handles collapse or expand status of result card
   */
  toggle_result() {
    this.setState({bExpResult: !this.state.bExpResult});
  }

  /**
   * go to the CAD page
   * @param num
   * @param effDtTm
   */
  gotoCADPage = (num, effDtTm) => {
    const cookies = new Cookies();
    cookies.set("cusNum", num);
    cookies.set("cusEffDtTm", effDtTm);
    cookies.set("action", gConst.RECORD_PAGE_ACTION_RETRIEVE)
    this.props.navigate('/customer_admin/customer_data');

    this.setState(JSON.parse(JSON.stringify(this.initialState)));
  }

  /**
   * go to the TAD page
   * @param tmplName
   */
  gotoTADPage = (tmplName) => {
    const cookies = new Cookies();
    cookies.set("tmplName", tmplName);
    cookies.set("effDtTm", "");
    this.props.navigate('/template_admin/template_data');
  }

  /**
   * convert from effective date time state string to UTC date time string
   * @param effDtTmStat
   */
  fromEffDtTmStatToUTCStr = (effDtTmStat) => {
    let tempArr = effDtTmStat.split(" ")
    let CTTimeStr = tempArr[0] + " " + tempArr[1] + " " + tempArr[2]
    return gFunc.fromCTStrToUTCStr(CTTimeStr)
  }

  /**
   * convert from UTC date time string string to CT date time value
   * @param utcStr
   */
  fromUTCStrToCTVal = (utcStr) => {
    let ctStr = gFunc.fromUTCStrToCTStr(utcStr)
    let ctDate = new Date(ctStr)
    return ctDate.getValue()
  }

  /**
   * get current effective date time
   * @returns {string}
   */
  getCurEffDtTm = () => {
    let tempArr = this.state.effDtTmStat.split(" ")
    return tempArr[0] + " " + tempArr[1] + " " + tempArr[2]
  }

  /**
   * this function is called at clicking the retrieve button of the retrieve card.
   */
  onSearchNumber() {
    let searchUTCString = ""
    if (this.state.searchEffDtTm != "") {
      let searchCTDtTm = new Date(this.state.searchEffDtTm)
      searchUTCString = gFunc.fromCTTimeToUTCStr(searchCTDtTm)
    }

    // if any modified, shows the modal asking if really will do
    if (this.state.bContentModified) {
      this.setState({
        numParam: this.state.searchEffDtTm,
        effDtTmParam: searchUTCString,
        preEffDtTmStat: '',   // sets as empty here
        modifiedModalVisible: true
      })
    } else if (this.retrievePointerRecord(this.state.searchNum, searchUTCString, true)) {
      this.setState({message: PAD_RETRIEVE_SUCCESSFUL})
    }
  }

  /**
   * This function is called at pressing keydown on the search template name or on the search effective date time
   * @param event
   */
  onKeyDownToRetrieve = (event) => {
    if (event.key == 'Enter') {
      this.onSearchNumber()
    }
  }

  /**
   * this function is called at clicking the Edit button
   */
  onEdit = () => {
    let UTCTimeStr = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)

    let body = { ptrRecAction: gConst.ACTION_UPDATE, srcNum: this.state.num, srcEffDtTm: UTCTimeStr }
    this.props.callApi2(RestApi.lockPtrRec, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout}).then(res => {
      if (res.ok && res.data) {
        if (res.data.updateStatus.isAllowed === 'Y') {
          this.setState({lockParam: body})
          this.setState({disable: false, bEditEnable: false, bSubmitEnable: true, bSaveEnable: true})
          return
        }
      }

      if (res.data && res.data.updateStatus && res.data.updateStatus.statusMessages !== null) {
        this.setState({message: gFunc.synthesisErrMsg(res.data.updateStatus.statusMessages)})
      }
    })
  }

  setItem = () => {
    window.addEventListener("storage", (ev) => {
      if (ev.key === "template") {
        this.setState({num: ev.newValue})
      } else {
        const state = {};
        state[ev.key] = JSON.parse(ev.newValue);
        this.setState(state);
      }
    });
  };

  /**
   * this function is called at changing selection of effective date time state select field
   * @param ev
   */
  onEffDtTmSelChange = async (ev) => {
    let UTCTimeStr = this.fromEffDtTmStatToUTCStr(ev.target.value)

    this.setState({effDtTmStat: ev.target.value})

    // if any modified, shows the modal asking if really will do
    if (this.state.bContentModified) {
      this.setState({
        numParam: this.state.num,
        effDtTmParam: UTCTimeStr,
        preEffDtTmStat: this.state.effDtTmStat,
        modifiedModalVisible: true
      })
    } else if (await this.retrievePointerRecord(this.state.num, UTCTimeStr, true)) {

      this.setState({message: PAD_RETRIEVE_SUCCESSFUL})
    }
  }

  /**
   * This is the function that performs the actions(Create, Update, Copy, Transfer, Disconnect)
   * @param cmd: 'U' - submit the pointer record to SCP, 'S' - save the the pointer record to Somos
   */
  performAction = (cmd) => {

    switch (this.state.action) {
      case gConst.ACTION_NONE:
        this.updatePointerRecord(cmd)
        break
      case gConst.ACTION_CREATE:
        this.createPointerRecord(cmd)
        break
      case gConst.ACTION_COPY:
        if (this.state.referral === '')
          this.copyPointerRecord(cmd)
        else
          this.disconnectPointerRecord(cmd)
        break
      case gConst.ACTION_TRANSFER:
        this.transferPointerRecord(cmd)
        break
      case gConst.ACTION_DISCONNECT:
        if (this.state.referral === '') {
          this.setState({message: 'Please select referral data'})
          return
        }
        this.disconnectPointerRecord(cmd)
        break
    }
  }

  /**
   * this function is called at clicking Submit button
   */
  onSubmit = () => {
    this.performAction(gConst.SUBMIT_CMD_SIGN)
  }

  /**
   * this function is called at clicking Save button
   */
  onSave = () => {
    this.performAction(gConst.SAVE_CMD_SIGN)
  }

  /**
   * this function is called at clicking Revert button
   */
  onRevert = () => {
    this.setState({bRevertClicked: true, modifiedModalVisible: true})
  }

  /**
   * this is called at clicking the copy button
   */
  onCopy = () => {
    this.setState({
      srcNum: this.state.num,
      srcEffDtTm: this.getCurEffDtTm(),
      tgtNum: gFunc.formattedNumber(this.state.num),
      tgtEffDtTm: '',
      copyNow: false,
      validMsg: '',
      copyAction: gConst.COPYACTION_CHANGE,
      copyModalVisible: true
    })

  }

  /**
   * this is called at clicking the convert button
   */
  onConvert = () => {
    this.setState({
      srcNum: this.state.num,
      srcEffDtTm: this.getCurEffDtTm(),
      tgtNum: gFunc.formattedNumber(this.state.num),
      tgtEffDtTm: '',
      copyNow: false,
      validMsg: '',
      copyAction: gConst.COPYACTION_CONVERT,
      convertModalVisible: true
    })
  }

  /**
   *
   */
  onTransfer = () => {
    this.setState({
      srcNum: this.state.num,
      srcEffDtTm: this.getCurEffDtTm(),
      tgtNum: gFunc.formattedNumber(this.state.num),
      tgtEffDtTm: '',
      copyNow: false,
      validMsg: '',
      bCheckCPREnable: true,
      bCheckLADEnable: true,
      transferModalVisible: true
    })
  }

  /**
   * this function is called at clicking the yes button on the modal asking if will revert
   */
  doRevert = () => {
    this.setState(JSON.parse(JSON.stringify(this.lastActionState)));
    this.setState({
      bEditEnable: false,
      disable: false,
    })


    console.log("doRevert this state: " + JSON.stringify(this.state.cprGridData))
  }

  /**
   * this function is called at clicking the no button on the modal asking if will revert
   */
  cancelRevert = () => {
    this.setState({bRevertClicked: false, modifiedModalVisible: false})
  }

  /**
   * this function is called at clicking the yes button on the modal asking if will retrieve another pointer record
   */
  doAnotherPtr = () => {
    this.hideModifiedModal()

    if (this.retrievePointerRecord(this.state.numParam, this.state.effDtTmParam, true)) {
      this.setState({message: PAD_RETRIEVE_SUCCESSFUL})
    }
  };

  /**
   * this function is called at clicking the no button on the modal asking if will retrieve another pointer record
   */
  cancelAnotherPtr = () => {
    this.hideModifiedModal();

    if (this.state.preEffDtTmStat != '')
      this.setState({effDtTmStat: this.state.preEffDtTmStat});
  };

  /**
   * checks the validation for the inputed fields
   */
  checkValidation = () => {
    let message = ''

    if (this.state.respOrg === '') {
      message += 'Resp Org field is required.'
    }

    if (this.state.numTermLine === '') {
      message += (message === '') ? '' : '\r\n'
      message += 'Number of Lines field is required.'
    }

    if (message != '') {
      this.setState({message: message})
      return false
    }
    return true
  }

  /**
   * reflect the retrieved data on page
   * @param data
   */
  reflectDataOnPage = async (num, data) => {

    let effDtTm = data.effDtTm

    // gets the list of effective date time
    let lstEffDtTms = data.lstEffDtTms

    // if no result, shows the message if moves to create mode
    if (lstEffDtTms == undefined || lstEffDtTms == null) {
      this.setState({createModalVisible: true,})
      return
    }

    // effective date time status list
    let nEffIndex = 0
    let dtTmStatList = []

    for (let i = 0; i < lstEffDtTms.length; i++) {

      let edt = lstEffDtTms[i]
      let dtTmString = gFunc.fromUTCStrToCTStr(edt.effDtTm)
      let dtTmStat = dtTmString + " CT " + edt.custRecStat.replace("_", " ") + " " + edt.custRecCompPart.substring(0, 3)
      dtTmStatList.push(dtTmStat)

      if (effDtTm === edt.effDtTm) {
        nEffIndex = i;
      }
    }

    // if the record was activated by CAD, go to the PAD page
    if (lstEffDtTms[nEffIndex].custRecCompPart.includes("CAD")) {
      this.gotoCADPage(num, effDtTm)
      return
    }

    let status = lstEffDtTms[nEffIndex].custRecStat.replace("_", " ")

    this.setState({
      num: num,
      retrieveCardTitle: gConst.RETRIEVE_CARD_TITLE_PREFIX + ": " + gFunc.formattedNumber(num),
      bRetrieveCardIconHidden: true,
      resultCardTitle: gConst.RESULT_CARD_TITLE_PREFIX2,
      bResultHeaderHidden: false,
      bEffDtTmListHidden: false,
      bExpRetrieve: false,
      bExpResult: true,
      effDtTmStatList: dtTmStatList,
      effDtTmStat: dtTmStatList[nEffIndex],
      lstEffDtTms: lstEffDtTms,
      status: status,
    })

    // this.props.selectRo(data.ctrlRespOrgId)

    // set the prev user and last user
    let lastUsr = '', prevUsr = '', lastUpDt = ''
    if (data.lastUsr != null)
      lastUsr = data.lastUsr
    if (data.prevUsr != null)
      prevUsr = data.prevUsr
    if (data.lastUpDt != null && data.lastUpDt != '')
      lastUpDt = gFunc.fromUTCStrToCTStr(data.lastUpDt)

    let destNum = '', numTermLine = '', forServOff = '', localServOff = ''
    if (data.destNums != null && data.destNums.length > 0) {
      if (data.destNums[0].destNum != null) destNum = gFunc.formattedNumber(data.destNums[0].destNum)
      if (data.destNums[0].numTermLine != null) numTermLine = data.destNums[0].numTermLine
      if (data.destNums[0].forServOff != null) forServOff = data.destNums[0].forServOff
      if (data.destNums[0].localServOff != null) localServOff = data.destNums[0].localServOff
    }

    console.log("destNums: " + JSON.stringify(data.destNums))
    console.log("destNums: " + destNum + ", " + numTermLine + ", " + forServOff + ", " + localServOff)

    this.setState({
      respOrg: data.ctrlRespOrgId,
      priority: (data.priority == 'Y'),
      customerId: data.onAccCust ? data.onAccCust : '',

      agent: data.agent ? data.agent : '',
      telco: data.telco ? data.telco : '',
      hold: data.hldIndFlag ? data.hldIndFlag : 'N',

      endSub: data.endSub ? data.endSub : '',
      endSubAddr: data.endSubAddr ? data.endSubAddr : '',
      svcOrderNum: data.svcOrderNum ? data.svcOrderNum : '',
      suppFormNum: data.suppFormNum ? data.suppFormNum : '',

      approval: data.lstEffDtTms[nEffIndex].apprStat.replace(/\_/g, " "),
      lastUpDt: lastUpDt,
      lastUser: lastUsr,
      prevUser: prevUsr,

      tmplName: data.tmplName,

      destNum: destNum,
      numTermLine: numTermLine,
      localServOff: localServOff,
      forServOff: forServOff,

      contactName: data.conName ? data.conName : '',
      contactNumber: data.conTel ? gFunc.formattedNumber(data.conTel) : '',
      notes: data.notes ? data.notes : '',

      endIntDtTm: data.endInterceptDt ? data.endInterceptDt : '',
      // endIntDtTm:   data.endInterceptDt ? this.fromUTCStrToCTVal(data.endInterceptDt) : '',
      referral: data.referral ? data.referral : '',

      recVersionId: data.recVersionId,
    });

    // check if the user has permission for the customer record
    if (data.errList != null && data.errList.length) {

      let errList = data.errList
      let errMsg = gFunc.synthesisErrMsg(errList)

      if (errList[0].errLvl === gConst.ERRLVL_WARNING)
        NotificationManager.warning("", errMsg)
      else
        NotificationManager.error("", errMsg)

      if (data.errList[0].errLvl === gConst.ERRLVL_ERROR) {  // no error
        this.setState({
          disable: true,
          bContentModified: false,
          bRetrieveEnable: true,
          bEditEnable: false,
          bCopyEnable: false,
          bTransferEnable: false,
          bDeleteEnable: false,
          bSubmitEnable: false,
          bSaveEnable: false,
          bRevertEnable: false,
          bCancelEnable: true,

          bEffDtTmDisable: false,
        })

        return
      }
    }

    // if current date is before than the the date of selected template record
    let ctEffDtTmStr = this.getCurEffDtTm()
    let localEffDtTm = gFunc.fromCTStrToLocalTime(ctEffDtTmStr)
    let curTime = new Date()

    if (localEffDtTm >= curTime) {
      this.setState({bEditEnable: true, bDeleteEnable: true})
    } else {
      this.setState({bEditEnable: false, bDeleteEnable: false})
    }

    let bTransferEnable = true
    if (status === gConst.STAT_ACTIVE || status === gConst.STAT_OLD
      || status === gConst.STAT_SENDING || status === gConst.STAT_DISCONNECT) {
      bTransferEnable = false
    }

    let bCopyEnable = true
    if (status === gConst.STAT_OLD || status === gConst.STAT_FAILED)
      bCopyEnable = false

    let bSubmitEnable = false
    if (status === gConst.STAT_SAVED)
      bSubmitEnable = true

    this.setState({
      disable: true,
      bContentModified: false,
      bRetrieveEnable: true,
      bCopyEnable: bCopyEnable,
      bTransferEnable: bTransferEnable,
      bSubmitEnable: bSubmitEnable,
      bSaveEnable: false,
      bRevertEnable: false,
      bCancelEnable: true,

      bEffDtTmDisable: false,
    })
  }

  /**
   * retrieve pointer record.
   * @param num
   * @param effDtTm: UTC time string of YYYY-MM-DDTHH:mmZ type
   * @returns {Promise<void>}
   */
  retrievePointerRecord = async (num, effDtTm, isUserAct = false) => {

    num = num.replace(/\-/g, "")
    if (effDtTm != "NOW")
      effDtTm = effDtTm.replace(/\-/g, "").replace(":", "");

    let params = { num: num, effDtTm: effDtTm, roId: this.props.somos.selectRo, isUserAct: isUserAct }
    return await this.props.callApi2(RestApi.retrievePtrRec, params).then(async (res) => {
      if (res.ok && res.data) {

        let data = res.data
        if (data.errList != null && data.errList.length) {

          let errList = data.errList
          let errMsg = gFunc.synthesisErrMsg(errList)
          if (data.num == null) {

            if (errList[0].errCode === "530001" && data.numStatus != null && data.numStatus === "RESERVED") {
              this.setState({createModalVisible: true})
              return false

            } else {
              console.log("Error")
              NotificationManager.error("", errMsg)
              this.setState({bRetrieveEnable: true})
              return false
            }

          }

        }

        this.unlockPointerRecord()

        await this.reflectDataOnPage(num, res.data)

        this.backupStateToLastAction()
        return true

      } else if (res.data !== undefined && res.data.errList !== undefined && res.data.errList.length) {
        NotificationManager.error("", gFunc.synthesisErrMsg(res.data.errList))
        this.setState({message: gFunc.synthesisErrMsg(res.data.errList), bRetrieveEnable: true})
        return false

      }
    })
  };

  /**
   * create pointer record
   * @param cmd: 'U' or 'S'
   * @returns {Promise<boolean>}
   */
  createPointerRecord = async (cmd) => {

    if (!this.checkValidation()) {
      return false
    }

    let body = this.getCreateRequestBody(cmd)

    let res = await this.props.callApi2(RestApi.createPtrRec, {'body': JSON.stringify(body), roId: this.state.respOrg, 'timeout': timeout})
    if (res.ok && res.data) {

      let data = res.data
      if (data.recVersionId != undefined && data.recVersionId != null) {
        this.setState({recVersionId: data.recVersionId})
      }

      // if there is any error
      let errList = data.errList
      if (errList != undefined && errList != null) {

        let message = gFunc.synthesisErrMsg(errList)
        // error, but able to retrieve
        if (data.recVersionId != null) {
          if (await this.retrievePointerRecord(body.num, body.effDtTm)) {
            if (errList[0].errLvl === "ERROR") {
              NotificationManager.error("", message)

            } else {
              NotificationManager.warning("", message)
            }

            this.setState({message: message})
          }

        } else {

          this.setState({message: message})

          if (errList[0].errLvl === "ERROR") {
            NotificationManager.error("", message)
            return false

          } else {
            NotificationManager.warning("", message)
          }
        }

      } else {

        // no error, update successful
        if (this.retrievePointerRecord(body.num, data.effDtTm)) {
          NotificationManager.success("", PAD_CREATE_SUCCESSFUL)
          this.setState({message: '', action: gConst.ACTION_NONE})
        }
      }

    } else if (res.data != undefined){

      console.log("ERRRR")

      // if there is any error
      let errList = res.data.errList
      if (errList != undefined && errList != null) {

        let message = gFunc.synthesisErrMsg(errList)
        this.setState({message: message})
        NotificationManager.error("", message)

        return false
      }
    }

    return true;
  };

  /**
   * Update pointer record
   * @param cmd: 'U' or 'S'
   * @returns {Promise<boolean>}
   */
  updatePointerRecord = async (cmd) => {

    if (!this.checkValidation()) {
      return false
    }

    let body = this.getUpdateRequestBody(cmd)

    let res = await this.props.callApi2(RestApi.updatePtrRec, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})
    if (res.ok && res.data) {

      let data = res.data
      if (data.recVersionId !== undefined && data.recVersionId != null) {
        this.setState({recVersionId: data.recVersionId})
      }

      // if there is any error
      let errList = data.errList
      if (errList !== undefined && errList != null) {

        let message = gFunc.synthesisErrMsg(errList)
        // error, but able to retrieve
        if (data.recVersionId != null) {
          if (await this.retrievePointerRecord(body.num, body.effDtTm)) {
            if (errList[0].errLvl === "ERROR") {
              NotificationManager.error("", message)

            } else {
              NotificationManager.warning("", message)
            }

            this.setState({message: message})
          }

        } else {

          this.setState({message: message})

          if (errList[0].errLvl === "ERROR") {
            NotificationManager.error("", message)
            return false

          } else {
            NotificationManager.warning("", message)
          }
        }

      } else {

        // no error, update successful
        if (await this.retrievePointerRecord(body.num, body.effDtTm)) {
          NotificationManager.success("", PAD_UPDATE_SUCCESSFUL)
          this.setState({message: PAD_UPDATE_SUCCESSFUL})
        }
      }

    } else if (res.data !== undefined) {

      // if there is any error
      let errList = res.data.errList
      if (errList !== undefined && errList != null) {

        let message = gFunc.synthesisErrMsg(errList)
        this.setState({message: message})
        NotificationManager.error("", message)

        return false
      }
    }

    return true
  }

  /**
   * this is called at clicking Yes button on the copy modal
   * @returns {Promise<void>}
   */
  checkValidForCopying = async () => {

    if (!this.state.copyNow && this.state.tgtEffDtTm === '') {
      this.setState({validMsg: "Please input effective date/time"})
      return
    }

    let tgtNum = this.state.tgtNum.replace(/\-/g, "")

    switch (this.state.copyAction) {
      case gConst.COPYACTION_CHANGE:
        break
      case gConst.COPYACTION_DISCONNECT:
        if (this.state.srcNum !== tgtNum) {
          this.setState({validMsg: "Copy of a Disconnect TR is allowed only to the same Number"})
          return
        }
        if (this.state.dscInd) {
          this.setState({validMsg: "Action must be Change or New"})
          return
        }
        break
      case gConst.COPYACTION_NEW:
        if (this.state.srcNum === tgtNum) {
          this.setState({validMsg: "Action must be Change or Disconnect"})
          return
        }
        break
    }

    // gets source date time
    let srcEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)

    // gets target date time
    let tgtEffDtTm = "NOW"
    if (!this.state.copyNow) {
      tgtEffDtTm = gFunc.fromCTTimeToUTCStr(new Date(this.state.tgtEffDtTm))
    }

    let ptrRecAction = gConst.ACTION_COPY
    if (this.state.copyAction === gConst.COPYACTION_DISCONNECT || this.state.referral !== '') {
      ptrRecAction = gConst.ACTION_DISCONNECT
    }

    // configs parameter for calling lock api
    let body = {
      ptrRecAction: ptrRecAction,
      srcNum: this.state.srcNum,
      srcEffDtTm: srcEffDtTm,
      tgtNum: tgtNum,
      tgtEffDtTm: tgtEffDtTm,
    }

    // calls lock api
    let res = await this.props.callApi2(RestApi.lockPtrRec, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})
    if (res.ok && res.data) {
      if ((res.data.copyStatus && res.data.copyStatus.isAllowed === 'Y')
        || (res.data.disconnectStatus && res.data.disconnectStatus.isAllowed === 'Y')) {

        this.setState({srcRecVersionId: this.state.recVersionId})
        this.setState({lockParam: body})

        let effDtTmStat = "NOW"
        if (body.tgtEffDtTm != "NOW")
          effDtTmStat = gFunc.fromUTCStrToCTStr(body.tgtEffDtTm)
        let effDtTmStatList = [effDtTmStat]

        // if create
        if (body.srcNum !== body.tgtNum) {
          this.setState({
            retrieveCardTitle: "Create a New Pointer Record: " + gFunc.formattedNumber(body.tgtNum),
          })
        }

        this.setState({
          effDtTmStatList: effDtTmStatList,
          effDtTmStat: effDtTmStat,
          num: body.tgtNum
        })

        this.finishCpyTrnsfrOp()

        return
      }
    }

    if (res.data.errList) {
      this.setState({validMsg: gFunc.synthesisErrMsg(res.data.errList)})
    } else if (res.data.copyStatus && res.data.copyStatus.statusMessages !== null) {
      this.setState({validMsg: gFunc.synthesisErrMsg(res.data.copyStatus.statusMessages)})
    } else if (res.data.disconnectStatus && res.data.disconnectStatus.statusMessages !== null) {
      this.setState({validMsg: gFunc.synthesisErrMsg(res.data.disconnectStatus.statusMessages)})
    }
  }

  /**
   * this function is called when the copy or transfer operation is finished.
   */
  finishCpyTrnsfrOp = () => {

    let action = gConst.ACTION_TRANSFER
    let message = gConst.TRANSFER_PENDING_MSG
    switch (this.state.lockParam.ptrRecAction) {
      case gConst.ACTION_COPY:
        action = gConst.ACTION_COPY
        message = gConst.COPY_PENDING_MSG
        break
      case gConst.ACTION_TRANSFER:
        action = gConst.ACTION_TRANSFER
        message = gConst.TRANSFER_PENDING_MSG
        break
      case gConst.ACTION_DISCONNECT:
        action = gConst.ACTION_DISCONNECT
        message = gConst.DISCONNECT_PENDING_MSG
        break
    }

    this.setState({
      bEffDtTmDisable: true,

      disable: false,

      bEditEnable: false,
      bCopyEnable: false,
      bTransferEnable: false,
      bDeleteEnable: false,

      bSubmitEnable: true,
      bSaveEnable: true,
      bRevertEnable: false,

      action: action,
      message: message,
    })

    this.hideCopyModal()
    this.hideTransferModal()

    NotificationManager.success("", message)
  }

  /**
   * calls copy pointer record request
   * @param cmd
   */
  copyPointerRecord = async (cmd) => {

    let body = this.getCopyRequestBody(cmd)

    let res = await this.props.callApi2(RestApi.copyPtrRec, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})
    if (res.ok && res.data) {

      let data = res.data
      if (data.recVersionId != undefined && data.recVersionId != null) {
        this.setState({recVersionId: data.recVersionId})
      }

      // if there is any error
      let errList = data.errList
      if (errList != undefined && errList != null) {

        let message = gFunc.synthesisErrMsg(errList)
        // error, but able to retrieve
        if (data.recVersionId != null && data.effDtTm != null) {
          if (await this.retrievePointerRecord(body.tgtNum, data.effDtTm)) {
            if (errList[0].errLvl === "ERROR") {
              NotificationManager.error("", message)

            } else {
              NotificationManager.warning("", message)
            }

            this.setState({message: message})
          }

        } else {

          this.setState({message: message})

          if (errList[0].errLvl === "ERROR") {
            NotificationManager.error("", message)
            return false

          } else {
            NotificationManager.warning("", message)
          }
        }

      } else {

        // no error, update successful
        if (await this.retrievePointerRecord(body.tgtNum, res.data.effDtTm)) {
          NotificationManager.success("", PAD_COPY_SUCCESSFUL)
          this.setState({message: PAD_COPY_SUCCESSFUL, action: gConst.ACTION_NONE})
        }
      }

    } else if (res.data != undefined) {

      // if there is any error
      let errList = res.data.errList
      if (errList != undefined && errList != null) {

        let message = gFunc.synthesisErrMsg(errList)
        this.setState({message: message})
        NotificationManager.error("", message)

        return false
      }
    }

    return true
  }

  /**
   * this function is called at clicking Convert button on the convert modal
   */
  checkValidForConverting = async () => {

    // gets target date time
    let tgtEffDtTm = "NOW"
    if (!this.state.copyNow) {
      if (this.state.tgtEffDtTm === '') {
        this.setState({validMsg: 'Please input effective date/time'})
        return
      }
      tgtEffDtTm = gFunc.fromCTTimeToUTCStr(new Date(this.state.tgtEffDtTm))
    }


    for (let effDtTmStat of this.state.effDtTmStatList) {
      let utcEffDtTm = this.fromEffDtTmStatToUTCStr(effDtTmStat)
      if (utcEffDtTm === tgtEffDtTm) {
        this.toggleOverwrite()
        return
      }
    }

    this.convertPointerRecord()
  }

  /**
   * convert the pointer record to the customer record
   */
  convertPointerRecord = async () => {

    // gets target date time
    let tgtEffDtTm = "NOW"
    if (!this.state.copyNow) {
      tgtEffDtTm = gFunc.fromCTTimeToUTCStr(new Date(this.state.tgtEffDtTm))
    }

    // configs parameter for calling lock api
    let body = {
      recVersionId: this.state.recVersionId,
      tfNum: this.state.srcNum,
      srcEffDtTm: gFunc.fromCTStrToUTCStr(this.state.srcEffDtTm),
      tgtEffDtTm: tgtEffDtTm,
    }

    // calls lock api
    let res = await this.props.callApi2(RestApi.convertPtrRec, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})
    if (res.ok && res.data) {
      if (res.data.effDtTm) {
        this.gotoCADPage(this.state.srcNum, res.data.effDtTm)
        return

      } else if (res.data.reqId) {
        let params = {reqId: res.data.reqId, roId: this.props.somos.selectRo}
        await this.props.callApi2(RestApi.resultOfConvertedPtrRec, params).then(resResult => {
          if (resResult.ok && resResult.data) {
            this.gotoCADPage(this.state.srcNum, resResult.data.effDtTm)
            return
          }

          if (resResult.data.errList) {
            this.setState({validMsg: gFunc.synthesisErrMsg(resResult.data.errList)})
          }
          return
        })
      }
    }

    if (res.data.errList) {
      this.setState({validMsg: gFunc.synthesisErrMsg(res.data.errList)})
    }
  }

  /**
   * this function is called at clicking Transfer button on the transfer modal
   */
  checkValidForTransferring = async () => {

    // gets source date time
    let srcEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)

    // gets target date time
    let tgtEffDtTm = "NOW"
    if (!this.state.copyNow) {
      if (this.state.tgtEffDtTm === '') {
        this.setState({validMsg: 'Please input effective date/time'})
        return
      }
      tgtEffDtTm = gFunc.fromCTTimeToUTCStr(new Date(this.state.tgtEffDtTm))
    }

    let tgtNum = this.state.tgtNum.replace(/\-/g, "")

    // configs parameter for calling lock api
    let body = {
      ptrRecAction: gConst.ACTION_TRANSFER,
      srcNum: this.state.srcNum,
      srcEffDtTm: srcEffDtTm,
      tgtNum: tgtNum,
      tgtEffDtTm: tgtEffDtTm,
    }

    // calls lock api
    let res = await this.props.callApi2(RestApi.lockPtrRec, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})
    if (res.ok && res.data) {
      if (res.data.transferStatus.isAllowed === 'Y') {

        this.setState({srcRecVersionId: this.state.recVersionId})
        this.setState({lockParam: body})

        let effDtTmStat = "NOW"
        if (body.tgtEffDtTm != "NOW")
          effDtTmStat = gFunc.fromUTCStrToCTStr(body.tgtEffDtTm)
        let effDtTmStatList = [effDtTmStat]

        this.setState({
          effDtTmStatList: effDtTmStatList,
          effDtTmStat: effDtTmStat,
        })

        this.finishCpyTrnsfrOp()
        return
      }
    }

    if (res.data.errList) {
      this.setState({validMsg: gFunc.synthesisErrMsg(res.data.errList)})
    } else if (res.data.transferStatus && res.data.transferStatus.statusMessages !== null) {
      this.setState({validMsg: gFunc.synthesisErrMsg(res.data.transferStatus.statusMessages)})
    }

  }

  /**
   * calls transfer pointer record request
   * @returns {Promise<void>}
   */
  transferPointerRecord = async (cmd) => {

    let body = this.getTransferRequestBody(cmd)

    let res = await this.props.callApi2(RestApi.transferPtrRec, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})
    if (res.ok && res.data) {

      let data = res.data
      if (data.recVersionId !== undefined && data.recVersionId != null) {
        this.setState({recVersionId: data.recVersionId})
      }

      // if there is any error
      let errList = data.errList
      if (errList !== undefined && errList != null) {

        let message = gFunc.synthesisErrMsg(errList)
        // error, but able to retrieve
        if (data.recVersionId != null && data.effDtTm != null) {
          if (await this.retrievePointerRecord(body.tgtNum, data.effDtTm)) {
            if (errList[0].errLvl === "ERROR") {
              NotificationManager.error("", message)

            } else {
              NotificationManager.warning("", message)
            }

            this.setState({message: message})
          }

        } else {

          this.setState({message: message})

          if (errList[0].errLvl === "ERROR") {
            NotificationManager.error("", message)
            return false

          } else {
            NotificationManager.warning("", message)
          }
        }

      } else {

        // no error, update successful
        if (await this.retrievePointerRecord(body.num, res.data.effDtTm)) {
          NotificationManager.success("", PAD_TRANSFER_SUCCESSFUL)
          this.setState({message: PAD_TRANSFER_SUCCESSFUL, action: gConst.ACTION_NONE})
        }
      }

    } else if (res.data !== undefined) {

      // if there is any error
      let errList = res.data.errList
      if (errList !== undefined && errList != null) {

        let message = gFunc.synthesisErrMsg(errList)
        this.setState({message: message})
        NotificationManager.error("", message)

        return false
      }
    }

    return true
  }

  /**
   * calls disconnect pointer record request
   * @returns {Promise<void>}
   */
  disconnectPointerRecord = async (cmd) => {

    let body = this.getDisconnectRequestBody(cmd)

    let res = await this.props.callApi2(RestApi.disconnectPtrRec, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})
    if (res.ok && res.data) {

      let data = res.data
      if (data.recVersionId !== undefined && data.recVersionId != null) {
        this.setState({recVersionId: data.recVersionId})
      }

      // if there is any error
      let errList = data.errList
      if (errList !== undefined && errList != null) {

        let message = gFunc.synthesisErrMsg(errList)

        // error, but able to retrieve
        if (data.recVersionId != null && data.effDtTm != null) {
          if (await this.retrievePointerRecord(body.num, data.effDtTm)) {
            if (errList[0].errLvl === "ERROR") {
              NotificationManager.error("", message)

            } else {
              NotificationManager.warning("", message)
            }

            this.setState({message: message})
          }

        } else {

          this.setState({message: message})

          if (errList[0].errLvl === "ERROR") {
            NotificationManager.error("", message)
            return false

          } else {
            NotificationManager.warning("", message)
          }
        }

      } else {

        // no error, update successful
        if (await this.retrievePointerRecord(body.num, res.data.effDtTm)) {
          NotificationManager.success("", PAD_DISCONNECT_SUCCESSFUL)
          this.setState({message: PAD_DISCONNECT_SUCCESSFUL, action: gConst.ACTION_NONE})
        }
      }

    } else if (res.data !== undefined) {

      // if there is any error
      let errList = res.data.errList
      if (errList !== undefined && errList != null) {

        let message = gFunc.synthesisErrMsg(errList)
        this.setState({message: message})
        NotificationManager.error("", message)

        return false
      }
    }

    return true
  }

  /**
   *  calls delete pointer record request
   * @returns {Promise<void>}
   */
  deletePointerRecord = async () => {
    this.toggleDelete()

    let utcEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)  // YYYY-MM-DDTHH:mmZ

    let params = { num: this.state.num, effDtTm: utcEffDtTm, recVersionId: this.state.recVersionId, roId: this.props.somos.selectRo }
    this.props.callApi2(RestApi.deletePtrRec, params).then(res => {
      if (res.ok && res.data) {
        if (res.data.errList == undefined || res.data.errList == null) {
          NotificationManager.success("", PAD_DELETE_SUCCESSFUL)
          this.setState({message: ''})

          let effDtTmListSize = this.state.effDtTmStatList.length

          if (this.state.effDtTmStatList.length == 1) { // only one record, goes to initial state of page
            this.cancelAction()
          } else { // if next record exists, shows next record, else shows previous record

            this.clearAllData()

            // gets index
            let index = this.state.effDtTmStatList.indexOf(this.state.effDtTmStat)

            let effDtTmStatList = [...this.state.effDtTmStatList]
            effDtTmStatList.splice(index, 1)
            effDtTmStatList.splice(0, 0, "SELECT")

            this.setState({
              effDtTmStatList,
              effDtTmStat: "SELECT",
              bEditEnable: false,
              bCopyEnable: false,
              bTransferEnable: false,
              bDeleteEnable: false,
              bSubmitEnable: false,
              bSaveEnable: false,
              bRevertEnable: false,
              bCancelEnable: true,
            })
          }

          return
        }
      }

      if (res.data && res.data.errList) {
        let message = gFunc.synthesisErrMsg(res.data.errList)
        this.setState({message: message})
        NotificationManager.error("", message)
      }
    })
  }

  /**
   * get the content of common request
   * @param cmd
   * @returns {{notes: *, aos, tmplDesc: *, conTel: (string|*), conName: (string|*), cmd: *, numTermLine: *, tmZn: (string|*), dayLightSavings: string, priority: string}}
   */
  getCommonRequestBody = (cmd) => {

    let destNums = []
    let destination = {}
    if (this.state.destNum !== '')        destination.destNum = this.state.destNum.replace(/\-/g, '')
    if (this.state.numTermLine !== '')    destination.numTermLine = this.state.numTermLine
    if (this.state.forServOff !== '')     destination.forServOff = this.state.forServOff
    if (this.state.localServOff !== '')   destination.localServOff = this.state.localServOff

    destNums.push(destination)

    let body = {
      cmd: cmd,

      priority: this.state.priority ? 'Y' : 'N',
      telco: this.state.telco,
      hldIndFlag: this.state.hold,

      tmplName: this.state.tmplName,

      destNums: destNums,
    }

    // if (this.state.customerId !== '')
    //   body.onAccCust = this.state.customerId
    //
    // if (this.state.agent !== '')
    //   body.agent = this.state.agent

    if (this.state.endSub !== '')
      body.endSub = this.state.endSub

    if (this.state.endSubAddr !== '')
      body.endSubAddr = this.state.endSubAddr

    if (this.state.svcOrderNum !== '')
      body.svcOrderNum = this.state.svcOrderNum

    if (this.state.suppFormNum !== '')
      body.suppFormNum = this.state.suppFormNum

    if (this.state.contactName !== '')
      body.conName = this.state.contactName

    if (this.state.contactNumber !== '')
      body.conTel = this.state.contactNumber.replace(/\-/g, "")

    if (this.state.notes !== '')
      body.notes = this.state.notes

    return body
  }

  /**
   * get the content of create request
   */
  getCreateRequestBody = (cmd) => {

    let body = this.getCommonRequestBody(cmd)

    body.num = this.state.num

    let effDtTm = "NOW"
    if (!this.state.createNow)
      effDtTm = gFunc.fromCTTimeToUTCStr(new Date(this.state.createEffDtTm))
    body.effDtTm = effDtTm

    body.newRespOrgId = this.state.respOrg

    return body
  }

  /**
   * get the content of update request
   */
  getUpdateRequestBody = (cmd) => {

    let body = this.getCommonRequestBody(cmd)

    body.num = this.state.num
    body.effDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)

    if (this.state.endIntDtTm != null && this.state.endIntDtTm !== '')
      body.endInterceptDt = this.state.endIntDtTm

    if (this.state.referral != null && this.state.referral !== '')
      body.referral = this.state.referral

    body.recVersionId = this.state.recVersionId

    return body
  }

  /**
   * get the content of transfer request
   */
  getTransferRequestBody = (cmd) => {

    let body = this.getCommonRequestBody(cmd)

    body.num = this.state.srcNum
    body.srcEffDtTm = gFunc.fromCTStrToUTCStr(this.state.srcEffDtTm)

    if (this.state.effDtTmStat == "NOW")
      body.tgtEffDtTm = "NOW"
    else
      body.tgtEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)

    body.ctrlRespOrgId = this.state.respOrg
    if (this.state.endIntDtTm != null && this.state.endIntDtTm !== '')
      body.endInterceptDt = this.state.endIntDtTm

    if (this.state.referral != null && this.state.referral !== '')
      body.referral = this.state.referral

    body.custRecCompPart = 'PAD'
    body.recVersionId = this.state.recVersionId
    return body
  }

  /**
   * get the content of copy request
   */
  getCopyRequestBody = (cmd) => {

    console.log("cpr grid data: " + this.state.cprGridData)

    let body = this.getCommonRequestBody(cmd)

    body.srcNum = this.state.srcNum
    body.srcEffDtTm = gFunc.fromCTStrToUTCStr(this.state.srcEffDtTm)

    body.tgtNum = this.state.tgtNum.replace(/\-/g, "")
    if (this.state.effDtTmStat == "NOW")
      body.tgtEffDtTm = "NOW"
    else
      body.tgtEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)

    body.ctrlRespOrgId = this.state.respOrg
    body.custRecCompPart = 'PAD'
    body.recVersionId = this.state.recVersionId
    return body
  }

  /**
   * get the content of disconnect request
   */
  getDisconnectRequestBody = (cmd) => {

    let body = this.getCommonRequestBody(cmd)

    body.num = this.state.num
    body.srcEffDtTm = gFunc.fromCTStrToUTCStr(this.state.srcEffDtTm)

    if (this.state.effDtTmStat == "NOW")
      body.tgtEffDtTm = "NOW"
    else
      body.tgtEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)

    body.ctrlRespOrgId = this.state.respOrg
    body.endInterceptDt = this.state.endIntDtTm
    body.referral = this.state.referral
    body.custRecCompPart = 'PAD'
    body.recVersionId = this.state.recVersionId
    return body
  }

  /**
   * This function is called at clicking Yes on the create pointer record modal.
   * @returns {Promise<boolean>}
   */
  createAction = async () => {

    // lock the number
    let body = { ptrRecAction: gConst.ACTION_ALL, srcNum: this.state.searchNum.replace(/-/g, "") }
    let res = await this.props.callApi2(RestApi.lockPtrRec, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})
    if (res.ok && res.data && res.data.createStatus) {
      if (res.data.createStatus.isAllowed === 'N') {

        this.setState({bRetrieveEnable: true, createModalVisible: false})
        if (res.data.createStatus.statusMessages)
          NotificationManager.error("", res.data.createStatus.statusMessages[0].errMsg)

        return
      }
    }

    let retrieveCardTitle = "Create a New Pointer Record: " + gFunc.formattedNumber(this.state.searchNum)
    await this.setState({
      action:                   gConst.ACTION_CREATE,
      disable:                  false,
      num:                      this.state.searchNum.replace(/-/g, ""),
      retrieveCardTitle:        retrieveCardTitle,
      bRetrieveCardIconHidden:  true,
      bResultHeaderHidden:       true,
      bExpRetrieve:             false,
      bExpResult:               true,

      bEditEnable:              false,
      bCopyEnable:              false,
      bTransferEnable:          false,
      bDeleteEnable:            false,

      createModalVisible:       false,
    })

    console.log(">>> " + this.state.searchNum)
    console.log(">>> " + this.state.num)

    this.clearAllData()

    // get user information from the server and set the mail.
    this.props.callApi2(RestApi.userInfo, {}).then(res => {
      if (res.ok && res.data) {
        this.setState({ contactName: res.data.profile.contactName, contactNumber: gFunc.formattedNumber(res.data.profile.contactNumber) })
      }
    })
  };

  /**
   * cancel template admin data
   * @returns {Promise<boolean>}
   */
  cancelAction = async () => {

    await this.unlockPointerRecord()
    await this.setState(JSON.parse(JSON.stringify(this.initialState)));
    await this.setState({searchNum: '', searchEffDtTm: '', cancelModalVisible: false})

    $('#searchNum').focus()
  };

  /**
   *
   * @param date
   */
  interceptDate = (date) => {
    this.setState({endIntDtTm: date});
  };

  /**
   *
   * @param date
   */
  copyDate = (date) => {
    this.setState({tgtEffDtTm: date});
  };

  /**
   *
   * @param date
   */
  transferDate = (date) => {
    this.setState({tgtEffDtTm: date});
  };

  /**
   *
   * @param event
   */
  handle = async (event) => {
    let state = {}
    state[event.target.name] = event.target.value
    state['bContentModified'] = true
    this.setState(state);
  };

  /**
   *
   * @param event
   */
  handleCheck = async (event) => {
    let state = {};
    state[event.target.name] = event.target.checked;
    state['bContentModified'] = true
    this.setState(state);
  };

  /**
   *
   * @param event
   * @returns {Promise<void>}
   */
  handlePhoneNumber = async (event) => {
    let state = {}
    state[event.target.name] = gFunc.formattedNumber(event.target.value)
    state['bContentModified'] = true
    this.setState(state);

    // this.checkDataExistForCR()
  }

  /**
   *
   * @param event
   */
  handleOnModal = (event) => {
    let state = {}
    state[event.target.name] = event.target.value
    this.setState(state);
  };

  /**
   *
   * @param event
   */
  handleUppercase = async (event) => {
    const input = event.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    let state = {}
    state[input.name] = input.value.toUpperCase()

    if (input.name != "searchNum") {
      state['bContentModified'] = true
    }
    await this.setState(state, ()=>input.setSelectionRange(start, end));
  };

  /**
   *
   * @param event
   */
  handleUppercaseOnModal = (event) => {
    const input = event.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    let state = {}
    state[input.name] = input.value.toUpperCase()

    this.setState(state, ()=>input.setSelectionRange(start, end));
  };

  /**
   *
   * @param event
   */
  handleCheckOnModal = async (event) => {
    let state = {};
    state[event.target.name] = event.target.checked;
    this.setState(state);
  };

  /**
   *
   */
  hideCopyModal = () => {
    this.setState({
      copyModalVisible: false,
    });
  };

  /**
   *
   */
  hideConvertModal = () => {
    this.setState({
      convertModalVisible: false,
    });
  };

  /**
   *
   */
  toggleOverwrite = () => {
    this.setState({overwriteModalVisible: !this.state.overwriteModalVisible})
  }

  /**
   *
   */
  toggleCancel = () => {
    this.setState({cancelModalVisible: !this.state.cancelModalVisible});
  };

  /**
   *
   */
  toggleCreateModal = () => {
    this.setState({createModalVisible: !this.state.createModalVisible});
  };

  /**
   *
   */
  hideModifiedModal = () => {
    this.setState({modifiedModalVisible: false});
  };

  /**
   *
   */
  toggleDelete = () => {
    this.setState({deleteModalVisible: !this.state.deleteModalVisible})
  };

  /**
   *
   */
  hideTransferModal = () => {
    this.setState({
      transferModalVisible: false,
    })
  };

  render() {
    return (
      <div className="animated fadeIn mt-1">
        <Label className="ml-1"><strong style={{fontSize: 25}}>Pointer Record Admin Data</strong></Label>
        <Row>
          <Col xs="12">

            {/************************************************* Retrieve Card ****************************************************/}
            <Card>
              <CardHeader spacing={4}>
                <strong style={{fontSize: 20}}>{this.state.retrieveCardTitle}</strong>
                <div className="card-header-actions" hidden={this.state.bRetrieveCardIconHidden}>
                  <a className="card-header-action btn btn-minimize" data-target="#collapseExample" onClick={this.toggle_retrieve.bind(this)}>
                    <i className={this.state.bExpRetrieve ? "icon-arrow-up" : "icon-arrow-down"}/>
                  </a>
                </div>
              </CardHeader>

              <Collapse isOpen={this.state.bExpRetrieve} id="collapseExample">
                <CardBody>
                  <Row className="ml-4">
                    <Col xs="12" md="6" className="row">
                      <Label className="font-weight-bold mr-3 pt-1">Toll-Free Number *: </Label>
                      <Input className="col-7 form-control-sm" type="text" name="searchNum" id="searchNum"
                             onKeyDown={(ev) => this.onKeyDownToRetrieve(ev)} onChange={(ev) => this.handleUppercase(ev)} value={this.state.searchNum}/>
                    </Col>

                    <Col xs="12" md="4" className="row ml-2">
                      <Label className="font-weight-bold mr-2 pt-1">Effective Date Time: </Label>
                      <Row className="col-7 form-control-sm pt-0">
                        <Col>
                          <DatePicker
                            invalid={this.state.effDateErr}
                            dateFormat="MM/dd/yyyy hh:mm a"
                            selected={this.state.searchEffDtTm}
                            id="searchEffDtTm"
                            showTimeSelect
                            timeIntervals={15}
                            onChange={ (date) => {
                              this.setState({searchEffDtTm: date});
                            }}
                            className="form-control"
                            timeCaption="time"/>
                        </Col>
                      </Row>
                    </Col>

                    <Col xs={6} md={2} className="text-right">
                      <Button size="md-10" color="primary" disabled={!this.state.bRetrieveEnable} onClick={this.onSearchNumber}>Retrieve</Button>
                    </Col>
                  </Row>
                </CardBody>
              </Collapse>
            </Card>

            {/************************************************ Result Card ********************************************************/}
            <Card>
              <CardHeader spacing={4} hidden={this.state.bResultHeaderHidden}>
                <strong style={{fontSize: 20}}>{this.state.resultCardTitle}</strong>

                <select xs="6" md="6" className="form-control-sm mt-1 ml-3" hidden={this.state.bEffDtTmListHidden} disabled={this.state.bEffDtTmDisable}
                        name="effDtTmStat" id="effDtTmStat" onChange={(ev) => this.onEffDtTmSelChange(ev)} value={this.state.effDtTmStat}>
                  <>{this.state.effDtTmStatList.map(value => {return <option key={value}>{value}</option>})}</>
                </select>

                <div className="card-header-actions">
                  {/*<Button size="md-10" className="mr-2" color="primary" hidden={this.state.tmplName === ''} onClick={this.onDownload}>Download</Button>*/}
                  {/*<Button size="md-10" className="mr-2" color="primary" hidden={this.state.tmplName === ''} onClick={this.onPrint}>Print</Button>*/}
                  <a className="card-header-action btn btn-minimize" data-target="#collapseExample" onClick={this.toggle_result.bind(this)}>
                    <i className={(this.state.bExpResult && this.state.num !== '') ? "icon-arrow-up" : "icon-arrow-down"}/>
                  </a>
                </div>
              </CardHeader>

              <Collapse isOpen={this.state.bExpResult && this.state.num !== ''} id="collapseExample">

                <div className="mb-1 ml-3 mr-3 mt-2 pt-1" style={{backgroundColor: '#dfe1e3'}}>

                  {/************* This is the row that includes the effective date time, now *************/}
                  <Row className="mb-1 ml-4 mr-4 mt-1 pb-1 text-center" hidden={this.state.action !== gConst.ACTION_CREATE}>
                    <Col xs="2" md="3"/>
                    <Col xs="6" md="4" className="row ml-2">
                      <Label className="font-weight-bold mr-2 pt-1">Effective Date Time: </Label>
                      <Row className="col-7 form-control-sm pt-0">
                        <Col>
                          <DatePicker
                            dateFormat="MM/dd/yyyy hh:mm a"
                            selected={this.state.createEffDtTm}
                            id="createEffDtTm"
                            showTimeSelect
                            timeIntervals={15}
                            minDate={new Date()}
                            onChange={ (date) => {
                              this.setState({createEffDtTm: date});
                            }}
                            className="form-control"
                            timeCaption="time"/>
                          {this.state.effDateErr ? <FormText>Effective Date field is required</FormText> : ""}
                        </Col>
                      </Row>
                    </Col>
                    <Col xs="3" md="2" className="row ml-5">
                      <Label htmlFor="createNow" className="col-6 font-weight-bold mt-2">Now</Label>
                      <Input type="checkbox" name="createNow" id="createNow" className="form-control mr-5" style={{height: '20px', marginTop: '0.5rem'}}
                             onChange={(ev) => this.handleCheck(ev)} checked={this.state.createNow} />
                    </Col>
                  </Row>

                  {/************* This is the row that includes the resp org, customer id, high priority *************/}
                  <Row className="mb-2 m2-2 pt-3">
                    <Col xs="12" md="4" className="row">
                      <Label className="col-6 font-weight-bold text-right">Resp Org:</Label>
                      <Input className="col-6 form-control-sm" type="text" name="respOrg" id="respOrg" onChange={(ev) => this.handleUppercase(ev)} value={this.state.respOrg} disabled={this.state.action !== gConst.ACTION_CREATE && !(this.state.action === gConst.ACTION_COPY && this.state.copyAction === gConst.COPYACTION_NEW)}/>
                    </Col>
                    <Col xs="12" md="4" className="row">
                      <Label className="col-6 font-weight-bold text-right">Customer Id:</Label>
                      <Input className="col-6 form-control-sm" type="text" name="customerId" id="customerId" onChange={(ev) => this.handle(ev)} value={this.state.customerId} disabled={this.state.disable}/>
                    </Col>
                    <Col xs="12" md="4" className="row mr-2">
                      <Label htmlFor="highPriCreating" className="col-6 font-weight-bold text-right">High Priority</Label>
                      <Input type="checkbox" name="priority" id="priority" className="form-control" style={{height: '20px', marginTop: '0.1rem', marginLeft: '0rem'}}
                             onChange={(ev) => this.handleCheck(ev)} checked={this.state.priority}  disabled={this.state.disable}/>
                    </Col>
                  </Row>

                  {/************* This is the row that includes the agent, telco, hold *************/}
                  <Row className="mt-2 pb-2">
                    <Col xs="12" md="4" className="row">
                      <Label className="col-6 text-right font-weight-bold">Agent:</Label>
                      <Input className="col-6 form-control-sm" type="text" name="agent" id="agent" onChange={(ev) => this.handle(ev)} value={this.state.agent} disabled={this.state.disable}/>
                    </Col>
                    <Col xs="12" md="4" className="row">
                      <Label className="col-6 text-right font-weight-bold">Telco:</Label>
                      <Input className="col-6 form-control-sm" type="text" name="telco" id="telco" onChange={(ev) => this.handle(ev)} value={this.state.telco} disabled={this.state.disable}/>
                    </Col>
                    <Col xs="12" md="4" className="row">
                      <Label className="col-6 text-right font-weight-bold">Hold:</Label>
                      <Input className="col-6 form-control-sm" type="select" name="hold" id="hold" onChange={(ev) => this.handle(ev)} value={this.state.hold} disabled={this.state.disable}>
                        <option value="N">No</option>
                        <option value="Y">Yes</option>
                      </Input>
                    </Col>
                  </Row>

                  {/************* This is the row that includes the End Subscriber Name, End Subscriber Address *************/}
                  <Row className="mt-4 pb-2 ml-2 mr-5">
                    <Col xs="12" md="6" className="row">
                      <Label className="col-6 text-right font-weight-bold">End Subscriber Name:</Label>
                      <Input className="col-6 form-control-sm" type="text" name="endSub" id="endSub" onChange={(ev) => this.handle(ev)} value={this.state.endSub} disabled={this.state.disable}/>
                    </Col>
                    <Col xs="12" md="6" className="row">
                      <Label className="col-6 text-right font-weight-bold">End Subscriber Address:</Label>
                      <Input className="col-6 form-control-sm" type="text" name="endSubAddr" id="endSubAddr" onChange={(ev) => this.handle(ev)} value={this.state.endSubAddr} disabled={this.state.disable}/>
                    </Col>
                  </Row>

                  {/************* This is the row that includes the Service Order Number, Support Form Number *************/}
                  <Row className="pb-2 ml-2 mr-5">
                    <Col xs="12" md="6" className="row text-center">
                      <Label className="col-6 text-right font-weight-bold">Service Order Number:</Label>
                      <Input className="col-6 form-control-sm" type="text" name="svcOrderNum" id="svcOrderNum" onChange={(ev) => this.handle(ev)} value={this.state.svcOrderNum} disabled={this.state.disable}/>
                    </Col>
                    <Col xs="12" md="6" className="row">
                      <Label className="col-6 text-right font-weight-bold">Support Form Number:</Label>
                      <Input className="col-6 form-control-sm" type="text" name="suppFormNum" id="suppFormNum" onChange={(ev) => this.handle(ev)} value={this.state.suppFormNum} disabled={this.state.disable}/>
                    </Col>
                  </Row>

                  {/************* This is the row that includes the Approval, Last Updated, Last User, Prev User *************/}
                  <Row className="mt-4 pb-3"  hidden={this.state.action === gConst.ACTION_CREATE || (this.state.action === gConst.ACTION_COPY && this.state.copyAction === gConst.COPYACTION_NEW)}>
                    <Col xs="12" md="3" className="row">
                      <Label className="col-6 text-right font-weight-bold">Approval:</Label>
                      <Input className="col-6 form-control-sm" type="text" name="approval" id="approval" onChange={(ev) => this.handle(ev)} value={this.state.approval} disabled/>
                    </Col>
                    <Col xs="12" md="3" className="row">
                      <Label className="col-6 text-right font-weight-bold">Last Updated:</Label>
                      <Input className="col-6 form-control-sm" type="text" name="lastUpDt" id="lastUpDt" onChange={(ev) => this.handle(ev)} value={this.state.lastUpDt} disabled/>
                    </Col>
                    <Col xs="12" md="3" className="row">
                      <Label className="col-6 text-right font-weight-bold">Last User:</Label>
                      <Input className="col-6 form-control-sm" type="text" name="lastUser" id="lastUser" onChange={(ev) => this.handle(ev)} value={this.state.lastUser} disabled/>
                    </Col>
                    <Col xs="12" md="3" className="row">
                      <Label className="col-6 text-right font-weight-bold">Prev User:</Label>
                      <Input className="col-6 form-control-sm" type="text" name="prevUser" id="prevUser" onChange={(ev) => this.handle(ev)} value={this.state.prevUser} disabled/>
                    </Col>
                  </Row>
                </div>

                <Row>
                  <Col md="6" xs="12">

                    {/************************* Template Pane *************************/}
                    <div className="ml-3 mr-1 mt-1 mb-2" style={{backgroundColor: '#dfe1e3'}}>
                      <div style={{backgroundColor: '#9a9ea3'}}>
                        <Label className="ml-3 mt-1 mb-1 font-weight-bold">Template</Label>
                      </div>
                      <Col xs="12" className="row mr-4 ml-4 mt-2 pb-2">
                        <Label className="text-right font-weight-bold">Template Name:&nbsp;</Label>
                        {this.state.disable ?
                            <a href="#" onClick={() => this.gotoTADPage(this.state.tmplName)}>{this.state.tmplName}</a>
                          : <Input className="col-7 form-control-sm ml-1 " type="text" name="tmplName" id="tmplName"
                                   value={this.state.tmplName}
                                   onChange={(ev) => this.handleUppercase(ev)}/>
                        }
                      </Col>
                    </div>

                    {/************************* Destination Pane *************************/}
                    <div className="ml-3 mr-1 mt-1 mb-2 pb-2" style={{backgroundColor: '#dfe1e3'}}>
                      <div style={{backgroundColor: '#9a9ea3'}}>
                        <Label className="ml-3 mt-1 mb-1 font-weight-bold">Destination</Label>
                      </div>
                      <table className="table-bordered table-responsive-lg mt-2 mr-4 ml-4 pb-2 col-11">
                        <thead>
                        <tr>
                          <th className="text-center">Number</th>
                          <th className="text-center">#Lines</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                          <td><Input type="text" name="destNum" id="destNum" onChange={(ev) => this.handle(ev)} className="form-control-sm" value={this.state.destNum} disabled={this.state.disable}/></td>
                          <td><Input type="text" name="numTermLine" id="numTermLine" onChange={(ev) => this.handle(ev)} className="form-control-sm" value={this.state.numTermLine} disabled={this.state.disable}/></td>
                        </tr>
                        </tbody>
                      </table>
                    </div>
                  </Col>

                  {/************************* Contact Information Pane *************************/}
                  <Col md="6" xs="12">
                    <div className="mb-1 mr-3 mt-1" style={{backgroundColor: '#dfe1e3'}}>
                      <div style={{backgroundColor: '#9a9ea3'}}>
                        <Label className="ml-3 mt-1 mb-1 font-weight-bold">Contact Information</Label>
                      </div>
                      <Row className="mt-2 mr-4">
                        <Label className="col-4 font-weight-bold text-right">Contact Person:</Label>
                        <Input className="col-8 text-left form-control-sm" type="text" name="contactName" id="contactName" onChange={(ev) => this.handle(ev)} value={this.state.contactName} disabled={this.state.disable}/>
                      </Row>
                      <Row className="mt-1 mr-4">
                        <Label className="col-4 font-weight-bold text-right">Contact Number:</Label>
                        <Input className="col-8 text-left form-control-sm" type="text" name="contactNumber" id="contactNumber" onChange={(ev) => this.handle(ev)} value={this.state.contactNumber} disabled={this.state.disable}/>
                      </Row>
                      <Row className="mt-1 mb-1 mr-4 pb-2">
                        <Label className="col-4 font-weight-bold text-right">Notes:</Label>
                        <Input className="col-8 text-left form-control-sm" type="textarea" name="notes" id="notes" rows="3" onChange={(ev) => this.handle(ev)} value={this.state.notes} disabled={this.state.disable}/>
                      </Row>
                    </div>
                  </Col>
                </Row>

                {/************************* Disconnect info Pane *************************/}
                <div className="mb-1 ml-3 mr-3 row" style={{backgroundColor: '#dfe1e3'}}
                     hidden={this.state.status === gConst.STAT_OLD || this.state.status === gConst.STAT_ACTIVE || this.state.action === gConst.ACTION_CREATE
                        || (this.state.disable && this.state.endIntDtTm === '' && this.state.referral == '')}>
                  <Col xs="12" md="6" className="row mt-2 mb-2">
                    <Label className="col-6 text-right">End Intercept:</Label>
                    {(this.state.endIntDtTm !== '') ?
                      <TextField
                        id="date"
                        name="endIntDtTm"
                        type="date"
                        // className="col-6 form-control"
                        value={this.state.endIntDtTm}
                        onChange={(ev) => this.handle(ev)}
                        disabled={this.state.disable}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      /> :

                      <TextField
                        id="date_empty"
                        name="endIntDtTm"
                        type="date"
                        style={{color: '#AAAAAA'}}
                        value={this.state.endIntDtTm}
                        onChange={(ev) => this.handle(ev)}
                        disabled={this.state.disable}
                        InputLabelProps={{
                          shrink: true,
                        }}
                      />
                    }
                  </Col>
                  <Col xs="12" md="6" className="row mt-2 mb-2">
                    <Label className="col-6 text-right">Referral:</Label>
                    <Input className="col-6 form-control-sm" type="select" name="referral" id="referral" onChange={(ev) => this.handle(ev)} value={this.state.referral} disabled={this.state.disable}>
                      <option value="">SELECT</option>
                      <option value="N">No</option>
                      <option value="Y">Yes</option>
                    </Input>
                  </Col>
                </div>

                <div className="ml-3 mr-3" style={{backgroundColor: '#dfe1e3'}}>
                  <div className="row mt-2 mb-2 pt-2 pb-2">
                    <Label className="col-2 text-right">Message:</Label>
                    <Input className="col-8" type="textarea" name="message" id="message" onChange={(ev) => this.handle(ev)} value={this.state.message} disabled={this.state.disable}/>
                  </div>
                </div>
                <div className="ml-4 mr-4 mb-2 mt-2">
                  <Row>
                    <Col xs="12" md="7">
                      <Button size="md" color="primary" className="mr-2" disabled={!this.state.bEditEnable} onClick={this.onEdit}>Edit</Button>
                      <Button size="md" color="primary" className="mr-2" disabled={!this.state.bCopyEnable} onClick={this.onCopy}>Copy</Button>
                      <Button size="md" color="primary" className="mr-2" disabled={!this.state.bTransferEnable} onClick={this.onTransfer}>Transfer</Button>
                      <Button size="md" color="primary" className="mr-2"  disabled={!this.state.bDeleteEnable} onClick={this.toggleDelete}>Delete</Button>
                      <Button size="md" color="primary" className="mr-2"  disabled={!this.state.bCopyEnable} onClick={this.onConvert}>Convert</Button>
                    </Col>
                    <Col xs="12" md="5" className="text-right">
                      <Button size="md" color="primary" className="mr-2" disabled={(this.state.disable || !this.state.bContentModified) && !this.state.bSubmitEnable} onClick={this.onSubmit}>Submit</Button>
                      <Button size="md" color="primary" className="mr-2" disabled={(this.state.disable || !this.state.bContentModified) && !this.state.bSaveEnable} onClick={this.onSave}>Save</Button>
                      <Button size="md" color="primary" className="mr-2" disabled={(this.state.disable || !this.state.bContentModified) && !this.state.bRevertEnable} onClick={this.onRevert}>Revert</Button>
                      <Button size="md" color="primary" className="mr-2" onClick={this.toggleCancel}>Cancel</Button>
                    </Col>
                  </Row>
                </div>
              </Collapse>
            </Card>
          </Col>
        </Row>

        {this.renderCopyModal()}
        {this.renderDeleteModal(this.state.effDtTmStat)}
        {this.renderTransferModal()}
        {this.renderConvertModal()}
        {this.renderCancelModal()}
        {this.renderModifiedModal()}
        {this.renderOverwriteModal()}
        {this.renderCreateModal()}

        <NotificationContainer/>
      </div>
    );
  }

  renderCopyModal = () => (
    <Modal isOpen={this.state.copyModalVisible} toggle={this.hideCopyModal} className={'modal-lg ' + this.props.className}>
      <ModalHeader toggle={this.hideCopyModal}>Copy Pointer Record</ModalHeader>
      <ModalBody>
        <FormGroup row style={{marginBottom: "0px"}}>
          <Col xs="6">
            <Card>
              <CardHeader>Source Record</CardHeader>
              <CardBody>
                <Label htmlFor="srcNum">Toll-Free Number:</Label>
                <Input type="text" name="srcNum" id="tmplName" value={gFunc.formattedNumber(this.state.srcNum)} disabled/>
                <Label htmlFor="srcEffDtTm">Effective Date/Time:</Label>
                <Input type="text" id="srcEffDtTm" value={this.state.srcEffDtTm} disabled/>
              </CardBody>
            </Card>
          </Col>
          <Col xs="6">
            <Card>
              <CardHeader>Target Record</CardHeader>
              <CardBody>
                <Label htmlFor="tgtNum">Toll-Free Number*: </Label>
                <Input type="text" name="tgtNum" id="tgtNum" onChange={(ev) => this.handleUppercaseOnModal(ev)} value={this.state.tgtNum}/>
                <Label htmlFor="et_copy">Effective Date/Time*:</Label>
                <Row>
                  <Col xs="7">
                    <DatePicker dateFormat="MM/dd/yyyy hh:mm a"
                                selected={this.state.tgtEffDtTm}
                                showTimeSelect
                                timeIntervals={15}
                                minDate={new Date()}
                                onChange={this.copyDate}
                                className="form-control"
                                timeCaption="time"/>
                  </Col>
                  <div className="form-check align-content-center">
                    <Input type="checkbox" className="form-check-input" id="copyNow" name="copyNow" onChange={(ev)=>this.handleCheckOnModal(ev)} checked={this.state.copyNow} />
                    <label className="form-check-label" htmlFor="copyNow"> Now</label>
                  </div>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </FormGroup>
        <Row className="mt-0">
          <Col xs="12">
            <Card>
              <CardHeader>Action</CardHeader>
              <CardBody className="ml-lg-5">
                <Row>
                  <div className="form-check align-content-center col-4">
                    <Input type="radio" className="form-control-sm" style={{marginTop: '-0.3rem'}} id="change" name="change"
                           checked={this.state.copyAction == gConst.COPYACTION_CHANGE} onChange={() => { this.setState({copyAction: gConst.COPYACTION_CHANGE})}} />
                    <label className="form-check-label" htmlFor="change">{gConst.COPYACTION_CHANGE}</label>
                  </div>
                  <div className="form-check col-4">
                    <Input type="radio" className="form-control-sm" style={{marginTop: '-0.3rem'}} id="disconnect" name="disconnect"
                           checked={this.state.copyAction == gConst.COPYACTION_DISCONNECT} onChange={() => { this.setState({copyAction: gConst.COPYACTION_DISCONNECT})}} />
                    <label className="form-check-label" htmlFor="disconnect">{gConst.COPYACTION_DISCONNECT}</label>
                  </div>
                  <div className="form-check col-4">
                    <Input type="radio" className="form-control-sm" style={{marginTop: '-0.3rem'}} id="new" name="new"
                           checked={this.state.copyAction == gConst.COPYACTION_NEW} onChange={() => { this.setState({copyAction: gConst.COPYACTION_NEW})}} />
                    <label className="form-check-label" htmlFor="new">{gConst.COPYACTION_NEW}</label>
                  </div>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
        <div className="row" hidden={this.state.validMsg == ''}>
          <Col xs = "1"/>
          <Input className="col-10" type="textarea" name="validMsg" id="validMsg" value={this.state.validMsg} rows="5" style={{color:'#FF0000'}} readonly/>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button type="submit" size="md" color="primary" className="mr-2" onClick={this.checkValidForCopying}> Copy</Button>
        <Button type="reset" size="md" color="danger" onClick={this.hideCopyModal}> Cancel</Button>
      </ModalFooter>
    </Modal>
  );

  renderTransferModal = () => (
    <Modal isOpen={this.state.transferModalVisible} toggle={this.hideTransferModal} className={'modal-lg ' + this.props.className}>
      <ModalHeader toggle={this.hideTransferModal}>Transfer Pointer Record</ModalHeader>
      <ModalBody>
        <FormGroup row>
          <Col xs="6">
            <Card>
              <CardHeader>Source Record</CardHeader>
              <CardBody>
                <Label htmlFor="srcNum">Toll-Free Number:</Label>
                <Input type="text" id="srcNum" value={gFunc.formattedNumber(this.state.srcNum)} disabled/>
                <Label htmlFor="srcEffDtTm">Effective Date/Time:</Label>
                <Input type="text" id="srcEffDtTm" value={this.state.srcEffDtTm} disabled/>
              </CardBody>
            </Card>
          </Col>
          <Col xs="6">
            <Card>
              <CardHeader>Target Record</CardHeader>
              <CardBody>
                <Label htmlFor="tgtNum">Toll-Free Number*: </Label>
                <Input type="text" name="tgtNum" id="tgtNum" value={this.state.tgtNum} disabled/>
                <Label htmlFor="et_copy">Effective Date/Time*:</Label>
                <Row>
                  <Col xs="7">
                    <DatePicker dateFormat="MM/dd/yyyy hh:mm a"
                                selected={this.state.tgtEffDtTm}
                                showTimeSelect
                                timeIntervals={15}
                                minDate={new Date()}
                                onChange={this.transferDate}
                                className="form-control"
                                timeCaption="time"/>
                  </Col>
                  <div className="form-check align-content-center">
                    <Input type="checkbox" className="form-check-input" id="copyNow" name="copyNow" onChange={(ev) => this.handleCheckOnModal(ev)} checked={this.state.copyNow} />
                    <label className="form-check-label" htmlFor="copyNow"> Now</label>
                  </div>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </FormGroup>
        <div className="row" hidden={this.state.validMsg == ''}>
          <Col xs = "1"/>
          <Input className="col-10" type="textarea" name="validMsg" id="validMsg" value={this.state.validMsg} rows="5" style={{color:'#FF0000'}} readonly/>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button type="submit" size="md" color="primary" className="mr-2" onClick={this.checkValidForTransferring}>Transfer</Button>
        <Button type="reset" size="md" color="danger" onClick={this.hideTransferModal}> Cancel</Button>
      </ModalFooter>
    </Modal>
  );

  renderConvertModal = () => (
    <Modal isOpen={this.state.convertModalVisible} toggle={this.hideConvertModal} className={'modal-lg ' + this.props.className}>
      <ModalHeader toggle={this.hideConvertModal}>Convert Pointer Record to Customer Record</ModalHeader>
      <ModalBody>
        <FormGroup row>
          <Col xs="6">
            <Card>
              <CardHeader>Source Record</CardHeader>
              <CardBody>
                <Label htmlFor="srcNum">Toll-Free Number:</Label>
                <Input type="text" id="srcNum" value={gFunc.formattedNumber(this.state.srcNum)} disabled/>
                <Label htmlFor="srcEffDtTm">Effective Date/Time:</Label>
                <Input type="text" id="srcEffDtTm" value={this.state.srcEffDtTm} disabled/>
              </CardBody>
            </Card>
          </Col>
          <Col xs="6">
            <Card>
              <CardHeader>Target Record</CardHeader>
              <CardBody>
                <Label htmlFor="et_copy">Effective Date/Time*:</Label>
                <Row>
                  <Col xs="7">
                    <DatePicker dateFormat="MM/dd/yyyy hh:mm a"
                                selected={this.state.tgtEffDtTm}
                                showTimeSelect
                                timeIntervals={15}
                                minDate={new Date()}
                                onChange={this.transferDate}
                                className="form-control"
                                timeCaption="time"/>
                  </Col>
                  <div className="form-check align-content-center">
                    <Input type="checkbox" className="form-check-input" id="copyNow" name="copyNow" onChange={(ev) => this.handleCheckOnModal(ev)} checked={this.state.copyNow}/>
                    <label className="form-check-label" htmlFor="copyNow"> Now</label>
                  </div>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </FormGroup>
        <div className="row" hidden={this.state.validMsg == ''}>
          <Col xs = "1"/>
          <Input className="col-10" type="textarea" name="validMsg" id="validMsg" value={this.state.validMsg} rows="5" style={{color:'#FF0000'}} readonly/>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button type="submit" size="md" color="primary" className="mr-2" onClick={this.checkValidForConverting}>Convert</Button>
        <Button type="reset" size="md" color="danger" onClick={this.hideConvertModal}> Cancel</Button>
      </ModalFooter>
    </Modal>
  );

  renderDeleteModal = (effDtTmStat) => (
    <Modal isOpen={this.state.deleteModalVisible} toggle={this.toggleDelete} className={'modal-sm ' + this.props.className}>
      <ModalHeader toggle={this.toggleDelete}>Delete PAD</ModalHeader>
      <ModalBody>
        <Card>
          <CardHeader>Source Record</CardHeader>
          <CardBody>
            <Label htmlFor="num">Toll-Free Number:</Label>
            <Input type="text" value={gFunc.formattedNumber(this.state.num)} disabled/>
            <Label>Effective Date/Time:</Label>
            <Input type="text" value={effDtTmStat.split(" ")[0] + " " + effDtTmStat.split(" ")[1] + " " + effDtTmStat.split(" ")[2]} disabled/>
          </CardBody>
        </Card>
      </ModalBody>
      <ModalFooter>
        <Button size="md" color="primary" className="mr-2" onClick={this.deletePointerRecord}> Delete</Button>
        <Button size="md" color="danger" onClick={this.toggleDelete}> Cancel</Button>
      </ModalFooter>
    </Modal>
  );

  renderOverwriteModal = () => (
    <Modal isOpen={this.state.overwriteModalVisible} toggle={this.toggleOverwrite} className={'modal-sm ' + this.props.className}>
      <ModalHeader toggle={this.toggleOverwrite}>Overwrite Confirm</ModalHeader>
      <ModalBody>
        <Label>Target record exists. Do you want to overwrite?</Label>
        <div style={{display: "flex", justifyContent: 'flex-end'}}>
          <Button size="md" color="primary" className="mr-2" onClick={this.convertPointerRecord}>Yes</Button>
          <Button size="md" color="danger" onClick={this.toggleOverwrite}>No</Button>
        </div>
      </ModalBody>
    </Modal>
  );

  renderCancelModal = () => (
    <Modal isOpen={this.state.cancelModalVisible} toggle={this.toggleCancel} className={'modal-sm ' + this.props.className}>
      <ModalHeader toggle={this.toggleCancel}>Confirm</ModalHeader>
      <ModalBody>
        <Label>Are you sure you wish to cancel?</Label>
        <div style={{display: "flex", justifyContent: 'flex-end'}}>
          <Button size="md" color="primary" className="mr-2" onClick={this.cancelAction}>Yes</Button>
          <Button size="md" color="danger" onClick={this.toggleCancel}> No</Button>
        </div>
      </ModalBody>
    </Modal>
  );

  renderModifiedModal = () => (
    <Modal isOpen={this.state.modifiedModalVisible} toggle={this.hideModifiedModal} className={'modal-sm ' + this.props.className}>
      <ModalHeader toggle={this.hideModifiedModal}>Confirm</ModalHeader>
      <ModalBody>
        <Label>The data that you modified will be lost. Are you sure you wish to continue?</Label>
        <div style={{display: "flex", justifyContent: 'flex-end'}}>
          <Button size="md" color="primary" className="mr-2"
                  onClick={()=> {
                    if (this.state.bRevertClicked)
                      this.doRevert()
                    else
                      this.doAnotherPtr()}
                  }>Yes</Button>
          <Button size="md" color="danger"
                  onClick={() => {
                    if (this.state.bRevertClicked)
                      this.cancelRevert()
                    else
                      this.cancelAnotherPtr()
                  }}> No</Button>
        </div>
      </ModalBody>
    </Modal>
  );

  renderCreateModal = () => (
    <Modal isOpen={this.state.createModalVisible} toggle={this.toggleCreateModal} className={'modal-sm ' + this.props.className}>
      <ModalHeader toggle={this.toggleCreateModal}>No Results</ModalHeader>
      <ModalBody>
        <Label>Do you want to create a new Pointer Record?</Label>
        <div style={{display: "flex", justifyContent: 'flex-end'}}>
          <Button size="md" color="primary" className="mr-2" onClick={this.createAction}>Yes</Button>
          <Button size="md" color="danger" onClick={this.toggleCreateModal}> No</Button>
        </div>
      </ModalBody>
    </Modal>
  );
}

export default connect((state) => ({somos: state.auth.profile.somos}),
  dispatch => ({
    template:(types, ladData) => dispatch(template({types, ladData})),
    selectRo:(ro) => dispatch(selectRo(ro)),
  })
)(withLoadingAndNotification(PointerData));
