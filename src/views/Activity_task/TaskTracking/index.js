import React, { Component } from 'react';
import { connect } from 'react-redux'
import ReactTable from 'react-table';
import "react-datepicker/dist/react-datepicker.css";
import 'react-table/react-table.css'
import "react-toastify/dist/ReactToastify.css";
import 'react-overlay-loader/styles.css';
import {  Button, Card, CardBody, CardHeader, Col, Input, Label } from 'reactstrap';

import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import RestApi from "../../../service/RestApi";
import * as gFunc from "../../../utils";
import * as gConst from "../../../constants/GlobalConstants";
import Cookies from "universal-cookie";

class Tasks extends Component {

  constructor(props) {
    super(props);
    this.state = {
      tasks: [],                  // task list
      showTasks: [],              // task list for displaying

      type: 'All',                // type for filter
      action: 'All',              // action for filter
      roId: 'All',                // resp org id for filter
      status: 'All',              // status for filter
      srcTmplName: '',         // source template name for filter
      srcNum: '',                 // source number for filter
      srcEffDtTm: '',             // source effective date time for filter
      tgtTmplName: '',         // target template name for filter
      tgtNum: '',                 // target number for filter
      tgtEffDtTm: '',             // target effective date time for filter
      userName: '',               // user name for filter
      subDtTm: '',                // submitted date time for filter

      typeList: [],               // type list
      actionList: [],             // action list
      roIdList: [],               // resp org id list
      statusList: []              // status list
    };
  }

  componentDidMount() {
    this.refreshList()
  }

  refreshList = () => {
    this.props.callApi2(RestApi.taskList, {}).then(res => {
      if (res.ok && res.data) {

        let typeList = res.data.typeList
        let actionList = res.data.actionList
        let roIdList = res.data.roIdList
        let statusList = res.data.statusList
        let taskList = res.data.taskList
        for (let task of taskList) {
          task.srcEffDtTm = gFunc.fromUTCStrListToCTStrList(task.srcEffDtTm)
          task.tgtEffDtTm = gFunc.fromUTCStrListToCTStrList(task.tgtEffDtTm)
          task.subDtTm = gFunc.fromUTCStrToCTStr(task.subDtTm)
        }
        this.setState({
          tasks: taskList,
          showTasks: taskList,

          typeList: typeList,
          actionList: actionList,
          roIdList: roIdList,
          statusList: statusList,

          type: 'All',
          action: 'All',
          srcNum: '',
          srcTmplName: '',
          srcEffDtTm: '',
          tgtNum: '',
          tgtTmplName: '',
          tgtEffDtTm: '',
          roId: 'All',
          status: 'All',
          userName: '',
          subDtTm: ''
        })
      }
    })
  }

  handleChange = (ev) => {
    let state = {};
    state[ev.target.name] = ev.target.value;
    this.setState(state);
  };

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
    let showTasks = []
    let taskList = JSON.parse(JSON.stringify(this.state.tasks))
    for (let task of taskList) {
      let bCoincide = true
      if (this.state.type !== 'All' && task.type !== this.state.type)
        bCoincide = false

      if (bCoincide && this.state.action !== 'All' && task.action !== this.state.action)
        bCoincide = false

      if (bCoincide && this.state.roId !== 'All' && task.respOrg !== this.state.roId)
        bCoincide = false

      if (bCoincide && this.state.srcTmplName !== '' && !task.srcTmplName.toLowerCase().startsWith(this.state.srcTmplName.toLowerCase()))
        bCoincide = false

      if (bCoincide && this.state.tgtTmplName !== '' && !task.tgtTmplName.toLowerCase().startsWith(this.state.tgtTmplName.toLowerCase()))
        bCoincide = false

      if (bCoincide && this.state.status !== 'All' && task.status !== this.state.status)
        bCoincide = false

      let srcNum = this.state.srcNum.replace(/\-/g, "")
      if (bCoincide && srcNum !== '' && !task.srcNum.startsWith(srcNum))
        bCoincide = false

      let tgtNum = this.state.tgtNum.replace(/\-/g, "")
      if (bCoincide && tgtNum !== '' && !task.tgtNum.startsWith(tgtNum))
        bCoincide = false

      if (bCoincide && this.state.userName !== '' && !task.userName.toLowerCase().startsWith(this.state.userName.toLowerCase()))
        bCoincide = false

      if (bCoincide && this.state.srcEffDtTm !== '' && !task.srcEffDtTm.includes(this.state.srcEffDtTm))
        bCoincide = false

      if (bCoincide && this.state.tgtEffDtTm !== '' && !task.tgtEffDtTm.includes(this.state.tgtEffDtTm))
        bCoincide = false

      if (bCoincide && this.state.subDtTm !== '' && !task.subDtTm.includes(this.state.subDtTm))
        bCoincide = false

      if (bCoincide) {
        showTasks.push(task)
      }
    }
    this.setState({showTasks: showTasks})
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

  TmplCell = ({ value, columnProps: { rest: { onClickTmplName } } }) => {
    return <div className="text-center"><a href="#" onClick={() => onClickTmplName(value)}>{value}</a></div>
  }

  srcNumCell = ({ value, columnProps: { rest: { onClickCAD, onClickPAD } } }) => {

    console.log(">>>> id: " + value)
    let selTask = null
    for (let task of this.state.tasks) {
      if (value == task.id) {
        selTask = task
        break
      }
    }

    if (selTask) {
      switch (selTask.type) {
        case "CAD":
          if (selTask.action === "CONVERT")
            return <div className="text-center"><a href="#" onClick={() => onClickPAD(selTask.srcNum)}>{gFunc.formattedNumber(selTask.srcNum)}</a></div>
          else
            return <div className="text-center"><a href="#" onClick={() => onClickCAD(selTask.srcNum)}>{gFunc.formattedNumber(selTask.srcNum)}</a></div>

        case "PAD":
          if (selTask.action === "CONVERT")
            return <div className="text-center"><a href="#" onClick={() => onClickCAD(selTask.srcNum)}>{gFunc.formattedNumber(selTask.srcNum)}</a></div>
          else
            return <div className="text-center"><a href="#" onClick={() => onClickPAD(selTask.srcNum)}>{gFunc.formattedNumber(selTask.srcNum)}</a></div>

        case "NUM":
            return <div className="text-center"><a href="#" onClick={() => onClickPAD(selTask.srcNum)}>{gFunc.formattedNumber(selTask.srcNum)}</a></div>

        default:
          return <div className="text-center">{gFunc.formattedNumber(selTask.srcNum)}</div>
      }
    }

    return <div className="text-center"></div>
  }

  tgtNumCell = ({ value, columnProps: { rest: { onClickCAD, onClickPAD } } }) => {

    console.log(">>>> id: " + value)
    let selTask = null
    for (let task of this.state.tasks) {
      if (value == task.id) {
        selTask = task
        break
      }
    }

    if (selTask) {
      switch (selTask.type) {
        case "CAD":
          if (selTask.action === "CONVERT")
            return <div className="text-center"><a href="#" onClick={() => onClickPAD(selTask.tgtNum)}>{gFunc.formattedNumber(selTask.tgtNum)}</a></div>
          else
            return <div className="text-center"><a href="#" onClick={() => onClickCAD(selTask.tgtNum)}>{gFunc.formattedNumber(selTask.tgtNum)}</a></div>

        case "PAD":
          if (selTask.action === "CONVERT")
            return <div className="text-center"><a href="#" onClick={() => onClickCAD(selTask.tgtNum)}>{gFunc.formattedNumber(selTask.tgtNum)}</a></div>
          else
            return <div className="text-center"><a href="#" onClick={() => onClickPAD(selTask.tgtNum)}>{gFunc.formattedNumber(selTask.tgtNum)}</a></div>

        default:
          return <div className="text-center">{gFunc.formattedNumber(selTask.tgtNum)}</div>
      }
    }

    return <div className="text-center"></div>
  }

  // Activity Log Columns
  taskColumns = [
    {
      Header: "Type",
      accessor: 'type',
      width: 80,
      Cell: props => <div className="text-center" >{props.value}</div>,
      Filter: () =>
        <Input type="select" className="form-control-sm " style={{'text-align-last': 'center'}} id="type" name="type" value={this.state.type} onChange={(ev)=> this.handleFilter(ev)}>
          <option value="All">All</option>
          {this.state.typeList && this.state.typeList.map(s => <option key={s} value={s}>{s}</option>)}
        </Input>
    },
    {
      Header: "Somos Action",
      accessor: 'action',
      width: 120,
      Cell: props => <div className="text-center" >{props.value}</div>,
      Filter: () =>
        <Input type="select" className="form-control-sm " style={{'text-align-last': 'center'}} id="action" name="action" value={this.state.action} onChange={(ev)=> this.handleFilter(ev)}>
          <option value="All">All</option>
          {this.state.actionList && this.state.actionList.map(s => <option key={s} value={s}>{s}</option>)}
        </Input>
    },
    {
      Header: "Src. Number",
      accessor: 'id',
      width: 120,
      Cell: this.srcNumCell,
      getProps: (onClickCAD, onClickPAD) => ({
        onClickCAD: (number) => {
          this.gotoCADPage(number)
        },
        onClickPAD: (number) => {
          this.gotoPADPage(number)
        }
      }),
      Filter: () =>
        <Input type="text" className="form-control-sm text-center" id="srcNum" name="srcNum" value={this.state.srcNum} onChange={(ev)=> this.handleFilter(ev)}/>
    },
    {
      Header: "Src. Template Name",
      accessor: 'srcTmplName',
      width: 130,
      Cell: this.TmplCell,
      getProps: () => ({
        onClickTmplName: (tmplName) => {
          this.gotoTADPage(tmplName)
        }
      }),
      Filter: () =>
        <Input type="text" className="form-control-sm text-center" id="srcTmplName" name="srcTmplName" value={this.state.srcTmplName} onChange={(ev)=> this.handleFilter(ev)}/>
    },
    {
      Header: "Src. Eff. Time",
      accessor: 'srcEffDtTm',
      width: 170,
      Cell: props => <div className="text-center" >{props.value}</div>,
      Filter: () =>
        <Input type="text" className="form-control-sm text-center" id="srcEffDtTm" name="srcEffDtTm" value={this.state.srcEffDtTm} onChange={(ev)=> this.handleFilter(ev)}/>
    },
    {
      Header: "Tgt. Number",
      accessor: 'id',
      width: 120,
      Cell: this.tgtNumCell,
      getProps: (onClickCAD, onClickPAD) => ({
        onClickCAD: (number) => {
          this.gotoCADPage(number)
        },
        onClickPAD: (number) => {
          this.gotoPADPage(number)
        }
      }),
      Filter: () =>
        <Input type="text" className="form-control-sm text-center" id="tgtNum" name="tgtNum" value={this.state.tgtNum} onChange={(ev)=> this.handleFilter(ev)}/>
    },
    {
      Header: "Tgt. Template Name",
      accessor: 'tgtTmplName',
      width: 130,
      Cell: this.TmplCell,
      getProps: () => ({
        onClickTmplName: (tmplName) => {
          this.gotoTADPage(tmplName)
        }
      }),
      Filter: () =>
        <Input type="text" className="form-control-sm text-center" id="tgtTmplName" name="tgtTmplName" value={this.state.tgtTmplName} onChange={(ev)=> this.handleFilter(ev)}/>
    },
    {
      Header: "Tgt. Eff. Time",
      accessor: 'tgtEffDtTm',
      width: 170,
      Cell: props => <div className="text-center" >{props.value}</div>,
      Filter: () =>
        <Input type="text" className="form-control-sm text-center" id="tgtEffDtTm" name="tgtEffDtTm" value={this.state.tgtEffDtTm} onChange={(ev)=> this.handleFilter(ev)}/>
    },
    {
      Header: "Resp Org Id",
      accessor: 'respOrg',
      width: 120,
      Cell: props => <div className="text-center" >{props.value}</div>,
      Filter: () =>
        <Input type="select" className="form-control-sm " style={{'text-align-last': 'center'}} id="roId" name="roId" value={this.state.roId} onChange={(ev)=> this.handleFilter(ev)}>
          <option value="All">All</option>
          {this.state.roIdList && this.state.roIdList.map(s => <option key={s} value={s}>{s}</option>)}
        </Input>
    },
    {
      Header: "Status",
      accessor: 'status',
      width: 120,
      Cell: props => <div className="text-center" >{props.value}</div>,
      Filter: () =>
        <Input type="select" className="form-control-sm " style={{'text-align-last': 'center'}} id="status" name="status" value={this.state.status} onChange={(ev)=> this.handleFilter(ev)}>
          <option value="All">All</option>
          {this.state.statusList && this.state.statusList.map(s => <option key={s} value={s}>{s}</option>)}
        </Input>
    },
    {
      Header: "User Name",
      accessor: 'userName',
      width: 100,
      Cell: props => <div className="text-center" >{props.value}</div>,
      Filter: () =>
        <Input type="text" className="form-control-sm text-center" id="userName" name="userName" value={this.state.userName} onChange={(ev)=> this.handleFilter(ev)}/>
    },
    {
      Header: "Message",
      accessor: 'message',
      width: 600,
      Cell: props => <div className="text-center" >{props.value}</div>,
      Filter: () => <div></div>
    },
    {
      Header: "Measure Time",
      accessor: 'subDtTm',
      width: 170,
      Cell: props => <div className="text-center" >{props.value}</div>,
      Filter: () =>
        <Input type="text" className="form-control-sm text-center" id="subDtTm" name="subDtTm" value={this.state.subDtTm} onChange={(ev)=> this.handleFilter(ev)}/>
    },
  ]

  render() {
    return (
      <div className="animated fadeIn">
        <Label className="ml-1"><strong style={{fontSize: 30}}>Task Tracking</strong></Label>
        <Card>
          <CardHeader>
            Tasks
          </CardHeader>
          <CardBody>
            <div className="row">
              <Col>
                Total: {this.state.tasks.length}, Display: {this.state.showTasks.length}
              </Col>
              <Col className="text-right">
                <Button size="md" color="primary" className="mr-2" onClick={this.refreshList}>Refresh</Button>
              </Col>
            </div>
            <div className="mt-2">
              <ReactTable
                data={this.state.showTasks} columns={this.taskColumns} defaultPageSize={10} filterable minRows="1" className="-striped -highlight col-12"
                ref={(r) => this.selectActivityLogTable = r}
              />
            </div>
          </CardBody>
        </Card>

        <form ref={(node) => { this.downloadForm = node }} action="" target="_blank" method="post">
          <input type="hidden" ref={(input) => { this.textInput = input }} name="access_token" value="" />
        </form>
      </div>
    );
  }
}

export default connect((state) => ({ somos: state.auth.profile.somos, data: state.auth }))(withLoadingAndNotification(Tasks));
