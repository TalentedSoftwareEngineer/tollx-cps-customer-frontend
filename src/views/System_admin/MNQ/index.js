import React, { Component } from 'react';
import { Button, Card, CardBody, CardHeader, Col, FormGroup, FormText, Input, Label, Row, CardFooter, Badge } from 'reactstrap';
import {filterValidNums, timeout,} from "../../../service/numberSearch";
import { connect } from 'react-redux'
import ReactTable from 'react-table';
import 'react-table/react-table.css'
import 'react-overlay-loader/styles.css';
import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import RestApi from "../../../service/RestApi";
import _ from 'lodash';
import produce from 'immer';
import ViewMnqListModal from './viewMnqListModal';
import XLSX from "xlsx";

import * as gFunc from "../../../utils";
import * as gConst from "../../../constants/GlobalConstants";
import ProgressBar from "../../../components/Common/ProgressBar"

// notification
import {NotificationContainer, NotificationManager} from'react-notifications';
import 'react-notifications/lib/notifications.css';
import Config from '../../../Config';
import Loader from "../../../components/Loader";

class MNQ extends Component {

  constructor(props) {
    super(props);

    this.state = {
      nums: "",
      numErr: false,
      jobTitle: "",
      jobTitleErr: false,
      name: "",
      nameErr: false,
      mail: '',
      message: '',
      roList: [],
      logLength: 0,
      activityLog: [],
      interval: "",

      modal: {
        isOpen: false,
        numberList: [], page: 0, sort: [], filter: [],
        pageSize: 0, total_page: 0,
        respOrg: [], status: [],
      },

      // unused states
      checked: false,
      datas: [],
      display: false,
      copyNums: '',
      bCadModal: false,
      date: '',
      so: '',
      ncon: '',
      ctel: '',
      iec: '',
      iac: '',
      network: '',
      line: '',
      count: 0,
      file: "",
      progress: 10,
      isProgressBar: false,

      isProcessing: false,

    }
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

          if (data[i].reqType !== gConst.REQ_TYPE_MNQ)  continue

          if (data[i].status === gConst.AUTO_RESULT_INPROGRESS && data[i].total !== (data[i].completed + data[i].failed))
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
                NotificationManager.success("", gConst.MNQ_REQ_FINISHED)
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
    })
    this.setState({ modal });
  }

  view = (id) => {
    this.props.callApi2(RestApi.viewMnp, { "id": id }).then(res => {
      if (res.ok && res.data) {
        let result = res.data
        let status = result.map(st => st.status)
          .filter((value, index, self) => {
            // if (value == "") return;
            return self.indexOf(value) === index
          })

        let respOrg = result.map(rs => rs.ctrlRespOrgId)
          .filter((value, index, self) => {
            // if (value == "") return;
            return self.indexOf(value) === index && value !== ''
          })

        let sortedData = _.sortBy(result, 'num');

        this.setState({
          modal: produce(this.state.modal, m => {
            m.isOpen = true;
            m.id = id;
            m.numberList = sortedData;
            m.respOrg = respOrg;
            m.status = status;
            m.totalCount = result.length;
            m.noRecords = result.length === 0
          }),
        })
      }
    })
  }

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
    this.props.callApi2(RestApi.activityLog, {type: gConst.REQ_TYPE_MNQ}).then(res => {
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

    state["message"] = ""
    this.setState(state);
  }

  /**
   * this function is called at clicking file open button
   * @param ev
   * @returns {Promise<void>}
   */
  handleFile = async (ev) => {
    console.log('>>> start parsing...', new Date().getTime())
    this.setState({isProcessing: true});


    // use frontend
    const file = ev.target.files[0];
    var reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: "array" })
      const firstSheet = workbook.SheetNames[0]
      const numbers = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheet])

      let message = ""
      let realNumbers = ""

      // const tempNums = numbers.replaceAll(",\n", ",").replaceAll("\n", ",")
      // console.log("temp numbers: ", tempNums)
      //
      // const parsed = gFunc.parseNumList(tempNums)
      // if (parsed.duplicatedCount || parsed.invalidCount) {
      //
      //   let causeMsg = "The total count has been decreased by the following cause."
      //
      //   if (parsed.invalidCount) {
      //     causeMsg += "\nInvalid Numbers: " + parsed.invalidCount
      //   }
      //   if (parsed.duplicatedCount) {
      //     causeMsg += "\nDuplicated Numbers: " + parsed.duplicatedCount
      //   }
      //
      //   NotificationManager.warning("", causeMsg)
      // }
      //
      // message = "File is uploaded with " + parsed.validCount + " Numbers. Please Submit."
      // if (parsed.validCount == 0)
      //   message = "There are no upload numbers due to the following cause."
      //
      // realNumbers = parsed.realNumbers

      const numList = gFunc.retrieveNumListWithHyphen(numbers)
      realNumbers = numList.join("\n")

      this.setState({
        file: "",
        message: message,
        nums: realNumbers,
        datas: [],
        display: false,
        copyNums: "",
        isProcessing: false
      })

      console.log('>>> end parsing...', new Date().getTime())
      document.getElementById("selectFile").value = "";
    };

    reader.readAsArrayBuffer(file);
  }

  submit = () => {
    this.setState({ isProcessing: true })

    setTimeout(() => {
      this.checkAndSubmit()
    }, 1000)
  };

  checkAndSubmit = async () => {
    this.setState({ display: false, count: 0, nameErr: false, jobTitleErr: false, numErr: false })
    this.state.datas = [];

    if (this.state.nums === "") { this.setState({ numErr: true }); window.scrollTo(0, 0); return false; }
    if (this.state.name === "") { this.setState({ nameErr: true }); window.scrollTo(0, 0); return false; }

    let body = {}

    console.log('>>> retrieveNumList: ', new Date().getTime())

    let numList = gFunc.retrieveNumList(this.state.nums)

    console.log('>>> finish retrieveNumList', new Date().getTime())

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
        await NotificationManager.warning("", "The number " + invalidString + " is invalid")
      else
        await NotificationManager.warning("", "The following numbers are invalid : " + invalidString)
    }

    if (duplicatedString != "") {
      if (duplicatedCount == 1)
        NotificationManager.warning("", "The number " + duplicatedString + " is duplicated")
      else
        NotificationManager.warning("", "The following numbers are duplicated : " + duplicatedString)
    }

    console.log('>>> finished checking number', new Date().getTime())

    if (validCount == 0) {
      NotificationManager.error("", "No data to query")
      this.setState({ isProcessing: false })
      return
    }

    body.numList = numsList[0]
    body.requestDesc = this.state.name
    body.email = this.state.mail
    body.title = this.state.name

    let res = await this.props.callApi2(RestApi.numberAutomation, {'body': JSON.stringify(body), 'type': gConst.REQ_TYPE_MNQ, respOrg: this.props.somos.selectRo, roId: this.props.somos.selectRo, 'timeout': timeout})
    if (res.ok && res.data) {
      NotificationManager.success("", res.data.msg)

      // this.refreshList();
      this.setState({ nums: "", name: "", message: res.data.msg })

    } else if (res.data != undefined) {

    }

    this.setState({ isProcessing: false })

    this.state.roList = this.state.datas.map(item => item.CRO).filter(
      (value, index, self) => self.indexOf(value) === index)
  }

  clear = () => {
    this.setState({
      message: '', nums: '',
      mail: '', display: false,
      copyNums: ''
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

  render() {
    return (
      <div className="animated fadeIn">
        <div className="page-header">
          <Row className="mt-4">
            <Col xs="12">
              <h1 className="pb-3 border-bottom">
                Multi Dial Number Query
              </h1>
            </Col>
          </Row>
        </div>

        {this.state.isProcessing ? <Loader fullPage loading/> : ""}
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
                  <Col xs="8" style={{marginBottom:'-5px'}}>
                    <FormGroup>
                      <Input invalid={this.state.numErr} type="textarea" value={this.state.nums}
                        name="nums" id="nums" rows="8" onChange={(ev) => this.handleChange(ev)} className="form-control" />
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

        <ViewMnqListModal
          isOpen={this.state.modal.isOpen}
          toggle={this.toggleModal}
          handler={this.handleUpdate}
          data={this.state.modal}
          token={this.props.data.token}
        />

        <NotificationContainer/>
      </div>
    )
  }
}

export default connect((state) => ({ somos: state.auth.profile.somos, token: state.auth.token, data: state.auth }))(withLoadingAndNotification(MNQ));
