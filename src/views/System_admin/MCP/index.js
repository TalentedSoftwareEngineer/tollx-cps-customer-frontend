import React, {Component} from 'react';
import {  Button, Card, CardBody, CardHeader, Col, FormGroup, Input, Label, Row, CardFooter, Badge, FormText } from 'reactstrap';
import {connect} from 'react-redux'
import ReactTable from 'react-table';
import 'react-table/react-table.css'
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import 'react-overlay-loader/styles.css';
import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import RestApi from "../../../service/RestApi";
import produce from "immer";
import _ from "lodash";
import {filterValidNums, timeout} from "../../../service/numberSearch";
import ViewMcpListModal from './viewMcpListModal';
import ProgressBar from "../../../components/Common/ProgressBar"

import * as gFunc from "../../../utils";
import * as gConst from "../../../constants/GlobalConstants";

// notification
import {NotificationContainer, NotificationManager} from'react-notifications';
import 'react-notifications/lib/notifications.css';
import Cookies from "universal-cookie";
import Config from '../../../Config';


class MCP extends Component {
  constructor(props) {
    super(props);
    this.state = {
      nums: "",            // name error flag
      numErr: false,
      name: "",
      nameErr: false,
      date: '',
      dateErr: false,
      dateNow: false,               // effective date time as now
      template: '',
      tmplErrType: gConst.TMPL_ERR_TYPE.NONE,
      mail: '',
      message: '',
      activityLog: [],              // MCP activity log data
      interval: "",                 // Timer
      numberList: [],

      // detail modal
      modal: {
        isOpen: false,              // initial non show
        numberList: [],             // detail number list data of One MCP
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

          if (data[i].reqType !== gConst.REQ_TYPE_MCP)  continue

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
                NotificationManager.success("", gConst.MCP_REQ_FINISHED)
              }

              break
            }
          }

          if (bNewLog) {
            let log = {
              id: data[i].id,
              title: data[i].title,
              requestDesc: data[i].title,
              userName: data[i].userName,
              subDtTm: data[i].subDtTm,
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
            console.log("status: " + value);
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
            m.noRecords = result.length === 0
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
    this.props.callApi2(RestApi.activityLog, {type: gConst.REQ_TYPE_MCP}).then(res => {
      if (res.ok && res.data) {
        gFunc.sortActivityLogWithDateZA(res.data)
        this.setState({ activityLog: res.data, logLength: res.data.length })
      }
    })
  }

  handleChange = (event) => {
    const state = {};
    state[event.target.name] = event.target.value;

    if (event.target.name === 'template') {
      state.tmplErrType = gConst.TMPL_ERR_TYPE.NONE
    }

    this.setState(state);
  };

  handleNowCheck = (event)=> {const state = {}; state[event.target.name] = event.target.checked; this.setState(state);};

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

        let numArr = res.data.length > 0 ? arrData.join("\n") : ""; // modified data.join as arrData.join by Ming Jin 2020/01/31
        this.setState({
          file: "",
          message: message,
          isFile: false,
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

    this.setState({ nameErr: false, numErr: false, tmplErrType: gConst.TMPL_ERR_TYPE.NONE, dateErr: false});

    // get effective date and time from date picker control
    let effDtTm = "", effTime = "";

    console.log(">>> this.state.date: ", this.state.date)

    if (this.state.dateNow) {
      effDtTm = "NOW";    // set "NOW" if now checkbox is checked

    } else if (this.state.date != null && this.state.date !== '') {
      effDtTm = gFunc.fromCTTimeToUTCStr(new Date(this.state.date))
    }


    // check the number field
    let bAllInvalid = true
    if (this.state.nums === "") {
      this.setState({ numErr: true })
      window.scrollTo(0, 0)

      bAllInvalid = false
    }

    // check if template filed is empty
    if (this.state.template === "") {
      this.setState({ tmplErrType: gConst.TMPL_ERR_TYPE.BLANK });
      window.scrollTo(0, 0);

      bAllInvalid = false

    } else if (!gConst.TMPLNAME_REG_EXP.test(this.state.template)) { //  check if template filed is proper for template
      this.setState({tmplErrType: gConst.TMPL_ERR_TYPE.ERROR })
      window.scrollTo(0, 0);

      bAllInvalid = false
    }

    // check if effective date time is empty
    if (effDtTm === "") {
      this.setState({ dateErr: true });
      window.scrollTo(0, 0);

      bAllInvalid = false
    }

    // check if name field is empty
    if (this.state.name === "") {
      this.setState({ nameErr: true });
      window.scrollTo(0, 0);

      bAllInvalid = false
    }

    if (!bAllInvalid) { return false }

    let numList = gFunc.retrieveNumList(this.state.nums)
    let numsList = [numList]
    let checkResult = filterValidNums(numsList)
    console.log("checkResult " + checkResult)

    let resultArr = checkResult.split("|")
    let invalidString = resultArr[0], duplicatedString = resultArr[2]
    let invalidCount = resultArr[1], duplicatedCount = resultArr[3]
    let validCount = resultArr[4]

    console.log("result Array " + resultArr)

    if (invalidString !== "") {
      if (invalidCount === 1)
        NotificationManager.warning("", "The number " + invalidString + " is invalid")
      else
        NotificationManager.warning("", "The following numbers are invalid : " + invalidString)
    }

    if (duplicatedString !== "") {
      if (duplicatedCount === 1)
        NotificationManager.warning("", "The number " + duplicatedString + " is duplicated")
      else
        NotificationManager.warning("", "The following numbers are duplicated : " + duplicatedString)
    }

    if (validCount === 0) {
      NotificationManager.error("", "No data to convert")
      return
    }

    let body = { numList: numsList[0], tmplName: this.state.template, tgtEffDtTm: effDtTm, requestDesc: this.state.name, email: this.state.mail, title: this.state.name }
    let res = await this.props.callApi2(RestApi.numberAutomation, {'body': JSON.stringify(body), 'type': gConst.REQ_TYPE_MCP, respOrg: this.props.somos.selectRo, roId: this.props.somos.selectRo, 'timeout': timeout})
    if (res.ok && res.data) {
      NotificationManager.success("", res.data.msg)

      this.refreshList();
      this.setState({ nums: "", name: "", message: res.data.msg })

    } else if (res.data !== undefined) {

    }
  };

  setDate = (date) => {this.setState({date: date})}

  clear =() => {
    this.setState({
      message: '',
      nums: '',
      mail: '',
    })
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
      Header: "Submit Date",
      accessor: 'subDtTm',
      sortable: false,
      width: gConst.ACTIVITY_NAME_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Eff. Date Time",
      accessor: 'startEffDtTm',
      sortable: false,
      width: gConst.ACTIVITY_DATE_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
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
          <Badge color={props.value === 0 ? "dark" : props.value === props.original.total ? "success" : "info"} pill>
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

        <Button size="sm" color="danger" className="ml-2" onClick={() => this.delete(props.original.id, props.index)}>
          <i className="fa fa-close"></i>
        </Button>
      </div>
    }
  ]

  render() {
    return (
      <div className="animated fadeIn">
        <Label className="ml-1"><strong style={{fontSize: 30}}>Multiple Conversion to Pointer Records</strong></Label>
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
                <Row className="mt-3 mb-2">
                  <Col xs="12 text-center">( or )</Col>
                </Row>
                <Row>
                  <Col xs="4" className="text-right"><Label for="nums">Dial Numbers :</Label></Col>
                  <Col xs="8">
                    <FormGroup>
                      <Input invalid={this.state.numErr} type="textarea" value={this.state.nums}
                             name="nums" id="nums" rows="12" onChange={(ev) => this.handleChange(ev)} className="form-control" />
                      {this.state.numErr ? <FormText>Number field is required</FormText> : ""}
                    </FormGroup>
                  </Col>
                </Row>
              </CardBody>
            </Card>
          </Col>
          <Col xs="6">
            <Card>
              <CardHeader>Report Information</CardHeader>
              <CardBody>
                <FormGroup row>
                  <Label for="name" sm={4}>Template Name:</Label>
                  <Col sm={8}>
                    <Input invalid={ this.state.tmplErrType !== gConst.TMPL_ERR_TYPE.NONE } type="text" id="template" name="template"
                           onChange={(ev) => this.handleChange(ev)} value={this.state.template} className="col-11" />
                    {this.state.tmplErrType === gConst.TMPL_ERR_TYPE.BLANK ? <FormText>Template field is required</FormText> : ""}
                    {this.state.tmplErrType === gConst.TMPL_ERR_TYPE.ERROR ? <FormText>Template Name: Must start with '*', then a valid 2 character Entity ID, followed by 1-12 alphanumerics. Must be 4-15 characters wide. Dashes are optional in the 4th-15th character positions.</FormText> : ""}
                  </Col>
                </FormGroup>

                <FormGroup row>
                  <Label sm={4} htmlFor="eff_date"> Start Effective Date/Time: </Label>
                  <Col xs={4}>
                    <DatePicker
                      invalid={this.state.dateErr}
                      dateFormat="MM/dd/yyyy hh:mm a"
                      selected={this.state.date}
                      showTimeSelect
                      timeIntervals={15}
                      minDate={new Date()}
                      onChange={this.setDate}
                      className="form-control"
                      timeCaption="time"/>
                    {this.state.dateErr ? <FormText>Effective Date Time field is required</FormText> : ""}
                  </Col>
                  <div className="form-check align-content-center">
                    <Input type="checkbox" className="form-check-input" id="dateNow" name="dateNow" onChange={this.handleNowCheck} checked={this.state.dateNow}/>
                    <label className="form-check-label"> NOW</label>
                  </div>
                </FormGroup>
                <FormGroup row>
                  <Label for="name" sm={4}>Request Name :</Label>
                  <Col sm={8}>
                    <Input invalid={this.state.nameErr} type="text" id="name" name="name"
                           onChange={(ev) => this.handleChange(ev)} value={this.state.name} className="col-11" />
                    {this.state.nameErr ? <FormText>Request Name field is required</FormText> : ""}
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
                  <Input type="textarea" name="message" rows="3" value={this.state.message} disabled/>
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

        <ViewMcpListModal
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

export default connect((state) => ({somos: state.auth.profile.somos, token: state.auth.token, data: state.auth}))(withLoadingAndNotification(MCP));
