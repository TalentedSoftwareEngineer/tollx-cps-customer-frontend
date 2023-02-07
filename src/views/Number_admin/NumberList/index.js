import React, { Component } from 'react';
import {
  Button, Card, CardBody, CardHeader, Col, FormGroup, FormText,
  Input, Label, Row, CardFooter, ModalHeader, ModalBody, ModalFooter, Modal, Badge, Collapse
} from 'reactstrap';
import { connect } from 'react-redux'
import ReactTable from 'react-table';
import 'react-table/react-table.css'
import "react-toastify/dist/ReactToastify.css";
import 'react-overlay-loader/styles.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import RestApi from "../../../service/RestApi";
import _ from 'lodash';
import * as gFunc from "../../../utils";
import * as gConst from "../../../constants/GlobalConstants";
import $ from "jquery";
import {timeout} from "../../../service/numberSearch";
import Cookies from "universal-cookie";
import moment from 'moment';

// notification
import {NotificationContainer, NotificationManager} from'react-notifications';
import 'react-notifications/lib/notifications.css';
import Config from '../../../Config';
import ContactInfoPic from "../../../components/Common/ContactInfoPic";

function TmplCell({ value, columnProps: { rest: { onClickTmplName } } }) {
  return <div className="text-center"><a href="#" onClick={() => onClickTmplName(value)}>{value}</a></div>
}

const NUM_IMPRT_STAT_WAITING      = "waiting"
const NUM_IMPRT_STAT_DOWNLOADING  = "downloading"
const NUM_IMPRT_STAT_IMPORTING    = "importing"
const NUM_IMPRT_STAT_FINISHED     = "finished"
const NUM_IMPRT_STAT_CANCELED     = "canceled"

const FRN_REQ_TYPE_PAD = "PAD"

class NumberList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      progress: [],
      allFinish: false,
      firstEventReceiving: true,

      bExpUpload: false,     // the flag if the number upload panel is expanded
      fileContent: "",
      validContent: true,
      message: '',
      canceled: true,

      bCancelModalVisible: false,

      scriptList: [],
      bScriptAllChecked: false,    // the flag if the all check is selected
      bScriptNoneChecked: true,    // the flag if there is none checked

      entity: 'All',
      entityList: [],
      roId: "All",
      roIdList: [],
      showRoIdList: [],
      tmplName: 'All',
      tmplNameList: [],
      showTmplNameList: [],
      number: '',
      numberList: [],
      showNumberList: [],
      status: 'All',
      statusList: [],
      showStatusList: [],
      subDtTm: '',

      bAllChecked: false,    // the flag if the all check is selected
      bNoneChecked: true,    // the flag if there is none checked

      bConvModalVisible: false,  // the flag for showing the convert modal
      convTmplName: '',      // template name for conversion
      tmplErrMsg: '',      // template name error text
      validTmplName: true,  // the flag if the template name is valid
      desc: '',             // description for conversion
      descErr: false,       // description error flag
      effDtTmVal: '',       // effective date time value for conversion
      effDtTmErr: false,    // effective date time error flag
      effDtTmNow: false,     // the flag if effective date time is now


      /**************************  states for activate ***************************************/
      tmplNameListForActivate: [],
      template: "",
      validTemplate: true,
      numTermLine: '9999',
      validNumTermLine: true,
      serviceOrderNum: '',
      validSvcOrdrNum: true,
      timeZone: 'C',
      effDate: '',
      validEffDate: true,
      validRoId: true,
      now: false,
      activateModalVisible: false,
      roIdForActive: this.props.somos.selectRo,

      roIdListForActive: [],

      contactName: "",              // contact name
      contactNumber: "",            // contact number
      notes: "",                    // notes
      validContactInfo: true,
    };
    this.csvRef = React.createRef();
    this.nameRef = [];
  }

  async componentDidMount() {
    let roIdListForActive = [];
    if (this.props.somos.ro) {
      let ros = this.props.somos.ro;
      if (ros.includes(",")) {
        roIdListForActive = ros.split(",");
      } else {
        roIdListForActive.push(ros);
      }
    }
    this.setState({ roIdListForActive: roIdListForActive })

    this.state.contactName = this.props.contactName;
    this.state.contactNumber = this.props.contactNumber;

    let params = { entity: this.props.somos.selectRo.substring(0, 2), startTmplName: '', roId: '' }
    this.props.callApiHideLoading(RestApi.getTmplRecLstForEntity, params).then(res => {

      if (res.ok && res.data) {
        let tmplNameListForActivate = [];  // only template name list

        let tmplList = res.data.tmplList
        if (tmplList === undefined || tmplList == null) {
          return
        }

        for (let i = 0; i < tmplList.length; i++) {
          if (tmplList[i].custRecStat === 'ACTIVE')
            tmplNameListForActivate.push(tmplList[i].tmplName)
        }

        tmplNameListForActivate.sort()

        this.setState({ tmplNameListForActivate: tmplNameListForActivate })

        if (tmplNameListForActivate.length > 0) {
          this.setState({template: tmplNameListForActivate[0]})
        }
      }
    })

    await this.retrieveScriptList()
    this.backPressureEvent();

    this.retrieveNumberList(true)
  }

  componentWillUnmount() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
  }

  /**
   * this is called at clicking the expanding button on the upload panel.
   */
  toggleUpload = () => {
    this.setState({ bExpUpload: !this.state.bExpUpload })
  }

  /**
   * retrieve the sql script list from cps server
   */
  retrieveScriptList = async () => {
    let res = await this.props.callApi2(RestApi.sqlScripts, {})

    if (res.ok && res.data) {

      let scriptList = res.data
      for (let scriptInfo of scriptList) {
        scriptInfo.checked = false
      }

      this.setState({
        scriptList: scriptList,
        bScriptAllChecked: false,
        bScriptNoneChecked: true
      })
    }
  }

  /**
   * retrieve the number list from cps server
   */
  retrieveNumberList = async (showLoading = false) => {
    let res = null
    if (showLoading)
      res = await this.props.callApi2(RestApi.numberList, {})
    else
      res = await this.props.callApiHideLoading(RestApi.numberList, {})

    if (res.ok && res.data) {
      let entityList = res.data.entityList
      let roIdList = res.data.roList
      let tmplNameList = res.data.tmplList
      let numberList = res.data.numList
      let statusList = res.data.statusList
      for (let numInfo of numberList) {
        numInfo.submitDate = gFunc.fromUTCStrToCTStr(numInfo.submitDate)
        numInfo.checked = false
      }

      this.setState({
        entityList: entityList,
        roIdList: roIdList,
        showRoIdList: JSON.parse(JSON.stringify(roIdList)),
        tmplNameList: tmplNameList,
        showTmplNameList: JSON.parse(JSON.stringify(tmplNameList)),
        numberList: numberList,
        showNumberList: JSON.parse(JSON.stringify(numberList)),
        statusList: statusList,
        showStatusList: JSON.parse(JSON.stringify(statusList)),
        bAllChecked: false, bNoneChecked: true
      })

      this.resetSearchValue()

    }
  }

  /**
   *
   * @param ev
   */
  handleFilter = async (ev) => {
    let state = {};
    state[ev.target.name] = ev.target.value

    let name = ev.target.name
    let value = ev.target.value

    let entity = this.state.entity
    let roId = this.state.roId
    let showRoIdList = this.state.showRoIdList
    let tmplName = this.state.tmplName
    let showTmplNameList = this.state.showTmplNameList
    let status = this.state.status
    let showStatusList = this.state.showStatusList

    switch (name) {
      case "entity":
        entity = value
        if (entity === "All") {
          showRoIdList = JSON.parse(JSON.stringify(this.state.roIdList))

        } else {
          showRoIdList = []
          for (let el of this.state.roIdList) {
            if (entity === el.substring(0, 2))
              showRoIdList.push(el)
          }

        }

      case "roId":
        if (name === "roId") {
          roId = value

        } else {
          if (showRoIdList.indexOf(roId) === -1)
            roId = "All"
        }

        showTmplNameList = []
        showStatusList = []
        for (let el of this.state.numberList) {
          if (entity !== "All" && el.entity !== entity)   continue
          if (roId !== "All" && el.respOrg !== roId)      continue

          if (showTmplNameList.indexOf(el.tmplName) === -1)
            showTmplNameList.push(el.tmplName)

          if (showStatusList.indexOf(el.status) === -1)
            showStatusList.push(el.status)
        }

      case "tmplName":
        if (name === "tmplName") {
          tmplName = value

        } else {
          if (showTmplNameList.indexOf(tmplName) === -1)
            tmplName = "All"

        }

        showStatusList = []
        for (let el of this.state.numberList) {
          if (entity !== "All" && el.entity !== entity)         continue
          if (roId !== "All" && el.respOrg !== roId)            continue
          if (tmplName !== "All" && el.tmplName !== tmplName)   continue

          if (showStatusList.indexOf(el.status) === -1)
            showStatusList.push(el.status)
        }

      case "status":
        if (name === "status") {
          status = value

        } else {
          if (showStatusList.indexOf(status) === -1)
            status = "All"

        }
        break

      case "number":
        await this.setState({number: value})
        this.search()
        return

      case "subDtTm":
        await this.setState({subDtTm: value})
        this.search()
        return

      case "status":
        await this.setState({status: value})
        this.search()
        return

    }

    console.log(`entity: ${entity}, roId: ${roId}, tmplName: ${tmplName}`)

    await this.setState({
      entity: entity,
      roId: roId,
      showRoIdList: showRoIdList,
      tmplName: tmplName,
      showTmplNameList: showTmplNameList,
      status: status,
      showStatusList: showStatusList
    })
    this.search()
  };

  /**
   *
   * @param ev
   */
  handleUppercase = (ev) => {
    let state = {};
    state[ev.target.name] = ev.target.value.toUpperCase()

    this.setState(state)

  }

  /**
   *
   * @param ev
   */
  handleChange = (ev) => {
    let state = {};
    state[ev.target.name] = ev.target.value;

    this.setState(state);
  };

  /**
   *
   * @returns {Promise<boolean>}
   */
  submit = async () => {

    this.setState({ message: '' })

    let ids = ""
    for (let scriptInfo of this.state.scriptList) {
      if (!scriptInfo.checked)  continue

      ids += ids !== "" ? "," : ""
      ids += scriptInfo.id
    }

    let params = {ids: ids}

    this.props.callApi2(RestApi.importNumberList, params).then(async res => {
      console.log("res Data: " + res.data)
      if (res.ok && res.data) {
        NotificationManager.success("", "Processing...")
        this.setState({canceled: false})

      } else if (res.data) {
        if (res.data.msg) {
          NotificationManager.error("", res.data.msg)
          this.setState({message: res.data.msg})
        }
      }
    });
  };

  /**
   * event message
   */
  backPressureEvent = () => {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }

    if (!this.props.token) {
      return;
    }

    const eventSource = new EventSource(Config.eventSourceEndPoint + '/backpressure_events/num_retrieving_status?access_token=' + this.props.token, {withCredentials: false});
    eventSource.onmessage = async (event) => {

      console.log("Event Source data", JSON.parse(event.data));
      try {
        const data = JSON.parse(event.data);

        let scriptList = [...this.state.scriptList]

        let allFinish = true
        if (data.length === 0)
          allFinish = false

        for (let script of scriptList) {
          script.status = ""
          script.imported = ""
          script.message = ""
          script.checked = false

          for (let el of data) {
            if (el.scriptId == script.id) {
              script.status = el.status
              script.imported = el.imported
              script.message = el.description
              script.checked = true

              console.log(`>>> script id: ${script.id}, status: ${script.status}`)
              console.log(`>>> cancelSqlScript included: ${script.status.includes(NUM_IMPRT_STAT_CANCELED)}`)

              if (script.status !== NUM_IMPRT_STAT_FINISHED && !script.status.includes(NUM_IMPRT_STAT_CANCELED)) {
                allFinish = false

                console.log(`>>> script id: ${script.id}, all finish: ${allFinish}`)
              }
              break
            }
          }
        }

        await this.setState({scriptList, progress: data, allFinish: allFinish})

        if (this.state.firstEventReceiving && data.length > 0)
          this.setState({bExpUpload: true, firstEventReceiving: false})

        console.log(`>>> finally all finish: ${allFinish}`)
        if (allFinish) {
          let message = "The importing is over. Please click Confirm button."
          NotificationManager.success("", message)
          this.setState({message: message})
        }

      } catch(ex){
        console.log(ex);
      }
    }

    this.eventSource = eventSource
  };

  /**
   * this is called at clicking confirm button
   * calls api for confirming
   */
  confirm = async () => {
    await this.retrieveNumberList()

    let res = await this.props.callApi2(RestApi.confirmNumImporting, {'timeout': timeout})
    if (res.ok && res.data) {
      this.setState({
        canceled: true,
        message: '',
        bScriptAllChecked: false
      })
    } else if (res.data !== undefined) {

    }
  }

  onCancel = () => {
    this.setState({bCancelModalVisible: true})

  }

  toggleCancelModal = () => {
    this.setState({bCancelModalVisible: !this.state.bCancelModalVisible})
  }

  /**
   * this is called at clicking confirm button
   * calls api for confirming
   */
  cancelSqlScript = async () => {
    this.toggleCancelModal()

    let res = await this.props.callApi2(RestApi.cancelNumImporting, {'timeout': timeout})
    if (res.ok && res.data) {
      this.setState({
        canceled: true,
        allFinish: true,
        message: 'Canceled'
      })
      NotificationManager.warning("", "Canceled")

    } else if (res.data !== undefined) {

    }
  }

  /**
   * reset the file content field
   */
  reset = () => {
    this.setState({ fileContent: '' })
  };

  /**
   * search the number list
   */
  search = () => {
    console.log('entity: ', this.state.entity);
    console.log('roId: ', this.state.roId);
    console.log('tmplName: ', this.state.tmplName);
    console.log('status: ', this.state.status);
    console.log('number: ', this.state.number);
    console.log('subDtTm: ', this.state.subDtTm);

    let showNumberList = []
    let numberList = JSON.parse(JSON.stringify(this.state.numberList))
    for (let numInfo of numberList) {
      let bCoincide = true
      if (this.state.entity !== 'All' && numInfo.entity !== this.state.entity)
        bCoincide = false

      if (bCoincide && this.state.roId !== 'All' && numInfo.respOrg !== this.state.roId)
        bCoincide = false

      if (bCoincide && this.state.tmplName !== 'All' && numInfo.tmplName !== this.state.tmplName)
        bCoincide = false

      if (bCoincide && this.state.status !== 'All' && numInfo.status !== this.state.status)
        bCoincide = false

      let srchNum = this.state.number.replace(/\-/g, "")
      if (bCoincide && srchNum !== '' && !numInfo.number.startsWith(srchNum))
        bCoincide = false

      if (bCoincide && this.state.subDtTm !== '' && !numInfo.submitDate.includes(this.state.subDtTm))
        bCoincide = false

      if (bCoincide) {
        showNumberList.push(numInfo)
      }
    }
    this.setState({showNumberList: showNumberList, bAllChecked: false, bNoneChecked: true})
  }

  /**
   * reset the search condition fields
   */
  resetSearchValue = () => {
    this.setState({ entity: 'All', roId: 'All', tmplName: 'All', number: '', subDtTm: ''})
  }

  /**
   * this is called at clicking the Convert button
   */
  onConvert = () => {
    this.setState({
      bConvModalVisible: true,
      convTmplName: '',
      validTmplName: true,
      tmplNameErrMsg: '',
      effDtTmVal: '',
      effDtTmErr: false,
      effDtTmNow: false,
      desc: '',
      descErr: false
    })
  }

  /**
   * this is called when the user click create cad button
   */
  onCreateCad = () => {
    let num = "";
    for (let number of this.state.showNumberList) {
      if (number.checked) {
        num = number.number;
        break;
      }
    }

    this.createCad(num)
  }

  /**
   * go to cad page with number
   * @param number
   */
  createCad = (number) => {
    const cookies = new Cookies();
    cookies.set("cusNum", number);
    cookies.set("action", gConst.RECORD_PAGE_ACTION_CREATE)
    this.props.navigate('/customer_admin/customer_data');
  }

  /**
   * calls when the user click save of the "Contact Information" dialog
   */
  submitContact = (contactName, contactNumber, notes) => {
    this.setState({contactName: contactName, contactNumber: contactNumber, notes: notes, validContactInfo: true})
  }

  onActivate = () => {
    console.log('---------- activate ro id list: ', this.state.roIdListForActive)

    const serviceOrderNum = 'N' + moment().format('MMDDYY')
    this.setState({
      validTemplate: true,
      numTermLine: '9999',
      validNumTermLine: true,
      serviceOrderNum: serviceOrderNum,
      validSvcOrdrNum: true,
      timeZone: 'C',
      effDate: '',
      validEffDate: true,
      now: false,
      activateModalVisible: true,
      roIdForActive: this.props.somos.selectRo,
    })
  }

  /**
   *
   */
  hideActivateModal = () => {
    this.setState({ activateModalVisible: false })
  }

  /**
   * this is called when the focus of service order field is lost
   */
  onSvcOrderFieldFocusOut = () => {
    let svcOrdrNumReg = gConst.SVC_ORDR_NUM_REG_EXP
    if (this.state.serviceOrderNum != null && !svcOrdrNumReg.test(this.state.serviceOrderNum)) {
      this.setState({validSvcOrdrNum: false})
    } else {
      this.setState({validSvcOrdrNum: true})
    }
  }

  /**
   * this is called when the focus of ro id field is lost
   */
  onRoIdFieldFocusOut = () => {
    if (this.state.roIdListForActive.indexOf(this.state.roIdForActive) !== -1) {
      this.setState({ validRoId: true })
    } else {
      this.setState({ validRoId: false })
    }
  }

  /**
   * this is called when the focus of numTermLine field is lost
   */
  onNumTermLineFieldFocusOut = () => {
    let line = this.state.numTermLine
    let lineReg = /\d{4}/g

    if (lineReg.test(line)) {
      this.setState({validNumTermLine: true})
    } else {
      this.setState({validNumTermLine: false})
    }
  }

  /**
   * this is called when the focus of date field is lost
   */
  onDateFieldFocusOut = () => {
    let effDate = this.state.effDate
    if (effDate !== null && effDate !== '')
      this.setState({validEffDate: true})
    else
      this.setState({validEffDate: false})
  }

  /**
   * this is called at clicking the Activate button on the Activate Modal
   */
  activate = async () => {

    console.log("Activate: ")

    let bPass = true

    console.log(">>> Template: " + this.state.template)

    if (this.state.template == null || this.state.template === '') {
      await this.setState({validTemplate: false});

      if (bPass) {
        $('#template').focus()
      }

      bPass = false

    }  else {
      this.setState({validTemplate: true})
    }

    if (!this.state.validSvcOrdrNum || this.state.serviceOrderNum == null || this.state.serviceOrderNum === '') {
      await this.setState({validSvcOrdrNum: false});

      if (bPass){
        $('#serviceOrderNum').focus()
      }

      bPass = false
    } else {
      this.setState({validSvcOrdrNum: true});
    }

    if (!this.state.now) {
      if (!this.state.validEffDate || this.state.effDate == null || this.state.effDate === '') {
        await this.setState({validEffDate: false});

        if (bPass){
          $('#effDate').focus()
          $('html, body').animate({
            scrollTop: $("#effDate").offset().top - 100
          }, 1000)
        }

        bPass = false

      } else {
        this.setState({validEffDate: true});
      }
    }

    if (!this.state.validNumTermLine || this.state.numTermLine == null || this.state.numTermLine === '') {
      await this.setState({validNumTermLine: false});

      if (bPass)  $('#numTermLine').focus()

      bPass = false

    } else {
      this.setState({validNumTermLine: true});
    }

    if (this.state.contactName === "" || this.state.contactNumber === "") {
      await this.setState({validContactInfo: false})
      bPass = false

    } else {
      this.setState({validContactInfo: true})
    }

    if (!bPass)
      return false

    this.hideActivateModal()

    let effDtTm = "NOW"
    if (!this.state.now) {
      effDtTm = gFunc.fromCTTimeToUTCStr(new Date(this.state.effDate))
    }

    let body = {
      conName: this.state.contactName,
      conTel: this.state.contactNumber.replace(/\-/g, ""),
      tmplName: this.state.template,
      numTermLine: this.state.numTermLine,
      svcOrderNum: this.state.serviceOrderNum,
      effDtTm: effDtTm,
      cmd: 'U',
      newRespOrgId: this.state.roIdForActive
    }

    if (this.state.notes !== '')
      body.shrtNotes = this.state.notes

    body.numList = []
    for (let numInfo of this.state.showNumberList) {
      if (numInfo.checked)
        body.numList.push(numInfo.number)
    }

    console.log("Body: " + JSON.stringify(body))

    const res = await this.props.callApi2(RestApi.performFromReservedNumbers, {'body': JSON.stringify(body), type:FRN_REQ_TYPE_PAD, roId: this.props.somos.selectRo, 'timeout': timeout})

    if (res.ok && res.data) {
      const cookies = new Cookies();
      cookies.set("from", "number-list-page");
      this.props.navigate('/number_admin/rnl');

    } else if (res.data && res.data.errList) {

      let errMsg = ''
      for (let err of res.data.errList) {
        errMsg += (errMsg == '') ? '' : '\r\n'
        errMsg += (err.errMsg + "(" + err.errCode + ")")
      }

      NotificationManager.error("", errMsg)
      this.setState({message: errMsg})
    }
  }

  onDownload = () => {

    let idList = ""
    for (let numInfo of this.state.showNumberList) {
      idList += (idList === "") ? "" : ","
      idList += numInfo.id
    }

    this.downloadForm.action = Config.apiEndPoint + "/somos/numbers_list/template/download"
    this.textInput.value = this.props.data.token
    this.ids.value = idList
    this.downloadForm.submit()
    this.textInput.value = ""
    this.ids.value = ""
  }

  /**
   *
   */
  convert = async () => {
    let bPass = true
    if (this.state.convTmplName === '') {
      this.setState({tmplNameErrMsg: "Template name is required", validTmplName: false })
      $('#convTmplName').focus()
      bPass = false
    } else if (!gConst.TMPLNAME_REG_EXP.test(this.state.convTmplName)) {
      this.setState({tmplNameErrMsg: "Template name format error", validTmplName: false })
      $('#convTmplName').focus()
      bPass = false
    } else {
      this.setState({validTmplName: true})
    }

    if (!this.state.effDtTmNow && (this.state.effDtTmVal === undefined || this.state.effDtTmVal === '')) {
      this.setState({effDtTmErr: true})
      if (bPass) {
        $('#effDtTmVal').focus()
        bPass = false
      }
    }

    if (this.state.desc === '') {
      this.setState({descErr: true})
      if (bPass) {
        $('#desc').focus()
        bPass = false
      }
    }

    if (!bPass) {
      return
    }

    let numList = []
    for (let numInfo of this.state.showNumberList) {
      if (numInfo.checked)
        numList.push(numInfo.number)
    }


    let effDtTm = ''
    if (this.state.effDtTmNow) {
      effDtTm = "NOW";    // set "NOW" if now checkbox is checked
    } else if (this.state.effDtTmVal != null) {
      effDtTm = gFunc.fromCTTimeToUTCStr(new Date(this.state.effDtTmVal))
    }

    let body = { numList: numList, tmplName: this.state.convTmplName, tgtEffDtTm: effDtTm, title: this.state.desc, requestDesc: this.state.desc }
    let res = await this.props.callApi2(RestApi.numberAutomation, {'body': JSON.stringify(body), 'type': gConst.REQ_TYPE_MCP, respOrg: this.props.somos.selectRo, roId: this.props.somos.selectRo, 'timeout': timeout})
    if (res.ok && res.data) {
      this.props.navigate('/system_admin/mcp')

    } else if (res.data !== undefined) {

    }

  }

  setDate = (date) => {this.setState({effDtTmVal: date})}

  /**
   *
   */
  hideConvModal = () => {
    this.setState({ bConvModalVisible: !this.state.bConvModalVisible })
  }

  handleNowCheck = (event)=> {const state = {}; state[event.target.name] = event.target.checked; this.setState(state);};

  /**
   *
   * @param event
   */
  handleScriptAllCheck = async (event) => {

    let state = {}
    let bScriptAllChecked = event.target.checked

    let scriptList = this.state.scriptList
    for (let scriptInfo of scriptList) {
      scriptInfo.checked = bScriptAllChecked
    }

    this.setState({scriptList: scriptList, bScriptAllChecked: bScriptAllChecked, bScriptNoneChecked: !bScriptAllChecked });
  };

  /**
   *
   * @param event
   */
  handleAllCheck = async (event) => {

    let state = {}
    let bAllChecked = event.target.checked

    let showNumberList = this.state.showNumberList
    for (let numInfo of showNumberList) {
      numInfo.checked = bAllChecked
    }

    state['showNumberList'] = showNumberList
    this.setState({showNumberList: showNumberList, bAllChecked: bAllChecked, bNoneChecked: !bAllChecked });
  };

  /**
   *
   * @param event
   */
  handleScriptCheck = async (event) => {

    let id = event.target.name.split("_")[1]

    let scriptList = this.state.scriptList

    let bScriptAllChecked = true
    let bScriptNoneChecked = true
    for (let scriptInfo of scriptList) {
      if (scriptInfo.id == id)
        scriptInfo.checked = event.target.checked

      if (scriptInfo.checked) {
        bScriptNoneChecked = false
      } else {
        bScriptAllChecked = false
      }
    }

    await this.setState({scriptList, bScriptAllChecked: bScriptAllChecked, bScriptNoneChecked: bScriptNoneChecked});
  };

  /**
   *
   * @param event
   */
  handleCheck = async (event) => {

    let tmplName = event.target.name.split("_")[1]
    let num = event.target.name.split("_")[2]

    let showNumberList = this.state.showNumberList

    let bAllChecked = true
    let bNoneChecked = true
    for (let numInfo of showNumberList) {
      if (numInfo.number === num && numInfo.tmplName === tmplName)
        numInfo.checked = event.target.checked

      if (numInfo.checked) {
        bNoneChecked = false
      } else {
        bAllChecked = false
      }
    }

    await this.setState({showNumberList, bAllChecked: bAllChecked, bNoneChecked: bNoneChecked});
  };

  /**
   * number cell
   * @param value
   * @param onClickCAD
   * @param onClickPAD
   * @returns {*}
   */
  numCell = ({ value, columnProps: { rest: { onClickCAD, onClickPAD } } }) => {

    let selNum = null
    for (let numInfo of this.state.showNumberList) {
      if (value == numInfo.id) {
        selNum = numInfo
        break
      }
    }

    if (selNum) {
       return <div className="text-center">
         <div className="dial-cell">
           <a className="action" href={"tel:1" + selNum.number}>
             <span className="font-phone-3 icon"></span>
           </a>
           {(selNum.tmplName === "")
             ? <a href="#" onClick={() => onClickCAD(selNum.number, selNum.status)}>{gFunc.formattedNumber(selNum.number)}</a>
             : <a href="#" onClick={() => onClickPAD(selNum.number, selNum.status)}>{gFunc.formattedNumber(selNum.number)}</a>
           }
         </div>
        </div>
    }

    return <div className="text-center"></div>
  }

  /**
   * go to the template record page
   * @param tmplName
   */
  gotoTADPage = (tmplName) => {
    const cookies = new Cookies();
    cookies.set("tmplName", tmplName);
    cookies.set("effDtTm", "");
    this.props.navigate('/template_admin/template_data');
  }

  /**
   * go to the customer record page
   * @param number
   */
  gotoCADPage = (number) => {
    const cookies = new Cookies();
    cookies.set("cusNum", number);
    cookies.set("cusEffDtTm", "");
    cookies.set("action", gConst.RECORD_PAGE_ACTION_RETRIEVE)
    this.props.navigate('/customer_admin/customer_data');
  }

  /**
   * go to the pointer record page
   * @param number
   */
  gotoPADPage = (number) => {
    const cookies = new Cookies();
    cookies.set("ptrNum", number);
    cookies.set("ptrEffDtTm", "");
    cookies.set("action", gConst.RECORD_PAGE_ACTION_RETRIEVE)
    this.props.navigate('/customer_admin/pointer_data');
  }

  /**
   * check if selected numbers can be converted to another template
   * @returns {boolean}
   */
  canBeConverted = () => {
    console.log('can be converted : ')
    if (this.state.bNoneChecked)    return false;

    console.log('no none checked ')
    let bAllWorking = true;
    for (let number of this.state.showNumberList) {
      if (number.checked && number.status != 'WORKING') {
        console.log('checked : ', number.number)
        bAllWorking = false;
      }
    }
    return bAllWorking;
  }

  /**
   * check if selected number can be activated
   * @returns {boolean}
   */
  canBeActivated = () => {
    if (this.state.bNoneChecked)    return false;

    for (let number of this.state.showNumberList) {
      if (number.checked && number.status != "RESERVED")
        return false;
    }

    return true;
  }

  /**
   * check if selected number can be created as cad
   * @returns {boolean}
   */
  canBeCreatedAsCad = () => {
    if (this.state.bNoneChecked)    return false;

    let checkedCount = 0
    for (let number of this.state.showNumberList) {
      if (number.checked && number.status != "RESERVED")
        return false;

      if (checkedCount > 1) return false;

      if (number.checked)
        checkedCount++;
    }

    return true;
  }

  sqlScriptColumnsWithoutProgress = [
    {
      Header: () => <Input type="checkbox" style={{marginLeft: '-0.2rem'}} className="form-check-input" id="bScriptAllChecked" name="bScriptAllChecked"
                           onChange={this.handleScriptAllCheck} checked={this.state.bScriptAllChecked}  disabled={this.state.progress.length > 0}/>,
      width: 50,
      sortable: false,
      accessor: 'id',
      Cell: (props) => {
        return <div className="text-center">
          <Input type="checkbox" className="form-check-input" style={{marginLeft: '-0.2rem'}}
                 id={"check_" + props.original.id} name={"check_" + props.original.id} disabled={this.state.progress.length > 0}
                 onChange={this.handleScriptCheck} checked={props.original.checked}/>
        </div>
      },
    },
    {
      Header: "User Name",
      accessor: 'userName',
      width: 200,
      Cell: props => <div className="text-center">{props.value}</div>,
    },
    {
      Header: "Sql Script",
      accessor: 'sqlScript',
      Cell: props => {
        return props.value.split("\n").map(line => {
          return <div className="text-left">{line}</div>
        })
      }
    },
    {
      Header: "Autorun",
      accessor: 'autorun',
      width: 80,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value ? "TRUE" : "FALSE"}</div>,
    },
  ]

  sqlScriptColumns = [
    {
      Header: () => <Input type="checkbox" style={{marginLeft: '-0.2rem'}} className="form-check-input" id="bScriptAllChecked" name="bScriptAllChecked"
                           onChange={this.handleScriptAllCheck} checked={this.state.bScriptAllChecked}  disabled={this.state.progress.length > 0}/>,
      width: 50,
      sortable: false,
      accessor: 'id',
      Cell: (props) => {
        return <div className="text-center"  style={{marginTop: 10}}s>
          <Input type="checkbox" className="form-check-input" style={{marginLeft: '-0.2rem'}}
                 id={"check_" + props.original.id} name={"check_" + props.original.id} disabled={this.state.progress.length > 0}
                 onChange={this.handleScriptCheck} checked={props.original.checked}/>
        </div>
      },
    },
    {
      Header: "User Name",
      accessor: 'userName',
      width: 150,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>,
    },
    {
      Header: "Sql Script",
      accessor: 'sqlScript',
      Cell: props => {
        return props.value.split("\n").map(line => {
          return <div className="text-left">{line}</div>
        })
      }
    },
    {
      Header: "Autorun",
      accessor: 'autorun',
      width: 80,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value ? "TRUE" : "FALSE"}</div>,
    },
    {
      Header: "Import Status",
      accessor: 'status',
      width: 200,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>
        <h4>
          <Badge
            color={props.value==="" ? ""
              : props.value.includes(NUM_IMPRT_STAT_CANCELED) ? "warning"
                  : props.value===NUM_IMPRT_STAT_WAITING ? "secondary"
                    : props.value===NUM_IMPRT_STAT_DOWNLOADING ? "primary"
                      : props.value===NUM_IMPRT_STAT_IMPORTING ? "info"
                        : props.original.imported>0 ? "success" : "danger"}
            pill>
            <span className="btm-1 fnt-14">
              {props.value}
            </span>
          </Badge>
        </h4>
      </div>
    },
    {
      Header: "Imported",
      accessor: 'imported',
      width: 80,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>
        <h4>
          <Badge
            color={props.original.status==="" ? ""
                : props.original.status.includes(NUM_IMPRT_STAT_CANCELED) ? "warning"
                    : props.original.status===NUM_IMPRT_STAT_WAITING ? "secondary"
                      : props.original.status===NUM_IMPRT_STAT_DOWNLOADING ? "primary"
                        : props.original.status===NUM_IMPRT_STAT_IMPORTING ? "info"
                          : props.original.imported>0 ? "success" : "danger"}
            pill>
            <span className="btm-1 fnt-14">
              {props.value}
            </span>
          </Badge>
        </h4>
      </div>
    },
    {
      Header: "Message",
      accessor: 'message',
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>,
    },
  ]

  numberListColumns = [
    {
      Header: () => <Input type="checkbox" style={{marginLeft: '-0.2rem'}} className="form-check-input" id="bAllChecked" name="bAllChecked" onChange={this.handleAllCheck} checked={this.state.bAllChecked}/>,
      width: 50,
      sortable: false,
      Cell: (props) => {
        return <div className="text-center">
          <Input type="checkbox" className="form-check-input" style={{marginLeft: '-0.2rem'}}
                 id={"check_" + props.original.tmplName + "_" + props.original.number} name={"check_" + props.original.tmplName + "_" + props.original.number}
                 onChange={this.handleCheck} checked={props.original.checked}/>
        </div>
      },
      Filter: () => <div></div>
    },
    {
      Header: "Entity",
      accessor: 'entity',
      Cell: props => <div className="text-center">{props.value}</div>,
      Filter: () =>
        <Input type="select" className="form-control-sm " style={{'text-align-last': 'center'}} id="entity" name="entity" value={this.state.entity} onChange={(ev)=> this.handleFilter(ev)}>
          <option value="All">All</option>
          {this.state.entityList && this.state.entityList.map(s => <option key={s} value={s}>{s}</option>)}
        </Input>
    },
    {
      Header: "Resp Org Id",
      accessor: 'respOrg',
      Cell: props => <div className="text-center">{props.value}</div>,
      Filter: () =>
        <Input type="select" className="form-control-sm " style={{'text-align-last': 'center'}} id="roId" name="roId" value={this.state.roId} onChange={(ev)=> this.handleFilter(ev)}>
          <option value="All">All</option>
          {this.state.showRoIdList && this.state.showRoIdList.map(s => <option key={s} value={s}>{s}</option>)}
        </Input>
    },
    {
      Header: "Template Name",
      accessor: 'tmplName',
      // Cell: props => <div className="text-center">{props.value}</div>,
      Cell: TmplCell,
      getProps: () => ({
        onClickTmplName: (tmplName) => {
          this.gotoTADPage(tmplName)
        }
      }),
      Filter: () =>
        <Input type="select" className="form-control-sm" style={{'text-align-last': 'center'}} id="tmplName" name="tmplName" value={this.state.tmplName} onChange={(ev)=> this.handleFilter(ev)}>
          <option value="All">All</option>
          {this.state.showTmplNameList && this.state.showTmplNameList.map(s => <option key={s} value={s}>{s}</option>)}
        </Input>
    },
    {
      Header: "Toll-Free Number",
      accessor: 'id',
      Cell: this.numCell,
      getProps: () => ({
        onClickCAD: (number, status) => {
          if (status == 'WORKING')
            this.gotoCADPage(number)
          else if (status == 'RESERVED')
            this.createCad(number)
        },
        onClickPAD: (number, status) => {
          if (status == 'WORKING')
            this.gotoPADPage(number)
        },
      }),
      // accessor: 'number',
      // Cell: props => <a className="text-center" href={"tel:'" + props.value + "'"}>{props.value}</a>,
      // Cell: props => <div className="text-center">{props.value}</div>,
      Filter: () =>
        <Input type="text" className="form-control-sm text-center" id="number" name="number" value={this.state.number} onChange={(ev)=> this.handleFilter(ev)}/>
    },
    {
      Header: "Status",
      accessor: 'status',
      Cell: props => <div className="text-center">{props.value}</div>,
      Filter: () =>
        <Input type="select" className="form-control-sm " style={{'text-align-last': 'center'}} id="status" name="status" value={this.state.status} onChange={(ev)=> this.handleFilter(ev)}>
          <option value="All">All</option>
          {this.state.showStatusList && this.state.showStatusList.map(s => <option key={s} value={s}>{s}</option>)}
        </Input>
    },
    {
      Header: "Submit Date",
      accessor: 'submitDate',
      Cell: props => <div className="text-center">{props.value}</div>,
      Filter: () =>
        <Input type="text" className="form-control-sm text-center" id="subDtTm" name="subDtTm" value={this.state.subDtTm} onChange={(ev)=> this.handleFilter(ev)}/>
    },
    {
      Header: "Action",
      sortable: false,
      Cell: props =>
        <div className="text-center">
          <Button size="sm" onClick={() => this.createCAD(props.original.num)} color="primary" className="ml-2" hidden={props.original.status !== 'RESERVED'}>CAD</Button>
        </div>,
      Filter: () => <div></div>
    },
  ]

  render() {
    return (
      <div className="animated fadeIn">
        <div className="page-header">
          <Row className="mt-4">
            <Col xs="12">
              <h1 className="pb-3 border-bottom">
                Number List
              </h1>
            </Col>
          </Row>
        </div>
        <div className="mt-3">
          <Card>
            <CardHeader>
              Sql Scripts
              <div className="card-header-actions">
                <a className="card-header-action btn btn-minimize" data-target="#collapseExample" onClick={this.toggleUpload.bind(this)}>
                  <i className={this.state.bExpUpload ? "icon-arrow-up" : "icon-arrow-down"}/>
                </a>
              </div>
            </CardHeader>
            <Collapse isOpen={this.state.bExpUpload} id="collapseExample">
              <CardBody>
                <div className="row">
                  <Col>
                    Total Numbers: {this.state.scriptList.length}
                  </Col>
                  <Col className="text-right">
                    <Button size="md" color="primary" className="mr-2" onClick={this.retrieveScriptList} disabled={this.state.progress.length !== 0}>Refresh</Button>
                  </Col>
                </div>

                <div className="mt-1">
                  { this.state.progress.length === 0
                     ? <ReactTable data={this.state.scriptList} columns={this.sqlScriptColumnsWithoutProgress} defaultPageSize={5} minRows="1" className="-striped -highlight col-12"
                        ref={(r) => this.selectActivityLogTable = r}
                      />
                    : <ReactTable data={this.state.scriptList} columns={this.sqlScriptColumns} defaultPageSize={5} minRows="1" className="-striped -highlight col-12"
                                ref={(r) => this.selectActivityLogTable = r}
                    />
                  }
                </div>

                <div className="row mt-3" hidden={this.state.message === ""}>
                  <Label className="col-1 text-right">Message:</Label>
                  <Input className="col-10" type="textarea" name="message" id="message" value={this.state.message} rows="2" style={{backgroundColor: "#FFF"}} readOnly/>
                </div>
              </CardBody>
              <CardFooter>
                <Row>
                  <Col xs="12" className="text-right">
                    <Button size="md" color="primary" onClick={this.confirm} className="ml-2" hidden={!this.state.allFinish}>Confirm</Button>
                    <Button size="md" color="primary" onClick={this.onCancel} className="ml-2" hidden={this.state.allFinish || this.state.progress.length === 0}>Cancel</Button>
                    <Button size="md" color="primary" onClick={this.submit} className="ml-2" disabled={this.state.progress.length !== 0}>Submit</Button>
                  </Col>
                </Row>
              </CardFooter>
            </Collapse>
          </Card>
        </div>

        <Card>
          <CardHeader>
            Number List
          </CardHeader>
          <CardBody>
            <div className="row">
              <Col>
                Total Numbers: {this.state.numberList.length}, Displayed Numbers: {this.state.showNumberList.length}
              </Col>
              <Col className="text-right">
                <Button size="md" color="primary" className="mr-2" onClick={(ev) => {this.retrieveNumberList(true)}}>Refresh</Button>
              </Col>
            </div>

            <div className="mt-2">
              <ReactTable
                data={this.state.showNumberList} columns={this.numberListColumns} defaultPageSize={10} filterable minRows="1" className="-striped -highlight col-12"
                ref={(r) => this.selectActivityLogTable = r}
              />

              <Row className="mt-3">
                <Col xs="12" className="text-right">
                  <Button size="md" color="primary" onClick={this.onConvert} className="ml-2" disabled={!this.canBeConverted()}>Convert</Button>
                  <Button size="md" color="primary" onClick={this.onActivate} className="ml-2" disabled={!this.canBeActivated()}>Activate</Button>
                  <Button size="md" color="primary" onClick={this.onDownload} className="ml-2">Download</Button>
                </Col>
              </Row>
            </div>
          </CardBody>
        </Card>


        <form ref={(node) => { this.downloadForm = node }} action="" target="_blank" method="post">
          <input type="hidden" ref={(input) => { this.textInput = input }} name="access_token" value="" />
          <input type="hidden" ref={(input) => { this.ids = input }} name="ids" value="" />
        </form>

        {this.renderCancelModal()}
        {this.renderConversionModal()}
        {this.renderActivateModal()}

        <NotificationContainer/>
      </div>
    );
  }

  renderCancelModal = () => (
    <Modal isOpen={this.state.bCancelModalVisible} toggle={this.toggleCancelModal} className={'modal-sm ' + this.props.className}>
      <ModalHeader toggle={this.toggleCancelModal}>Cancel Confirm</ModalHeader>
      <ModalBody>
        <Label>Are you sure you wish to cancel?</Label>
        <div style={{display: "flex", justifyContent: 'flex-end'}}>
          <Button size="md" color="primary" className="mr-2" onClick={this.cancelSqlScript}>Yes</Button>
          <Button size="md" color="danger" onClick={this.toggleCancelModal}>No</Button>
        </div>
      </ModalBody>
    </Modal>
  );

  renderConversionModal = () => (
    <Modal isOpen={this.state.bConvModalVisible} toggle={this.hideConvModal} className={'modal-lg ' + this.props.className}>
      <ModalHeader toggle={this.hideConvModal}>Multiple Number Conversion</ModalHeader>
      <ModalBody>
        <FormGroup row>
          <Label for="name" sm={4}>Template Name:</Label>
          <Col sm={8}>
            <Input invalid={!this.state.validTmplName} type="text" id="convTmplName" name="convTmplName"
                   onChange={(ev) => this.handleUppercase(ev)} value={this.state.convTmplName} className="col-11" />
            {!this.state.validTmplName ? <FormText>{this.state.tmplNameErrMsg}</FormText> : ""}
          </Col>
        </FormGroup>

        <FormGroup row>
          <Label sm={4} htmlFor="eff_date"> Start Effective Date/Time: </Label>
          <Col xs={4}>
            <DatePicker
              invalid={this.state.effDtTmErr}
              dateFormat="MM/dd/yyyy hh:mm a"
              selected={this.state.effDtTmVal}
              showTimeSelect
              timeIntervals={15}
              minDate={new Date()}
              onChange={this.setDate}
              className="form-control"
              timeCaption="time"/>
            {this.state.effDtTmErr ? <FormText>Effective Date Time field is required</FormText> : ""}
          </Col>
          <div className="form-check align-content-center">
            <Input type="checkbox" className="form-check-input" id="effDtTmNow" name="effDtTmNow" onChange={this.handleNowCheck} checked={this.state.effDtTmNow}/>
            <label className="form-check-label"> NOW</label>
          </div>
        </FormGroup>
        <FormGroup row>
          <Label for="name" sm={4}>Description :</Label>
          <Col sm={8}>
            <Input invalid={this.state.descErr} type="text" id="desc" name="desc"
                   onChange={(ev) => this.handleChange(ev)} value={this.state.desc} className="col-11" />
            {this.state.descErr ? <FormText>Description field is required</FormText> : ""}
          </Col>
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button type="submit" size="md" color="primary" className="mr-2" onClick={this.convert}>Convert</Button>
        <Button type="reset" size="md" color="danger" onClick={this.hideConvModal}> Cancel</Button>
      </ModalFooter>
    </Modal>
  );

  renderActivateModal = () => (
    <Modal isOpen={this.state.activateModalVisible} toggle={this.hideActivateModal} className={'modal-lg ' + this.props.className}>
      <ModalHeader toggle={this.hideActivateModal}>Activate</ModalHeader>
      <ModalBody>
        <Card>
          <CardBody>
            {/* Template */}
            <FormGroup row>
              <Col xs="12" md="6">
                <Label htmlFor="template">Template *</Label>
                <Input type="select" className="form-control-sm " id="template" name="template" value={this.state.template} onChange={(ev)=> this.handleChange(ev)}>
                  {this.state.tmplNameListForActivate && this.state.tmplNameListForActivate.map(s => <option key={s} value={s}>{s}</option>)}
                </Input>
              </Col>
              <Col xs="12" md="6">
                <Label htmlFor="roId">Resp Org Id *</Label>
                <Input invalid={!this.state.validRoId} type="text" name="roIdForActive" id="roIdForActive" onChange={(ev)=>this.handleUppercase(ev)} onBlur={this.onRoIdFieldFocusOut} value={this.state.roIdForActive}/>
                {!this.state.validRoId ? <FormText><p style={{color: 'red'}}>Must be name belongs to your resp org id list.</p></FormText> : ""}
              </Col>
            </FormGroup>

            {/* Service Order & Time Zone*/}
            <FormGroup row>
              <Col xs="12" md="6">
                <Label htmlFor="serviceOrderNum">Service Order *</Label>
                <Input invalid={!this.state.validSvcOrdrNum} type="text" name="serviceOrderNum" id="serviceOrderNum" onChange={(ev)=>this.handleChange(ev)} onBlur={this.onSvcOrderFieldFocusOut} value={this.state.serviceOrderNum}/>
                {!this.state.validSvcOrdrNum ? <FormText><p style={{color: 'red'}}>Must be 4 to 13 alphanumeric characters. The 1st character must be alpha, 2nd to 12th characters must be alphanumeric. The 13th character must be alpha.</p></FormText> : ""}
              </Col>
              <Col xs="12" md="6">
                <Label htmlFor="numTermLine">Number of Lines *</Label>
                <Input invalid={!this.state.validNumTermLine} type="text" name="numTermLine" id="numTermLine" onChange={(ev) => this.handleChange(ev)} onBlur={this.onNumTermLineFieldFocusOut} value={this.state.numTermLine}/>
                {!this.state.validNumTermLine ? <FormText><p style={{color: 'red'}}>Please input only 4 digits</p></FormText> : ""}
              </Col>
            </FormGroup>

            {/* Number of Line & Effective Date & Time */}
            <FormGroup row>
              <Col xs="6" md="6">
                <Row>
                  <Col xs="8">
                    <Label htmlFor="effective_date">Effective Date *</Label>
                    <div>
                      <DatePicker
                        invalid={!this.state.validEffDate}
                        id="effDate"
                        placeholderText="MM/DD/YYYY"
                        dateFormat="MM/dd/yyyy hh:mm a"
                        showTimeSelect
                        selected={this.state.effDate}
                        onChange={this.handleDate}
                        minDate={new Date()}
                        className="form-control"
                        onBlur={this.onDateFieldFocusOut}
                      />
                    </div>
                    {!this.state.validEffDate ? <FormText><p style={{color: 'red'}}>Please input effective date</p></FormText> : ""}
                  </Col>
                  <Col xs="2" md="2">
                    <Label htmlFor="now">Now</Label>
                    <Input type="checkbox" name="now" id="now" className="form-control" style={{height: 30, marginTop: 0}} onChange={(ev) => this.setState({now: ev.target.checked})}/>
                  </Col>
                </Row>
              </Col>

              <Col xs="6" md="6">
                <ContactInfoPic
                  buttonId="contactInfoPicBtn"
                  contactName={this.state.contactName}
                  contactNumber={this.state.contactNumber}
                  notes={this.state.notes}
                  submitContact={this.submitContact}
                  modalClassName={this.props.className}
                />
                {!this.state.validContactInfo ? <FormText className="ml-4"><p style={{color: 'red'}}>Please input contact information</p></FormText> : ""}
              </Col>
            </FormGroup>
          </CardBody>
        </Card>
      </ModalBody>
      <ModalFooter>
        <Button size="md" color="primary" className="mr-2" onClick={this.activate}> Activate</Button>
        <Button size="md" color="danger" onClick={this.hideActivateModal}> Cancel</Button>
      </ModalFooter>
    </Modal>
  );
}

export default connect((state) => ({
  somos: state.auth.profile.somos,
  contactName: state.auth.profile.contactName,
  contactNumber: state.auth.profile.contactNumber,
  token: state.auth.token,
  data: state.auth
}))(withLoadingAndNotification(NumberList));
