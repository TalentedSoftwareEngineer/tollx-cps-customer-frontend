import React, {Component} from 'react';
import $ from "jquery"
import {  Badge,  Button,  Card, CardBody, CardHeader, Col, Collapse, Fade, FormGroup, FormText,  Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';

import ReactTable from 'react-table';
import 'react-table/react-table.css'

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// notification
import {NotificationContainer, NotificationManager} from'react-notifications';
import 'react-notifications/lib/notifications.css';

import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import RestApi from "../../../service/RestApi";
import {timeout} from "../../../service/numberSearch";
import {connect} from "react-redux";
import * as gFunc from "../../../utils";
import * as gConst from "../../../constants/GlobalConstants";
import Cookies from "universal-cookie";
import ProgressBar from "../../../components/Common/ProgressBar"
import _ from "lodash";
import ContactInfoPic from "../../../components/Common/ContactInfoPic";
import Config from '../../../Config';

const MSP_REQ_NAME = "On the reserved number list"

const FRN_REQ_TYPE_PAD = "PAD"
const FRN_REQ_TYPE_CAD = "CAD"

class RNL extends Component {
  constructor(props) {
    super(props);
    this.state = {
      numberList: [],
      showNumberList: [],
      activityLog: [],
      searchNum: '',
      reqName: '',
      bAllChecked: false,           // the flag if there are all checked
      bNoneChecked: true,           // the flag if there is none checked

      activateModalVisible: false,  // the flag for the activationModal
      detailModalVisible: false,   // initial non show
      detailedNumberList: [],      // detail number list data of multi creating

      template: '',                 // template name
      tmplNameList: [],             // template name list
      validTemplate: true,          // the flag to represent that template value is valid

      roId: '',                     // resp org id
      validRoId: true,              // the flag to represent that roId value is valid
      roIdList: [],                 // the roId list that user owned

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

      selTmplName: '',              // template name on detail view modal
      selRoId: '',                  // resp org id on detail view modal
      // selSvcOrderNum: '',           // service order number on detail view modal
      // selNumTermLine: '',           // number of lines on detail view modal
      selEffDtTm: '',               // effective date time on detail view modal

      contactName: "",              // contact name
      contactNumber: "",            // contact number
      notes: "",                    // notes
      validContactInfo: true,

      isPageLoaded: false
    };
  }

  async componentDidMount() {
    let roIdList = [];
    if (this.props.somos.ro) {
      let ros = this.props.somos.ro;
      if (ros.includes(",")) {
        roIdList = ros.split(",");
      } else {
        roIdList.push(ros);
      }
    }

    this.state.contactName = this.props.contactName;
    this.state.contactNumber = this.props.contactNumber;

    this.setState({ roIdList: roIdList })
    this.refreshData()

    await this.refreshList()
    this.backPressureEvent()


    let params = { entity: this.props.somos.selectRo.substring(0, 2), startTmplName: '', roId: '' }
    this.props.callApiHideLoading(RestApi.getTmplRecLstForEntity, params).then(res => {

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

        if (tmplNameList.length > 0) {
          this.setState({template: tmplNameList[0]})
          console.log(">>> " + tmplNameList[0])
        }
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

          if (data[i].reqType !== gConst.REQ_TYPE_RNL)  continue

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
                NotificationManager.success("", gConst.RNL_REQ_FINISHED)
              }

              break
            }
          }

          if (bNewLog) {
            let log = {
              id: data[i].id,
              userName: data[i].userName,
              subDtTm: data[i].subDtTm,
              tmplName: data[i].tmplName,
              effDtTm: data[i].effDtTm,
              type: data[i].type,
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
    this.props.callApi2(RestApi.frnActivityLog).then(res => {
      if (res.ok && res.data) {
        gFunc.sortActivityLogWithDateZA(res.data)
        let log = res.data
        for (let i = 0; i < log.length; i++) {
          log[i].progress = (log[i].completed * 100) / log[i].total
        }
        this.setState({ activityLog: log })

        const cookies = new Cookies();
        const from = cookies.get('from')
        console.log('>>>>> cookie', from)

        if (!this.state.isPageLoaded && from !== undefined && from !== '') {
          cookies.remove('from')
          setTimeout(() => {
            window.scrollTo(0, document.body.scrollHeight);
          }, 2000)
        }

        this.state.isPageLoaded = true;
      }
    })
  }

  delete = (id, index) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    this.props.callApi2(RestApi.deleteFrnResult, { "id": id }).then(res => {
      if (res.ok && res.data) {
        let activityLog = [...this.state.activityLog];
        activityLog.splice(index, 1)
        this.setState({ activityLog })
      }
    })
  }

  /**
   * this is called at changing the value of search num input field
   * @param event
   */
  onChangeSearchNum = async (event) => {
    const state = {};
    state[event.target.name] = event.target.value

    await this.setState(state)
    this.refreshShowData()
  }

  /**
   *
   */
  refreshShowData = () => {

    let numberList = JSON.parse(JSON.stringify(this.state.numberList))
    let searchNum = this.state.searchNum.replace(/\-/g, "")
    let showNumberList = []

    if (searchNum === '') {
      showNumberList = numberList

    } else {
      for (let numInfo of numberList) {
        if (numInfo.num.startsWith(searchNum)) {
          showNumberList.push(numInfo)
        }
      }
    }

    this.setState({
      showNumberList: showNumberList,
      bAllChecked: false,
      bNoneChecked: true
    })
  }

  /**
   * this is called at loading page and clicking the refres button
   */
  refreshData = async () => {

    const res = await this.props.callApi2(RestApi.getReservedNumberList, {'timeout': timeout, roId: this.props.somos.selectRo})

    if (res.ok && res.data && res.data.numList) {

      // sort template name list
      res.data.numList.sort(function (a, b) {
        if (a.resrvdDt < b.resrvdDt)
          return 1
        else if (a.resrvdDt > b.resrvdDt)
          return -1

        return 0
      })

      for (let numInfo of res.data.numList) {
        numInfo.checked = false
      }

      await this.setState({numberList: res.data.numList})
      this.refreshShowData()

    } else if (res.data && res.data.errList) {

      let errMsg = ''
      for (let err of res.data.errList) {
        errMsg += (errMsg == '') ? '' : '\r\n'
        errMsg += (err.errMsg + "(" + err.errCode + ")")
      }

      NotificationManager.error("", errMsg)
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
   * @param ev
   */
  handleChange = (ev) => {
    let state = {};
    state[ev.target.name] = ev.target.value;

    this.setState(state);
  }

  /**
   * effective date control
   */
  handleDate = (date) => {
    this.setState({
      effDate: date,
      validEffDate: true
    });
  }

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
    this.setState({showNumberList: showNumberList, bAllChecked: bAllChecked, bNoneChecked: !bAllChecked })
  }

  /**
   *
   * @param event
   */
  handleCheck = async (event) => {

    let num = event.target.name.split("_")[1]

    let showNumberList = this.state.showNumberList

    let bAllChecked = true
    let bNoneChecked = true
    for (let numInfo of showNumberList) {
      if (numInfo.num === num)
        numInfo.checked = event.target.checked

      if (numInfo.checked) {
        bNoneChecked = false
      } else {
        bAllChecked = false
      }
    }

    await this.setState({showNumberList, bAllChecked: bAllChecked, bNoneChecked: bNoneChecked})
  };

  /**
   * this is called at clicking Spare button
   */
  onSpare = async () => {

    let numList = []
    for (let numInfo of this.state.showNumberList) {
      if (numInfo.checked)
        numList.push(numInfo.num)
    }

    let body = {
      tfNumList: numList,
      requestDesc: MSP_REQ_NAME,
      title: MSP_REQ_NAME
    }

    let res = await this.props.callApi2(RestApi.numberAutomation, {'body': JSON.stringify(body), 'type': gConst.REQ_TYPE_MSP, respOrg: this.props.somos.selectRo, roId: this.props.somos.selectRo, 'timeout': timeout})
    if (res.ok && res.data) {
      this.props.navigate('/system_admin/msp')
    } else if (res.data !== undefined) {
      console.log("Failed")
      NotificationManager.error("", "Failed to spare.")
    }
  }

  /**
   * this is called at clicking the Activate button
   */
  onActivate = () => {
    this.setState({
      validTemplate: true,
      numTermLine: '',
      validNumTermLine: true,
      serviceOrderNum: '',
      validSvcOrdrNum: true,
      timeZone: 'C',
      effDate: '',
      validEffDate: true,
      now: false,
      activateModalVisible: true,
      roId: this.props.somos.selectRo,
    })
  }

  /**
   * this is called at clicking CAD on the number list
   * @param num
   */
  createCAD = (num) => {
    const cookies = new Cookies();
    cookies.set("cusNum", num);
    cookies.set("action", gConst.RECORD_PAGE_ACTION_CREATE)
    this.props.navigate('/customer_admin/customer_data');

  }

  /**
   * this is called at clicking PAD on the number list
   * @param num
   */
  createPAD = (num) => {
    const cookies = new Cookies();
    cookies.set("ptrNum", num);
    cookies.set("action", gConst.RECORD_PAGE_ACTION_CREATE)
    this.props.navigate('/customer_admin/pointer_data');
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
    if (this.state.roIdList.indexOf(this.state.roId) !== -1) {
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
      newRespOrgId: this.state.roId
    }

    if (this.state.notes !== '')
      body.shrtNotes = this.state.notes

    body.numList = []
    for (let numInfo of this.state.showNumberList) {
      if (numInfo.checked)
        body.numList.push(numInfo.num)
    }

    console.log("Body: " + JSON.stringify(body))

    const res = await this.props.callApi2(RestApi.performFromReservedNumbers, {'body': JSON.stringify(body), type:FRN_REQ_TYPE_PAD, roId: this.props.somos.selectRo, 'timeout': timeout})

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
  }

  /**
   * this is called at clicking the view button on the activity list
   */
  logView = async (id) => {
    this.props.callApi2(RestApi.viewFrnResult, { "id": id }).then(res => {
      if (res.ok && res.data) {
        let result = res.data

        let sortedData = _.sortBy(result, 'num');

        this.setState({ detailedNumberList: sortedData });

        for (let log of this.state.activityLog) {
          console.log("log value: " + JSON.stringify(log))
          if (log.id == id) {
            this.setState({
              selRoId: log.respOrg,
              selTmplName: log.tmplName,
              selEffDtTm: log.effDtTm,
              detailModalVisible: true
            })
            break
          }
        }

      }
    })
  }

  /**
   *
   */
  hideDetailModal = () => {
    this.setState({detailModalVisible: false})
  }

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
   * calls when the user click save of the "Contact Information" dialog
   */
  submitContact = (contactName, contactNumber, notes) => {
    this.setState({contactName: contactName, contactNumber: contactNumber, notes: notes, validContactInfo: true})
  }

  reservedNumberColumns = [
    {
      Header: () => <Input type="checkbox" style={{marginLeft: '-0.2rem'}} className="form-check-input" id="bAllChecked" name="bAllChecked" onChange={this.handleAllCheck} checked={this.state.bAllChecked}/>,
      width: 50,
      sortable: false,
      Cell: (props) => {
        return <div className="text-center">
          <Input type="checkbox" className="form-check-input" style={{marginLeft: '-0.2rem', marginBottom: '5px'}}
                 id={"check_" + props.original.num} name={"check_" + props.original.num}
                 onChange={this.handleCheck} checked={props.original.checked}/>
        </div>
      },
      Filter: () => <div></div>
    },
    {
      Header: 'Toll Free Number',
      accessor: 'num',
      // sortable: false,
      Cell: props => <div className="text-center">{gFunc.formattedNumber(props.value)}</div>,
      Filter: () =>
        <Input type="text" className="form-control-sm " placeholder="Search Toll-Free Number" id="searchNum" name="searchNum" onChange={this.onChangeSearchNum} value={this.state.searchNum} />
    },
    {
      Header: 'Auctioned TFN',
      accessor: 'auctnInd',
      sortable: false,
      Cell: props => {
        if (props.value == null)
          return <div className="text-center">No</div>
        else
          return <div className="text-center">{props.value}</div>
      },
      Filter: () => <div></div>
    },
    {
      Header: 'Reserved Date',
      accessor: 'resrvdDt',
      // sortable: false,
      Cell: props => <div className="text-center">{gFunc.fromUTCDateStrToCTDateStr(props.value)}</div>,
      Filter: () => <div></div>
    },
    {
      Header: 'Reserved Until Date',
      accessor: 'resrvdUntilDt',
      // sortable: false,
      Cell: props => <div className="text-center">{gFunc.fromUTCDateStrToCTDateStr(props.value)}</div>,
      Filter: () => <div></div>
    },
    {
      Header: 'Contact Person',
      accessor: 'conName',
      // sortable: false,
      Cell: props => <div className="text-center">{props.value}</div>,
      Filter: () => <div></div>
    },
    {
      Header: 'Contact Number',
      accessor: 'conPhone',
      // sortable: false,
      Cell: props => <div className="text-center">{gFunc.formattedNumber(props.value)}</div>,
      Filter: () => <div></div>
    },
    {
      Header: "Action",
      sortable: false,
      Cell: props =>
        <div className="text-center">
          <Button size="sm" onClick={() => this.createCAD(props.original.num)} color="primary" className="ml-2">CAD</Button>
        </div>,
      Filter: () => <div></div>
    }
  ]

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
    // {
    //   Header: "Type",
    //   accessor: 'type',
    //   sortable: false,
    //   width: gConst.ACTIVITY_TYPE_COLUMN_WIDTH,
    //   Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    // },
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
      Header: "Effective Time",
      accessor: 'effDtTm',
      sortable: false,
      width: gConst.ACTIVITY_DATE_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
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
          this.downloadForm.action = Config.apiEndPoint + "/somos/frn/result/download/" + props.original.id;
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
      accessor: 'message',
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
  ]

  render() {
    return (
      <div className="animated fadeIn">
        <Label className="ml-1"><strong style={{fontSize: 30}}>Reserved Number List</strong></Label>
        <Row className="mt-3">
          <Col xs="12">
            <Card>
              <CardHeader>
                <span style={{fontSize: 20, fontWeight: 'bold'}}>Reserved Number List</span>
              </CardHeader>
              <CardBody>
                <Row className="mb-2">
                  <Col>
                    Total Numbers: {this.state.numberList.length}, Displayed Numbers: {this.state.showNumberList.length}
                  </Col>
                  <Col className="text-right">
                    <Button size="md" color="primary" className="mr-2" onClick={this.refreshData}>Refresh</Button>
                  </Col>
                </Row>

                <Row className="mb-2 m1-1">
                  <Col>
                    <ReactTable
                      data={this.state.showNumberList} columns={this.reservedNumberColumns} defaultPageSize={10} filterable minRows="1" className="-striped -highlight col-12"
                      ref={(r) => this.selectActivityLogTable = r}
                    />
                  </Col>
                </Row>
                <div style={{display:'flex', justifyContent:'flex-end'}}>
                  <Button size="md" color="primary" className="ml-2" onClick={this.onActivate} disabled={this.state.bNoneChecked}>Activate</Button>
                  <Button size="md" color="primary" className="ml-2" onClick={this.onSpare} disabled={this.state.bNoneChecked}>Spare</Button>
                </div>
              </CardBody>
            </Card>
          </Col>

          {/* Result Card */}
          <Col xs="12">
            <Fade timeout={this.state.timeoutResult} in={this.state.fadeInResult}>
              <Card id="multi_creating_result">
                <CardHeader>
                  <strong>Multi Creating Result</strong>
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
                      {this.state.tmplNameList && this.state.tmplNameList.map(s => <option key={s} value={s}>{s}</option>)}
                    </Input>
                  </Col>
                  <Col xs="12" md="6">
                    <Label htmlFor="roId">Resp Org Id *</Label>
                    <Input invalid={!this.state.validRoId} type="text" name="roId" id="roId" onChange={(ev)=>this.handleUppercase(ev)} onBlur={this.onRoIdFieldFocusOut} value={this.state.roId}/>
                    {!this.state.validRoId ? <FormText><p style={{color: 'red'}}>Must be name belongs to your resp org id list.</p></FormText> : ""}
                  </Col>
                </FormGroup>

                {/* Service Order & Time Zone*/}
                <FormGroup row>
                  <Col xs="12" md="6">
                    <Label htmlFor="serviceOrderNum">Service Order *</Label>
                    <Input invalid={!this.state.validSvcOrdrNum} type="text" name="serviceOrderNum" id="serviceOrderNum" onChange={(ev)=>this.handleChange(ev)} onBlur={this.onSvcOrderFieldFocusOut}/>
                    {!this.state.validSvcOrdrNum ? <FormText><p style={{color: 'red'}}>Must be 4 to 13 alphanumeric characters. The 1st character must be alpha, 2nd to 12th characters must be alphanumeric. The 13th character must be alpha.</p></FormText> : ""}
                  </Col>
                  <Col xs="12" md="6">
                    <Label htmlFor="numTermLine">Number of Lines *</Label>
                    <Input invalid={!this.state.validNumTermLine} type="text" name="numTermLine" id="numTermLine" onChange={(ev) => this.handleChange(ev)} onBlur={this.onNumTermLineFieldFocusOut}/>
                    {!this.state.validNumTermLine ? <FormText><p style={{color: 'red'}}>Please input only 4 digits</p></FormText> : ""}
                  </Col>
                </FormGroup>

                {/* Number of Line & Effective Date & Time */}
                <FormGroup row>
                  {/*<Col xs="6" md="6">*/}
                    {/*<Row>*/}
                      {/*<Col xs="12" md="6">*/}
                        {/*<Label htmlFor="timeZone">Time Zone</Label>*/}
                        {/*<Input type="select" name="timeZone" id="timeZone" onChange={(ev)=> this.handleChange(ev)}>*/}
                          {/*<option value="C">Central (C)</option>*/}
                          {/*<option value="A">Atlantic (A)</option>*/}
                          {/*<option value="B">Bering (B)</option>*/}
                          {/*<option value="E">Eastern (E)</option>*/}
                          {/*<option value="H">Hawaiian-Aleutian (H)</option>*/}
                          {/*<option value="M">Mountain (M)</option>*/}
                          {/*<option value="N">Newfoundland (N)</option>*/}
                          {/*<option value="P">Pacific (P)</option>*/}
                          {/*<option value="Y">Alaska (Y)</option>*/}
                        {/*</Input>*/}
                      {/*</Col>*/}
                    {/*</Row>*/}
                  {/*</Col>*/}

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


        <Modal isOpen={this.state.detailModalVisible} toggle={this.hideDetailModal} className={'modal-lg ' + this.props.className}>
          <ModalHeader toggle={this.hideDetailModal}>Multi Creating Result</ModalHeader>
          <ModalBody>
            <FormGroup className="ml-4 mr-4">
              <Row className="mb-3">
                <Col xs="4">
                  <div className="row mr-2">
                    <Label htmlFor="selRoId">Resp Org Id:</Label>
                    <Input type="text" id="selRoId" value={this.state.selRoId} disabled/>
                  </div>
                </Col>
                <Col xs="4">
                  <div className="row mr-2">
                    <Label htmlFor="selTmplName">Template Name:</Label>
                    <Input type="text" id="selTmplName" value={this.state.selTmplName} disabled/>
                  </div>
                </Col>
                <Col xs="4">
                  <div className="row">
                    <Label htmlFor="selEffDtTm">Effective Date Time:</Label>
                    <Input type="text" id="selEffDtTm" value={this.state.selEffDtTm} disabled/>
                  </div>
                </Col>
              </Row>

              <Row className="mb-3">
                <ReactTable
                  data={this.state.detailedNumberList} columns={this.resultColumns} defaultPageSize={10} minRows="1" className="-striped -highlight col-12"
                  ref={(r) => this.selectActivityLogTable = r}
                />
              </Row>

            </FormGroup>
          </ModalBody>
          <ModalFooter>
            <Button type="reset" size="md" color="danger" onClick={this.hideDetailModal}> Close</Button>
          </ModalFooter>
        </Modal>

        <form ref={(node) => { this.downloadForm = node }} action="" target="_blank" method="post">
          <input type="hidden" ref={(input) => { this.textInput = input }} name="access_token" value="" />
        </form>

        <NotificationContainer/>
      </div>
    );
  }
}

export default connect(
  (state) => ({
    somos: state.auth.profile.somos,
    contactName: state.auth.profile.contactName,
    contactNumber: state.auth.profile.contactNumber,
    token: state.auth.token,
    data: state.auth,
  })
)(withLoadingAndNotification(RNL));
