import React, {Component} from 'react';
import {Button, Card, CardBody, CardFooter, Col, Input, Label, Row} from 'reactstrap';
import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import { handle_change, handle_value_cpr, insert_row} from "../../../utils";
import {connect} from "react-redux";
import {LBL_TYPE_AC, LBL_TYPE_DT, LBL_TYPE_LT, LBL_TYPE_NX, LBL_TYPE_ST, LBL_TYPE_TE, LBL_TYPE_TI, LBL_TYPE_TD, LBL_TYPE_SD,
        LBL_TYPE_DA, LBL_TYPE_SW, LBL_TYPE_PC, LBL_TYPE_CA, LBL_TYPE_AN, LBL_TYPE_GT, INVALID_ROW, INVALID_COL} from "../../../constants/GlobalConstants";

class CPR extends Component {
  constructor(props) {
    super(props);
    this.state = {
      template: localStorage.getItem("template") || "",
      gridType: JSON.parse(localStorage.getItem("gridType")) || Array(8).fill(''),
      gridData: JSON.parse(localStorage.getItem("gridData")) || Array(5).fill(Array(8).fill('')),
      iec_array: JSON.parse(localStorage.getItem("iec")) || [],
      iac_array: JSON.parse(localStorage.getItem("iac")) || [],
      disable: localStorage.getItem("disable") === "1"|| false,
      timezone: '',
      ds: '',
      currentActiveRow: INVALID_ROW,
      currentActiveCol: INVALID_COL
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
        const state = {};
        state[ev.key] = JSON.parse(ev.newValue);
        this.setState(state);
      }
    });
  };

  handle = (event) => {
    const state = {};
    state[event.target.name] = event.target.value;
    this.setState(state);
  };

  handleCPRSelectChange = (ev) => {
    this.setState({gridType: handle_change(ev, this.state.gridType)});
    localStorage.setItem("gridType", JSON.stringify(handle_change(ev, this.state.gridType)))

  };

  setCPRActiveIndexes = async(row, cell) => {
    await this.setState({currentActiveRow: row, currentActiveCol: cell})
  }

  /**
   * insert row before indicated row 
   */
  insertCPRRowAbove = () => {
    let gridData = [...this.state.gridData]

    let activeRow = this.state.currentActiveRow != INVALID_ROW ? this.state.currentActiveRow : gridData.length;
    gridData.splice(activeRow, 0, Array(gridData[0].length).fill(""))

    this.setState({gridData, currentActiveRow: INVALID_ROW});
    localStorage.setItem("gridData", JSON.stringify(gridData));
  }

  /**
   * insert row after indicated row
   */
  insertCPRRowBelow = () => {
    let gridData = [...this.state.gridData]

    let activeRow = this.state.currentActiveRow != INVALID_ROW ? this.state.currentActiveRow : gridData.length;
    let belowRow = activeRow == 0 ? activeRow : activeRow + 1
    gridData.splice(belowRow, 0, Array(gridData[0].length).fill(""))

    this.setState({gridData, currentActiveRow: INVALID_ROW});
    localStorage.setItem("gridData", JSON.stringify(gridData));
  }

  /**
   * insert column to left of indicated col
   */
  insertCPRLeftColumn = () => {
    let gridData = [...this.state.gridData];
    let gridType = [...this.state.gridType];

    let activeCol = this.state.currentActiveCol == INVALID_COL ? 0 : this.state.currentActiveCol;
    activeCol = activeCol < 0 ? 0 : activeCol;

    let gridColDtata = gridData.map((item) => {
      item.splice(activeCol, 0, "");
      return item;
    })

    gridType.splice(activeCol, 0, "");

    this.setState({gridData: gridColDtata, gridType,  currentActiveCol: INVALID_COL});
    localStorage.setItem("gridData", JSON.stringify(gridColDtata));
    localStorage.setItem("gridType", JSON.stringify(gridType));
  }

  /**
   * insert column to right of indicated col
   */
  insertCPRRightColumn = () => {
    let gridData = [...this.state.gridData];
    let gridType = [...this.state.gridType];

    let colLength = this.state.gridData[0].length
    let activeCol = this.state.currentActiveCol == INVALID_COL ? colLength : this.state.currentActiveCol + 1;

    let gridColDtata = gridData.map((item) => {
      item.splice(activeCol, 0, "");
      return item;
    })

    gridType.splice(activeCol, 0, "");

    this.setState({gridData: gridColDtata, gridType,  currentActiveCol: INVALID_COL});
    localStorage.setItem("gridData", JSON.stringify(gridColDtata));
    localStorage.setItem("gridType", JSON.stringify(gridType));
  }

  /**
   * get copy & paste value
   */
  getCopyPasteValue = (ev) => {
    let gridData = [...this.state.gridData];
    let [ row, col ] = ev.target.name.split("_");

    let values = ev.target.value.split(" ");
    values.map(items => {
      let item = items.split("\t");
      if(item.length > 1) {
        item.map(cpr => {
          if(!gridData[row]) {
            gridData.push(Array(8).fill(''));
          }
          gridData[row][col] = cpr;
          col++
        })
        row++; col = 0;
      }
    })

    return gridData;
  }

  /**
   * handle value
   */
  handleCPRCellChange = ev => {
    if(ev.target.value.includes("\t")) {
      this.setState({gridData: this.getCopyPasteValue(ev)});
      localStorage.setItem("gridData", JSON.stringify(this.getCopyPasteValue(ev)))
      console.log(this.getCopyPasteValue(ev));

    } else {
      this.setState({gridData: handle_value_cpr(ev, this.state.gridData)});
      localStorage.setItem("gridData", JSON.stringify(handle_value_cpr(ev, this.state.gridData)))

    }
  };

  /**
   * insert a row to last
   */
  insertCPRRowEnd = () => {
    let gridData = this.state.gridData;
    this.setState({gridData: insert_row(gridData)});
    localStorage.setItem("gridData", JSON.stringify(insert_row(gridData)));
  };

  /**
   * delete last row
   */
  deleteCPRRowEnd = () => {
    let rowLength = this.state.gridData.length;
    if(rowLength == 1) return false;

    let activeCol = this.state.currentActiveCol == INVALID_COL ? rowLength - 1 : this.state.currentActiveRow;
    let gridData = this.state.gridData;
    gridData.splice(activeCol, 1);

    this.setState({gridData: gridData,  currentActiveCol: INVALID_COL});
    localStorage.setItem("gridData", JSON.stringify(gridData))
  };

  /**
   * insert a column to last
   */
  insertCPRColumn = () => {
    let gridData = [...this.state.gridData];
    let gridType = [...this.state.gridType];

    console.log(gridData);
    let activeCol = this.state.gridData[0].length
    let gridColDtata = gridData.map((item) => {
      item.splice(activeCol, 0, "");
      return item;
    })
    gridType.splice(activeCol, 0, "");

    console.log(gridColDtata);

    this.setState({gridData: gridColDtata, gridType});  
    localStorage.setItem("gridData", JSON.stringify(gridColDtata));
    localStorage.setItem("gridType", JSON.stringify(gridType));
  };

  /**
   * delete last column
   */
  deleteCPRColumn = () => {
    let colLength = this.state.gridData[0].length
    let activeCol = this.state.currentActiveCol == INVALID_COL ? colLength - 1  : this.state.currentActiveCol;
    if(colLength == 1) return false;

    let gridType = this.state.gridType;
    let gridData = this.state.gridData.map((item) => {
      item.splice(activeCol, 1);
      return item;
    })
    gridType.splice(activeCol, 1);

    this.setState({gridType, gridData, currentActiveCol: INVALID_COL});
    localStorage.setItem("gridData", JSON.stringify(gridData));
    localStorage.setItem("gridType", JSON.stringify(gridType));
  };

  updateCpr = () => {
    console.log("Todo for updates")
    // window.close();
  }


  render() {
    return (
      <div className="animated fadeIn mt-3 ml-2 mr-2">
        <Label className="ml-1"><strong style={{fontSize: 25}}>Call Processing</strong></Label>
        <Card>
          <CardBody>
            <Row>
              <Col xs="12">
                <div className="mt-2 mb-1  mr-1" style={{backgroundColor: '#dfe1e3'}}>
                  <Row className="mt-2 ml-4 mr-4 pt-2 pb-1">
                    <Col xs="12" md="6" className="row">
                      <Label className="col-5 font-weight-bold">Dial#/Template *:</Label>
                      <Input className="col-6 ml-4 form-control-sm" type="text" name="template" id="template" onChange={(ev) => this.handle(ev)} value={this.state.template}/>
                    </Col>
                  </Row>
                  {/* <Row className="mt-2 ml-4 mr-4 pt-2 pb-1">
                    <Col xs="12" md="6" className="row">
                      <Label className="col-5 font-weight-bold">Select CPR File :</Label>
                      <Input className="col-6 mb-3 ml-3 form-control-sm" type="file" name="file" id="exampleFile" />
                    </Col>
                  </Row> */}
                </div>
                <div className="mb-1 ml-1 mr-1 mt-1 mb-1"
                     style={{backgroundColor: '#dfe1e3'}}>
                  <Col xs="12" className="mt-2 mb-1 pt-2">
                    <table className="table-bordered fixed_header">
                      <thead>
                      <tr>
                        {this.state.gridType && this.state.gridType.map((value) => {
                          if (value === LBL_TYPE_TI) value = "Time";
                          else if (value === LBL_TYPE_DT) value = "Date";
                          else if (value === LBL_TYPE_TE) value = "Tel#";
                          else if (value === LBL_TYPE_DA) value = "Day";
                          else if (value === LBL_TYPE_LT) value = "LATA";
                          else if (value === LBL_TYPE_ST) value = "State";
                          else if (value === LBL_TYPE_AC) value = "Area Code";
                          else if (value === LBL_TYPE_NX) value = "NXX";
                          else if (value === LBL_TYPE_SW) value = "Switch";
                          else if (value === LBL_TYPE_PC) value = "Percent";
                          else if (value === LBL_TYPE_CA) value = "Carrier";
                          else if (value === LBL_TYPE_AN) value = "Announcement";
                          else if (value === LBL_TYPE_SD) value = "6-digit#";
                          else if (value === LBL_TYPE_TD) value = "10-digit#";
                          else if (value === LBL_TYPE_GT) value = "Go to";
                          else if (!value) value = "<select>";
                          return (<th className="text-center">{value}</th>)
                        })}
                      </tr>
                      </thead>
                      <tbody style={{fontSize: 11 }}>
                      <tr>
                        {this.state.gridType && this.state.gridType.map((value, i) => {
                          return (
                            <td key={i}>
                              <Input type="select" name={'type_' + i} className="form-control-sm" value={value} onChange={(ev) => this.handleCPRSelectChange(ev)}
                                     disabled={this.state.disable}>
                                <option>&lt;select&gt;</option>
                                <option value={LBL_TYPE_TI}>Time</option>
                                <option value={LBL_TYPE_DT}>Date</option>
                                <option value={LBL_TYPE_TE}>Tel#</option>
                                <option value={LBL_TYPE_DA}>Day</option>
                                <option value={LBL_TYPE_LT}>LATA</option>
                                <option value={LBL_TYPE_ST}>State</option>
                                <option value={LBL_TYPE_AC}>Area Code</option>
                                <option value={LBL_TYPE_NX}>NXX</option>
                                <option value={LBL_TYPE_SW}>Switch</option>
                                <option value={LBL_TYPE_PC}>Percent</option>
                                <option value={LBL_TYPE_CA}>Carrier</option>
                                <option value={LBL_TYPE_AN}>Announcement</option>
                                <option value={LBL_TYPE_SD}>6-digit#</option>
                                <option value={LBL_TYPE_TD}>10-digit#</option>
                                <option value={LBL_TYPE_GT}>Go to</option>
                              </Input>
                            </td>
                          )
                        })}
                      </tr>
                      {
                        this.state.gridData && this.state.gridData.map((datas, k) => {
                          return (
                            <tr key={k}>
                              {
                                datas.map((data, g) => {
                                  return (
                                    <td key={g}><Input type="text" className="form-control-sm" name={k + "_" + g}
                                               value={data} onClick={() => this.setCPRActiveIndexes(k, g)} 
                                               onChange={(ev) => this.handleCPRCellChange(ev)}
                                               disabled={this.state.disable}/></td>
                                  )
                                })
                              }
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    <div className="mt-2 pb-2">
                      <Button size="sm" color="primary" onClick={this.updateCpr} disabled={this.state.disable}>Update</Button>
                      <Button size="sm" color="primary" onClick={this.insertCPRRowEnd}  className="ml-3" disabled={this.state.disable}>Insert Row End</Button>
                      <Button size="sm" color="primary" onClick={this.insertCPRRowAbove} className="ml-3" disabled={this.state.disable}>Insert Row Above</Button>
                      <Button size="sm" color="primary" onClick={this.insertCPRRowBelow} className="ml-3" disabled={this.state.disable}>Insert Row Below</Button>
                      <Button size="sm" color="primary" onClick={this.deleteCPRRowEnd} className="ml-3" disabled={this.state.disable}>Delete Row</Button>
                    </div>
                    <div className="mt-1 pb-3">
                      <Button size="sm" color="primary" onClick={this.insertCPRColumn} disabled={this.state.disable}>Insert Column</Button>
                      <Button size="sm" color="primary" onClick={this.insertCPRLeftColumn} className="ml-3" disabled={this.state.disable}>Insert Left Column</Button>
                      <Button size="sm" color="primary" onClick={this.insertCPRRightColumn} className="ml-3" disabled={this.state.disable}>Insert Right Column</Button>
                      <Button size="sm" color="primary" onClick={this.deleteCPRColumn} className="ml-3" disabled={this.state.disable}>Delete Column</Button>
                    </div>
                  </Col>
                </div>
                <Row>
                  <Col xs="12">
                    <div className="mb-1 ml-1 mr-1" style={{backgroundColor: '##dfe1e3'}}>
                      <div className="ml-1 mr-1 mt-2 mb-2 row">
                        <Col xs="6" className="row">
                          <Col xs="6">IntraLATA Carrier:</Col>
                          <Col xs="6"><Input type="select" className="form-control-sm" disabled={this.state.disable}>
                            {this.state.iac_array.map(value => {
                              return <option value={value}>{value}</option>
                            })}
                          </Input></Col>
                        </Col>
                        <Col xs="6" className="row">
                          <Col xs="6">InterLATA Carrier:</Col>
                          <Col xs="6"><Input type="select" className="form-control-sm" disabled={this.state.disable}>
                            {this.state.iec_array.map(value => {
                              return <option value={value}>{value}</option>
                            })}
                          </Input></Col>
                        </Col>
                        <Col xs="6" className="row mt-1">
                          <Col xs="6">Timezone:</Col>
                          <Col xs="6">
                            <Input type="select" className="form-control-sm" value={this.state.timezone} disabled={this.state.disable}>
                              <option/>
                              <option value="C">Central</option>
                              <option value="A">Atlantic</option>
                              <option value="B">Bering</option>
                              <option value="E">Eastern</option>
                              <option value="H">Hawaiian-Aleutian</option>
                              <option value="M">Mountain</option>
                              <option value="N">Newfoundland</option>
                              <option value="P">Pacific</option>
                              <option value="Y">Alaska</option>
                            </Input>
                          </Col>
                        </Col>
                        <Col xs="6" className="row mt-1">
                          <Col xs="6">Daylight Savings:</Col>
                          <Col xs="6" className="text-right"><Input type="checkbox" checked={this.state.ds === "Y"} disabled={this.state.disable}/></Col>
                        </Col>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Col>
            </Row>
          </CardBody>
        </Card>
      </div>
    );
  }
}

export default connect((state) => ({types: state.auth.types, ladData: state.auth.ladData}))(withLoadingAndNotification(CPR));
