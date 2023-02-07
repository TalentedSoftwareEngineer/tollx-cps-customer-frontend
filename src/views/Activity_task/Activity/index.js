import React, {Component} from 'react';
import {  Button,  Card,  CardBody,  CardHeader,  Col,  FormGroup,  Input,  Label,  Row,  Badge,  Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import {connect} from 'react-redux'
import ReactTable from 'react-table';
import 'react-table/react-table.css'
import "react-datepicker/dist/react-datepicker.css";
import "react-toastify/dist/ReactToastify.css";
import 'react-overlay-loader/styles.css';
import {timeout} from "../../../service/numberSearch";
import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import RestApi from "../../../service/RestApi";
import _ from "lodash";
import {NotificationContainer, NotificationManager} from'react-notifications';
import * as gFunc from "../../../utils";
import Cookies from "universal-cookie";
import * as gConst from "../../../constants/GlobalConstants";

class UserActivity extends Component {
  constructor(props) {
    super(props);
    this.state = {
      activities: [],              // user activity list
      showActivities: [],          // show activity list

      subDtTm:    '',
      userName:   'All',
      page:       'All',
      operation:  'All',
      status:     'All',

      userList:   [],
      pageList:   [],
      opList:     [],
      statusList: [],

      // detail modal
      tadModalVisible: false,
      padModalVisible: false,
      cadModalVisible: false,
      otherModalVisible: false,
      taskList: [],

      numInfoModalVisible: false,       // number info modal
      tmplInfoModalVisible: false,       // template info modal

      taskType: "",                  // task type of detail

      selNum: '',                   // selected number for numView
      selTmplName: '',              // selected template name for tmplView
      selRespOrg: '',               // resp org of the selected number for numView
      selStatus: '',                // status of the selected number for numView
      selEffDate: '',               // effective date of the selected number for numView
      selReservedUntil: '',         // reserved until date of the selected number for numView
      selLastActive: '',            // last active of the selected number for numView
    };
  }

  componentDidMount() {
    this.refreshList()
  }

  toggleTadDetailModal = () => {
    this.setState({tadModalVisible: !this.state.tadModalVisible})
  }

  togglePadDetailModal = () => {
    this.setState({padModalVisible: !this.state.padModalVisible})
  }

  toggleCadDetailModal = () => {
    this.setState({cadModalVisible: !this.state.cadModalVisible})
  }

  toggleOtherDetailModal = () => {
    this.setState({otherModalVisible: !this.state.otherModalVisible})
  }

  view = (id, index) => {
    console.log("index: " + index)
    this.props.callApi2(RestApi.viewActivity, { "id": id }).then(res => {
      if (res.ok && res.data) {
        let result = res.data

        let sortedData;
        if (this.state.activities[index].page === "Template Record")
          sortedData = _.sortBy(result, 'tmplName')
        else
          sortedData = _.sortBy(result, 'num');

        let taskType = '', taskAction = ''
        if (sortedData.length) {
          taskType = sortedData[0].type
          taskAction = sortedData[0].action
        }

        this.setState({
          taskList: sortedData,
          taskType: taskType,
          taskAction: taskAction
        })

        let tadModalVisible = false, padModalVisible = false, cadModalVisible = false, otherModalVisible = false
        switch (taskType) {
          case 'TAD':
            tadModalVisible = true;
            break

          case 'PAD':
            padModalVisible = true;
            break

          case 'CAD':
            cadModalVisible = true;
            break

          default:
            otherModalVisible = true
            break
        }

        this.setState({
          tadModalVisible: tadModalVisible,
          padModalVisible: padModalVisible,
          cadModalVisible: cadModalVisible,
          otherModalVisible: otherModalVisible
        })

      }
    })
  };

  viewCurInfo = async (index) => {
    switch (this.state.taskType) {
      case "TAD":
        let paramEffDtTm = this.state.taskList[index].tgtEffDtTm.replace(/\-|\:/g, "")
        let params = { tmplName: this.state.taskList[index].tgtTmplName, effDtTm: paramEffDtTm, roId: this.props.somos.selectRo, isUserAct: false }
        let resTmpl = await this.props.callApi2(RestApi.queryTmplRec, params)  // get template info
        if (resTmpl.ok && resTmpl.data && resTmpl.data.errList == null) {
          let data = resTmpl.data

          this.setState({
            selTmplName: this.state.taskList[index].tgtTmplName,
            selEffDtTm: gFunc.fromUTCStrToCTStr(this.state.taskList[index].tgtEffDtTm),
            selRespOrg: data.ctrlRespOrgId,
            tmplInfoModalVisible: true
          })

          for (let effDtTms of data.lstEffDtTms) {
            if (effDtTms.effDtTm === this.state.taskList[index].tgtEffDtTm) {
              this.setState({selStatus: effDtTms.custRecStat})
              break
            }
          }
        } else if (resTmpl.data && resTmpl.data.errList) {
          let errMsg = gFunc.synthesisErrMsg(resTmpl.data.errList)
          if (resTmpl.data.errList[0].errLvl === "ERROR")
            NotificationManager.error("", errMsg)
          else
            NotificationManager.warning("", errMsg)
        }
        break

      case "PAD":
      case "CAD":
      case "NUM":
      case "OTHER":
        let body = {
          numList:[
            this.state.taskList[index].tgtNum
          ]
        }
        let res = await this.props.callApi2(RestApi.numberQuery, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})

        if (res.ok && res.data && res.data.queryResult) {
          let result = res.data.queryResult[0]
          this.setState({
            selNum: this.state.taskList[index].tgtNum,
            selRespOrg: result.ctrlRespOrgId,
            selStatus: result.status,
            selEffDate: result.effDt,
            selReservedUntil: result.resUntilDt,
            selLastActive: result.lastActDt,
            numInfoModalVisible: true
          })

        } else if (res.data && res.data.errList) {
          let errMsg = gFunc.synthesisErrMsg(res.data.errList)
          if (res.data.errList[0].errLvl === "ERROR")
            NotificationManager.error("", errMsg)
          else
            NotificationManager.warning("", errMsg)
        }
        break
    }
  }

  delete = (id, index) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    this.props.callApi2(RestApi.deleteActivity, { "id": id }).then(res => {
      if (res.ok && res.data) {
        let activities = [...this.state.activities];
        activities.splice(index, 1)
        this.setState({ activities })
      }
    })
  }

  /**
   * refresh the activity log data in period
   */
  refreshList = () => {
    this.props.callApi2(RestApi.activityList, {}).then(res => {
      if (res.ok && res.data) {
        gFunc.sortActivityLogWithDateZA(res.data)

        let data = res.data
        let userList = [], pageList = [], opList = [], statusList = []
        for (let rec of data) {

          rec.subDtTm = gFunc.fromUTCStrToCTStr(rec.subDtTm)

          if (rec.status === "FAILED")
            rec.status = "Failed"
          else if (rec.status !== "")
            rec.status = "Finished"

          if (!userList.includes(rec.userName))
            userList.push(rec.userName)

          if (!pageList.includes(rec.page))
            pageList.push(rec.page)

          if (!opList.includes(rec.operation))
            opList.push(rec.operation)

          if (!statusList.includes(rec.status))
            statusList.push(rec.status)
        }

        userList.sort()
        pageList.sort()
        opList.sort()
        statusList.sort()

        this.setState({
          activities: data,
          showActivities: data,
          userList: userList,
          pageList: pageList,
          opList: opList,
          statusList: statusList
        })
      }
    })
  }

  handleChange = (event) => {
    const state = {};
    state[event.target.name] = event.target.value;
    this.setState(state);
  };

  clear =() => {
    this.setState({
      message: '',
      nums: '',
      mail: '',
    })
  }

  /**
   *
   */
  toggleNumModal = () => {
    this.setState({numInfoModalVisible: !this.state.numInfoModalVisible})
  }

  /**
   *
   */
  toggleTmplModal = () => {
    this.setState({tmplInfoModalVisible: !this.state.tmplInfoModalVisible})
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
   * template name cell
   * @param value
   * @param onClickCell
   * @returns {*}
   */
  templateNameCell = ({ value, columnProps: { rest: { onClickCell } } }) => {
    return <div className="text-center" style={{marginTop: 10}}><a href="#" onClick={() => onClickCell(value)}>{value}</a></div>
  }

  /**
   * pad number cell
   * @param value
   * @param onClickCell
   * @returns {*}
   */
  padNumCell = ({ value, columnProps: { rest: { onClickCell } } }) => {
    return <div className="text-center" style={{marginTop: 10}}><a href="#" onClick={() => onClickCell(value)}>{gFunc.formattedNumber(value)}</a></div>
  }

  /**
   * cad name cell
   * @param value
   * @param onClickCell
   * @returns {*}
   */
  cadNumCell = ({ value, columnProps: { rest: { onClickCell } } }) => {
    return <div className="text-center" style={{marginTop: 10}}><a href="#" onClick={() => onClickCell(value)}>{gFunc.formattedNumber(value)}</a></div>
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
   *
   * @param ev
   */
  handleFilter = async (ev) => {
    let state = {};
    state[ev.target.name] = ev.target.value

    console.log(">>> " + ev.target.name + ": " + ev.target.value)

    await this.setState(state)
    this.search()
  };

  /**
   * search the number list
   */
  search = () => {
    let showActivities = []
    let activityList = JSON.parse(JSON.stringify(this.state.activities))
    for (let act of activityList) {
      let bCoincide = true
      if (this.state.userName !== 'All' && act.userName !== this.state.userName)
        bCoincide = false

      if (bCoincide && this.state.page !== 'All' && act.page !== this.state.page)
        bCoincide = false

      if (bCoincide && this.state.operation !== 'All' && act.operation !== this.state.operation)
        bCoincide = false

      if (bCoincide && this.state.status !== 'All' && act.status !== this.state.status)
        bCoincide = false

      if (bCoincide && this.state.subDtTm !== '' && !act.subDtTm.includes(this.state.subDtTm))
        bCoincide = false

      if (bCoincide) {
        showActivities.push(act)
      }
    }
    this.setState({showActivities: showActivities})
  }

  // Activity Log Columns
  activityColumns = [
    {
      Header: "Submit Time",
      accessor: 'subDtTm',
      width: gConst.DATE_COLUMN_WIDTH,
      sortable: true,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>,
      Filter: () =>
        <Input type="text" className="form-control-sm text-center" id="subDtTm" name="subDtTm" value={this.state.subDtTm} onChange={(ev)=> this.handleFilter(ev)}/>
    },
    {
      Header: "User Name",
      accessor: 'userName',
      width: gConst.ACTIVITY_NAME_COLUMN_WIDTH,
      sortable: true,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>,
      Filter: () =>
        <Input type="select" className="form-control-sm " style={{'text-align-last': 'center'}} id="userName" name="userName" value={this.state.userName} onChange={(ev)=> this.handleFilter(ev)}>
          <option value="All">All</option>
          {this.state.userList && this.state.userList.map(s => <option key={s} value={s}>{s}</option>)}
        </Input>
    },
    {
      Header: "Page",
      accessor: 'page',
      width: 150,
      sortable: true,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>,
      Filter: () =>
        <Input type="select" className="form-control-sm " style={{'text-align-last': 'center'}} id="page" name="page" value={this.state.page} onChange={(ev)=> this.handleFilter(ev)}>
          <option value="All">All</option>
          {this.state.pageList && this.state.pageList.map(s => <option key={s} value={s}>{s}</option>)}
        </Input>
    },
    {
      Header: "Operation",
      accessor: 'operation',
      width: 120,
      sortable: true,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>,
      Filter: () =>
        <Input type="select" className="form-control-sm " style={{'text-align-last': 'center'}} id="operation" name="operation" value={this.state.operation} onChange={(ev)=> this.handleFilter(ev)}>
          <option value="All">All</option>
          {this.state.opList && this.state.opList.map(s => <option key={s} value={s}>{s}</option>)}
        </Input>
    },
    {
      Header: "Total",
      accessor: 'total',
      width: gConst.ACTIVITY_TOTAL_COLUMN_WIDTH,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>
        <h4>
          <Badge color="success" pill>
            <span className="btm-1 fnt-14">
              {props.value}
            </span>
          </Badge>
        </h4>
      </div>,
      Filter: () => <div></div>
    },
    {
      Header: "Completed",
      accessor: 'completed',
      width: gConst.ACTIVITY_COMPLETED_COLUMN_WIDTH,
      sortable: true,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>
        <h4>
          <Badge color={props.value === 0 ? "dark" : props.value === props.original.total ? "success" : "info"} pill>
            <span className="btm-1 fnt-14">
              {props.value}
            </span>
          </Badge>
        </h4>
      </div>,
      Filter: () => <div></div>
    },
    {
      Header: "Status",
      accessor: 'status',
      width: gConst.STATUS_COLUMN_WIDTH,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>,
      Filter: () =>
        <Input type="select" className="form-control-sm " style={{'text-align-last': 'center'}} id="status" name="status" value={this.state.status} onChange={(ev)=> this.handleFilter(ev)}>
          <option value="All">All</option>
          {this.state.statusList && this.state.statusList.map(s => <option key={s} value={s}>{s}</option>)}
        </Input>
    },
    {
      Header: "Message",
      accessor: 'message',
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>,
      Filter: () => <div></div>
    },
    // removed, no need action
    // {
    //   Header: "Action",
    //   width: gConst.ACTIVITY_ACTION_COLUMN_WIDTH,
    //   sortable: false,
    //   Cell: props => <div className="text-center" style={{marginTop: 10}}>
    //
    //     <Button size="sm" onClick={() => this.view(props.original.id, props.index)} color="primary" className="ml-2">
    //       <i className="fa fa-eye"></i>
    //     </Button>
    //
    //     <Button size="sm" color="danger" className="ml-2" onClick={() => this.delete(props.original.id, props.index)}>
    //       <i className="fa fa-close"></i>
    //     </Button>
    //   </div>,
    //   Filter: () => <div></div>
    // }
  ]

  taskTADColumns = [
    {
      Header: "Template Name",
      accessor: 'tgtTmplName',
      width: 130,
      sortable: false,
      Cell: this.templateNameCell,
      getProps: () => ({
        onClickCell: (number) => {
          this.gotoTADPage(number)
        },
      }),
    },
    {
      Header: "Eff. Time",
      accessor: 'tgtEffDtTm',
      width: 170,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Somos Action",
      accessor: 'action',
      width: 120,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Status",
      accessor: 'status',
      width: 100,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Message",
      accessor: 'message',
      sortable: false,
      width: 250,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Measure Time",
      accessor: 'subDtTm',
      width: 170,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Current Status View",
      width: 170,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>

        <Button size="sm" onClick={() => this.viewCurInfo(props.index)} color="primary" className="ml-2">
          <i className="fa fa-eye"></i>
        </Button>
      </div>
    }
  ]

  taskTADWithSrcColumns = [
    {
      Header: "Src. Template Name",
      accessor: 'srcTmplName',
      width: 150,
      sortable: false,
      Cell: this.templateNameCell,
      getProps: () => ({
        onClickCell: (tmplName) => {
          this.gotoTADPage(tmplName)
        },
      }),
    },
    {
      Header: "Src. Eff. Time",
      accessor: 'srcEffDtTm',
      width: 170,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Tgt. Template Name",
      accessor: 'tgtTmplName',
      width: 150,
      sortable: false,
      Cell: this.templateNameCell,
      getProps: () => ({
        onClickCell: (tmplName) => {
          this.gotoTADPage(tmplName)
        },
      }),
    },
    {
      Header: "Tgt. Eff. Time",
      accessor: 'tgtEffDtTm',
      width: 170,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Somos Action",
      accessor: 'action',
      width: 120,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Status",
      accessor: 'status',
      width: 100,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Message",
      accessor: 'message',
      sortable: false,
      width: 250,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Measure Time",
      accessor: 'subDtTm',
      width: 170,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Current Status View",
      sortable: false,
      width: 170,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>

        <Button size="sm" onClick={() => this.viewCurInfo(props.index)} color="primary" className="ml-2">
          <i className="fa fa-eye"></i>
        </Button>
      </div>
    }
  ]

  taskPADColumns = [
    {
      Header: "Number",
      accessor: 'tgtNum',
      width: 120,
      sortable: false,
      Cell: this.padNumCell,
      getProps: () => ({
        onClickCell: (number) => {
          this.gotoPADPage(number)
        },
      }),
    },
    {
      Header: "Template Name",
      accessor: 'tgtTmplName',
      width: 150,
      sortable: false,
      Cell: this.templateNameCell,
      getProps: () => ({
        onClickCell: (tmplName) => {
          this.gotoTADPage(tmplName)
        },
      }),
    },
    {
      Header: "Eff. Time",
      accessor: 'tgtEffDtTm',
      width: 170,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Somos Action",
      accessor: 'action',
      width: 120,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Status",
      accessor: 'status',
      width: 100,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Message",
      accessor: 'message',
      sortable: false,
      width: 250,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Measure Time",
      accessor: 'subDtTm',
      width: 170,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Number Status View",
      sortable: false,
      width: 170,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>

        <Button size="sm" onClick={() => this.viewCurInfo(props.index)} color="primary" className="ml-2">
          <i className="fa fa-eye"></i>
        </Button>
      </div>
    }
  ]

  taskPADWithSrcColumns = [
    {
      Header: "Src. Number",
      accessor: 'srcNum',
      width: 120,
      sortable: false,
      Cell: this.padNumCell,
      getProps: () => ({
        onClickCell: (number) => {
          this.gotoPADPage(number)
        },
      }),
    },
    {
      Header: "Src. Template Name",
      accessor: 'srcTmplName',
      width: 150,
      sortable: false,
      Cell: this.templateNameCell,
      getProps: () => ({
        onClickCell: (tmplName) => {
          this.gotoTADPage(tmplName)
        },
      }),
    },
    {
      Header: "Src. Eff. Time",
      accessor: 'srcEffDtTm',
      width: 170,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Tgt. Number",
      accessor: 'tgtNum',
      width: 120,
      sortable: false,
      Cell: this.padNumCell,
      getProps: () => ({
        onClickCell: (number) => {
          this.gotoPADPage(number)
        },
      }),
    },
    {
      Header: "Tgt. Template Name",
      accessor: 'tgtTmplName',
      width: 150,
      sortable: false,
      Cell: this.templateNameCell,
      getProps: () => ({
        onClickCell: (tmplName) => {
          this.gotoTADPage(tmplName)
        },
      }),
    },
    {
      Header: "Tgt. Eff. Time",
      accessor: 'tgtEffDtTm',
      width: 170,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Somos Action",
      accessor: 'action',
      width: 120,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Status",
      accessor: 'status',
      width: 100,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Message",
      accessor: 'message',
      sortable: false,
      width: 250,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Measure Time",
      accessor: 'subDtTm',
      width: 170,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Number Status View",
      width: 170,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>

        <Button size="sm" onClick={() => this.viewCurInfo(props.index)} color="primary" className="ml-2">
          <i className="fa fa-eye"></i>
        </Button>
      </div>
    }
  ]

  taskCADColumns = [
    {
      Header: "Number",
      accessor: 'tgtNum',
      width: 120,
      sortable: false,
      Cell: this.cadNumCell,
      getProps: () => ({
        onClickCell: (number) => {
          this.gotoCADPage(number)
        },
      }),
    },
    {
      Header: "Eff. Time",
      accessor: 'tgtEffDtTm',
      width: 170,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Somos Action",
      accessor: 'action',
      width: 120,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Status",
      accessor: 'status',
      width: 100,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Message",
      accessor: 'message',
      sortable: false,
      width: 250,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Measure Time",
      accessor: 'subDtTm',
      width: 170,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Number Status View",
      width: 170,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>

        <Button size="sm" onClick={() => this.viewCurInfo(props.index)} color="primary" className="ml-2">
          <i className="fa fa-eye"></i>
        </Button>
      </div>
    }
  ]

  taskCADWithSrcColumns = [
    {
      Header: "Src. Number",
      accessor: 'srcNum',
      width: 120,
      sortable: false,
      Cell: this.cadNumCell,
      getProps: () => ({
        onClickCell: (number) => {
          this.gotoCADPage(number)
        },
      }),
    },
    {
      Header: "Src. Eff. Time",
      accessor: 'srcEffDtTm',
      width: 170,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Tgt. Number",
      accessor: 'tgtNum',
      width: 120,
      sortable: false,
      Cell: this.cadNumCell,
      getProps: () => ({
        onClickCell: (number) => {
          this.gotoCADPage(number)
        },
      }),
    },
    {
      Header: "Tgt. Eff. Time",
      accessor: 'tgtEffDtTm',
      width: 170,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Somos Action",
      accessor: 'action',
      width: 120,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Status",
      accessor: 'status',
      width: 100,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Message",
      accessor: 'message',
      sortable: false,
      width: 250,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Measure Time",
      accessor: 'subDtTm',
      width: 170,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Number Status View",
      width: 170,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>

        <Button size="sm" onClick={() => this.viewCurInfo(props.index)} color="primary" className="ml-2">
          <i className="fa fa-eye"></i>
        </Button>
      </div>
    }
  ]

  taskOtherColumns = [
    {
      Header: "Number",
      accessor: 'tgtNum',
      width: 120,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.formattedNumber(props.value)}</div>
    },
    {
      Header: "Somos Action",
      accessor: 'action',
      width: 120,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Status",
      accessor: 'status',
      width: 100,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Resp Org",
      accessor: 'respOrg',
      width: 100,
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
      Header: "Measure Time",
      accessor: 'subDtTm',
      width: 170,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{gFunc.fromUTCStrToCTStr(props.value)}</div>
    },
    {
      Header: "Number Status View",
      width: 170,
      sortable: false,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>

        <Button size="sm" onClick={() => this.viewCurInfo(props.index)} color="primary" className="ml-2">
          <i className="fa fa-eye"></i>
        </Button>
      </div>
    }
  ]

  render() {
    return (
      <div className="animated fadeIn">
        <Label className="ml-1"><strong style={{fontSize: 30}}>User Activity</strong></Label>
        <Card>
          <CardHeader>
            User Activities
          </CardHeader>
          <CardBody>
            <div className="row">
              <Col>
                Total: {this.state.activities.length}, Display: {this.state.showActivities.length}
              </Col>
              <Col className="text-right">
                <Button size="md" color="primary" className="mr-2" onClick={this.refreshList}>Refresh</Button>
              </Col>
            </div>
            <div className="mt-2">
              <ReactTable
                data={this.state.showActivities} columns={this.activityColumns} defaultPageSize={10} filterable minRows="1" className="-striped -highlight col-12"
                ref={(r) => this.selectActivityLogTable = r}
              />
            </div>
          </CardBody>
        </Card>

        <form ref={(node) => { this.downloadForm = node }} action="" target="_blank" method="post">
          <input type="hidden" ref={(input) => { this.textInput = input }} name="access_token" value="" />
        </form>

        {this.renderTADDetailModal()}
        {this.renderPADDetailModal()}
        {this.renderCADDetailModal()}
        {this.renderOtherDetailModal()}
        {this.renderNumInfoModal()}
        {this.renderTmplInfoModal()}

        <NotificationContainer/>
      </div>
    );
  }

  renderTADDetailModal = () => (
    <Modal isOpen={this.state.tadModalVisible} toggle={this.toggleTadDetailModal} className={'modal-xl ' + this.props.className}>
      <ModalHeader toggle={this.toggleTadDetailModal}>Detail</ModalHeader>
      <ModalBody>
        <FormGroup className="ml-4 mr-4">

          <Row className="mb-3">
            <ReactTable
              data={this.state.taskList}
              columns={(this.state.taskAction === 'RETRIEVE' || this.state.taskAction === 'CREATE' || this.state.taskAction === 'UPDATE' || this.state.taskAction === 'DELETE') ? this.taskTADColumns : this.taskTADWithSrcColumns}
              defaultPageSize={10} minRows="1" className="-striped -highlight col-12"
              ref={(r) => this.selectActivityLogTable = r}
            />
          </Row>

        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button type="reset" size="md" color="danger" onClick={this.toggleTadDetailModal}> Close</Button>
      </ModalFooter>
    </Modal>
  );

  renderPADDetailModal = () => (
    <Modal isOpen={this.state.padModalVisible} toggle={this.togglePadDetailModal} className={'modal-xl ' + this.props.className}>
      <ModalHeader toggle={this.togglePadDetailModal}>Detail</ModalHeader>
      <ModalBody>
        <FormGroup className="ml-4 mr-4">

          <Row className="mb-3">
            <ReactTable
              data={this.state.taskList}
              columns={(this.state.taskAction === 'RETRIEVE' || this.state.taskAction === 'CREATE' || this.state.taskAction === 'UPDATE' || this.state.taskAction === 'DELETE')
                      ? this.taskPADColumns
                      : this.state.taskAction === 'CONVERT' ? this.taskCADColumns : this.taskPADWithSrcColumns}
              defaultPageSize={10} minRows="1" className="-striped -highlight col-12"
              ref={(r) => this.selectActivityLogTable = r}
            />
          </Row>

        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button type="reset" size="md" color="danger" onClick={this.togglePadDetailModal}> Close</Button>
      </ModalFooter>
    </Modal>
  );

  renderCADDetailModal = () => (
    <Modal isOpen={this.state.cadModalVisible} toggle={this.toggleCadDetailModal} className={'modal-xl ' + this.props.className}>
      <ModalHeader toggle={this.toggleCadDetailModal}>Detail</ModalHeader>
      <ModalBody>
        <FormGroup className="ml-4 mr-4">

          <Row className="mb-3">
            <ReactTable
              data={this.state.taskList}
              columns={(this.state.taskAction === 'RETRIEVE' || this.state.taskAction === 'CREATE' || this.state.taskAction === 'UPDATE' || this.state.taskAction === 'DELETE')
                ? this.taskCADColumns
                : this.state.taskAction === 'CONVERT' ? this.taskPADColumns : this.taskCADWithSrcColumns}
              defaultPageSize={10} minRows="1" className="-striped -highlight col-12"
              ref={(r) => this.selectActivityLogTable = r}
            />
          </Row>

        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button type="reset" size="md" color="danger" onClick={this.toggleCadDetailModal}> Close</Button>
      </ModalFooter>
    </Modal>
  );

  renderOtherDetailModal = () => (
    <Modal isOpen={this.state.otherModalVisible} toggle={this.toggleOtherDetailModal} className={'modal-xl ' + this.props.className}>
      <ModalHeader toggle={this.toggleOtherDetailModal}>Detail</ModalHeader>
      <ModalBody>
        <FormGroup className="ml-4 mr-4">

          <Row className="mb-3">
            <ReactTable
              data={this.state.taskList}
              columns={this.state.taskType === 'CAD' ? this.taskCADColumns : (this.state.taskType === 'NUM' && this.state.taskAction === "CONVERT") ? this.taskPADColumns : this.taskOtherColumns}
              defaultPageSize={10} minRows="1" className="-striped -highlight col-12"
              ref={(r) => this.selectActivityLogTable = r}
            />
          </Row>

        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button type="reset" size="md" color="danger" onClick={this.toggleOtherDetailModal}> Close</Button>
      </ModalFooter>
    </Modal>
  );

  renderNumInfoModal = () => (
    <Modal isOpen={this.state.numInfoModalVisible} toggle={this.toggleNumModal} className={'modal-lg ' + this.props.className}>
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
                <Label htmlFor="selRespOrg">Resp Org:</Label>
                <Input type="text" id="selRespOrg" value={this.state.selRespOrg} disabled/>
              </div>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs="6">
              <div className="row mr-2">
                <Label htmlFor="selStatus">Status:</Label>
                <Input type="text" id="selStatus" value={this.state.selStatus} disabled/>
              </div>
            </Col>
            <Col xs="6">
              <div className="row">
                <Label htmlFor="selEffDtTm">Effective Date:</Label>
                <Input type="text" id="selEffDtTm" value={this.state.selEffDtTm} disabled/>
              </div>
            </Col>
          </Row>

          <Row>
            <Col xs="6">
              <div className="row mr-2">
                <Label htmlFor="selReservedUntil">Reserved Until:</Label>
                <Input type="text" id="selReservedUntil" value={this.state.selReservedUntil} disabled/>
              </div>
            </Col>
            <Col xs="6">
              <div className="row">
                <Label htmlFor="selLastActive">Last Active:</Label>
                <Input type="text" id="selLastActive" value={this.state.selLastActive} disabled/>
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

  renderTmplInfoModal = () => (
    <Modal isOpen={this.state.tmplInfoModalVisible} toggle={this.toggleTmplModal} className={'modal-lg ' + this.props.className}>
      <ModalHeader toggle={this.toggleTmplModal}>Template Info</ModalHeader>
      <ModalBody>
        <FormGroup className="ml-4 mr-4">
          <Row className="mb-3">
            <Col xs="6">
              <div className="row mr-2">
                <Label htmlFor="selTmplName">Template Name:</Label>
                <Input type="text" id="selTmplName" value={this.state.selTmplName} disabled/>
              </div>
            </Col>
            <Col xs="6">
              <div className="row">
                <Label htmlFor="selEffDtTm">Effective Date Time:</Label>
                <Input type="text" id="selEffDtTm" value={this.state.selEffDtTm} disabled/>
              </div>
            </Col>
          </Row>

          <Row className="mb-3">
            <Col xs="6">
              <div className="row mr-2">
                <Label htmlFor="selStatus">Status:</Label>
                <Input type="text" id="selStatus" value={this.state.selStatus} disabled/>
              </div>
            </Col>
            <Col xs="6">
              <div className="row">
                <Label htmlFor="selRespOrg">Resp Org:</Label>
                <Input type="text" id="selRespOrg" value={this.state.selRespOrg} disabled/>
              </div>
            </Col>
          </Row>
        </FormGroup>
      </ModalBody>
      <ModalFooter>
        <Button type="reset" size="md" color="danger" onClick={this.toggleTmplModal}> Close</Button>
      </ModalFooter>
    </Modal>
  );
}

export default connect((state) => ({somos: state.auth.profile.somos, data: state.auth}))(withLoadingAndNotification(UserActivity));
