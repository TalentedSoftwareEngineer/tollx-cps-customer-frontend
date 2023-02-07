import React, {Component} from 'react';
import ReactTable from 'react-table';
import produce from "immer";
import _ from "lodash";
import { Button, Card, CardBody, CardHeader, Col, FormGroup, Input, Label, Row, CardFooter, Badge, FormText } from 'reactstrap';

import 'react-overlay-loader/styles.css';
import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import {filterValidNums, timeout} from "../../../service/numberSearch";
import {connect} from 'react-redux'
import RestApi from "../../../service/RestApi";

import ViewMroListModal from './viewMroListModal';
import * as gConst from "../../../constants/GlobalConstants";
import * as gFunc from "../../../utils";
import ProgressBar from "../../../components/Common/ProgressBar"

// notification
import {NotificationContainer, NotificationManager} from'react-notifications';
import 'react-notifications/lib/notifications.css';
import Config from '../../../Config';

class MRO extends Component {
  constructor(props) {
    super(props);

    this.state = {
      nums: "",
      ro: '',
      roErr: false,
      mail: '',
      message: '',
      loading: false,
      date: '',
      disableDialedNumber: false,
      name: "",
      nameErr: false,               // name error flag
      numErr: false,                // number error flag
      activityLog: [],              // MRO activity log data
      interval: "",                 // Timer
      numberList: [],
      numberListId: "",
      notes: "",                    // notes

      // detail modal
      modal: {
        isOpen: false,              // initial non show
        numberList: [],             // detail number list data of One MSP
        id: null,
        result: [],
      },
    };
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

          if (data[i].reqType !== gConst.REQ_TYPE_MRO)  continue

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
                NotificationManager.success("", gConst.MRO_REQ_FINISHED)
              }

              break
            }
          }

          if (bNewLog) {
            let log = {
              id: data[i].id,
              title: data[i].title,
              requestDesc: data[i].title,
              newRespOrgId: data[i].newRo,
              userName: data[i].userName,
              subDtTm: data[i].subDtTm,
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

  view = (id) => {
    this.props.callApi2(RestApi.viewMnp, { "id": id }).then(res => {
      if (res.ok && res.data) {
        let result = res.data
        let status = result.map(st => st.status)
          .filter((value, index, self) => {
            // if (value == "") return;
            return self.indexOf(value) === index
          })

        let sortedData = _.sortBy(result, 'num');

        this.setState({
          modal: produce(this.state.modal, m => {
            m.isOpen = true;
            m.id = id;
            m.numberList = sortedData;
            m.status = status;
            m.totalCount = result.length;
            m.noRecords = result.length == 0 ? true : false;
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

  /**
   * refresh the activity log data in period
   */
  refreshList = () => {
    this.props.callApi2(RestApi.activityLog, {type: gConst.REQ_TYPE_MRO}).then(res => {
      if (res.ok && res.data) {
        gFunc.sortActivityLogWithDateZA(res.data)
        this.setState({ activityLog: res.data, logLength: res.data.length })
      }
    })
  }

  handleRespOrg = (ev) => {
    const input = ev.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    let value = input.value.toUpperCase()
    let state = {}
    state[input.name] = value

    this.setState(state, ()=>input.setSelectionRange(start, end));

    let reg = gConst.RESPORG_REG_EXP
    if (!reg.test(value) && value.length >= 5) {
      this.setState({ roErr: true })
    } else {
      this.setState({ roErr: false })
    }
  }

  handleChange = (ev) => {
    const state = {};
    state[ev.target.name] = ev.target.value;

    if (ev.target.name === "name" && ev.target.value === "")
      state["nameErr"] = true
    else
      state["nameErr"] = false

    if (ev.target.name === "ro" && ev.target.value === "")
      state["roErr"] = true
    else
      state["roErr"] = false

    state["message"] = ""
    this.setState(state);
  };

  /**
   * this function is called at clicking file open button
   * @param ev
   * @returns {Promise<void>}
   */
  handleFile = async (ev) => {
    let data = new FormData();
    data.append("file", ev.target.files[0]);

    this.props.callApi2(RestApi.uploadFileMnp, data).then(res => {
      if (res.ok && res.data) {
        if (res.data === "") {
          NotificationManager.error("", "The issue has triggered in the file parsing")
          return
        }

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

        if (causeMsg !== "")
          message += "\nWarning: " + causeMsg

        let numArr = res.data.length > 0 ? arrData.join("\n") : ""; // modified data.join as arrData.join by Ming Jin 2020/01/31
        this.setState({
          file: "",
          message: message,
          nums: numArr,
          datas: [],
          display: false,
          copyNums: ""
        })

        document.getElementById("selectFile").value = "";

      }
    })
  }

  submit = async () => {
    this.setState({ nameErr: false, numErr: false, roErr: false });

    if (this.state.nums === "") { this.setState({ numErr: true }); window.scrollTo(0, 0); return false; }
    if (this.state.ro === "") { this.setState({ roErr: true }); window.scrollTo(0, 0); return false; }
    if (this.state.name === "") { this.setState({ nameErr: true }); window.scrollTo(0, 0); return false; }

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
      NotificationManager.error("", "No data to convert")
      return
    }

    let body = {
      numList: numsList[0],
      ctrlRespOrgId: this.state.ro,
      requestDesc: this.state.name,
      email: this.state.mail,
      title: this.state.name
    }

    let res = await this.props.callApi2(RestApi.numberAutomation, {'body': JSON.stringify(body), 'type': gConst.REQ_TYPE_MRO, respOrg: this.props.somos.selectRo, roId: this.props.somos.selectRo, 'timeout': timeout})
    if (res.ok && res.data) {
      NotificationManager.success("", res.data.msg)

      this.refreshList();
      this.setState({ nums: "", name: "", message: res.data.msg })

    } else if (res.data != undefined) {

    }

  };

  clear =() => {
    this.setState({
      ro: '',
      nums: '',
      name: '',
    })
  };

  /**
   * get the required text for the resp org field
   * @returns {*}
   */
  getRespOrgRequiredText = () => {
    if (this.state.ro === '')
      return <FormText>New Resp Org field is required</FormText>

    return <FormText>Resp Org should be the format that is configured 3 uppercase letters and 2 numbers like AKG01</FormText>
  }


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
      Header: "New Resp Org",
      accessor: 'newRespOrgId',
      sortable: false,
      width: 120,
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
          this.downloadForm.action = Config.apiEndPoint + "/somos/automation/result/download/" + props.original.id
          this.textInput.value = this.props.data.token
          this.downloadForm.submit()
          this.textInput.value = ""
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

  render() {
    return (
      <div className="animated fadeIn">
        <Label className="ml-1"><strong style={{fontSize: 30}}>Multi Dial Number Resp Org Change</strong></Label>
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
                    <Input type="file" id="selectFile" name="selectFile" onChange={this.handleFile} accept=".xls,.xlsx,.csv" />
                  </Col>
                </Row>
                <Row className="mt-3 mb-3">
                  <Col xs="12 text-center">( or )</Col>
                </Row>
                <Row>
                  <Col xs="4" className="text-right"><Label for="nums">Dial Numbers :</Label></Col>
                  <Col xs="8" style={{marginBottom:'4px'}}>
                    <FormGroup>
                      <Input invalid={this.state.numErr} type="textarea" value={this.state.nums}
                             name="nums" id="nums" rows="10" onChange={(ev) => this.handleChange(ev)} className="form-control" />
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
                  <Label for="name" sm={4}>New Resp Org :</Label>
                  <Col sm={8}>
                    <Input invalid={this.state.roErr} type="text" id="ro" name="ro"
                           onChange={(ev) => this.handleRespOrg(ev)} value={this.state.ro} />
                    {this.state.roErr ? this.getRespOrgRequiredText() : ""}
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
                  <Input type="textarea" name="message" rows="4" value={this.state.message} disabled/>
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

        <ViewMroListModal
          isOpen={this.state.modal.isOpen}
          toggle={this.toggleModal}
          handler={this.handleUpdate}
          data={this.state.modal}
          token={this.props.data.token}
        />

        <NotificationContainer/>
      </div>
    );
  }
}

export default connect((state) => ({somos: state.auth.profile.somos, token: state.auth.token, data: state.auth}))(withLoadingAndNotification(MRO));
