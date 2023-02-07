import React, {Component} from 'react';
import {Button, Card, CardBody, Col, Input, Label, Row, Nav, NavItem, NavLink, TabContent, TabPane
} from 'reactstrap';
import "react-toastify/dist/ReactToastify.css";
import 'react-overlay-loader/styles.css';
import "react-datepicker/dist/react-datepicker.css";
import classnames from "classnames";
import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import {insert_cell, delete_cell, handle_lad, insert_row, delete_row} from "../../../utils";
import {LBL_TYPE_AC, LBL_TYPE_DT, LBL_TYPE_LT, LBL_TYPE_NX, LBL_TYPE_ST, LBL_TYPE_TE, LBL_TYPE_TI, LBL_TYPE_TD, LBL_TYPE_SD} from "../../../constants/GlobalConstants";

var INSERT_TYPE_ABOVE = 0;
var INSERT_TYPE_BELOW = 1;
var INSERT_TYPE_END = 2;
var DELETE_TYPE_CURRENT = 0;
var DELETE_TYPE_LAST = 1;

class LAD extends Component {

  constructor(props) {
    console.log("LAD Window Constructor");
    console.log("gridArea" + localStorage.getItem("gridArea"));
    super(props);
    this.state = {
      activeLADTab: '1',
      isDate: false,
      isArea: false,
      template: localStorage.getItem("template"),
      isLATA: localStorage.getItem("isLATA") === "1" || false,
      isNXX: localStorage.getItem("isNXX") === "1" || false,
      isState: localStorage.getItem("isState") === "1" || false,
      isTel: localStorage.getItem("isTel") === "1" || false,
      isSD: localStorage.getItem("isSD") === "1" || false,
      isTD: localStorage.getItem("isTD") === "1" || false,
      isTime: localStorage.getItem("isTime") === "1" || false,
      disable: localStorage.getItem("disable") === "1" || false,
      gridArea: JSON.parse(localStorage.getItem("gridArea")) || Array(7).fill(Array(8).fill('')),
      gridDate: JSON.parse(localStorage.getItem("gridDate")) || Array(7).fill(Array(8).fill('')),
      gridLATA: JSON.parse(localStorage.getItem("gridLATA")) || Array(7).fill(Array(8).fill('')),
      gridNXX: JSON.parse(localStorage.getItem("gridNXX")) || Array(7).fill(Array(8).fill('')),
      gridState: JSON.parse(localStorage.getItem("gridState")) || Array(7).fill(Array(8).fill('')),
      gridTel: JSON.parse(localStorage.getItem("gridTel")) || Array(7).fill(Array(8).fill('')),
      gridTime: JSON.parse(localStorage.getItem("gridTime")) || Array(7).fill(Array(8).fill('')),
      gridTD: JSON.parse(localStorage.getItem("gridTD")) || Array(7).fill(Array(8).fill('')),
      gridSD: JSON.parse(localStorage.getItem("gridSD")) || Array(7).fill(Array(8).fill('')),
      acRowIndex: -1, dtRowIndex: -1, ltRowIndex: -1, nxRowIndex: -1, stRowIndex: -1, teRowIndex: -1, tiRowIndex: -1, tdRowIndex: -1, sdRowIndex: -1,
      acColIndex: 0, dtColIndex: 0, ltColIndex: 0, nxColIndex: 0, stColIndex: 0, teColIndex: 0, tiColIndex: 0, tdColIndex: 0, sdColIndex: 0,
    };

  }

  componentDidMount() {
    this.setItem();
  };

  setItem = () => {
    window.addEventListener("storage", (ev) => {
      if (ev.key === "template") {
        this.setState({template: ev.newValue});
      } else {
        console.log("SetItem Function");
        let state = {};
        state[ev.key] = JSON.parse(ev.newValue);
        this.setState(state);
      }
    });
  };

  setCellIndex = async(type, row, col) => {
    switch (type) {
      case LBL_TYPE_AC:
        await this.setState({acRowIndex: row, acColIndex: col})
        break;
      case LBL_TYPE_DT:
        await this.setState({dtRowIndex: row, dtColIndex: col})
        break;
      case LBL_TYPE_LT:
        await this.setState({ltRowIndex: row, ltColIndex: col})
        break;
      case LBL_TYPE_NX:
        await this.setState({nxRowIndex: row, nxColIndex: col})
        break;
      case LBL_TYPE_ST:
        await this.setState({stRowIndex: row, stColIndex: col})
        break;
      case LBL_TYPE_TE:
        await this.setState({teRowIndex: row, teColIndex: col})
        break;
      case LBL_TYPE_TI:
        await this.setState({tiRowIndex: row, tiColIndex: col})
        break;
      case LBL_TYPE_TD:
        await this.setState({tdRowIndex: row, tdColIndex: col})
        break;
      case LBL_TYPE_SD:
        await this.setState({sdRowIndex: row, sdColIndex: col})
        break;
    }
  }

  //Manage area carrier for LAD
  handleAreaChange = (ev) => {
    this.setState({gridArea: handle_lad(ev, this.state.gridArea)});
    localStorage.setItem("gridArea", JSON.stringify(handle_lad(ev, this.state.gridArea)));
  };
  //Manage date carrier for LAD
  handleDateChange = (ev) => {
    this.setState({gridDate: handle_lad(ev, this.state.gridDate)});
    localStorage.setItem("gridDate", JSON.stringify(handle_lad(ev, this.state.gridDate)));
  };
  //Manage lata carrier for LAD
  handleLATAChange = (ev) => {
    this.setState({gridLATA: handle_lad(ev, this.state.gridLATA)});
    localStorage.setItem("gridLATA", JSON.stringify(handle_lad(ev, this.state.gridLATA)));
  };
  //Manage nxx carrier for LAD
  handleNXXChange = (ev) => {
    this.setState({gridNXX: handle_lad(ev, this.state.gridNXX)});
    localStorage.setItem("gridNXX", JSON.stringify(handle_lad(ev, this.state.gridNXX)));
  };
  //Manage state carrier for LAD
  handleStateChange = (ev) => {
    this.setState({gridState: handle_lad(ev, this.state.gridState)});
    localStorage.setItem("gridState", JSON.stringify(handle_lad(ev, this.state.gridState)));
  };
  //Manage tel carrier for LAD
  handleTelChange = (ev) => {
    this.setState({gridTel: handle_lad(ev, this.state.gridTel)});
    localStorage.setItem("gridTel", JSON.stringify(handle_lad(ev, this.state.gridTel)));
  };
  //Manage time carrier for LAD
  handleTimeChange = (ev) => {
    this.setState({gridTime: handle_lad(ev, this.state.gridTime)});
    localStorage.setItem("gridTime", JSON.stringify(handle_lad(ev, this.state.gridTime)));
  };
  //Manage ten digits carrier for LAD
  handleTdChange = (ev) => {
    this.setState({gridTD: handle_lad(ev, this.state.gridTD)});
    localStorage.setItem("gridTD", JSON.stringify(handle_lad(ev, this.state.gridTD)));
  };
  //Manage six digits carrier for LAD
  handleSdChange = (ev) => {
    this.setState({gridSD: handle_lad(ev, this.state.gridSD)});
    localStorage.setItem("gridSD", JSON.stringify(handle_lad(ev, this.state.gridSD)));
  };

  handle = (event) => {
    let state = {};
    state[event.target.name] = event.target.value;
    this.setState(state);
  };

  toggleLADTab = (tab) => {
    this.state.activeLADTab !== tab && this.setState({activeLADTab: tab});
  };

  /**
   * insert add to row indicated
   * @param type        : tab type
   * @param insertType  : insert type(above row or below row or last row)
   * Added by Ming Jin 2020/03/26
   */
  insertLADRow = (type, insertType) => {
    var rowIndex = 0;

    switch (type) {
      case LBL_TYPE_AC:
        switch (insertType) {
          case INSERT_TYPE_ABOVE:
            rowIndex = this.state.acRowIndex;
            rowIndex = Math.max(0, rowIndex);
            break;
          case INSERT_TYPE_BELOW:
            rowIndex = this.state.acRowIndex + 1;
            rowIndex = Math.min(this.state.gridArea.length, rowIndex);
            break;
          case INSERT_TYPE_END:
            rowIndex = this.state.gridArea.length;
            break;
        }
        this.setState({gridArea: insert_row(this.state.gridArea, rowIndex)});
        localStorage.setItem("gridArea", JSON.stringify(insert_row(this.state.gridArea, rowIndex)));
        break;

      case LBL_TYPE_DT:
        switch (insertType) {
          case INSERT_TYPE_ABOVE:
            rowIndex = this.state.dtRowIndex;
            rowIndex = Math.max(0, rowIndex);
            break;
          case INSERT_TYPE_BELOW:
            rowIndex = this.state.dtRowIndex + 1;
            rowIndex = Math.min(this.state.gridDate.length, rowIndex);
            break;
          case INSERT_TYPE_END:
            rowIndex = this.state.gridDate.length;
            break;
        }
        this.setState({gridDate: insert_row(this.state.gridDate, rowIndex)});
        localStorage.setItem("gridDate", JSON.stringify(insert_row(this.state.gridDate, rowIndex)));
        break;

      case LBL_TYPE_LT:
        switch (insertType) {
          case INSERT_TYPE_ABOVE:
            rowIndex = this.state.ltRowIndex;
            rowIndex = Math.max(0, rowIndex);
            break;
          case INSERT_TYPE_BELOW:
            rowIndex = this.state.ltRowIndex + 1;
            rowIndex = Math.min(this.state.gridLATA.length, rowIndex);
            break;
          case INSERT_TYPE_END:
            rowIndex = this.state.gridLATA.length;
            break;
        }
        this.setState({gridLATA: insert_row(this.state.gridLATA, rowIndex)});
        localStorage.setItem("gridLATA", JSON.stringify(insert_row(this.state.gridLATA, rowIndex)));
        break;

      case LBL_TYPE_TD:
        switch (insertType) {
          case INSERT_TYPE_ABOVE:
            rowIndex = this.state.tdRowIndex;
            rowIndex = Math.max(0, rowIndex);
            break;
          case INSERT_TYPE_BELOW:
            rowIndex = this.state.tdRowIndex + 1;
            rowIndex = Math.min(this.state.gridTD.length, rowIndex);
            break;
          case INSERT_TYPE_END:
            rowIndex = this.state.gridTD.length;
            break;
        }
        this.setState({gridTD: insert_row(this.state.gridTD, rowIndex)});
        localStorage.setItem("gridTD", JSON.stringify(insert_row(this.state.gridTD, rowIndex)));
        break;

      case LBL_TYPE_SD:
        switch (insertType) {
          case INSERT_TYPE_ABOVE:
            rowIndex = this.state.sdRowIndex;
            rowIndex = Math.max(0, rowIndex);
            break;
          case INSERT_TYPE_BELOW:
            rowIndex = this.state.sdRowIndex + 1;
            rowIndex = Math.min(this.state.gridSD.length, rowIndex);
            break;
          case INSERT_TYPE_END:
            rowIndex = this.state.gridSD.length;
            break;
        }
        this.setState({gridSD: insert_row(this.state.gridSD, rowIndex)});
        localStorage.setItem("gridSD", JSON.stringify(insert_row(this.state.gridSD, rowIndex)));
        break;

      case LBL_TYPE_NX:
        switch (insertType) {
          case INSERT_TYPE_ABOVE:
            rowIndex = this.state.nxRowIndex;
            rowIndex = Math.max(0, rowIndex);
            break;
          case INSERT_TYPE_BELOW:
            rowIndex = this.state.nxRowIndex + 1;
            rowIndex = Math.min(this.state.gridNXX.length, rowIndex);
            break;
          case INSERT_TYPE_END:
            rowIndex = this.state.gridNXX.length;
            break;
        }
        this.setState({gridNXX: insert_row(this.state.gridNXX, rowIndex)});
        localStorage.setItem("gridNXX", JSON.stringify(insert_row(this.state.gridNXX, rowIndex)));
        break;

      case LBL_TYPE_TI:
        switch (insertType) {
          case INSERT_TYPE_ABOVE:
            rowIndex = this.state.tiRowIndex;
            rowIndex = Math.max(0, rowIndex);
            break;
          case INSERT_TYPE_BELOW:
            rowIndex = this.state.tiRowIndex + 1;
            rowIndex = Math.min(this.state.gridTime.length, rowIndex);
            break;
          case INSERT_TYPE_END:
            rowIndex = this.state.gridTime.length;
            break;
        }
        this.setState({gridTime: insert_row(this.state.gridTime, rowIndex)});
        localStorage.setItem("gridTime", JSON.stringify(insert_row(this.state.gridTime, rowIndex)));
        break;

      case LBL_TYPE_ST:
        switch (insertType) {
          case INSERT_TYPE_ABOVE:
            rowIndex = this.state.stRowIndex;
            rowIndex = Math.max(0, rowIndex);
            break;
          case INSERT_TYPE_BELOW:
            rowIndex = this.state.stRowIndex + 1;
            rowIndex = Math.min(this.state.gridState.length, rowIndex);
            break;
          case INSERT_TYPE_END:
            rowIndex = this.state.gridState.length;
            break;
        }
        this.setState({gridState: insert_row(this.state.gridState, rowIndex)});
        localStorage.setItem("gridState", JSON.stringify(insert_row(this.state.gridState, rowIndex)));
        break;
    }
  };

  /**
   * insert cell to before cell indicated
   * @param type        : tab type
   * Added by Ming Jin 2020/04/07
   */
  insertLADCell = (type) => {
    let data = this.state.gridArea.slice(0);
    switch (type) {
      case LBL_TYPE_AC:
        data = insert_cell(this.state.gridArea, this.state.acRowIndex, this.state.acColIndex);
        this.setState({gridArea: data});
        localStorage.setItem("gridArea", JSON.stringify(data));
        break;

      case LBL_TYPE_DT:
         data = insert_cell(this.state.gridDate, this.state.dtRowIndex, this.state.dtColIndex);
        this.setState({gridDate: data});
        localStorage.setItem("gridDate", JSON.stringify(data));
        break;

      case LBL_TYPE_LT:
        data = insert_cell(this.state.gridLATA, this.state.ltRowIndex, this.state.ltColIndex);
        this.setState({gridLATA: data});
        localStorage.setItem("gridLATA", JSON.stringify(data));
        break;

      case LBL_TYPE_TD:
        data = insert_cell(this.state.gridTD, this.state.tdRowIndex, this.state.tdColIndex);
        this.setState({gridTD: data});
        localStorage.setItem("gridTD", JSON.stringify(data));
        break;

      case LBL_TYPE_NX:
        data = insert_cell(this.state.gridNXX, this.state.nxRowIndex, this.state.nxColIndex);
        this.setState({gridNXX: data});
        localStorage.setItem("gridNXX", JSON.stringify(data));
        break;

      case LBL_TYPE_TI:
        data = insert_cell(this.state.gridTime, this.state.tiRowIndex, this.state.tiColIndex);
        this.setState({gridTime: data});
        localStorage.setItem("gridTime", JSON.stringify(data));
        break;

      case LBL_TYPE_ST:
        data = insert_cell(this.state.gridState, this.state.stRowIndex, this.state.stColIndex);
        this.setState({gridState: data});
        localStorage.setItem("gridState", JSON.stringify(data));
        break;

      case LBL_TYPE_SD:
        data = insert_cell(this.state.gridSD, this.state.sdRowIndex, this.state.sdColIndex);
        this.setState({gridSD: data});
        localStorage.setItem("gridSD", JSON.stringify(data));
        break;
    }
  };

  /**
   * delete row indicated
   * @param type        : tab type
   * @param deleteType  : delete type(current row or last row)
   * Added by Ming Jin 2020/03/26
   */
  deleteLADRow = (type, deleteType) => {

    var rowIndex = 0;

    switch (type) {
      case LBL_TYPE_AC:
        switch (deleteType) {
          case DELETE_TYPE_CURRENT:
            rowIndex = this.state.acRowIndex;
            break;
          case DELETE_TYPE_LAST:
            rowIndex = this.state.gridArea.length - 1;
            break;
        }
        this.setState({gridArea: delete_row(this.state.gridArea, rowIndex)});
        localStorage.setItem("gridArea", JSON.stringify(delete_row(this.state.gridArea, rowIndex)));
        console.log("DELETE: " + localStorage.getItem("gridArea"));
        break;

      case LBL_TYPE_DT:
        switch (deleteType) {
          case DELETE_TYPE_CURRENT:
            rowIndex = this.state.dtRowIndex;
            break;
          case DELETE_TYPE_LAST:
            rowIndex = this.state.gridDate.length - 1;
            break;
        }
        this.setState({gridDate: delete_row(this.state.gridDate, rowIndex)});
        localStorage.setItem("gridDate", JSON.stringify(delete_row(this.state.gridDate, rowIndex)));
        break;

      case LBL_TYPE_LT:
        switch (deleteType) {
          case DELETE_TYPE_CURRENT:
            rowIndex = this.state.ltRowIndex;
            break;
          case DELETE_TYPE_LAST:
            rowIndex = this.state.gridLATA.length - 1;
            break;
        }
        this.setState({gridLATA: delete_row(this.state.gridLATA, rowIndex)});
        localStorage.setItem("gridLATA", JSON.stringify(delete_row(this.state.gridLATA, rowIndex)));
        break;

      case LBL_TYPE_TD:
        switch (deleteType) {
          case DELETE_TYPE_CURRENT:
            rowIndex = this.state.tdRowIndex;
            break;
          case DELETE_TYPE_LAST:
            rowIndex = this.state.gridTD.length - 1;
            break;
        }
        this.setState({gridTD: delete_row(this.state.gridTD, rowIndex)});
        localStorage.setItem("gridTD", JSON.stringify(delete_row(this.state.gridTD, rowIndex)));
        break;

      case LBL_TYPE_SD:
        switch (deleteType) {
          case DELETE_TYPE_CURRENT:
            rowIndex = this.state.sdRowIndex;
            break;
          case DELETE_TYPE_LAST:
            rowIndex = this.state.gridSD.length - 1;
            break;
        }
        this.setState({gridSD: delete_row(this.state.gridSD, rowIndex)});
        localStorage.setItem("gridSD", JSON.stringify(delete_row(this.state.gridSD, rowIndex)));
        break;

      case LBL_TYPE_NX:
        switch (deleteType) {
          case DELETE_TYPE_CURRENT:
            rowIndex = this.state.nxRowIndex;
            break;
          case DELETE_TYPE_LAST:
            rowIndex = this.state.gridNXX.length - 1;
            break;
        }
        this.setState({gridNXX: delete_row(this.state.gridNXX, rowIndex)});
        localStorage.setItem("gridNXX", JSON.stringify(delete_row(this.state.gridNXX, rowIndex)));
        break;

      case LBL_TYPE_TI:
        switch (deleteType) {
          case DELETE_TYPE_CURRENT:
            rowIndex = this.state.tiRowIndex;
            break;
          case INSERT_TYPE_END:
            rowIndex = this.state.gridTime.length - 1;
            break;
        }
        this.setState({gridTime: delete_row(this.state.gridTime, rowIndex)});
        localStorage.setItem("gridTime", JSON.stringify(delete_row(this.state.gridTime, rowIndex)));
        break;

      case LBL_TYPE_ST:
        switch (deleteType) {
          case DELETE_TYPE_CURRENT:
            rowIndex = this.state.stRowIndex;
            break;
          case INSERT_TYPE_END:
            rowIndex = this.state.gridState.length - 1;
            break;
        }
        this.setState({gridState: delete_row(this.state.gridState, rowIndex)});
        localStorage.setItem("gridState", JSON.stringify(delete_row(this.state.gridState, rowIndex)));
        break;
    }
  };

  /**
   * delete indicated cell
   * @param type        : tab type
   * Added by Ming Jin 2020/04/07
   */
  deleteLADCell = (type) => {
    let data = this.state.gridArea.slice(0);
    switch (type) {
      case LBL_TYPE_AC:
        data = delete_cell(this.state.gridArea, this.state.acRowIndex, this.state.acColIndex);
        this.setState({gridArea: data});
        localStorage.setItem("gridArea", JSON.stringify(data));
        break;

      case LBL_TYPE_DT:
        data = delete_cell(this.state.gridDate, this.state.dtRowIndex, this.state.dtColIndex);
        this.setState({gridDate: data});
        localStorage.setItem("gridDate", JSON.stringify(data));
        break;

      case LBL_TYPE_LT:
        data = delete_cell(this.state.gridLATA, this.state.ltRowIndex, this.state.ltColIndex);
        this.setState({gridLATA: data});
        localStorage.setItem("gridLATA", JSON.stringify(data));
        break;

      case LBL_TYPE_TD:
        data = delete_cell(this.state.gridTD, this.state.tdRowIndex, this.state.tdColIndex);
        this.setState({gridTD: data});
        localStorage.setItem("gridTD", JSON.stringify(data));
        break;

      case LBL_TYPE_NX:
        data = delete_cell(this.state.gridNXX, this.state.nxRowIndex, this.state.nxColIndex);
        this.setState({gridNXX: data});
        localStorage.setItem("gridNXX", JSON.stringify(data));
        break;

      case LBL_TYPE_TI:
        data = delete_cell(this.state.gridTime, this.state.tiRowIndex, this.state.tiColIndex);
        this.setState({gridTime: data});
        localStorage.setItem("gridTime", JSON.stringify(data));
        break;

      case LBL_TYPE_ST:
        data = delete_cell(this.state.gridState, this.state.stRowIndex, this.state.stColIndex);
        this.setState({gridState: data});
        localStorage.setItem("gridState", JSON.stringify(data));
        break;


      case LBL_TYPE_SD:
        data = delete_cell(this.state.gridSD, this.state.sdRowIndex, this.state.sdColIndex);
        this.setState({gridSD: data});
        localStorage.setItem("gridSD", JSON.stringify(data));
        break;
    }
  };

  /**
   * clear data and initialize for indicated tab
   * @param type        : tab type
   * Added by Ming Jin 2020/04/01
   */
  clearTabData = (type) => {

    var initGrid = Array(7).fill(Array(8).fill(''));

    switch (type) {
      case LBL_TYPE_AC:
        this.setState({gridArea: initGrid});
        localStorage.setItem("gridArea", JSON.stringify(initGrid));
        break;

      case LBL_TYPE_DT:
        this.setState({gridDate: initGrid});
        localStorage.setItem("gridDate", JSON.stringify(initGrid));
        break;

      case LBL_TYPE_LT:
        this.setState({gridLATA: initGrid});
        localStorage.setItem("gridLATA", JSON.stringify(initGrid));
        break;

      case LBL_TYPE_TD:
        this.setState({gridTD: initGrid});
        localStorage.setItem("gridTD", JSON.stringify(initGrid));
        break;

      case LBL_TYPE_SD:
        this.setState({gridSD: initGrid});
        localStorage.setItem("gridSD", JSON.stringify(initGrid));
        break;

      case LBL_TYPE_NX:
        this.setState({gridNXX: initGrid});
        localStorage.setItem("gridNXX", JSON.stringify(initGrid));
        break;

      case LBL_TYPE_TI:
        this.setState({gridTime: initGrid});
        localStorage.setItem("gridTime", JSON.stringify(initGrid));
        break;

      case LBL_TYPE_ST:
        this.setState({gridState: initGrid});
        localStorage.setItem("gridState", JSON.stringify(initGrid));
        break;
    }
  };

  render() {
    return (
        <div className="animated fadeIn mt-3 ml-2 mr-2 ">
          <Label className="ml-1"><strong style={{fontSize: 25}}>Label Definition</strong></Label>
            <Card>
              <CardBody>
                <Row>
                  <Col xs="12">
                    <div className="mt-2 mb-1 ml-1 mr-1" style={{backgroundColor: '#dfe1e3'}}>
                      <Row className="mt-2 ml-4 mr-4 pt-2 pb-1">
                        <Col xs="12" md="6" className="row">
                          <Label className="col-6 font-weight-bold">Dial#/Template *:</Label>
                          <Input className="col-6 form-control-sm" type="text" name="template" id="template" onChange={(ev) => this.handle(ev)} value={this.state.template}/>
                        </Col>
                      </Row>
                    </div>
                    <Card className="mb-1 ml-1 mr-1 mt-1 mb-1" style={{height:450}} >
                      <div>
                        <div className="ml-2 mr-2 mt-1 mb-1">
                          <Nav tabs className="custom">
                            {this.renderLADNavbar("1", "Area Code", this.state.isArea)}
                            {this.renderLADNavbar("2", "Date", this.state.isDate)}
                            {this.renderLADNavbar("3", "LATA", this.state.isLATA)}
                            {this.renderLADNavbar("4", "NXX", this.state.isNXX)}
                            {this.renderLADNavbar("5", "State", this.state.isState)}
                            {this.renderLADNavbar("6", "Tel#", this.state.isTel)}
                            {this.renderLADNavbar("7", "Time", this.state.isTime)}
                            {this.renderLADNavbar("8", "10-digit#", this.state.isTD)}
                            {this.renderLADNavbar("9", "6-digit#", this.state.isSD)}
                          </Nav>
                          <TabContent activeTab={this.state.activeLADTab} style={{height:400}}>
                            {this.renderLADTabPane("1", this.state.gridArea, LBL_TYPE_AC, this.handleAreaChange)}
                            {this.renderLADTabPane("2", this.state.gridDate, LBL_TYPE_DT, this.handleDateChange)}
                            {this.renderLADTabPane("3", this.state.gridLATA, LBL_TYPE_LT, this.handleLATAChange)}
                            {this.renderLADTabPane("4", this.state.gridNXX, LBL_TYPE_NX, this.handleNXXChange)}
                            {this.renderLADTabPane("5", this.state.gridState, LBL_TYPE_ST, this.handleStateChange)}
                            {this.renderLADTabPane("6", this.state.gridTel, LBL_TYPE_TE, this.handleTelChange)}
                            {this.renderLADTabPane("7", this.state.gridTime, LBL_TYPE_TI, this.handleTimeChange)}
                            {this.renderLADTabPane("8", this.state.gridTD, LBL_TYPE_TD, this.handleTdChange)}
                            {this.renderLADTabPane("9", this.state.gridSD, LBL_TYPE_SD, this.handleSdChange)}
                          </TabContent>
                        </div>
                      </div>
                    </Card>
                  </Col>
                </Row>
              </CardBody>
            </Card>
        </div>
    );
  }

  renderLADNavbar = (id, name, state) => (
    <NavItem>
      <NavLink className={classnames({active: this.state.activeLADTab === id})} onClick={() => {this.toggleLADTab(id);}}>
        {!state ? name : name + " *"}
      </NavLink>
    </NavItem>);

  renderLADTabPane = (id, data, type, func) => {
    return <TabPane tabId={id}>
      <table className="table-bordered fixed_header" style={{height:320}}>
        <thead>
        <tr>
          <th className="text-center">Number</th>
          <th className="text-center">Label</th>
          <th className="text-center">Definition</th>
          <th className="text-center">Definition</th>
          <th className="text-center">Definition</th>
          <th className="text-center">Definition</th>
          <th className="text-center">Definition</th>
          <th className="text-center">Definition</th>
          <th className="text-center">Definition</th>
        </tr>
        </thead>
        <tbody style={{fontSize: 11 }} style={{height:300}}>
        {data && data.map((value, i) => {return (<tr>
          <td style={{textAlign: 'center'}}>{i + 1}</td>
          {value.map((element, j) => {
            return (<td><Input type="text" className="form-control-sm" name={type + "_" + i + "_" + j}
                               value={element} onChange={func} onClick={() => this.setCellIndex(type, i, j)} disabled={this.state.disable}/></td>)})}
        </tr>)})
        }
        </tbody>
      </table>
      <div className="mt-2">
          <Button size="sm" color="primary" onClick={() => this.insertLADRow(type, INSERT_TYPE_ABOVE)} disabled={this.state.disable}>Insert Row Above</Button><span className="ml-3"/>
          <Button size="sm" color="primary" onClick={() => this.insertLADRow(type, INSERT_TYPE_BELOW)} disabled={this.state.disable}>Insert Row Below</Button><span className="ml-3"/>
          <Button size="sm" color="primary" onClick={() => this.insertLADRow(type, INSERT_TYPE_END)} disabled={this.state.disable}>Insert Row End</Button><span className="ml-3"/>
          <Button size="sm" color="primary" onClick={() => this.insertLADCell(type)} disabled={this.state.disable}>Insert Cell</Button><span className="ml-3"/>
          <Button size="sm" color="primary" onClick={() => this.deleteLADRow(type, DELETE_TYPE_CURRENT)} disabled={this.state.disable}>Delete Current Row</Button><span className="ml-3"/>
          <Button size="sm" color="primary" onClick={() => this.deleteLADRow(type, DELETE_TYPE_LAST)} disabled={this.state.disable}>Delete Last Row</Button><span className="ml-3"/>
          <Button size="sm" color="primary" onClick={() => this.deleteLADCell(type)} disabled={this.state.disable}>Delete Cell</Button><span className="ml-3"/>
          <Button size="sm" color="danger" onClick={() => this.clearTabData(type)} disabled={this.state.disable}>Clear Tab Data</Button><span className="ml-3"/>
      </div>
    </TabPane>
  }
}

export default withLoadingAndNotification(LAD);
