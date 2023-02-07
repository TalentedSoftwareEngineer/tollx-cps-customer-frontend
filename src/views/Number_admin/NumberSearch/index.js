import React, {Component} from 'react'
import $ from 'jquery'
import {  Button,  Card,  CardBody,  CardFooter,  CardHeader,  Col,  FormGroup,  FormText,  Input,  Label,  Row,  Fade,  Collapse,  Modal,  ModalBody,  ModalFooter,  ModalHeader,  Tooltip,  Badge } from 'reactstrap'

import {connect} from 'react-redux'
import "react-toastify/dist/ReactToastify.css"
import 'react-overlay-loader/styles.css'

// notification
import {NotificationContainer, NotificationManager} from'react-notifications'
import 'react-notifications/lib/notifications.css'

import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification"
import RestApi from "../../../service/RestApi"
import {refreshContact} from "../../../redux/AuthRedux"
import * as gConst from "../../../constants/GlobalConstants"
import * as gFunc from "../../../utils"
import moment from 'moment'

import { timeout } from "../../../service/oneClick"

import ReactTable from 'react-table'
import 'react-table/react-table.css'
import _ from "lodash"
import ProgressBar from "../../../components/Common/ProgressBar"
import ContactInfoPic from "../../../components/Common/ContactInfoPic"
import Config from '../../../Config';


const NUS_SUBMIT_TYPE_SEARCH		= "SEARCH"
const NUS_SUBMIT_TYPE_RESERVE		= "RESERVE"
const NUS_SUBMIT_TYPE_SRCHRES		= "SEARCH & RESERVE"

class NumberSearch extends Component {
  constructor(props) {
    super(props);

    this.toggleSearch = this.toggleSearch.bind(this);
    this.toggleContact = this.toggleContact.bind(this);
    this.contactSubmit = this.contactSubmit.bind(this);
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

      file: "",                     // file for uploading

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

      now: false,                   // now checkbox value
      message: '',                  // message

      activityLog: [],              // OCA activity log data
      interval: "",                 // Timer

      contactDefault: false,

      disableSearch: false,        // the flag that presents the status of the visible of Search button

      detailModalVisible: false,   // initial non show
      numberList: [],              // detail number list data of NUS
      showNumberList: [],          // detail number list data of NUS

      id: null,

      selQuantity: '',            // quantity value of detail modal
      selCons: '',                // consecutive value of detail modal
      selWildCardNum: '',         // wildcard value of detail modal
      selNpa: '',                 // npa value of detail modal
      selNxx: '',                 // nxx value of detail modal
      selLine: '',                // line value of detail modal
      selSubmitType: '',          // submit type for selected detail activity log

      detailSrchNum: '',           // value for number filtering on the detail modal
      detailStatus: 'All',         // value for status selection on the detail modal
      detailStatusList: [],        // detail status list
      detailTotalCount: 0,         // total count of detail
      allCheck: false,             // all check flag on the detail modal
      checkedList: [],             // checked list

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

          if (data[i].reqType !== gConst.REQ_TYPE_NSR)  continue

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
                NotificationManager.success("", gConst.NSR_REQ_FINISHED)
              }

              break
            }
          }

          if (bNewLog) {
            let log = {
              id: data[i].id,
              title: data[i].title,
              userName: data[i].userName,
              subDtTm: data[i].subDtTm,
              type: data[i].type,
              submitType: data[i].subType,
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
    this.props.callApi2(RestApi.nusActivityLog).then(res => {
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
    this.props.callApi2(RestApi.deleteNusResult, { "id": id }).then(res => {
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
  contactSubmit = () => {

    this.toggleContact();

    if (this.state.contactDefault) {
      this.props.callApi2(RestApi.updateContact,
        {
          contactName: this.state.contactName, contactNumber: this.state.contactNumber
        }).then(res => {
        if (res.ok) {
          console.log("refresh contact")
          this.props.refreshContact(this.state.contactName, this.state.contactNumber);
        }
      });
    }
  }


  /**
   * download the nus result
   */
  download = () => {
    console.log("id: " + this.state.id)
    console.log("detailStatus: " + this.state.detailStatus)
    this.downloadForm.action = Config.apiEndPoint + "/somos/nus/result/filterview/download?id=" + this.state.id + "&status=" + this.state.detailStatus
    this.textInput.value = this.props.data.token;
    this.downloadForm.submit();
    this.textInput.value = "";
  };

  /**
   *  this is the function that opens or closes the contact modal
   */
  toggleContact = () => {
    this.setState({
      isOpenContact: !this.state.isOpenContact,
    });
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
          this.setState({ invalidNumType: gConst.INVALID_NUM_TYPE_NONE, disableSearch: parseInt(this.state.quantity) > 10 })

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
          this.setState({ invalidNumType: gConst.INVALID_NUM_TYPE_NONE, quantity: nums.length, disableSearch: false })

        }

      }

    } else if (num == null || num === "") {
      this.setState({
        numType: gConst.OCA_NUM_TYPE_RANDOM,
        invalidNumType: gConst.INVALID_NUM_TYPE_NONE,
        disableSearch: parseInt(this.state.quantity) > 10
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
        state['disableSearch'] = true
      } else {
        state['disableCons'] = false
        state['disableSearch'] = false
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
    let lineReg = /^\d{1,4}$/g

    if (line === '' || lineReg.test(line)) {
      this.setState({validLine: true})
    } else {
      this.setState({validLine: false})
    }
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

  onChangeDetailSrchNum = (event) => {
    const state = {}
    state[event.target.name] = event.target.value

    let srchNum = event.target.value
    let showNumberList = []

    if (srchNum === '')
      showNumberList = this.state.numberList
    else {
      for (let numInfo of this.state.numberList) {
        if (numInfo.num.includes(srchNum)) {
          showNumberList.push(numInfo)
        }
      }
    }
    state['showNumberList'] = showNumberList

    this.setState(state);
  }

  /**
   *
   * @param event
   */
  onChangeDetailStatus = (event) => {
    const state = {}
    state[event.target.name] = event.target.value

    let status = event.target.value
    let showNumberList = []

    if (status === 'All')
      showNumberList = this.state.numberList
    else {
      for (let numInfo of this.state.numberList) {
        if (numInfo.status.toUpperCase() === status) {
          showNumberList.push(numInfo)
        }
      }
    }
    state['showNumberList'] = showNumberList

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
  performNUS = async (submitType) => {

    console.log("Activate: ")
    this.setState({message: ''})

    let bPass = true
    if (!this.state.validQty)
      bPass = false

    if (this.state.invalidNumType !== gConst.INVALID_NUM_TYPE_NONE) {
      bPass = false
      $('#num').focus()
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

    let body = {
      type: this.state.numType,
      submitType: submitType,
    }

    if (submitType === NUS_SUBMIT_TYPE_SRCHRES) {
      body.conName = this.state.contactName
      body.conTel = this.state.contactNumber.replace(/\-/g, "")

      if (body.conName === '' || body.conTel === '') {
        this.setState({message: 'Please set contact name and number.'})
        return false
      }

      if (this.state.notes !== '')
        body.shrtNotes = this.state.notes
    }

    switch (this.state.numType) {
      case gConst.OCA_NUM_TYPE_RANDOM:
        body.qty = this.state.quantity.toString()
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
        body.qty = this.state.quantity.toString()
        if (parseInt(this.state.quantity) <= 10)
          body.cons = this.state.cons ?  'Y' : 'N'
        if (this.state.npa !== '')
          body.nxx = this.state.nxx
        if (this.state.line !== '')
          body.line = this.state.line
        body.wildCardNum = this.state.num.replace(/\-/g, "")
        break
    }

    console.log("Body: " + JSON.stringify(body))

    const res = await this.props.callApi2(RestApi.performNUS, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})

    if (res.ok && res.data) {

    } else if (res.data && res.data.errList) {

      let errMsg = ''
      for (let err of res.data.errList) {
        errMsg += (errMsg === '') ? '' : '\r\n'
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
   * this function is called at clicking file open button
   * @param ev
   * @returns {Promise<void>}
   */
  handleFile = async (ev) => {
    let data = new FormData();
    data.append("file", ev.target.files[0]);

    let res = await this.props.callApi2(RestApi.uploadFileMnp, data)

    if (res.ok && res.data) {
      let arrRes = res.data.split("|");
      let data = arrRes[0];
      console.log(data);

      // check the result about bad number and duplicated number
      let causeMsg = "";
      let temp = arrRes[1];

      if (temp != undefined && temp.replace(" ", "") != "") {
        causeMsg = arrRes[1];
      }

      // if bad number or duplicated number exists
      if (causeMsg != "") {
        console.log("Cause Msg:" + causeMsg);
        NotificationManager.warning("", causeMsg)
      }

      // modified by Ming Jin 2020/01/31
      // if the utf8 comma csv file, return string
      // if the seperate comma csv file, return array
      let arrData = Array()
      if (Array.isArray(data)) {  // return from seperate comma file
        arrData = data;
      } else {                    // return from utf8 comma file
        if (data.length > 0) {    // remove the parenthesis [ and ]
          data = data.substr(1, data.length - 2);
        }

        arrData = data.split(", ");
      }

      let message = "File is uploaded with " + arrData.length + " Numbers. Please Submit."

      NotificationManager.success("", message)

      if (causeMsg != "")
        message += "\nWarning: " + causeMsg

      let quantity = 1
      if (arrData.length > 0)
        quantity = arrData.length

      let numArr = res.data.length > 0 ? arrData.join(",") : ""; // modified data.join as arrData.join by Ming Jin 2020/01/31
      await this.setState({
        file: "",
        message: message,
        num: numArr,
        quantity: quantity
      })

      this.onNumFieldFocusOut()

      document.getElementById("selectFile").value = "";

    }
  }

  /**
   *
   * @param event
   */
  handleAllCheck = async (event) => {

    console.log("handleAllCheck")
    let state = {}
    state[event.target.name] = event.target.checked;


    let checkedList = []
    if (event.target.checked) {
      console.log("event.target.checked: " + JSON.stringify(this.state.showNumberList))
    }

    for (let numInfo of this.state.showNumberList) {
      if (numInfo.status.toUpperCase() === gConst.TFNUM_STATE_SPARE) {
        if (event.target.checked) {
          $("#check_" + numInfo.num)[0].checked = true
          checkedList.push(numInfo.num)
        } else {
          $("#check_" + numInfo.num)[0].checked = false
        }
      }
    }

    state['checkedList'] = checkedList

    this.setState(state);
  };


  /**
   *
   * @param event
   */
  handleCheck = async (event) => {

    let num = event.target.name.split("_")[1]

    let checkedList = [...this.state.checkedList]
    if (event.target.checked) {
      checkedList.push(num)
    } else {
      let index = checkedList.indexOf(num)
      checkedList.splice(index, 1)
    }

    console.log("checkedList: " + checkedList)

    let bAllChecked = true
    for (let numInfo of this.state.showNumberList) {
      if (numInfo.status.toUpperCase() === gConst.TFNUM_STATE_SPARE) {
        console.log("indexOf: " + checkedList.indexOf(numInfo.num) + ", " + numInfo.num)
        if (checkedList.indexOf(numInfo.num) === -1) {
          bAllChecked = false
          break
        }
      }
    }

    console.log("is all checked: " + bAllChecked)

    await this.setState({checkedList, allCheck: bAllChecked});
  };

  /**
   * this is called at clicking the view button on the activity list
   */
  logView = async (id) => {
    this.props.callApi2(RestApi.viewNusResult, { "id": id }).then(res => {
      if (res.ok && res.data) {
        let result = res.data

        let sortedData = _.sortBy(result, 'num');

        let detailStatusList = []
        for (let numInfo of sortedData) {
          if (detailStatusList.indexOf(numInfo.status.toUpperCase()) === -1) {
            detailStatusList.push(numInfo.status.toUpperCase())
          }
        }

        this.setState({
          id: id,
          numberList: sortedData,
          showNumberList: sortedData,
          detailTotalCount: sortedData.length,
          detailStatusList: detailStatusList
        });

        for (let log of this.state.activityLog) {
          if (log.id === id) {
            this.setState({
              selQuantity: log.total,
              selCons: log.consecutive,
              selWildCardNum: log.wildCardNum,
              selNpa: log.npa,
              selNxx: log.nxx,
              selLine: log.line,
              selSubmitType: log.submitType,

              detailModalVisible: true,
              allCheck: false,
              checkedList: []
            })
            break
          }
        }
    }
    })
  }

  /**
   *
   * @returns {Promise<void>}
   */
  reserve = async () => {

    let body = {
      conName: this.state.contactName,
      conTel: this.state.contactNumber.replace(/\-/g, ""),
      numList: this.state.checkedList
    }

    if (this.state.notes !== '')
      body.shrtNotes = this.state.notes

    console.log("Body: " + JSON.stringify(body))

    const res = await this.props.callApi2(RestApi.reserve, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})

    if (res.ok && res.data) {
      this.setState({ detailModalVisible: false})

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
      Header: "Submit Type",
      accessor: 'submitType',
      width: gConst.ACTIVITY_SUBMITTYPE_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
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

        <Button size="sm" onClick={() => this.logView(props.original.id)} color="primary" className="ml-2">
          <i className="fa fa-eye"></i>
        </Button>

        <Button size="sm" color="success" className="ml-2" onClick={() => {
          this.downloadForm.action = Config.apiEndPoint + "/somos/nus/result/download/" + props.original.id;
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
  resultColumnsWithCheck = [
    {
      Header: props => <Input type="checkbox" style={{marginLeft: '-0.2rem'}} className="form-check-input" id="allCheck" name="allCheck" onChange={this.handleAllCheck} checked={this.state.allCheck}/>,
      width: 50,
      //accessor: 'num',
      sortable: false,
      Cell: (props) => {
        // if (props.original.status.toUpperCase() === gConst.TFNUM_STATE_SPARE) {
          return <div className="text-center" style={{marginTop: 10}}>
            <Input type="checkbox" className="form-check-input" style={{marginLeft: '-0.2rem'}}
                   id={"check_" + props.original.num} name={"check_" + props.original.num}
                   onChange={this.handleCheck} checked={this.state.checkedList.indexOf(props.original.num) !== -1}/>
          </div>
        // } else {
        //   return <div className="text-center" style={{marginTop: 10}}></div>
        // }
      }
    },
    {
      Header: "Toll-Free Number",
      accessor: 'num',
      width: gConst.NUMBER_COLUMN_WIDTH,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.formattedNumber(props.value)}</div>
    },
    {
      Header: "Status",
      accessor: 'status',
      width: gConst.STATUS_COLUMN_WIDTH,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Message",
      accessor: 'message',
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Suggestions",
      accessor: 'suggestedNum',
      width: gConst.NUMBER_COLUMN_WIDTH,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.formattedNumber(props.value)}</div>
    },
    {
      Header: "View",
      accessor: 'num',
      width: 80,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>

        <Button size="sm" onClick={() => this.numView(props.value)} color="primary" className="ml-2">
          <i className="fa fa-eye"></i>
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
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.formattedNumber(props.value)}</div>
    },
    {
      Header: "Resp Org",
      accessor: 'roId',
      sortable: false,
      width: gConst.ROID_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Status",
      accessor: 'status',
      width: gConst.STATUS_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Message",
      accessor: 'message',
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Suggestions",
      accessor: 'suggestedNum',
      width: gConst.NUMBER_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.formattedNumber(props.value)}</div>
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
        <Label className="ml-1"><strong style={{fontSize: 30}}>Number Search And Reserve</strong></Label>
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
                                   value={this.state.quantity}
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
                      <Col xs="3">
                        <Label>CSV or XL file :</Label>
                        <Input type="file" id="selectFile" name="selectFile" onChange={this.handleFile} accept=".xls,.xlsx,.csv" />
                      </Col>
                      <Col xs="9">
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
                  </CardBody>

                  <div className="row pb-2">
                    <Col xs="1" className="text-right">
                      Message:
                    </Col>
                    <Col xs="10">
                      <Input type="textarea" name="message" value={this.state.message} rows={5} readOnly={true}/>
                    </Col>
                  </div>

                  {/* Buttons */}
                  <CardFooter>
                    <Row>
                      <Col className="text-right">
                        <Button size="md" color="primary" className="mr-2" disabled={this.state.disableSearch} onClick={()=>{this.performNUS(NUS_SUBMIT_TYPE_SEARCH)}}>Search</Button>
                        <Button size="md" color="primary" className="mr-2" onClick={()=>{this.performNUS(NUS_SUBMIT_TYPE_SRCHRES)}}>Search & Reserve</Button>
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
                <Collapse isOpen={true} id="collapseExample">
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
    <Modal isOpen={this.state.detailModalVisible} toggle={this.toggleDetailModal} className={'modal-xl ' + this.props.className}>
      <ModalHeader toggle={this.toggleDetailModal}>Search And Reserve Result</ModalHeader>
      <ModalBody>
        <FormGroup className="ml-4 mr-4">
          <Row className="mb-3" hidden={this.state.selSubmitType === NUS_SUBMIT_TYPE_RESERVE}>
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

          <Row className="mb-3" hidden={this.state.selSubmitType === NUS_SUBMIT_TYPE_RESERVE}>
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


          <Row className="mb-3" hidden={this.state.selSubmitType === NUS_SUBMIT_TYPE_RESERVE}>
            <Col xs="3">
              <div className="row mr-2">
                <Input type="text" placeholder="Search Toll-Free Number" id="detailSrchNum" name="detailSrchNum" onChange={this.onChangeDetailSrchNum} value={this.state.detailSrchNum} />
              </div>
            </Col>

            <Col xs="3">
              <div className="row mr-2">
                <Col xs="4">
                  <Label htmlFor="detailStatus">Status: </Label>
                </Col>
                <Col xs="8">
                  <Input type="select" id="detailStatus" name="detailStatus" onChange={this.onChangeDetailStatus} value={this.state.detailStatus}>
                  <option value="All">All</option>
                  {this.state.detailStatusList && this.state.detailStatusList.map(s => <option key={s} value={s}>{s}</option>)}
                </Input>
                </Col>
              </div>
            </Col>

            <Col xl="3" className="row mr-2 text-right">
              <p> Total Records :
                <span className="font-weight-bold text-right"> { this.state.detailTotalCount }</span>
              </p>
            </Col>

            <Col xl="3" className="row text-right">
              <Button size="sm" color="success" className="ml-5 " onClick={this.download}>
                <i className="fa fa-download"></i> Download
              </Button>
            </Col>
          </Row>

          <Row className="mb-3">
            <ReactTable
              data={this.state.showNumberList} columns={this.state.selSubmitType === NUS_SUBMIT_TYPE_SEARCH ? this.resultColumnsWithCheck : this.resultColumns}
              defaultPageSize={10} minRows="1" className="-striped -highlight col-12" ref={(r) => this.selectActivityLogTable = r}
            />
          </Row>

        </FormGroup>
      </ModalBody>
      <ModalFooter>

        <Row>
          <Col xs="6" hidden={this.state.selSubmitType !== NUS_SUBMIT_TYPE_SEARCH} >
            <Button size="md" color="primary" className="mr-2" onClick={this.reserve} disabled={this.state.checkedList.length === 0}>Reserve</Button>
          </Col>
          <Col xs="6" className="text-right">
            <Button type="reset" size="md" color="danger" onClick={this.toggleDetailModal}> Close</Button>
          </Col>
        </Row>
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
    data: state.auth }),
  dispatch => ({
    refreshContact: (contactName, contactNumber) => dispatch(refreshContact({contactName, contactNumber}))
  })
)(withLoadingAndNotification(NumberSearch));

