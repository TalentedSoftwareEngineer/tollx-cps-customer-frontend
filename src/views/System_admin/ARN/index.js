import React, { Component } from 'react';
import { Button, Card, CardBody, CardHeader, Col, FormGroup, FormText, Input, Label, Row, CardFooter, Badge } from 'reactstrap';
import { timeout} from "../../../service/numberSearch";
import { connect } from 'react-redux'
import ReactTable from 'react-table';
import 'react-table/react-table.css'
import 'react-overlay-loader/styles.css';
import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import RestApi from "../../../service/RestApi";

import * as gFunc from "../../../utils";
import * as gConst from "../../../constants/GlobalConstants";

// notification
import {NotificationContainer, NotificationManager} from'react-notifications';
import 'react-notifications/lib/notifications.css';

// Date Picker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import * as moment from 'moment-timezone';
import { INVALID_NUM_TYPE_NONE, INVALID_TIME_NONE, INVALID_TIME_PAST, INVALID_TIME_ORDER } from "../../../constants/GlobalConstants";
import ViewReservedNumbersModal from "./viewReservedNumbersModal";
import produce from "immer";

const SERVER_DIFF_TIME = 0 * 1000

const MAX_REQUESTS_AT_A_TIME_LIMIT = 100

class ARN extends Component {

  constructor(props) {
    super(props);

    this.state = {

      timeDiffCT:       0,
      timeDiffUTC:      0,

      quantity:       "1",                // quantity
      validQty:       true,               // the flag to represent that quantity value is valid

      wildcards:           "",
      invalidNumType: gConst.INVALID_NUM_TYPE_NONE,  // the flag to represent that number value is valid

      requestsLimit:     '',
      validRequestsLimit: true,

      requestsAtATime:    "100",                 // max requests for single number
      validRequestsAtATime: true,

      startTime:           moment().valueOf(),
      invalidStartTime:    INVALID_TIME_NONE,               // date startTime error
      startNow:       true,

      endTime:        moment().valueOf(),
      invalidEndTime: INVALID_TIME_NONE,                   // date startTime error
      endNow:         true,
      afterMin:       5,
      afterMinErr:    false,

      roList: ["XQG01", "EJT01", "TTA01"],
      roId: "",

      status: "",

      message: '',
      scheduleList:    [],

      disableSubmit:  true,

      interval:       null,

      bAllChecked:    false,

      bNoneChecked:   true,

      // detail modal
      modal: {
        isOpen: false,           // initial non show
        csvHeader: "",
        numGrid: [],             // detail number list
        totalCount: 0,
      },

    }
    this.csvRef = React.createRef();
  }

  async componentDidMount() {
    const curTime = moment(moment().format('YYYY-MM-DD HH:mm:ss')).valueOf()
    const usCSTTime = moment(moment().tz(gConst.US_CT_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')).valueOf()
    const timeDiffUTC = curTime - usCSTTime - 60 * 60 * 1000
    console.log('   ', timeDiffUTC)

    await this.setState({
      timeDiffUTC: timeDiffUTC,
      startTime: usCSTTime + 1 * 60 * 1000,
      endTime: usCSTTime + 6 * 60 * 1000
    })

    await this.props.callApi2(RestApi.getAutoReserveInfo, {}).then(async res => {
      console.log('>>> auto reserve number info: ', res.data)
      this.parseScheduleList(res.data)
    })

    const interval = setInterval(() => {
      this.refreshListWithoutLoading()
    }, 5000)

    this.setState({interval: interval})
  }

  componentWillUnmount() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }

    clearInterval(this.interval);
  }

  parseScheduleList(data) {
    let scheduleList = []
    for (let record of data) {
      const startTime = gFunc.fromUTCWithoutTStrToCTStrWithSec(record.startTime)
      const endTime = gFunc.fromUTCWithoutTStrToCTStrWithSec(record.endTime)
      const createdAt = record.createdAt.split('.')[0].replace('T', ' ')
      const submitTime = gFunc.fromUTCWithoutTStrToCTStrWithSec(createdAt)
      const numList = record.wildcard.split(',')
      let numbers = ""
      for (let num of numList) {
        numbers += numbers === '' ? '' : ', '
        numbers += num.substr(0, 3) + '-' + num.substr(3, 3) + '-' + num.substr(6, 4)
      }
      const schedule = {
        id: record.id,
        startTime: startTime,
        endTime: endTime,
        submitTime: submitTime,
        wildcard: numbers,
        quantity: record.quantity,
        requestsAtATime: record.maxRequests,
        requestsLimit: record.requestsLimit,
        status: record.status,
        reservedCount: record.reservedCount,
        requestCount: record.requestCount,
        note: record.note,
        roId: record.roId,
        checked: false
      }

      if (this.state.bAllChecked) {
        schedule.checked = true
      } else {

        for (let el of this.state.scheduleList) {
          if (el.id === record.id) {
            schedule.checked = el.checked
          }
        }
      }

      scheduleList.push(schedule)
    }

    this.setState({ scheduleList: scheduleList })
  }

  refreshListWithoutLoading = () => {
    this.props.callApiHideLoading(RestApi.getAutoReserveInfo, {}).then(res => {
      this.parseScheduleList(res.data)
    })
  }

  refreshListWithLoading = () => {
    this.props.callApi2(RestApi.getAutoReserveInfo, {}).then(res => {
      this.parseScheduleList(res.data)
    })
  }

  handleChange = async (ev) => {
    let state = {};
    state[ev.target.name] = ev.target.value;

    if (ev.target.name === "name") {
      if (ev.target.value === "")
        state["nameErr"] = true
      else
        state["nameErr"] = false
    }

    if (ev.target.name === "afterMin") {
      if (ev.target.value <= 0)
        state["afterMinErr"] = true
      else
        state["afterMinErr"] = false
    }

    state["message"] = ""
    await this.setState(state);
    this.setSubmitable()
  }

  onChangeWildcards = async (value) => {
    let state = {};
    state["wildcards"] = value;

    this.setState(state);
    await this.checkWildcardsValidation(value);
    this.setSubmitable()
  }

  /**
   *
   * @param event
   */
  handleAllCheck = async (event) => {

    let bAllChecked = event.target.checked

    let scheduleList = this.state.scheduleList
    for (let el of scheduleList) {
      el.checked = bAllChecked
    }

    this.setState({scheduleList: scheduleList, bAllChecked: bAllChecked, bNoneChecked: !bAllChecked })
  }

  /**
   *
   * @param event
   */
  handleCheck = async (event) => {

    let id = event.target.name.split("_")[1]

    let scheduleList = this.state.scheduleList

    let bAllChecked = true
    let bNoneChecked = true
    for (let el of scheduleList) {
      if (el.id == id)
        el.checked = event.target.checked

      if (el.checked) {
        bNoneChecked = false
      } else {
        bAllChecked = false
      }
    }

    await this.setState({scheduleList: scheduleList, bAllChecked: bAllChecked, bNoneChecked: bNoneChecked})
  };

  clear = () => {
    const usCSTTime = moment(moment().tz(gConst.US_CT_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')).valueOf()
    this.setState({
      quantity: 1,
      validQty: true,
      startTime: usCSTTime + 1 * 60 * 1000,
      invalidStartTime: INVALID_TIME_NONE,
      startNow: true,
      endTime: usCSTTime + 6 * 60 * 1000,
      invalidEndTime: INVALID_TIME_NONE,
      endNow: true,
      afterMin: 5,
      requestsLimit: '',
      validRequestsLimit: true,
      requestsAtATime: 100,
      validRequestsAtATime: true,
      wildcards: "",
      invalidNumType: gConst.INVALID_NUM_TYPE_NONE,
      disableSubmit:    true,
    })
  }

  submit = async () => {
    const utcTime = moment(moment().tz("Etc/UTC").format('YYYY-MM-DD HH:mm:ss')).valueOf();
    const usCSTTime = moment(moment().tz(gConst.US_CT_TIMEZONE).format('YYYY-MM-DD HH:mm:ss')).valueOf();
    const diffTime = utcTime - usCSTTime;

    console.log('>>>>>>>>>>>> diff time: ', diffTime);
    let startTime = moment(this.state.startTime).valueOf() + diffTime;
    let endTime = moment(this.state.endTime).valueOf() + diffTime;

    console.log(">>>>>>>>>> start time value: ", this.state.startTime);
    console.log(">>>>>>>>>> end time value: ", this.state.endTime);
    console.log(">>>>>>>>>> start time: ", moment(this.state.startTime).format('YYYY-MM-DD HH:mm:ss'));
    console.log(">>>>>>>>>> end time: ", moment(this.state.endTime).format('YYYY-MM-DD HH:mm:ss'));
    console.log(">>>>>>>>>> start time: ", moment(startTime).format('YYYY-MM-DD HH:mm:ss'));
    console.log(">>>>>>>>>> end time: ", moment(endTime).format('YYYY-MM-DD HH:mm:ss'));

    if (this.state.startNow)
      startTime = 0

    if (this.state.endNow)
      endTime = 0

    let body = {
      quantity: this.state.quantity,
      start_time: startTime === 0 ? "" : moment(startTime).format('YYYY-MM-DD HH:mm:ss'),
      start_now: this.state.startNow,
      end_time: endTime === 0 ? "" : moment(endTime).format('YYYY-MM-DD HH:mm:ss'),
      end_now: this.state.endNow,
      after_min: this.state.afterMin,
      max_requests: this.state.requestsAtATime,
      requests_limit: this.state.requestsLimit,
      wildcards: this.state.wildcards.replaceAll('-', '').replaceAll(' ', ''),
      ro_id: this.state.roId,
    }

    const res = await this.props.callApi2(RestApi.createAutoReserveInfo, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})
    if (res.ok && res.data) {
      NotificationManager.success("Success")

    } else if (res.data !== undefined) {

    }

    this.clear()

    this.refreshListWithLoading();
  }

  /**
   * this is called at changing the Requests Limit field.
   * @param event
   */
  onChangeRequestsLimit = async (event) => {
    let digitReg = /^[1-9]([0-9]+)?$/g
    let value = event.target.value

    const state = {};
    state[event.target.name] = value;

    if (!digitReg.test(value)) {
      state['validRequestsLimit'] = false
      state['disableSubmit'] = true
    } else {
      state['validRequestsLimit'] = true
      state['disableSubmit'] = false
    }

    await this.setState(state);
  }

  /**
   * this is called at changing the quantity field.
   * @param event
   */
  onChangeRequestsAtATime = async (event) => {
    let digitReg = /^[1-9]([0-9]+)?$/g
    let value = event.target.value

    console.log("quantity: " + value)

    const state = {};
    state[event.target.name] = value;

    if (!digitReg.test(value) || parseInt(value) > MAX_REQUESTS_AT_A_TIME_LIMIT) {
      state['validRequestsAtATime'] = false
      state['disableSubmit'] = true
    } else {
      state['validRequestsAtATime'] = true
      state['disableSubmit'] = false
    }

    await this.setState(state);
  }

  /**
   * this is called at changing the quantity field.
   * @param event
   */
  onChangeQuantity = async (value) => {
    let digitReg = /^[1-9]([0-9]+)?$/g

    console.log("quantity: " + value)

    const state = {};
    state['quantity'] = value;

    if (!digitReg.test(value)) {
      state['validQty'] = false
    } else {
      state['validQty'] = true
    }

    await this.setState(state);
  }

  /**
   * this function is called when the focus of number input field is lost
   */
  checkWildcardsValidation = async (value) => {

    console.log('>>> wildcards change: ', value)

    let wildcards = value.replaceAll('-', '')
    while (wildcards.includes("  "))
      wildcards = wildcards.replaceAll("  ", ' ')

    wildcards = wildcards.replaceAll(" ", ',')
    wildcards = wildcards.replaceAll("\n", ',')

    while (wildcards.includes(",,"))
      wildcards = wildcards.replaceAll(",,", ',')
    console.log('>>> wildcards after removing space: ', wildcards)
    
    if (wildcards !== "") {

      if (wildcards.includes('*') || wildcards.includes('&')) { // to wildcard mode
        
        const wildcardList = wildcards.split(',')
        console.log('>>> wildcards list: ', wildcardList)

        let invalidNumType = gConst.INVALID_NUM_TYPE_NONE
        for (let wildcard of wildcardList) {
          if (!(wildcard.includes('*') || wildcard.includes('&'))) {
            invalidNumType = gConst.INVALID_NUM_TYPE_WILDCARD
            break
          }

          // check if the number is wildcard number
          let wildcardNumReg = gConst.WILDCARDNUM_REG_EXP
          let isValidWildcard = true

          if (wildcard.length > 12)
            isValidWildcard = false

          if (isValidWildcard && !wildcardNumReg.test(wildcard))
            isValidWildcard = false

          let ampCount = 0
          if (isValidWildcard && wildcard.includes("&")) {
            ampCount = 1
            let index = wildcard.indexOf("&")
            if (wildcard.includes("&", index + 1))
              ampCount = 2
          }

          if (!isValidWildcard) {
            invalidNumType = gConst.INVALID_NUM_TYPE_WILDCARD

          } else if (ampCount === 1) {
            invalidNumType = gConst.INVALID_NUM_TYPE_AMP

          }
        }
      
        if (invalidNumType === gConst.INVALID_NUM_TYPE_NONE) {
          wildcards = ""
          for (let num of wildcardList) {
            wildcards += wildcards === '' ? '' : ', '

            num = num.replaceAll('-', '')
            wildcards += num.substr(0, 3) + '-' + num.substr(3, 3) + '-' + num.substr(6, 4)
          }
          await this.setState({invalidNumType: gConst.INVALID_NUM_TYPE_NONE, wildcards: wildcards})
          this.setSubmitable()

        } else {
          await this.setState({invalidNumType: invalidNumType, disableSubmit: true})
        }

      } else {
        const numList = wildcards.split(',')

        let invalidNumType = gConst.INVALID_NUM_TYPE_NONE
        for (let num of numList) {

          let isPhoneNumber = true

          if (num.length > 12)
            isPhoneNumber = false

          if (isPhoneNumber && !gConst.TFNUM_REG_EXP.test(num))
            isPhoneNumber = false

          if (!isPhoneNumber) {
            invalidNumType = gConst.INVALID_NUM_TYPE_COMMON
          }
        }

        console.log('------ invalid num type: ', invalidNumType)

        if (invalidNumType === gConst.INVALID_NUM_TYPE_NONE) {
          let numbers = ""
          for (let num of numList) {
            numbers += numbers === '' ? '' : ', '

            num = num.replaceAll('-', '')
            numbers += num.substr(0, 3) + '-' + num.substr(3, 3) + '-' + num.substr(6, 4)
          }

          await this.setState({invalidNumType: gConst.INVALID_NUM_TYPE_NONE, wildcards: numbers})
          this.setSubmitable()

        } else {
          await this.setState({invalidNumType: invalidNumType, disableSubmit: true})
        }
      }

    } else if (wildcards == null || wildcards === "") {
      await this.setState({
        invalidNumType: gConst.INVALID_NUM_TYPE_EMPTY,
        disableSubmit: true
      })
    }
  }

  /**
   *
   * @param date
   * @returns {Promise<void>}
   */
  onChangeStartTime = async (date) => {
    await this.setState({startTime: date});

    console.log('>>>>>>> start date: ', moment(date).format('YYYY-MM-DD HH:mm:ss'))
    console.log('>>>>>>> end date: ', moment(this.state.endTime).format('YYYY-MM-DD HH:mm:ss'))
    this.onTimeFieldFocusOut()
  }

  /**
   *
   * @param date
   * @returns {Promise<void>}
   */
  onChangeEndTime = async (date) => {
    await this.setState({endTime: date});
    this.onTimeFieldFocusOut()
  }

  /**
   *
   * @param id
   * @param index
   */
  delete = (id, index) => {
    if (!window.confirm("Are you sure you want to delete this schedule?")) return;
    this.props.callApi2(RestApi.deleteAutoReserveInfo, { "id": id }).then(res => {
      if (res.ok && res.data) {
        let scheduleList = [...this.state.scheduleList];
        scheduleList.splice(index, 1)
        this.setState({ scheduleList })
      }
    })
  }

  /**
   * delete selected schedules
   */
  deleteSchedules = () => {
    if (!window.confirm("Are you sure you want to delete selected schedule?")) return;
    let ids = ""
    for (let schedule of this.state.scheduleList) {
      if (schedule.checked) {
        ids += ids === "" ? "" : ","
        ids += schedule.id
      }
    }

    this.props.callApi2(RestApi.deleteAutoReserveSchedules, { "ids": ids }).then(res => {
      if (res.ok && res.data) {
        let scheduleList = [...this.state.scheduleList];
        for (let i = scheduleList.length - 1; i >= 0; i--) {
          if (scheduleList[i].checked) {
            scheduleList.splice(i, 1)
          }
        }
        this.setState({ scheduleList })
      }
    })
  }

  /**
   * this is called when the focus of end time field is lost
   */
  onTimeFieldFocusOut = async () => {

    const startNow = this.state.startNow
    const endNow = this.state.endNow
    let startTime = this.state.startTime
    let endTime = this.state.endTime
    const afterMin = this.state.afterMin

    if (!startNow && endNow)
      endTime = moment().valueOf() + afterMin * 60 * 1000
    else if (startNow && !endNow)
      startTime = moment().valueOf()

    let invalidStartTime = INVALID_TIME_NONE
    let invalidEndTime = INVALID_TIME_NONE

    /*
    if (moment(startTime).valueOf() < moment().valueOf() - this.state.timeDiffCT + 10000) {
      invalidStartTime = INVALID_TIME_PAST
    }

    if (moment(endTime).valueOf() < moment().valueOf() - this.state.timeDiffCT + 10000) {
      invalidEndTime = INVALID_TIME_PAST
    }
    */

    if (startTime >= endTime && invalidStartTime === INVALID_TIME_NONE) {
      invalidStartTime = INVALID_TIME_ORDER
    }

    if (startTime >= endTime && invalidEndTime === INVALID_TIME_NONE) {
      invalidEndTime = INVALID_TIME_ORDER
    }

    await this.setState({
      invalidStartTime: invalidStartTime,
      invalidEndTime: invalidEndTime,
    })

    this.setSubmitable()
  }


  /**
   * setSubmitable
   */
  setSubmitable() {
    let submitable = true
    if (this.state.wildcards === '') {
      this.setState({ invalidNumType: gConst.INVALID_NUM_TYPE_EMPTY})
      submitable = false
    }

    if (submitable && !this.state.validQty)
      submitable = false

    if (submitable && !this.state.validRequestsAtATime)
      submitable = false

    if (submitable && this.state.invalidNumType !== INVALID_NUM_TYPE_NONE)
      submitable = false

    if (submitable && !this.state.startNow && this.state.invalidStartTime !== INVALID_TIME_NONE)
      submitable = false

    if (submitable && !this.state.endNow && this.state.invalidEndTime !== INVALID_TIME_NONE)
      submitable = false

    if (submitable && this.state.endNow && this.state.afterMinErr)
      submitable = false

    this.setState({ disableSubmit: !submitable })
  }

  /**
   * view
   */
  view(id, index) {
    const info = this.state.scheduleList[index]
    let csvHeader = "Start Time, End Time, Submit Time, Wildcard, Quantity, Max Request Times, Status, Reserved Count\r\n"
    csvHeader += `${info.startTime}, ${info.endTime}, ${info.submitTime}, ${info.wildcard}, ${info.quantity}, ${info.requestsAtATime}, ${info.status}, ${info.reservedCount}\r\n\r\n`

    this.props.callApi2(RestApi.getAutoReserveNumbers, { "id": id }).then(res => {
      if (res.ok && res.data) {


        const cols = 5
        let rows = 4

        const numList = []
        const len = Math.max(cols * rows, Math.ceil(res.data.length / cols) * cols)
        for (let i = 0; i < len; i++) {
          if (i >= res.data.length)
            numList.push("")
          else
            numList.push(res.data[i])
        }

        console.log('>>>>> number list: ', numList)
        rows = numList.length / cols

        const numGrid = []
        for (let i = 0; i < rows; i++) {
          const row = []
          for (let j = 0; j < 5; j++) {
            row.push(numList[i * 5 + j])
          }
          numGrid.push(row)
        }
        console.log('>>>>> number grid: ', numGrid)

        this.setState({
          modal: produce(this.state.modal, m => {
            m.isOpen = true;
            m.csvHeader = csvHeader
            m.numGrid = numGrid;
            m.totalCount = res.data.length;
          }),
        })
      }
    })
  }

  /**
   * download
   */
  async download(id, index) {
    const info = this.state.scheduleList[index]
    let csv = "Start Time, End Time, Submit Time, Wildcard, Quantity, Max Request Times, Status, Reserved Count\r\n"
    csv += `${info.startTime}, ${info.endTime}, ${info.submitTime}, ${info.wildcard}, ${info.quantity}, ${info.requestsAtATime}, ${info.status}, ${info.reservedCount}\r\n\r\n`

    let numberList = []
    const res = await this.props.callApi2(RestApi.getAutoReserveNumbers, { "id": id })
    if (res.ok && res.data)
      numberList = res.data

    if (numberList.length) {
      csv += "Reserved Numbers\r\n"
      for (let number of numberList) {
        const num = number.substr(0, 3) + "-" + number.substr(3, 3) + "-" + number.substr(6, 4)
        csv += `${num}\r\n`
      }
    }

    const downloadLink = document.createElement("a");
    const blob = new Blob(["\ufeff", csv]);
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = "Auto Reserve Information.csv";  //Name the file here
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  toggleModal = () => {
    const modal = produce(this.state.modal, m => {
      m.isOpen = !m.isOpen;
    });
    this.setState({ modal });
  };

  // Activity Log Columns
  activityReportColumns = [
    {
      Header: () => <Input type="checkbox" style={{marginLeft: '-0.2rem'}} className="form-check-input" id="bAllChecked" name="bAllChecked" onChange={this.handleAllCheck} checked={this.state.bAllChecked}/>,
      width: 50,
      sortable: false,
      Cell: (props) => {
        return <div className="text-center">
          {props.original.status !== "Executing..." ?
            <Input type="checkbox" style={{marginLeft: '-0.2rem', marginBottom: '5px', position: 'relative'}}
                   id={"check_" + props.original.id} name={"check_" + props.original.id}
                   onChange={this.handleCheck} checked={props.original.checked}/> : ''
          }
        </div>
      },
    },
    {
      Header: "Start Time",
      accessor: 'startTime',
      sortable: true,
      width: gConst.ACTIVITY_DATE_TIMECOLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "End Time",
      accessor: 'endTime',
      sortable: false,
      width: gConst.ACTIVITY_DATE_TIMECOLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Submit Time",
      accessor: 'submitTime',
      sortable: false,
      width: gConst.ACTIVITY_DATE_TIMECOLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Wildcard",
      accessor: 'wildcard',
      sortable: false,
      width: gConst.NUMBER_COLUMN_WIDTH,
      Cell: props =>  {
        if (props.value.split(',').length == 1)
          return <div className="text-center" style={{marginTop: 10}}>{props.value}</div>

        return props.value.split(",").map(line => {
          return <div className="text-center">{line}</div>
        })
      }
    },
    {
      Header: "Requests at a time",
      accessor: 'requestsAtATime',
      sortable: false,
      width: 150,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Status",
      accessor: 'status',
      sortable: false,
      width: 80,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Ro Id",
      accessor: 'roId',
      sortable: false,
      width: 120,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Request Count",
      accessor: 'requestCount',
      sortable: false,
      width: 120,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Reserved Count",
      accessor: 'reservedCount',
      sortable: false,
      width: 120,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Note",
      accessor: 'note',
      sortable: false,
      width: 400,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Action",
      sortable: false,
      width: gConst.ACTIVITY_ACTION_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>

        <Button size="sm" color="primary" className="ml-2" onClick={() => this.view(props.original.id, props.index)}>
          <i className="fa fa-eye"></i>
        </Button>
        <Button size="sm" color="success" className="ml-2" onClick={() => this.download(props.original.id, props.index)}>
          <i className="fa fa-download"></i>
        </Button>
        { props.original.status !== "Executing..." ?
        <Button size="sm" color="danger" className="ml-2" onClick={() => this.delete(props.original.id, props.index)}>
          <i className="fa fa-close"></i>
        </Button> : '' }
      </div>
    }
  ]

  render() {
    return (
      <div className="animated fadeIn">
        <div className="page-header">
          <Row className="mt-4">
            <Col xs="12">
              <h1 className="pb-3 border-bottom">
                Auto Reserve Numbers
              </h1>
            </Col>
          </Row>
        </div>

        <Row className="mt-3">
          <Col>
            <Card>
              <CardHeader>
                Auto Reserve Setting
              </CardHeader>
              <CardBody>
                <FormGroup row>

                  {/* start date start time*/}
                  <Col xs="12" md="4" className="row ml-2 mb-3">
                    <Label className="mr-2 pt-1">Starting Date Time *: </Label>
                    <Row className="form-control-sm pt-0 ml-2">
                        <DatePicker
                          invalid={this.state.invalidStartTime}
                          dateFormat="MM/dd/yyyy hh:mm:ss a"
                          selected={this.state.startTime}
                          id="endDtTm"
                          showTimeSelect
                          timeIntervals={1}
                          minDate={new Date(moment().add(1, 'minute').valueOf() - this.state.timeDiffCT)}
                          onChange={ this.onChangeStartTime }
                          className="form-control"
                          timeCaption="time"
                          disabled={this.state.startNow}
                          onBlur={this.onTimeFieldFocusOut}
                        />
                        <Row className="ml-5 mt-2">
                          <Input type="checkbox" id="startNow" name="startNow" checked={this.state.startNow} onChange={() => {this.setState({startNow: !this.state.startNow})}}/>
                          <Label htmlFor="startNow">Now</Label>
                        </Row>
                    </Row>
                    {
                      this.state.invalidStartTime === INVALID_TIME_PAST && !this.state.startNow
                      ? <FormText style={{width: '100%'}}><p style={{color: 'red', textAlign: 'center'}}>Please input future time</p></FormText>
                      : ""
                    }
                    {
                      this.state.invalidStartTime === INVALID_TIME_ORDER && !this.state.startNow
                        ? <FormText style={{width: '100%'}}><p style={{color: 'red', textAlign: 'center'}}>Start time must be before than end time</p></FormText>
                        : ""
                    }
                  </Col>

                  {/* end date start time*/}
                  <Col xs="12" md="8" className="row ml-2 mb-3">
                    <Label className="mr-2 pt-1">End Date Time *: </Label>
                    <Row className="form-control-sm pt-0 ml-2">
                        <DatePicker
                          invalid={this.state.invalidEndTime}
                          dateFormat="MM/dd/yyyy hh:mm:ss a"
                          selected={this.state.endTime}
                          id="endDtTm"
                          showTimeSelect
                          timeIntervals={1}
                          minDate={new Date(moment().add(11, 'minute').valueOf() - this.state.timeDiffCT)}
                          onChange={ this.onChangeEndTime }
                          className="form-control"
                          timeCaption="time"
                          disabled={this.state.endNow}
                          onBlur={ this.onTimeFieldFocusOut }
                        />
                        <Row className="ml-1">
                          <Row className="ml-5 mt-2">
                            <Input type="checkbox" id="endNow" name="endNow" checked={this.state.endNow} onChange={(evt) => {this.setState({endNow: !this.state.endNow})}}/>
                            <Label htmlFor="endNow">Now + </Label>
                          </Row>
                          <Row className="ml-4">
                            <Input type="number" name="afterMin" id="afterMin" value={this.state.afterMin} style={{width: '70px'}}
                                   placeholder="After Min" onChange={(value) => this.handleChange(value)} disabled={!this.state.endNow}/>
                            <Label className="ml-1 mt-2" htmlFor="afterMin">Mins</Label>
                          </Row>
                          {
                            this.state.afterMinErr ? <FormText style={{width: '100%'}}><p style={{color: 'red', textAlign: 'center'}}>The value must be greater than 0</p></FormText>  : ""
                          }
                        </Row>
                    </Row>
                    {
                      this.state.invalidEndTime === INVALID_TIME_PAST && !this.state.endNow
                        ? <FormText style={{width: '100%'}}><p style={{color: 'red', marginLeft: '120px'}}>Please input future time</p></FormText>
                        : ""
                    }
                    {
                      this.state.invalidEndTime === INVALID_TIME_ORDER && !this.state.endNow
                        ? <FormText style={{width: '100%'}}><p style={{color: 'red', marginLeft: '120px'}}>End time must be after than start time</p></FormText>
                        : ""
                    }
                  </Col>
                </FormGroup>

                <FormGroup row>


                  {/* Requests Limit*/}
                  {/*<Col xs="12" md="5" className="row ml-2 mt-3 mb-3">*/}
                    {/*<Label className="mr-2 pt-1">Requests Limit: </Label>*/}
                    {/*<Row className="col-8 form-control-sm pt-0">*/}
                      {/*<Col>*/}
                        {/*<Input type="number" id="requestsLimit" name="requestsLimit" autoComplete="text"*/}
                               {/*value={this.state.requestsLimit}*/}
                               {/*onChange={(evt) => this.onChangeRequestsLimit(evt)}/>*/}
                      {/*</Col>*/}
                    {/*</Row>*/}
                  {/*</Col>*/}

                  <Col xs="12" md="5" className="row ml-2 mt-3 mb-3">
                    <Label className="mr-2 pt-1">Ro Id: </Label>
                    <Row className="col-8 form-control-sm pt-0">
                      <Col>
                        <Input type="select" className="form-control-sm " id="roId" name="roId" value={this.state.roId} onChange={(ev)=> {this.setState({roId: ev.target.value})}}>
                          <option key="" value=""></option>
                          {this.state.roList && this.state.roList.map(s => <option key={s} value={s}>{s}</option>)}
                        </Input>
                      </Col>
                    </Row>
                  </Col>

                  {/* Max Requests */}
                  <Col xs="12" md="5" className="row ml-2 mt-3 mb-3">
                    <Label className="mr-2 pt-1">Requests at a time *: </Label>
                    <Row className="col-8 form-control-sm pt-0">
                      <Col>
                        <Input type="number" id="requestsAtATime" name="requestsAtATime" autoComplete="text"
                               value={this.state.requestsAtATime}
                               onChange={(evt) => this.onChangeRequestsAtATime(evt)}/>
                        {!this.state.validRequestsAtATime ?
                          <FormText><p style={{color: 'red'}}>Must be between 1 and {MAX_REQUESTS_AT_A_TIME_LIMIT}.</p>
                          </FormText> : ""}
                      </Col>
                    </Row>
                  </Col>

                </FormGroup>

                {/* Wildcard */}
                <Col xs="12" md="11" className="row ml-1 mt-3 mb-3">
                  <Label className="mr-2 pt-1" htmlFor="quantity">Wildcards / TFN Numbers *: </Label>
                  <Input type="textarea" name="wildcards" id="wildcards" rows="5"
                         value={this.state.wildcards}
                         placeholder="Mask Entry" onChange={(ev) => this.onChangeWildcards(ev.target.value)}/>
                  {this.state.invalidNumType === gConst.INVALID_NUM_TYPE_COMMON ? <FormText><strong style={{color: 'red'}}>Must be 10 alphanumeric characters and optionally two dashes '-'. Allowed delimiters are comma or return.</strong></FormText> : ""}
                  {this.state.invalidNumType === gConst.INVALID_NUM_TYPE_AMP ? <FormText><strong style={{color: 'red'}}>Number cannot contain a single '&'.</strong></FormText> : ""}
                  {this.state.invalidNumType === gConst.INVALID_NUM_TYPE_WILDCARD ? <FormText><strong style={{color: 'red'}}>Please input wildcard for auto reserving.</strong></FormText> : ""}
                  {this.state.invalidNumType === gConst.INVALID_NUM_TYPE_TOO_MANY ? <FormText><strong style={{color: 'red'}}>You cannot apply over 500 numbers.</strong></FormText> : ""}
                  {this.state.invalidNumType === gConst.INVALID_NUM_TYPE_EMPTY ? <FormText><strong style={{color: 'red'}}>Please input wildcard for auto reserving.</strong></FormText> : ""}

                </Col>
              </CardBody>
              <CardFooter>
                <Row>
                  <Col className="text-right">
                    <Button size="md" color="primary" disabled={this.state.disableSubmit} onClick={this.submit} >Submit</Button>
                    <Button size="md" color="danger" onClick={this.clear} className="ml-3">Clear</Button>
                  </Col>
                </Row>
              </CardFooter>
            </Card>
          </Col>
        </Row>

        <Card>
          <CardHeader>
            Auto Reserve Numbers
          </CardHeader>
          <CardBody>
            <Row className="mb-2">
              <Col>
                Total: {this.state.scheduleList.length}
              </Col>
              <Col className="text-right">
                <Button size="md" color="danger" className="mr-2" onClick={this.deleteSchedules}>Delete</Button>
              </Col>
            </Row>

            <div className="mt-2">
              <ReactTable
                data={this.state.scheduleList} columns={this.activityReportColumns} defaultPageSize={10} minRows="1" className="-striped -highlight col-12"
                ref={(r) => this.selectActivityLogTable = r}
              />
            </div>
          </CardBody>
        </Card>

        <ViewReservedNumbersModal
          isOpen={this.state.modal.isOpen}
          toggle={this.toggleModal}
          data={this.state.modal}
          token={this.props.data.token}
        />

        <NotificationContainer/>
      </div>
    )
  }
}

export default connect((state) => ({ somos: state.auth.profile.somos, token: state.auth.token, data: state.auth }))(withLoadingAndNotification(ARN));
