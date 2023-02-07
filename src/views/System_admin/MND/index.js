import React, { Component } from 'react';
import { connect } from 'react-redux'
import ReactTable from 'react-table';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import 'react-table/react-table.css'
import 'react-overlay-loader/styles.css';
import {  Button, Card, CardBody, CardHeader, Col, FormGroup, FormText,  Input, Label, Row, CardFooter, ModalHeader, ModalBody, ModalFooter, Modal,  Badge } from 'reactstrap';

import {filterValidNums, timeout,} from "../../../service/numberSearch";
import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import RestApi from "../../../service/RestApi";
import _ from 'lodash';
import produce from 'immer';
import ViewMndListModal from './viewMndListModal';

import * as gFunc from "../../../utils";
import * as gConst from "../../../constants/GlobalConstants";
import ProgressBar from "../../../components/Common/ProgressBar"

// notification
import {NotificationContainer, NotificationManager} from'react-notifications';
import 'react-notifications/lib/notifications.css';
import Config from '../../../Config';


class MND extends Component {

  constructor(props) {
    super(props);

    this.state = {
      nums: "",                     // numbers to disconnect
      mail: '',                     // user email
      loading: false,
      datas: [],
      date: '',
      disableDialedNumber: false,
      name: "",
      nameErr: false,               // name error flag
      numErr: false,                // number error flag
      effDateErr: false,            // effective date error flag
      interDateErr: false,          // intercept date error flag
      logLength: 0,                 // log length
      activityLog: [],              // MND activity log data
      csvData: [],                  // csv file content
      jobTitle: "",                 // job title
      jobTitleErr: false,
      interval: "",                 // Timer
      numberList: [],
      numberListId: "",
      referral: "N",                 // referral
      eff_now: false,               // effective date time as now
      eff_date: null,               // effective date time value
      inter_now: false,             // intercept date as now
      inter_date: null,             // intercept date value
      notes: "",                    // notes

      // detail modal
      modal: {
        isOpen: false,              // initial non show
        numberList: [],             // detail number list data of One MND
        /*
        page: 0,
        sort: [],
        filter: [],
        pageSize: 0,
        total_page: 0,
        */
        id: null,
        result: [],
      },

    };
    this.csvRef = React.createRef();
  }

  async componentDidMount() {
    await this.refreshList()
    this.backPressureEvent()

    // get user information from the server and set the mail.
    this.props.callApi2(RestApi.userInfo, {}).then(res => {
      if (res.ok && res.data) {
        this.setState({ mail: res.data.email })
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

          if (data[i].reqType !== gConst.REQ_TYPE_MND)  continue

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
                NotificationManager.success("", gConst.MND_REQ_FINISHED)
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
              startEffDtTm: data[i].effDtTm,
              endInterceptDt: data[i].interceptDate,
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

  toggleModal = () => {
    const modal = produce(this.state.modal, m => {
      m.isOpen = !m.isOpen;
    });
    this.setState({ modal });
  };

  view = async (id) => {
    this.props.callApi2(RestApi.viewMnp, { "id": id }).then(res => {

      if (res.ok && res.data) {
        let status = res.data.map(st => st.status)
          .filter((value, index, self) => {
            // if (value == "") return;
            console.log("status: " + value);
            return self.indexOf(value) === index
          })

        let sortedData = _.sortBy(res.data, 'num');

        this.setState({
          modal: produce(this.state.modal, m => {
            m.isOpen = true;
            m.numberList = sortedData;
            m.status = status;
            m.id = id;
            m.totalCount = res.data.length;
            m.noRecords = res.data.length === 0;
          })
        });
      }
    })
  };

  delete = (id, index) => {
    if (!window.confirm("Are you sure you want to delete this report?")) return;
    this.props.callApi2(RestApi.deleteReport, { "id": id }).then(res => {
      if (res.ok && res.data) {
        let activityLog = [...this.state.activityLog];
        activityLog.splice(index, 1)
        this.setState({ activityLog })
      }
    })
  }

  refreshList = () => {
    this.props.callApi2(RestApi.activityLog, {type: gConst.REQ_TYPE_MND}).then(res => {
      if (res.ok && res.data) {
        gFunc.sortActivityLogWithDateZA(res.data)
        this.setState({ activityLog: res.data, logLength: res.data.length })
      }
    })
  }

  handleChange = (ev) => {
    let state = {};
    state[ev.target.name] = ev.target.value;

    if (ev.target.name === "name" && ev.target.value === "")
      state["nameErr"] = true
    else
      state["nameErr"] = false

    state['message'] = ""
    this.setState(state);
  };

  /**
   * upload csv or xls, xlsx.
   * @param ev
   * @returns {Promise<void>}
   */
  uploadFile = async (ev) => {
    let data = new FormData();
    data.append("file", ev.target.files[0]);

    this.props.callApi2(RestApi.uploadFileMnp, data).then(res => {
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

        let numArr = res.data.length > 0 ? arrData.join("\n") : ""; // modified data.join as arrData.join by Ming Jin 2020/01/31
        this.setState({
          "disableDialedNumber": false,
          "nums": numArr,
          "datas": [],
        })

        document.getElementById("selectFile").value = "";
        NotificationManager.success("", "File is uploaded with " + arrData.length + " Numbers. Please Submit")

      }
    })
  }

  download = (name) => {
    let csvData = []
    this.csvData = [csvData];
    let btn = this.csvRef.current;
    btn.link.click();
  }

  /**
   * call when the user click the submit button
   * @returns {Promise<boolean>}
   */
  submit = async () => {

    console.log("eff_date: " + this.state.eff_date);

    // get effective date and time from date picker control
    let effDtTm = ""

    if (this.state.eff_now) {
      effDtTm = "NOW";    // set "NOW" if now checkbox is checked

    } else if (this.state.eff_date != null) {
      let dt = new Date(this.state.eff_date)
      effDtTm = gFunc.fromCTTimeToUTCStr(dt)
    }

    // get intercept date from date picker control
    let interDate = "";
    if (this.state.inter_now) {
      interDate = "NOW";    // set "NOW" if now checkbox is checked

    } else if (this.state.inter_date != null) {
      let dt = new Date(this.state.inter_date)

      // get date string as dd/mm/yyyy format
      let month = dt.getMonth() + 1
      interDate += dt.getFullYear()
      interDate += "-" + (month > 9 ? "" : "0") + month
      interDate += "-" + (dt.getDate() > 9 ? "" : "0") + dt.getDate()
    }

    console.log("effDate: " + effDtTm);


    this.setState({ nameErr: false, jobTitleErr: false, numErr: false, effDateErr: false, interDateErr: false });
    this.state.datas = [];

    // check validation, number list, job title(name), effective date time, intercept date
    if (this.state.nums === "") { this.setState({ numErr: true }); window.scrollTo(0, 0); return false; }
    if (this.state.name === "") { this.setState({ nameErr: true }); window.scrollTo(0, 0); return false; }
    if (effDtTm === "") { this.setState({ effDateErr: true }); window.scrollTo(0, 0); return false; }
    if (interDate === "") { this.setState({ interDateErr: true }); window.scrollTo(0, 0); return false; }

    let numList = gFunc.retrieveNumList(this.state.nums)
    let numsList = [numList]

    let checkResult = filterValidNums(numsList)
    console.log("checkResult " + checkResult)

    let resultArr = checkResult.split("|")
    let invalidString = resultArr[0], duplicatedString = resultArr[2]
    let invalidCount = resultArr[1], duplicatedCount = resultArr[3]
    let validCount = resultArr[4]

    console.log("result Array " + resultArr)

    if (invalidString != "") {
      if (invalidCount == 1)
        NotificationManager.warning("", "The number " + invalidString + " is invalid")
      else
        NotificationManager.warning("", "The following numbers are invalid : " + invalidString)
    }

    if (duplicatedString != "") {
      if (duplicatedCount == 1)
        NotificationManager.warning("", "The number " + duplicatedString + " is duplicated")
      else
      NotificationManager.warning("", "The following numbers are duplicated : " + duplicatedString)
    }
    if (validCount == 0) {
      NotificationManager.error("", "No data to disconnect")
      return
    }

    let body = {
      numList: numsList[0],
      startEffDtTm: effDtTm,
      endInterceptDt: interDate,
      referral: this.state.referral,
      notes: this.state.notes,
      title: this.state.name,
      email: this.state.mail,
      requestDesc: this.state.name
    }

    let res = await this.props.callApi2(RestApi.numberAutomation, {'body': JSON.stringify(body), 'type': gConst.REQ_TYPE_MND, respOrg: this.props.somos.selectRo, roId: this.props.somos.selectRo, 'timeout': timeout})
    if (res.ok && res.data) {
      NotificationManager.success("", res.data.msg)

      this.refreshList();
      this.setState({ nums: "", name: "", message: res.data.msg })

    } else if (res.data != undefined) {

    }
  };

  clear = () => {
    this.setState({
      message: '',
      name: '',
      ro: '',
      nums: '',
      referral:'N',
      eff_date:null,
      eff_now:false,
      inter_date:null,
      inter_now:false,
      notes:''
    })
  };


  // Activity Log Columns
  activityReportColumns = [
    {
      Header: "Name",
      accessor: 'title',
      sortable: false,
      width: gConst.ACTIVITY_NAME_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Created By",
      accessor: 'userName',
      sortable: false,
      width: gConst.ACTIVITY_USERNAME_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Date",
      accessor: 'subDtTm',
      sortable: false,
      width: gConst.ACTIVITY_DATE_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Effective Date/Time",
      accessor: 'startEffDtTm',
      sortable: false,
      width: gConst.ACTIVITY_DATE_COLUMN_WIDTH,
      Cell: props => {
        if (props.value ==='')
          return <div className="text-center" style={{marginTop: 10}}></div>
        else
          return <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
      }
    },
    {
      Header: "Intercept Date",
      accessor: 'endInterceptDt',
      sortable: false,
      width: gConst.ACTIVITY_DATE_COLUMN_WIDTH,
      Cell: props => {
        if (props.value ==='')
          return <div className="text-center" style={{marginTop: 10}}></div>
        else
          return <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCDateStrToCTDateStr(props.value)}</div>
      }
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

        <Button size="sm" onClick={() => this.view(props.original.id)} color="primary" className="ml-2">
          <i className="fa fa-eye"></i>
        </Button>

        <Button size="sm" color="success" className="ml-2" onClick={() => {
          this.downloadForm.action = Config.apiEndPoint + "/somos/automation/result/download/" + props.original.id;
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

  setEffDate = (date) => {this.setState({eff_date: date});};
  setInterDate = (date) => {this.setState({inter_date: date});};

  handleNowCheck = (event)=> {const state = {}; state[event.target.name] = event.target.checked; this.setState(state);};

  render() {
    return (
      <div className="animated fadeIn">
        <div className="page-header">
          <Row className="mt-4">
            <Col xs="12">
              <h1 className="pb-3 border-bottom">
                Multi Dial Number Disconnect
              </h1>
            </Col>
          </Row>
        </div>
        <Row className="mt-3">
          <Col xs="6">
            <Card>
              <CardHeader>
                Multi Dial Numbers
              </CardHeader>
              <CardBody>
                <Row>
                  <Col xs="4" className="text-right">
                    <Label>CSV or XL file :</Label>
                  </Col>
                  <Col xs="7">
                    <Input type="file" id="selectFile" name="selectFile" onChange={this.uploadFile} accept=".xls,.xlsx,.csv" />
                  </Col>
                </Row>
                <Row className="mt-3 mb-3">
                  <Col xs="12 text-center">( or )</Col>
                </Row>
                <Row>
                  <Col xs="4" className="text-right"><Label for="nums">Dial Numbers :</Label></Col>
                  <Col xs="8" style={{marginBottom:'-8px'}}>
                    <FormGroup>
                      <Input invalid={this.state.numErr} type="textarea" disabled={this.state.disableDialedNumber} value={this.state.nums}
                        name="nums" id="nums" rows="14" onChange={(ev) => this.handleChange(ev)} className="form-control" />
                      {this.state.numErr ? <FormText>Number field is required</FormText> : ""}
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
          <Col xs="6">
            <Card>
              <CardHeader>
                Request Information
              </CardHeader>
              <CardBody>
                <FormGroup row>
                  <Label for="name" sm={4}>Request Name :</Label>
                  <Col sm={8}>
                    <Input invalid={this.state.nameErr} type="text" id="name" name="name"
                           onChange={(ev) => this.handleChange(ev)} value={this.state.name}  />
                    {this.state.nameErr ? <FormText>Request Name field is required</FormText> : ""}
                  </Col>
                </FormGroup>

                <FormGroup row>
                  <Label sm={4} htmlFor="eff_date"> Start Effective Date/Time: </Label>
                  <Col xs={4}>
                    <DatePicker
                      invalid={this.state.effDateErr}
                      dateFormat="MM/dd/yyyy hh:mm a"
                      selected={this.state.eff_date}
                      showTimeSelect
                      timeIntervals={15}
                      minDate={new Date()}
                      onChange={this.setEffDate}
                      className="form-control"
                      timeCaption="time"/>
                    {this.state.effDateErr ? <FormText>Effective Date field is required</FormText> : ""}
                  </Col>
                  <div className="form-check align-content-center">
                    <Input type="checkbox" className="form-check-input" id="eff_now" name="eff_now" onChange={this.handleNowCheck} checked={this.state.eff_now}/>
                    <label className="form-check-label"> NOW</label>
                  </div>
                </FormGroup>

                <FormGroup row>
                  <Label sm={4} htmlFor="inter_date"> End Intercept Date: </Label>
                  <Col sm={4}>
                    <DatePicker
                      invalid={this.state.interDateErr}
                      dateFormat="MM/dd/yyyy"
                      selected={this.state.inter_date}
                      onChange={this.setInterDate}
                      minDate={new Date()}
                      className="form-control"/>
                    {this.state.interDateErr ? <FormText>Intercept Date field is required</FormText> : ""}
                  </Col>
                  <Col sm={2} style={{paddingLeft: '0px'}}>
                    <Label >Referral:</Label>
                  </Col>
                  <Col sm={2} style={{paddingLeft: '0px'}}>
                    <Input type="select" name="referral"
                           onChange={this.handleChange} value={this.state.referral}  >
                      <option value="Y">Yes</option>
                      <option value="N" selected>NO</option>
                    </Input>
                  </Col>
                </FormGroup>

              </CardBody>
            </Card>

            <Card>
              <CardBody className="row">
                <Col xs="2" className="text-right">
                  Message:
                </Col>
                <Col xs="10">
                  <Input type="textarea" name="message" rows="5" value={this.state.message} disabled/>
                </Col>
              </CardBody>
              <CardFooter>
                <Row>
                  <Col className="text-right">
                    <Button size="md" color="primary" onClick={this.submit} >Submit</Button>
                    <Button size="md" color="danger" onClick={this.clear} className="ml-3">Clear</Button>
                  </Col>
                </Row>
              </CardFooter>
            </Card>

          </Col>
        </Row>

        <Card>
          <CardHeader>
            Activity Log
          </CardHeader>
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
        </Card>

        <form ref={(node) => { this.downloadForm = node }} action="" target="_blank" method="post">
          <input type="hidden" ref={(input) => { this.textInput = input }} name="access_token" value="" />
        </form>

        <ViewMndListModal
          isOpen={this.state.modal.isOpen}
          toggle={this.toggleModal}
          id={this.state.modal.id}
          handler={this.handleUpdate}
          data={this.state.modal}
          token={this.props.data.token}
        />

        <NotificationContainer/>
      </div>
    );
  }
}

export default connect((state) => ({ somos: state.auth.profile.somos, token: state.auth.token, data: state.auth }))(withLoadingAndNotification(MND));
