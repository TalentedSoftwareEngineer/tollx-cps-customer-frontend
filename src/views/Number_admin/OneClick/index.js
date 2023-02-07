import React, {Component} from 'react';
import $ from 'jquery'
import {  Button,  Card,  CardBody,  CardFooter,  CardHeader,  Col,  FormGroup,  FormText,  Input,  Label,  Row,  Fade,  Collapse,  Modal,  ModalBody,  ModalFooter,  ModalHeader,  Tooltip,  Badge } from 'reactstrap';

import {connect} from 'react-redux'

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// notification
import {NotificationContainer, NotificationManager} from'react-notifications';
import 'react-notifications/lib/notifications.css';

import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import RestApi from "../../../service/RestApi";
import * as gConst from "../../../constants/GlobalConstants";
import moment from 'moment';

import { timeout } from "../../../service/oneClick";
import * as gFunc from "../../../utils";

import ReactTable from 'react-table';
import 'react-table/react-table.css'
import _ from "lodash";
import ProgressBar from "../../../components/Common/ProgressBar"
import Cookies from "universal-cookie";
import ContactInfoPic from "../../../components/Common/ContactInfoPic";
import Config from '../../../Config';

class OneClick extends Component {
  constructor(props) {
    super(props);

    this.toggleSearch = this.toggleSearch.bind(this);
    this.handle = this.handle.bind(this);


    this.state = {
      tooltipOpen: [false, false],
      collapseSearch: true,         // the flag to represent if the search panel is collapse
      collapseAdvancedSearch: true, // the flag to represent if the advanced search panel is collapse
      fadeInSearch: true,           // the value of fade in for the search panel
      fadeInAdvancedSearch: true,   // the value of fade in for the advanced search panel
      fadeInResult: true,           // the value of fade in for the result panel
      timeoutSearch: 300,           // the value of timeout for the search panel
      timeoutAdvancedSearch: 300,   // the value of timeout for the advanced search panel
      timeoutResult: 300,           // the value of timeout for the result panel

      isOpenContact: false,         // the flag to represent if the contact modal is open

      num: '',                      // number value
      invalidNumType: gConst.INVALID_NUM_TYPE_NONE,         // the flag to represent that number value is valid
      numType: gConst.OCA_NUM_TYPE_RANDOM,

      nxx: '',                      // nxx value
      validNxx: true,               // the flag to represent that nxx value is valid

      line: '',                     // line value
      validLine: true,              // the flag to represent that line value is valid

      quantity: "1",                // quantity
      validQty: true,               // the flag to represent that quantity value is valid

      npa: "",                   // npa value
      cons: false,                  // consecutive
      disableCons: false,
      contactName: "",              // contact name
      contactNumber: "",            // contact number
      notes: "",                    // notes
      validContactInfo: true,       // validation

      template: '',                 // template name
      tmplNameList: [],             // template name list
      validTemplate: true,          // the flag to represent that template value is valid

      numTermLine: '',              // number of lines
      validNumTermLine: true,       // the flag to represent that number of lines is valid

      serviceOrderNum: '',          // service order number
      validSvcOrdrNum: true,        // the flag to represent that service order number is valid

      timeZone: "C",                // time zone

      effDate: '',                  // effective date
      validEffDate: true,           // the flag to represent that effective date is valid

      effTime: '',                  // effective time
      validEffTime: true,           // the flag to represent that effective time is valid

      now: false,                   // now checkbox value
      message: '',                  // message

      activityLog: [],              // OCA activity log data
      interval: "",                 // Timer

      contactDefault: false,

      detailModalVisible: false,   // initial non show
      numberList: [],               // detail number list data of OCA
      id: null,

      selQuantity: '',            // quantity value of detail modal
      selCons: '',                // consecutive value of detail modal
      selWildCardNum: '',         // wildcard value of detail modal
      selNpa: '',                 // npa value of detail modal
      selNxx: '',                 // nxx value of detail modal
      selLine: '',                // line value of detail modal
      selTmplName: '',            // template name value of detail modal
      selSvcOrdrNum: '',          // service order num value of detail modal
      selNumTermNum: '',          // numbers of line value of detail modal
      selTimeZone: '',            // time zone value of detail modal

      numModalVisible: false,       // number info modal
      selNum: '',                   // selected number for numView
      respOrg: '',                  // resp org of the selected number for numView
      status: '',                   // status of the selected number for numView
      numEffDate: '',               // effective date of the selected number for numView
      reservedUntil: '',            // reserved until date of the selected number for numView
      lastActive: '',               // last active of the selected number for numView
    };
  }


  async componentDidMount() {
    await this.refreshList()
    this.backPressureEvent()

    this.state.contactName = this.props.contactName;
    this.state.contactNumber = this.props.contactNumber;

    this.setState({effDate: new Date().getTime()})

    let params = { entity: this.props.somos.selectRo.substring(0, 2), startTmplName: '', roId: '' }
    this.props.callApi2(RestApi.getTmplRecLstForEntity, params).then(res => {

      if (res.ok && res.data) {
        let tmplNameList = [];  // only template name list

        let tmplList = res.data.tmplList
        if (tmplList === undefined || tmplList == null) {
          return
        }

        for (let i = 0; i < tmplList.length; i++) {
          if (tmplList[i].custRecStat === 'ACTIVE')
            tmplNameList.push(tmplList[i].tmplName)
        }

        tmplNameList.sort()

        this.setState({ tmplNameList: tmplNameList })

        if (tmplNameList.length > 0)
          this.setState( {template: tmplNameList[0]})
      }
    })
  }

  componentWillUnmount() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
  }

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

    const eventSource = new EventSource(Config.eventSourceEndPoint + '/backpressure_events/multi_req_status?access_token=' + this.props.token, {withCredentials: false});
    eventSource.onmessage = (event) => {

      try {
        const data = JSON.parse(event.data);

        let activityLog = [...this.state.activityLog]

        let allFinish = true
        for (let i = 0; i < data.length; i++) {

          if (data[i].reqType !== gConst.REQ_TYPE_OCA)  continue

          if (data[i].status === gConst.AUTO_RESULT_INPROGRESS)
            allFinish = false

          let bNewLog = true
          let id = data[i].id
          for (let log of activityLog) {
            if (id == log.id) {
              bNewLog = false

              // update the log info
              log.completed = data[i].completed
              log.failed = data[i].failed
              log.status = data[i].status
              log.errMsgs = data[i].message

              if (log.status === gConst.AUTO_RESULT_COMPLETED) {
                NotificationManager.success("", gConst.OCA_REQ_FINISHED)
              }

              break
            }
          }

          if (bNewLog) {
            let log = {
              id: data[i].id,
              userName: data[i].userName,
              subDtTm: data[i].subDtTm,
              type: data[i].type,
              effDtTm: data[i].effDtTm,
              tmplName: data[i].tmplName,
              total: data[i].total,
              completed: data[i].completed,
              failed: data[i].failed,
              status: data[i].status,
              errMsgs: data[i].message,
            }

            activityLog.splice(0, 0, log)
          }
        }

        this.setState({activityLog, allFinish: allFinish})

      } catch(ex){
        console.log(ex);
      }
    }

    this.eventSource = eventSource
  };

  /**
   * refresh the activity log data in period
   */
  refreshList = () => {
    this.props.callApi2(RestApi.ocaActivityLog).then(res => {
      if (res.ok && res.data) {
        gFunc.sortActivityLogWithDateZA(res.data)
        let log = res.data
        for (let i = 0; i < log.length; i++) {
          log[i].progress = (log[i].completed * 100) / log[i].total
        }
        this.setState({ activityLog: log })
      }
    })
  }

  delete = (id, index) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    this.props.callApi2(RestApi.deleteOcaResult, { "id": id }).then(res => {
      if (res.ok && res.data) {
        let activityLog = [...this.state.activityLog];
        activityLog.splice(index, 1)
        this.setState({ activityLog })
      }
    })
  }

  toggle_tip(i) {
    const newArray = this.state.tooltipOpen.map((element, index) => {
      return (index === i ? !element : false);
    });
    this.setState({
      tooltipOpen: newArray,
    });
  }

  /**
   * This is the function that collapses or expands the search panel
   */
  toggleSearch = () => {
    this.setState({collapseSearch: !this.state.collapseSearch});
  }

  /**
   * This is the function that collapses or expands the advanced search panel
   */
  toggleAdvancedSearch = () => {
    this.setState({collapseAdvancedSearch: !this.state.collapseAdvancedSearch});
  }

  /**
   * calls when the user click save of the "Contact Information" dialog
   */
  submitContact = (contactName, contactNumber, notes) => {
    this.setState({contactName: contactName, contactNumber: contactNumber, notes: notes, validContactInfo: true})
  }

  /**
   * this function is called when the focus of number input field is lost
   */
  onNumFieldFocusOut = () => {

    let num = this.state.num;
    if (num !== null && num !== "") {

      let nums = gFunc.retrieveNumListWithHyphen(num)
      console.log("gFunc.retrieveNumListWithHyphen: " + nums.join(","))
      this.setState({num: nums.join(",")})

      if (num.includes('*') || num.includes('&')) { // to wildcard mode

        console.log("Wildcard")
        this.setState({
          numType: gConst.OCA_NUM_TYPE_WILDCARD,
          npa: '',
          nxx: '',
          validNxx: true,
          line: '',
          validLine: true
        });

        // check if the number is wildcard number
        let wildcardNumReg = gConst.WILDCARDNUM_REG_EXP
        let isValidWildcard = true

        if (num.length > 12)
          isValidWildcard = false

        if (isValidWildcard && !wildcardNumReg.test(num))
          isValidWildcard = false

        let ampCount = 0
        if (isValidWildcard && num.includes("&")) {
          ampCount = 1
          let index = num.indexOf("&")
          if (num.includes("&", index + 1))
            ampCount = 2
        }

        if (!isValidWildcard) {
          if (nums.length > 1)
            this.setState({ invalidNumType: gConst.INVALID_NUM_TYPE_WILDCARD })
          else if (gConst.TFNPA_WILDCAD_REG_EXP.test(num))
            this.setState({ invalidNumType: gConst.INVALID_NUM_TYPE_COMMON })
          else
            this.setState({ invalidNumType: gConst.INVALID_NUM_TYPE_NPA })

        } else if (this.state.cons && parseInt(this.state.quantity) > 1 && num[num.length - 1] !== '*') {
          this.setState({ invalidNumType: gConst.INVALID_NUM_TYPE_CONS })

        } else if (ampCount === 1) {
          this.setState({ invalidNumType: gConst.INVALID_NUM_TYPE_AMP })

        } else {
          this.setState({ invalidNumType: gConst.INVALID_NUM_TYPE_NONE })

        }

      } else {  // to specific mode
        this.setState({
          numType: gConst.OCA_NUM_TYPE_SPECIFIC,
          quantity: '1',
          validQty: true,
          disableCons: false,
          npa: '',
          nxx: '',
          validNxx: true,
          line: '',
          validLine: true
        });
        console.log("Specific")

        // check if the number list is valid
        let specificNumReg = gConst.SPECIFICNUM_REG_EXP
        let isValid = true
        let isNpaInvalid = false
        for (let el of nums) {
          console.log("el: " + el)
          if (!specificNumReg.test(el)) {   // if anyone among the number list is invalid, the number list is invalid.
            isValid = false

            if (!gConst.TFNPA_WILDCAD_REG_EXP.test(el))
              isNpaInvalid = true

            console.log("Valid is false ")
            break
          }
        }

        console.log("Specific: " + isValid)

        if (!isValid) {
          if (!isNpaInvalid)
            this.setState({ invalidNumType: gConst.INVALID_NUM_TYPE_COMMON })
          else
            this.setState({ invalidNumType: gConst.INVALID_NUM_TYPE_NPA })

        } else if (this.state.cons && parseInt(this.state.quantity) > 1) {
          this.setState({ invalidNumType: gConst.INVALID_NUM_TYPE_CONS })

        } else {
          this.setState({ invalidNumType: gConst.INVALID_NUM_TYPE_NONE })

        }

      }

    } else if (num == null || num === "") {
      this.setState({
        numType: gConst.OCA_NUM_TYPE_RANDOM,
        invalidNumType: gConst.INVALID_NUM_TYPE_NONE
      });
    }
  }

  /**
   * this is called at changing the quantity field.
   * @param event
   */
  onChangeQuantity = async (event) => {
    let digitReg = /^[1-9]([0-9]+)?$/g
    let value = event.target.value

    console.log("quantity: " + value)

    const state = {};
    state[event.target.name] = value;

    if (!digitReg.test(value) || parseInt(value) > 1000) {
      state['validQty'] = false
    } else {
      state['validQty'] = true

      if (parseInt(value) > 10) {
        state['cons'] = false
        state['disableCons'] = true
      } else {
        state['disableCons'] = false
      }
    }

    await this.setState(state);
    this.onNumFieldFocusOut()
  }

  /**
   * this is called at changing the consecutive check box
   * @param event
   */
  onChangeCons = async (event) => {
    await this.setState({cons: event.target.checked})
    this.onNumFieldFocusOut()
  }

  /**
   * this is called when the focus of nxx field is lost
   */
  onNXXFieldFocusOut = () => {
    let nxx = this.state.nxx
    let nxxReg = /\d{3}/g

    if (nxx === '' || nxxReg.test(nxx)) {
      this.setState({validNxx: true})
    } else {
      this.setState({validNxx: false})
    }
  }

  /**
   * this is called when the focus of line field is lost
   */
  onLineFieldFocusOut = () => {
    let line = this.state.line
    let lineReg = /\d{4}/g

    if (line === '' || lineReg.test(line)) {
      this.setState({validLine: true})
    } else {
      this.setState({validLine: false})
    }
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
   * this is called when the focus of time field is lost
   */
  onTimeFieldFocusOut = () => {
    let timeReg = gConst.TIME_REG_EXP
    let effTime = this.state.effTime
    if (effTime === '' || timeReg.test(effTime))
      this.setState({validEffTime: true})
    else
      this.setState({validEffTime: false})
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
   * this is called when the focus of template field is lost
   */
  onTemplateFieldFocusOut = () => {
    if (this.state.template && this.state.template.length > 0 && this.state.template[0] === '*')
      this.setState({validTemplate: true})
    else
      this.setState({validTemplate: false})
  }

  /**
   *
   * @param event
   */
  handleUppercase = async (event) => {
    console.log("HandleUppercase")
    const input = event.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    let state = {}
    state[input.name] = input.value.toUpperCase()

    await this.setState(state, ()=>input.setSelectionRange(start, end));
  };

  /**
   *
   */
  handleChange = (event) => {
    const state = {};
    state[event.target.name] = event.target.value;
    this.setState(state);
  }

  /**
   * effective date control
   */
  handle = (date) => {
    console.log("Value: " + moment(date).calendar())

    this.setState({
      effDate: date,
      validEffDate: true
    });
  }

  /**
   *
   */
  toggleNumModal = () => {
    this.setState({numModalVisible: !this.state.numModalVisible})
  }

  /**
   *
   */
  toggleDetailModal = () => {
    this.setState({detailModalVisible: !this.state.detailModalVisible})
  }

  convertUTCStrToCTStr = (strDateTime) => {

    if (strDateTime.length === 10) {
      let tmpArr = strDateTime.split("-")
      return tmpArr[1] + "/" + tmpArr[2] + "/" + tmpArr[0]
    }

    return gFunc.fromUTCStrToCTStr(strDateTime)
  }

  /**
   *
   */
  activate = async () => {

    console.log("Activate: ")

    let bPass = true
    if (!this.state.validQty)
      bPass = false

    if (this.state.invalidNumType !== gConst.INVALID_NUM_TYPE_NONE) {
      bPass = false
      $('#num').focus()
    }

    if (!this.state.validTemplate || this.state.template == null || this.state.template === '') {
      await this.setState({validTemplate: false});

      if (bPass) {
        $('#template').focus()
        $('html, body').animate({
          scrollTop: $("#template").offset().top - 100
        }, 500)
      }

      bPass = false
    }  else {
      this.setState({validTemplate: true})
    }

    if (!this.state.validSvcOrdrNum || this.state.serviceOrderNum == null || this.state.serviceOrderNum === '') {
      await this.setState({validSvcOrdrNum: false});

      if (bPass){
        $('#serviceOrderNum').focus()
        $('html, body').animate({
          scrollTop: $("#serviceOrderNum").offset().top - 100
        }, 1000)
      }

      bPass = false
    } else {
      this.setState({validSvcOrdrNum: true});
    }

    if (!this.state.now) {
      if (!this.state.validEffTime) {

        if (bPass){
          $('#effTime').focus()
          $('html, body').animate({
            scrollTop: $("#effTime").offset().top - 100
          }, 1000)
        }

        bPass = false

      } else if (!this.state.validEffDate || this.state.effDate == null || this.state.effDate === '') {
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

      if (bPass)  $('#contactInfoPicBtn').focus()
      bPass = false

    } else {
      this.setState({validContactInfo: true})
    }

    if (!bPass)
      return false

    let effDtTm = "NOW"
    if (!this.state.now) {
      if (this.state.effTime && this.state.effTime.length > 0) {
        let effTimeStr = this.state.effTime.toUpperCase()
        let hour = effTimeStr.split(":")[0]
        let time = effTimeStr.split(":")[1].split(" ")[0]
        let am = effTimeStr.split(" ")[1]
        if (hour.length === 1)
          hour = "0" + hour
        if (time.length === 1)
          time = "0" + time

        effTimeStr = hour + ":" + time + " " + am

        let ctEffDtTmStr = moment(new Date(this.state.effDate)).format('MM/DD/YYYY') + " " + effTimeStr
        console.log("ctEffDtTmStr: " + ctEffDtTmStr)

        effDtTm = gFunc.fromCTStrToUTCStr(ctEffDtTmStr)
        console.log("utcEffDtTmStr: " + effDtTm)

      } else {
        effDtTm = moment(new Date(this.state.effDate)).format("YYYY-MM-DD")
        console.log("effDtTm: " + effDtTm)
        effDtTm = effDtTm.substring(0, 10)
      }
    }

    let body = {
      conName: this.state.contactName,
      conTel: this.state.contactNumber.replace(/\-/g, ""),
      tmplName: this.state.template,
      numTermLine: this.state.numTermLine,
      svcOrderNum: this.state.serviceOrderNum,
      effDtTm: effDtTm,
      timeZone: this.state.timeZone,
      type: this.state.numType
    }

    if (this.state.notes !== '')
      body.shrtNotes = this.state.notes

    switch (this.state.numType) {
      case gConst.OCA_NUM_TYPE_RANDOM:
        body.qty = this.state.quantity
        if (parseInt(this.state.quantity) <= 10)
          body.cons = this.state.cons ?  'Y' : 'N'
        if (this.state.npa !== '')
          body.npa = this.state.npa
        if (this.state.nxx !== '')
          body.nxx = this.state.nxx
        if (this.state.line !== '')
          body.line = this.state.line
        break

      case gConst.OCA_NUM_TYPE_SPECIFIC:
        let numList = gFunc.retrieveNumList(this.state.num)
        body.numList = numList
        break

      case gConst.OCA_NUM_TYPE_WILDCARD:
        body.qty = this.state.quantity
        if (parseInt(this.state.quantity) <= 10)
          body.cons = this.state.cons ?  'Y' : 'N'
        if (this.state.npa !== '')
          body.nxx = this.state.nxx
        if (this.state.line !== '')
          body.line = this.state.line
        body.wildCardNum = this.state.num.replace(/\-/g, "")
        break
    }

    // let body = {}
    // body.conName =  "TALLAGSEN, MELVIN"
    // body.conTel = "8888888888"
    // body.effDtTm = "2020-11-21T03:30Z"
    // body.numTermLine = "9999"
    // body.qty = "1"
    // body.svcOrderNum = "WD072605"
    // body.timeZone = "C"
    // body.tmplName = "*ZX-A2G"
    // body.cons = "N"
    // body.type = this.state.numType

    console.log("Body: " + JSON.stringify(body))

    const res = await this.props.callApi2(RestApi.oneClickActivate, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})

    if (res.ok && res.data) {

    } else if (res.data && res.data.errList) {

      let errMsg = ''
      for (let err of res.data.errList) {
        errMsg += (errMsg == '') ? '' : '\r\n'
        errMsg += (err.errMsg + "(" + err.errCode + ")")
      }

      NotificationManager.error("", errMsg)
      this.setState({message: errMsg})
    }
  };

  reset = () => {
    window.location.reload();
  };

  /**
   * number cell
   * @param value
   * @param onClickPAD
   * @returns {*}
   */
  numCell = ({ value, columnProps: { rest: { onClickPAD } } }) => {
    return <div className="text-center" style={{marginTop: 10}}><a href="#" onClick={() => onClickPAD(value)}>{gFunc.formattedNumber(value)}</a></div>
  }

  /**
   * template name cell
   * @param value
   * @param onClickCell
   * @returns {*}
   */
  templateNameCell = ({ value, columnProps: { rest: { onClickCell } } }) => {
    return <div className="text-center" style={{marginTop: 10}}><a href="#" onClick={() => onClickCell(value)}>{value}</a></div>
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
   * this is called at clicking the View button on the number list of the detail modal
   */
  numView = async (num) => {

    let body = {
      numList:[
        num
      ]
    }

    const res = await this.props.callApi2(RestApi.numberQuery, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})

    if (res.ok && res.data && res.data.queryResult) {
      let result = res.data.queryResult[0]
      this.setState({
        selNum: num,
        respOrg: result.ctrlRespOrgId,
        status: result.status,
        numEffDate: result.effDt,
        reservedUntil: result.resUntilDt,
        lastActive: result.lastActDt,

        numModalVisible: true
      })

    } else if (res.data && res.data.errList) {
      let errMsg = gFunc.synthesisErrMsg(res.data.errList)
      if (res.data.errList[0].errLvl === "ERROR")
        NotificationManager.error("", errMsg)
      else
        NotificationManager.warning("", errMsg)
    }
  }

  /**
   * this is called at clicking the view button on the activity list
   */
  logView = async (id, index) => {
    this.props.callApi2(RestApi.viewOcaResult, { "id": id }).then(res => {
      if (res.ok && res.data) {
        let result = res.data

        let sortedData = _.sortBy(result, 'num');

        this.setState({ numberList: sortedData });

        let log = this.state.activityLog[index]
        this.setState({
          selQuantity: log.total,
          selCons: log.consecutive,
          selWildCardNum: log.wildCardNum,
          selNpa: log.npa,
          selNxx: log.nxx,
          selLine: log.line,
          selTmplName: log.tmplName,
          selSvcOrdrNum: log.svcOrdrNum,
          selNumTermNum: log.numTermLine,
          selTimeZone: log.timeZone,

          detailModalVisible: true
        })
      }
    })
  }

  // Activity Log Columns
  activityReportColumns = [
    {
      Header: "Created By",
      accessor: 'userName',
      sortable: false,
      width: gConst.ACTIVITY_USERNAME_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Submit Date",
      accessor: 'subDtTm',
      sortable: false,
      width: gConst.ACTIVITY_DATE_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Type",
      accessor: 'type',
      sortable: false,
      width: gConst.ACTIVITY_TYPE_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Eff. Date Time",
      accessor: 'effDtTm',
      sortable: false,
      width: gConst.ACTIVITY_DATE_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{this.convertUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Template Name",
      accessor: 'tmplName',
      sortable: false,
      width: gConst.ACTIVITY_TMPLNAME_COLUMN_WIDTH,
      Cell: this.templateNameCell,
      getProps: () => ({
        onClickCell: (tmplName) => {
          this.gotoTADPage(tmplName)
        },
      }),
    },
    {
      Header: "Total",
      accessor: 'total',
      sortable: false,
      width: gConst.ACTIVITY_TOTAL_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>
        <h4>
          <Badge color="success" pill>
            <span className="btm-1 fnt-14">
              {props.value}
            </span>
          </Badge>
        </h4>
      </div>
    },
    {
      Header: "Completed",
      accessor: 'completed',
      sortable: false,
      width: gConst.ACTIVITY_COMPLETED_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>
        <h4>
          <Badge color={props.value === 0 ? "dark" : props.value === props.original.total ? "success" : "info"} pill>
            <span className="btm-1 fnt-14">
              {props.value}
            </span>
          </Badge>
        </h4>
      </div>
    },
    {
      Header: "Message",
      accessor: 'errMsgs',
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Progress Status",
      accessor: 'status',
      sortable: false,
      width: gConst.ACTIVITY_PROGRESS_COLUMN_WIDTH,
      Cell: props => {

        return <div className="text-center" >
          <h4>
            {props.value !== gConst.AUTO_RESULT_COMPLETED
              ? <div className="ml-1 mt-2">
                <ProgressBar status={props.value} completed={gFunc.getPercentValue(props.original.total, props.original.completed, props.original.failed)}/>
              </div>
              : <i className="fa fa-check mt-3"/>}
          </h4>
        </div>

      }
    },
    {
      Header: "Action",
      sortable: false,
      width: gConst.ACTIVITY_ACTION_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>

        <Button size="sm" onClick={() => this.logView(props.original.id, props.index)} color="primary" className="ml-2">
          <i className="fa fa-eye"></i>
        </Button>

        <Button size="sm" color="success" className="ml-2" onClick={() => {
          this.downloadForm.action = Config.apiEndPoint + "/somos/oca/result/download/" + props.original.id;
          this.textInput.value = this.props.data.token;
          this.downloadForm.submit();
          this.textInput.value = "";
        }}>
          <i className="fa fa-download"></i>
        </Button>

        <Button size="sm" color="danger" className="ml-2"
                onClick={() => this.delete(props.original.id, props.index)}>
          <i className="fa fa-close"></i>
        </Button>
      </div>
    }
  ]


  // result Columns
  resultColumns = [
    {
      Header: "Toll-Free Number",
      accessor: 'num',
      width: gConst.NUMBER_COLUMN_WIDTH,
      Cell: this.numCell,
      getProps: () => ({
        onClickPAD: (number) => {
          this.gotoPADPage(number)
        },
      }),
    },
    {
      Header: "Status",
      accessor: 'status',
      width: gConst.STATUS_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Message",
      accessor: 'errMsg',
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "View",
      accessor: 'num',
      width: 80,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>

        <Button size="sm" onClick={() => this.numView(props.value)} color="primary" className="ml-2">
          <i className="fa fa-eye"></i>
        </Button>
      </div>
    }
  ]

  render() {
    return (
      <div className="animated fadeInSearch">
        <Label className="ml-1"><strong style={{fontSize: 30}}>One Click Activate</strong></Label>
        <Row className="mt-3">
          <Col xs="12">
            <Fade timeout={this.state.timeoutSearch} in={this.state.fadeInSearch}>
              <Card>

                <CardHeader>
                  <strong>Search</strong>
                  <div className="card-header-actions">
                    <a className="card-header-action btn btn-minimize" data-target="#collapseExample"
                       onClick={this.toggleSearch.bind(this)}><i
                      className={this.state.collapseSearch ? "icon-arrow-up" : "icon-arrow-down"}/></a>
                  </div>
                </CardHeader>

                <Collapse isOpen={this.state.collapseSearch} id="collapseExample">
                  <CardBody>
                    <FormGroup row>

                      {/* Quantity */}
                      <Col xs="12" md="4">
                        <Row>
                          <Col md="3">
                            <Label htmlFor="quantity">Quantity *: </Label>
                          </Col>
                          <Col xs="12" md="9">
                            <Input type="number" id="quantity" name="quantity" autoComplete="text"
                                   defaultValue={this.state.quantity}
                                   onChange={(evt) => this.onChangeQuantity(evt)} disabled={this.state.numType === gConst.OCA_NUM_TYPE_SPECIFIC}/>
                            {!this.state.validQty ?
                              <FormText><p style={{color: 'red'}}>Starting Quantity: Must be between 1 and 10.</p>
                              </FormText> : ""}
                          </Col>
                        </Row>
                      </Col>

                      {/* Consecutive Checkbox*/}
                      <Col xs="12" md="4">
                        <Row className="ml-5">
                          <Input type="checkbox" id="cons" name="cons" checked={this.state.cons} onChange={(evt) => this.onChangeCons(evt)} disabled={this.state.disableCons}/>
                          <Label htmlFor="cons">Consecutive</Label>
                        </Row>
                      </Col>

                      {/* Contact Information */}
                      <Col xs="12" md="4">
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

                    {/* Number List Field */}
                    <Row className="mb-3">
                      <Col xs="12">
                        <Input type="textarea" name="num" id="num" rows="5"
                               onBlur={this.onNumFieldFocusOut} value={this.state.num}
                               placeholder="Number or Mask Entry" onChange={(value) => this.handleChange(value)}/>
                        {this.state.invalidNumType === gConst.INVALID_NUM_TYPE_COMMON ? <FormText><strong style={{color: 'red'}}>Number or Mask Entry: Must be 10 alphanumeric characters, '*', '&' and optionally two dashes '-'. Allowed delimiters are comma or return.</strong></FormText> : ""}
                        {this.state.invalidNumType === gConst.INVALID_NUM_TYPE_CONS ? <FormText><strong style={{color: 'red'}}>Number or Mask Entry: Last character must equal '*' if consecutive is selected.</strong></FormText> : ""}
                        {this.state.invalidNumType === gConst.INVALID_NUM_TYPE_NPA ? <FormText><strong style={{color: 'red'}}>Number or Mask Entry: NPA must be an existing 3-digit 8xx Toll-Free NPA code known to the TFN Registry (e.g., 800).</strong></FormText> : ""}
                        {this.state.invalidNumType === gConst.INVALID_NUM_TYPE_AMP ? <FormText><strong style={{color: 'red'}}>Number or Mask Entry: Number cannot contain a single '&'.</strong></FormText> : ""}
                        {this.state.invalidNumType === gConst.INVALID_NUM_TYPE_WILDCARD ? <FormText><strong style={{color: 'red'}}>Number or Mask Entry: When performing a wild card search, the Number or Mask Entry field can be either empty or contain at most one number.</strong></FormText> : ""}
                      </Col>

                    </Row>

                    {/* Advanced Search */}
                    <Fade timeout={this.state.timeoutAdvancedSearch} in={this.state.fadeInAdvancedSearch}>
                      <Card className="mt-3">
                        <CardHeader>
                          <strong>Advanced Search</strong>
                          <div className="card-header-actions">
                            <a className="card-header-action btn btn-minimize" data-target="#collapseExample"
                               onClick={this.toggleAdvancedSearch.bind(this)}><i
                              className={this.state.collapseAdvancedSearch ? "icon-arrow-up" : "icon-arrow-down"}/></a>
                          </div>
                        </CardHeader>
                        <Collapse isOpen={this.state.collapseAdvancedSearch} id="collapseExample">
                          <CardBody>
                            <FormGroup row>
                              <Col xs="12" md="4">
                                <Input type="select" name="npa" id="npa" onChange={(value) => this.handleChange(value)}
                                       disabled={this.state.numType !== gConst.OCA_NUM_TYPE_RANDOM} value={this.state.npa === null ? "" : this.state.npa}>
                                  <option value="">Toll-Free NPA</option>
                                  <option value="800">800</option>
                                  <option value="833">833</option>
                                  <option value="844">844</option>
                                  <option value="855">855</option>
                                  <option value="866">866</option>
                                  <option value="877">877</option>
                                  <option value="888">888</option>
                                </Input>
                              </Col>
                              <Col xs="12" md="4">
                                <Input type="text" name="nxx" id="nxx" autoComplete="text" placeholder="Starting NXX" onBlur={this.onNXXFieldFocusOut}
                                       onChange={(value) => this.handleChange(value)} disabled={this.state.numType !== gConst.OCA_NUM_TYPE_RANDOM} value={this.state.nxx === null ? "" : this.state.nxx}/>
                                {!this.state.validNxx ?
                                  <FormText><p style={{color: 'red'}}>Starting NXX: Must be three numerics.</p>
                                  </FormText> : ""}
                              </Col>
                              <Col xs="12" md="4">
                                <Input type="text" name="line" id="line" autoComplete="text" placeholder="Starting line" onBlur={this.onLineFieldFocusOut}
                                       onChange={(value) => this.handleChange(value)} disabled={this.state.numType !== gConst.OCA_NUM_TYPE_RANDOM} value={this.state.line === null ? "" : this.state.line}/>
                                {!this.state.validLine ?
                                  <FormText><p style={{color: 'red'}}>Starting LINE: Must be four numerics.</p>
                                  </FormText> : ""}
                              </Col>
                            </FormGroup>
                          </CardBody>
                        </Collapse>
                      </Card>
                    </Fade>

                    {/* One Click Activate Card*/}
                    <Card>
                      <CardHeader>
                        <strong>One Click Activate</strong>
                      </CardHeader>
                      <CardBody>

                        {/* Template */}
                        <FormGroup row>
                          <Col xs="12" md="6">
                            <Label htmlFor="template">Template *</Label>
                            <Row>
                              <Col xs="11">
                                <Input type="select" className="form-control-sm " id="template" name="template" value={this.state.template} onChange={(ev)=> this.handleChange(ev)}>
                                  {this.state.tmplNameList && this.state.tmplNameList.map(s => <option key={s} value={s}>{s}</option>)}
                                </Input>
                              </Col>
                              <Col xs="1">
                                <i className="fa fa-exclamation-circle fa-fw size-3" id="tollfree_tooltip" style={{fontSize: 25}}/>
                                <Tooltip placement="top" isOpen={this.state.tooltipOpen[1]} autohide={false} target="tollfree_tooltip" toggle={() => {this.toggle_tip(1);}}>
                                  The selected Template Record must be in an Active status and valid in the Toll-Free
                                  Number Registry prior to utilizing this feature. If an Invalid Template Record was
                                  found during processing, the first TFN will be in an Invalid status and up to 9 TFNs
                                  will be in a Reserved status for a request. Any remaining TFNs in the request will not
                                  be processed.
                                </Tooltip>
                              </Col>
                            </Row>
                          </Col>
                        </FormGroup>

                        {/* Service Order & Time Zone*/}
                        <FormGroup row>
                          <Col xs="12" md="6">
                            <Label htmlFor="serviceOrderNum">Service Order *</Label>
                            <Input type="text" name="serviceOrderNum" id="serviceOrderNum" onChange={(ev)=>this.handleChange(ev)} onBlur={this.onSvcOrderFieldFocusOut}/>
                            {!this.state.validSvcOrdrNum ? <FormText><p style={{color: 'red'}}>Must be 4 to 13 alphanumeric characters. The 1st character must be alpha, 2nd to 12th characters must be alphanumeric. The 13th character must be alpha.</p></FormText> : ""}
                          </Col>
                          <Col xs="12" md="6">
                            <Label htmlFor="timeZone">Time Zone</Label>
                            <Input type="select" name="timeZone" id="timeZone" onChange={(ev)=> this.handleChange(ev)}>
                              <option value="C">Central (C)</option>
                              <option value="A">Atlantic (A)</option>
                              <option value="B">Bering (B)</option>
                              <option value="E">Eastern (E)</option>
                              <option value="H">Hawaiian-Aleutian (H)</option>
                              <option value="M">Mountain (M)</option>
                              <option value="N">Newfoundland (N)</option>
                              <option value="P">Pacific (P)</option>
                              <option value="Y">Alaska (Y)</option>
                            </Input>
                          </Col>
                        </FormGroup>

                        {/* Number of Line & Effective Date & Time */}
                        <FormGroup row>
                          <Col xs="12" md="4">
                            <Label htmlFor="numTermLine">Number of Lines *</Label>
                            <Input type="text" name="numTermLine" id="numTermLine" onChange={(ev) => this.handleChange(ev)} onBlur={this.onNumTermLineFieldFocusOut}/>
                            {!this.state.validNumTermLine ? <FormText><p style={{color: 'red'}}>Please input only 4 digits</p></FormText> : ""}
                          </Col>
                          <Col xs="12" md="2">
                            <Label htmlFor="effective_date">Effective Date *</Label>
                            {/*<Input id="effDate" name="effDate" type="text" onChange={(ev)=>this.handleChange(ev)} placeholder="MM/DD/YYYY"/>*/}
                            <div>
                              <DatePicker
                                id="effDate"
                                placeholderText="MM/DD/YYYY"
                                dateFormat="MM/dd/yyyy"
                                selected={this.state.effDate}
                                onChange={this.handle}
                                minDate={new Date()}
                                className="form-control"
                                onBlur={this.onDateFieldFocusOut}
                              />
                            </div>
                            {!this.state.validEffDate ? <FormText><p style={{color: 'red'}}>Please input effective date</p></FormText> : ""}
                          </Col>
                          <Col xs="12" md="6">
                            <Row>
                              <Col xs="10">
                                <Label htmlFor="effTime">Effective Time</Label>
                                <Input type="text" name="effTime" id="effTime" placeholder="HH:MM AM/PM" onChange={(ev)=>this.handleChange(ev)} onBlur={this.onTimeFieldFocusOut}/>
                                {!this.state.validEffTime ? <FormText><p style={{color: 'red'}}>Time format must be 'HH:MM AM/PM' and minutes part must be in quarter hours (00, 15, 30, 45) E.G. '10:45'</p></FormText> : ""}
                              </Col>
                              <Col xs="2">
                                <Label htmlFor="now">Now</Label>
                                <Input type="checkbox" name="now" id="now" className="form-control ml-2" onChange={(ev) => this.setState({now: ev.target.checked})}/>
                              </Col>
                            </Row>
                          </Col>
                        </FormGroup>
                      </CardBody>
                    </Card>
                  </CardBody>

                  <div className="row pb-2">
                    <Col xs="1" className="text-right">
                      Message:
                    </Col>
                    <Col xs="10">
                      <Input type="textarea" name="message" value={this.state.message} readOnly={true}/>
                    </Col>
                  </div>

                  {/* Buttons */}
                  <CardFooter>
                    <Row>
                      <Col className="text-right">
                        <Button size="md" color="primary" className="mr-2" onClick={this.activate}>Search,Reserve & Activate</Button>
                        <Button size="md" color="danger" onClick={this.reset}>Reset</Button>
                      </Col>
                    </Row>
                  </CardFooter>
                </Collapse>
              </Card>
            </Fade>
          </Col>

          {/* Result Card */}
          <Col xs="12">
            <Fade timeout={this.state.timeoutResult} in={this.state.fadeInResult}>
              <Card>
                <CardHeader>
                  <strong>Result</strong>
                </CardHeader>
                <Collapse isOpen={true} id="collapseResult">
                  <CardBody>
                    <div className="row">
                      <Col>
                        Total: {this.state.activityLog.length}
                      </Col>
                      <Col className="text-right">
                        <Button size="md" color="primary" className="mr-2" onClick={this.refreshList}>Refresh</Button>
                      </Col>
                    </div>

                    <div className="mt-2">
                      <ReactTable
                        data={this.state.activityLog} columns={this.activityReportColumns} defaultPageSize={10} minRows="1" className="-striped -highlight col-12"
                        ref={(r) => this.selectActivityLogTable = r}
                      />
                    </div>
                  </CardBody>
                </Collapse>
              </Card>
            </Fade>
          </Col>
        </Row>

        <form ref={(node) => { this.downloadForm = node }} action="" target="_blank" method="post">
          <input type="hidden" ref={(input) => { this.textInput = input }} name="access_token" value="" />
        </form>

        {this.renderDetailModal()}
        {this.renderNumInfoModal()}

        <NotificationContainer/>

      </div>
    );
  }

  renderDetailModal = () => (
    <Modal isOpen={this.state.detailModalVisible} toggle={this.toggleDetailModal} className={'modal-lg ' + this.props.className}>
      <ModalHeader toggle={this.toggleDetailModal}>One Click Activate Result</ModalHeader>
      <ModalBody>
        <FormGroup className="ml-4 mr-4">
          <Row className="mb-3">
            <Col xs="4">
              <div className="row mr-2">
                <Label htmlFor="selQuantity">Quantity:</Label>
                <Input type="text" id="selQuantity" value={this.state.selQuantity} disabled/>
              </div>
            </Col>
            <Col xs="4">
              <div className="row mr-2">
                <Label htmlFor="selCons">Consecutive:</Label>
                <Input type="text" id="selCons" value={this.state.selCons} disabled/>
              </div>
            </Col>
            <Col xs="4">
              <div className="row">
                <Label htmlFor="selWildCardNum">Wild Card Num:</Label>
                <Input type="text" id="selWildCardNum" value={this.state.selWildCardNum} disabled/>
              </div>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs="4">
              <div className="row mr-2">
                <Label htmlFor="selSvcOrdrNum">Service Order Num:</Label>
                <Input type="text" id="selSvcOrdrNum" value={this.state.selSvcOrdrNum} disabled/>
              </div>
            </Col>
            <Col xs="4">
              <div className="row mr-2">
                <Label htmlFor="selTimeZone">Time Zone:</Label>
                <Input type="text" id="selTimeZone" value={this.state.selTimeZone} disabled/>
              </div>
            </Col>
            <Col xs="4">
              <div className="row">
                <Label htmlFor="selNumTermLine">Number Of Lines:</Label>
                <Input type="text" id="selNumTermLine" value={this.state.selNumTermLine} disabled/>
              </div>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs="4">
              <div className="row mr-2">
                <Label htmlFor="selNpa">Npa:</Label>
                <Input type="text" id="selNpa" value={this.state.selNpa} disabled/>
              </div>
            </Col>
            <Col xs="4">
              <div className="row mr-2">
                <Label htmlFor="selNxx">Nxx:</Label>
                <Input type="text" id="selNxx" value={this.state.selNxx} disabled/>
              </div>
            </Col>
            <Col xs="4">
              <div className="row">
                <Label htmlFor="selLine">Line:</Label>
                <Input type="text" id="selLine" value={this.state.selLine} disabled/>
              </div>
            </Col>
          </Row>

          <Row className="mb-3">
            <ReactTable
              data={this.state.numberList} columns={this.resultColumns} defaultPageSize={10} minRows="1" className="-striped -highlight col-12"
              ref={(r) => this.selectActivityLogTable = r}
            />
          </Row>

        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button type="reset" size="md" color="danger" onClick={this.toggleDetailModal}> Close</Button>
      </ModalFooter>
    </Modal>
  );

  renderNumInfoModal = () => (
    <Modal isOpen={this.state.numModalVisible} toggle={this.toggleNumModal} className={'modal-lg ' + this.props.className}>
      <ModalHeader toggle={this.toggleNumModal}>Toll-Free Number Info</ModalHeader>
      <ModalBody>
        <FormGroup className="ml-4 mr-4">
          <Row className="mb-3">
            <Col xs="6">
              <div className="row mr-2">
                <Label htmlFor="selNum">Number:</Label>
                <Input type="text" id="selNum" value={gFunc.formattedNumber(this.state.selNum)} disabled/>
              </div>
            </Col>
            <Col xs="6">
              <div className="row">
                <Label htmlFor="respOrg">Resp Org:</Label>
                <Input type="text" id="respOrg" value={this.state.respOrg} disabled/>
              </div>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs="6">
              <div className="row mr-2">
                <Label htmlFor="status">Status:</Label>
                <Input type="text" id="status" value={this.state.status} disabled/>
              </div>
            </Col>
            <Col xs="6">
              <div className="row">
                <Label htmlFor="numEffDate">Effective Date:</Label>
                <Input type="text" id="numEffDate" value={this.state.numEffDate} disabled/>
              </div>
            </Col>
          </Row>

          <Row>
            <Col xs="6">
              <div className="row mr-2">
                <Label htmlFor="reservedUntil">Reserved Until:</Label>
                <Input type="text" id="reservedUntil" value={this.state.reservedUntil} disabled/>
              </div>
            </Col>
            <Col xs="6">
              <div className="row">
                <Label htmlFor="lastActive">Last Active:</Label>
                <Input type="text" id="lastActive" value={this.state.lastActive} disabled/>
              </div>
            </Col>
          </Row>
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button type="reset" size="md" color="danger" onClick={this.toggleNumModal}> Close</Button>
      </ModalFooter>
    </Modal>
  );
}

export default connect(
      (state) => ({
            somos: state.auth.profile.somos,
            contactName: state.auth.profile.contactName,
            contactNumber: state.auth.profile.contactNumber,
            token: state.auth.token,
            data: state.auth
      })
)(withLoadingAndNotification(OneClick));

