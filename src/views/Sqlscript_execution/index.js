import React, { Component } from 'react';
import { connect } from 'react-redux'
import ReactTable from 'react-table';
import "react-datepicker/dist/react-datepicker.css";
import 'react-table/react-table.css'
import "react-toastify/dist/ReactToastify.css";
import 'react-overlay-loader/styles.css';
import {  Button, Card, CardBody, CardHeader, Col, Input, Label } from 'reactstrap';

import withLoadingAndNotification from "../../components/HOC/withLoadingAndNotification";
import RestApi from "../../service/RestApi";

import * as gFunc from "../../utils";


class SqlScriptExecutionRecord extends Component {

  constructor(props) {
    super(props);
    this.state = {
      executionRecords: [],       // execution record list
      showExecutionRecords: [],   // show execution record list
      interval: "",               // Timer

      sqlScript: "",
      result: "",
      userName: "",
      executionTime: "",

    };
  }

  componentDidMount() {
    this.refreshList()
  }

  refreshList = () => {
    this.props.callApi2(RestApi.sqlScriptExecutionList, {}).then(res => {
      if (res.ok && res.data) {
        // sortActivityLogWithDateZA(res.data)
        for (let record of res.data) {
          record.executionTime = gFunc.fromUTCStrToCTStr(record.executionTime)
        }

        this.setState({
          executionRecords: res.data,
          showExecutionRecords: res.data,
          sqlScript: "",
          result: "All",
          userName: "",
          executionTime: "",
        })
      }
    })
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

    console.log(">>> " + this.state.result)
    this.search()
  }

  /**
   * search the number list
   */
  search = () => {
    let showExecutionRecords = []
    let executionRecords = JSON.parse(JSON.stringify(this.state.executionRecords))
    for (let record of executionRecords) {
      let bCoincide = true
      if (this.state.sqlScript !== '' && !record.script.includes(this.state.sqlScript))
        bCoincide = false

      if (bCoincide && this.state.result !== 'All' && record.result !== this.state.result)
        bCoincide = false

      if (bCoincide && this.state.userName !== '' && !record.userName.includes(this.state.userName))
        bCoincide = false

      if (bCoincide && this.state.executionTime !== '' && record.executionTime.startsWith(this.state.executionTime))
        bCoincide = false

      if (bCoincide) {
        showExecutionRecords.push(record)
      }
    }
    this.setState({showExecutionRecords: showExecutionRecords})
  }



  handleChange = (ev) => {
    let state = {};
    state[ev.target.name] = ev.target.value;
    this.setState(state);
  };

  // Activity Log Columns
  executionColumns = [
    {
      Header: "Sql Script",
      accessor: 'script',
      // Cell: props => <div className="text-center" >{props.value}</div>,
      Filter: () =>
        <Input type="text" className="form-control-sm " id="sqlScript" name="sqlScript" value={this.state.sqlScript} onChange={(ev)=> this.handleFilter(ev)}/>
    },
    {
      Header: "Result",
      accessor: 'result',
      width: 115,
      Cell: props => <div className="text-center" >{props.value}</div>,
      Filter: () =>
        <Input type="select" className="form-control-sm " style={{'text-align-last': 'center'}} id="result" name="result" value={this.state.result} onChange={(ev)=> this.handleFilter(ev)}>
          <option value="All">All</option>
          <option value="SUCCESS">SUCCESS</option>
          <option value="FAILED">FAILED</option>
          <option value="CANCELED">CANCELED</option>
        </Input>
    },
    {
      Header: "Imported",
      accessor: 'imported',
      width: 80,
      Cell: props => <div className="text-center" >{props.value}</div>,
      Filter: () => <div></div>
    },
    {
      Header: "Message",
      accessor: 'message',
      width: 200,
      Cell: props => <div className="text-center" >{props.value}</div>,
      Filter: () => <div></div>
    },
    {
      Header: "User Name",
      accessor: 'userName',
      width: 100,
      Cell: props => <div className="text-center" >{props.value}</div>,
      Filter: () =>
        <Input type="text" className="form-control-sm " id="userName" name="userName" value={this.state.userName} onChange={(ev)=> this.handleFilter(ev)}/>
    },
    {
      Header: "Execution Time",
      accessor: 'executionTime',
      width: 170,
      Cell: props => <div className="text-center" >{props.value}</div>,
      Filter: () =>
        <Input type="text" className="form-control-sm " id="executionTime" name="executionTime" value={this.state.executionTime} onChange={(ev)=> this.handleFilter(ev)}/>
    },
  ]

  render() {
    return (
      <div className="animated fadeIn">
        <Label className="ml-1"><strong style={{fontSize: 30}}>Sql Script Execution Records</strong></Label>
        <Card>
          <CardHeader>
            Sql Script Execution Records
          </CardHeader>
          <CardBody>
            <div className="row">
              <Col>
                Total: {this.state.executionRecords.length}, Display: {this.state.showExecutionRecords.length}
              </Col>
              <Col className="text-right">
                <Button size="md" color="primary" className="mr-2" onClick={this.refreshList}>Refresh</Button>
              </Col>
            </div>
            <div className="mt-2">
              <ReactTable
                data={this.state.showExecutionRecords} columns={this.executionColumns} defaultPageSize={10} filterable minRows="1" className="-striped -highlight col-12"
                ref={(r) => this.selectActivityLogTable = r}
              />
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }
}

export default connect((state) => ({ somos: state.auth.profile.somos, data: state.auth }))(withLoadingAndNotification(SqlScriptExecutionRecord));
