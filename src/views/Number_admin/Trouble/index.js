import React, {Component} from 'react';
import {  Button,  Card,  CardBody,  CardHeader,  Col,  FormGroup,  Input,  Label,  Row,  Fade,  Collapse,  FormText,  Modal, ModalHeader, ModalBody, ModalFooter, Badge } from 'reactstrap';
import {connect} from 'react-redux'

// notification
import {NotificationContainer, NotificationManager} from'react-notifications';
import 'react-notifications/lib/notifications.css';

import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import RestApi from "../../../service/RestApi";

import ReactTable from 'react-table';
import 'react-table/react-table.css'
import * as gFunc from "../../../utils";
import * as gConst from "../../../constants/GlobalConstants";
import ProgressBar from "../../../components/Common/ProgressBar"
import {timeout} from "../../../service/oneClick";
import _ from "lodash";
import Config from '../../../Config';

class Trouble extends Component {
  constructor(props) {
    super(props);

    this.toggleRetrieve = this.toggleRetrieve.bind(this);


    this.state = {
      collapseRetrieve: true,
      fadeIn: true,
      fadeInResult: true,
      timeout: 300,
      timeoutResult: 300,

      num: "",
      validNum: true,

      display: false,
      activityLog: [],              // TRQ activity log data

      detailModalVisible: false,    // initial non show
      numberList: [],               // detail number list data of TRQ
    };
  }

  toggleRetrieve() {
    this.setState({collapseRetrieve: !this.state.collapseRetrieve});
  }

  async componentDidMount() {
    await this.refreshList()
    this.backPressureEvent()
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

          if (data[i].reqType !== gConst.REQ_TYPE_TRQ)  continue

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
                NotificationManager.success("", gConst.TRQ_REQ_FINISHED)
              }

              break
            }
          }

          if (bNewLog) {
            let log = {
              id: data[i].id,
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

  /**
   * refresh the activity log data in period
   */
  refreshList = () => {
    this.props.callApi2(RestApi.trqActivityLog).then(res => {
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

  /**
   * this is called at clicking the Retrieve button
   * @returns {Promise<void>}
   */
  retrieveNumber = async () => {
    console.log("retrieveNumber")
    let numList = gFunc.retrieveNumListWithHyphen(this.state.num)
    let bValidNum = true

    for (let num of numList) {
      if (!gConst.TFNUM_REG_EXP.test(num)) {
        bValidNum = false
        break
      }
    }

    if (!bValidNum) {
      this.setState({validNum: false})
      return
    } else {
      this.setState({validNum: true})
    }

    await this.setState({num: numList.join(",")})

    let strNumList = numList.join(",").replace(/\-/g, "")

    console.log("number list param: " + strNumList)

    this.props.callApi2(RestApi.queryTRQ, {'numList': strNumList, roId: this.props.somos.selectRo, 'timeout': timeout}).then(res => {
      if (res.ok && res.data) {
        return
      }

      if (res.data && res.data.errList) {
        let errMsg = ''
        for (let err of res.data.errList) {
          errMsg += (errMsg == '') ? '' : '\r\n'
          errMsg += (err.errMsg + "(" + err.errCode + ")")
        }

        NotificationManager.error("", errMsg)
      }

    })
  };

  /**
   * this is called at changing the number list
   * @param event
   */
  handleChange = (event) => {

    const state = {};
    state[event.target.name] = event.target.value;
    this.setState(state);
  };


  /**
   *
   */
  toggleDetailModal = () => {
    this.setState({detailModalVisible: !this.state.detailModalVisible})
  }


  /**
   * delete the activity log
   * @param id
   * @param index
   */
  delete = (id, index) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    this.props.callApi2(RestApi.deleteTrqResult, { "id": id }).then(res => {
      if (res.ok && res.data) {
        let activityLog = [...this.state.activityLog];
        activityLog.splice(index, 1)
        this.setState({ activityLog })
      }
    })
  }

  /**
   * this is called at clicking the view button on the activity list
   */
  logView = async (id) => {
    this.props.callApi2(RestApi.viewTrqResult, { "id": id }).then(res => {
      if (res.ok && res.data) {
        let result = res.data

        let sortedData = _.sortBy(result, 'num');

        this.setState({ numberList: sortedData, detailModalVisible: true });
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
          this.downloadForm.action = Config.apiEndPoint + "/somos/trq/result/download/" + props.original.id;
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
      sortable: false,
      width: gConst.NUMBER_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.formattedNumber(props.value)}</div>
    },
    {
      Header: "Resp Org",
      accessor: 'respOrgId',
      width: gConst.ROID_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Trouble Ref #",
      accessor: 'refNum',
      width: gConst.NUMBER_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.formattedNumber(props.value)}</div>
    },
    {
      Header: "Resp Org Name",
      accessor: 'respOrgName',
      width: 250,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Message",
      accessor: 'errMsg',
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
  ]


  render() {

    return (
      <div className="animated fadeIn">
        <Label className="ml-1"><strong style={{fontSize: 30}}>Trouble Referral Number Query</strong></Label>
        <Row className="mt-3">
          <Col xs="12">
            <Fade timeout={this.state.timeout} in={this.state.fadeIn}>
              <Card>
                <CardHeader>
                  <strong style={{fontSize: 20}}>Retrieve</strong>
                  <div className="card-header-actions">
                    <a className="card-header-action btn btn-minimize" data-target="#collapseRetrieve"
                       onClick={this.toggleRetrieve.bind(this)}><i
                      className={this.state.collapseRetrieve ? "icon-arrow-up" : "icon-arrow-down"}/></a>
                  </div>
                </CardHeader>

                <Collapse isOpen={this.state.collapseRetrieve} id="collapseRetrieve">
                  <CardBody>
                    <Label>Toll-Free Number *</Label>
                    <Input type="textarea" name="num" id="num" rows="5" onChange={(ev) => this.handleChange(ev)} value={this.state.num}/>
                    {!this.state.validNum ?
                      <FormText><p style={{color: 'red'}}>Toll-Free Number#: Allows 10 alphanumerics and optionally two
                        dashes '-'</p>
                      </FormText> : ""}
                    <Col className="text-right">
                      <Button size="md" color="primary" className="mt-3" onClick={this.retrieveNumber}>Retrieve</Button>
                    </Col>
                  </CardBody>
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

        <NotificationContainer/>

      </div>
    );
  }

  renderDetailModal = () => (
    <Modal isOpen={this.state.detailModalVisible} toggle={this.toggleDetailModal} className={'modal-xl ' + this.props.className}>
      <ModalHeader toggle={this.toggleDetailModal}>Trouble Referral Number Query Result</ModalHeader>
      <ModalBody>
        <FormGroup className="ml-4 mr-4">
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
}

export default connect((state) => ({somos: state.auth.profile.somos, token: state.auth.token, data: state.auth }))(withLoadingAndNotification(Trouble));
