import React from 'react';
import {
  Button, Card, CardBody, CardHeader, Col, Collapse, FormGroup, FormText, Input, Label,
  Modal, ModalBody, ModalFooter, ModalHeader, Nav, NavItem, NavLink, Row, TabContent, TabPane
} from "reactstrap";

// Date Picker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// Checkbod Tree
import CheckboxTree from 'react-checkbox-tree';
import 'react-checkbox-tree/lib/react-checkbox-tree.css';

import classnames from "classnames";
import * as gConst from "../../../constants/GlobalConstants";
import ChoiceModal from "../../../components/Common/ChoiceModal"
import {NotificationContainer} from'react-notifications';
import 'react-notifications/lib/notifications.css';

import {formattedNumber} from "../../../utils";
import LADSubTabPanel from "../../../components/CusRec/LADSubTabPanel";
import Loader from "../../../components/Loader";

function renderMixin(Component) {
  return class Render extends Component {
    render() {
      return (
        <>
          <Label className="ml-1"><strong style={{fontSize: 25}}>Customer Record Admin Data</strong></Label>
          <Row>
            <Col xs="12">

              {/************************************************* Retrieve Card ****************************************************/}
              <Card>
                <CardHeader spacing={4}>
                  <strong style={{fontSize: 20}}>{this.state.retrieveCardTitle}</strong>
                  <div className="card-header-actions" hidden={this.state.bRetrieveCardIconHidden}>
                    <a className="card-header-action btn btn-minimize" data-target="#collapseExample" onClick={this.toggle_retrieve.bind(this)}>
                      <i className={this.state.bExpRetrieve ? "icon-arrow-up" : "icon-arrow-down"}/>
                    </a>
                  </div>
                </CardHeader>

                <Collapse isOpen={this.state.bExpRetrieve} id="collapseExample">
                  <CardBody>
                      <Row className="ml-4">
                        <Col xs="12" md="6" className="row">
                          <Label className="font-weight-bold mr-3 pt-1">Toll-Free Number *: </Label>
                          <Input className="col-7 form-control-sm" type="text" name="searchNum" id="searchNum"
                                 onKeyDown={(ev) => this.onKeyDownToRetrieve(ev)} onChange={(ev) => this.handleUppercase(ev)} value={this.state.searchNum}/>
                        </Col>

                        <Col xs="12" md="4" className="row ml-2">
                          <Label className="font-weight-bold mr-2 pt-1">Effective Date Time: </Label>
                          <Row className="col-7 form-control-sm pt-0">
                            <Col>
                              <DatePicker
                                invalid={this.state.effDateErr}
                                dateFormat="MM/dd/yyyy hh:mm a"
                                selected={this.state.searchEffDtTm}
                                id="searchEffDtTm"
                                showTimeSelect
                                timeIntervals={15}
                                onChange={ (date) => {
                                  this.setState({searchEffDtTm: date});
                                }}
                                className="form-control"
                                timeCaption="time"/>
                            </Col>
                          </Row>
                        </Col>

                        <Col xs={6} md={2} className="text-right">
                          <Button size="md-10" color="primary" disabled={!this.state.bRetrieveEnable} onClick={this.onSearchNumber}>Retrieve</Button>
                        </Col>
                      </Row>
                  </CardBody>
                </Collapse>
              </Card>

              {/************************************************ Result Card ********************************************************/}
              <Card>
                <CardHeader spacing={4} hidden={this.state.bResultHeaderHidden}>
                  <strong style={{fontSize: 20}}>{this.state.resultCardTitle}</strong>

                  <select xs="6" md="6" className="form-control-sm mt-1 ml-3" hidden={this.state.bEffDtTmListHidden} disabled={this.state.bEffDtTmDisable}
                          name="effDtTmStat" id="effDtTmStat" onChange={(ev) => this.onEffDtTmSelChange(ev)} value={this.state.effDtTmStat}>
                    <>{this.state.effDtTmStatList.map(value => {return <option key={value}>{value}</option>})}</>
                  </select>

                  <div className="card-header-actions">
                    {/*<Button size="md-10" className="mr-2" color="primary" hidden={this.state.num === ''} onClick={this.onDownload}>Download</Button>*/}
                    {/*<Button size="md-10" className="mr-2" color="primary" hidden={this.state.num === ''} onClick={this.onPrint}>Print</Button>*/}
                    <a className="card-header-action btn btn-minimize" data-target="#collapseExample" onClick={this.toggle_result.bind(this)}>
                      <i className={(this.state.bExpResult && this.state.num !== '') ? "icon-arrow-up" : "icon-arrow-down"}/>
                    </a>
                  </div>
                </CardHeader>

                <Collapse isOpen={this.state.bExpResult && this.state.num !== ''} id="collapseExample">
                {/*<Collapse isOpen={true} id="collapseExample">*/}
                  <div className="mt-3 mb-1 ml-4 mr-4">
                    <Row xs="12" md="12">
                      <Col>
                        <Nav tabs className="custom">
                          {this.renderMainNavbar("1", "Basic")}
                          {this.renderMainNavbar("2", "CPR")}
                          {this.renderMainNavbar("3", "LAD")}
                        </Nav>
                      </Col>
                      <Col className="text-right mb-1">
                        <Input type="file" className="file" id="attachment" style={{display: 'none'}} onChange={this.onImportFileSelected} accept=".xlsx"/>
                        {/*<Spinner animation="border" size='sm' className="mr-2"/>*/}
                        {this.state.isImporting ? <Loader fullPage loading/> : ""}
                        <Button size="md" color="primary" className="mr-2" id="btnAttachment" disabled={this.state.disable} onClick={this.onImportCprReportData}>Import CPR Report Data</Button>
                      </Col>
                    </Row>

                    <TabContent activeTab={this.state.activeMainTab} className="pt-0">
                      {/* Basic Tab */}
                      <TabPane tabId="1">
                        <div className=" mt-0 ml-2 mr-2 mb-2">
                          <Row xs="12" md="12">
                            <Col>
                              <Label className="ml-1"><strong style={{fontSize: 25}}>Basic Data</strong></Label>
                            </Col>
                            <Col className="text-right mb-1">
                              <Button size="md" color="danger" className="mr-2" disabled={this.state.disable} onClick={this.onClearBasicData}>Clear</Button>
                            </Col>
                          </Row>

                          <Card className="mb-0 pt-2 pl-2 pr-2" >

                            <div className="mb-1 ml-2 mr-2 mt-1 pt-1" style={{backgroundColor: gConst.PANEL_BACKGROUND_COLOR}}>

                              {/*  at creating */}
                              <Row className="mb-1 ml-4 mr-4 mt-1 pb-1" hidden={this.state.action !== gConst.ACTION_CREATE}>
                                <Col xs="6" md="3" className="row mr-2">
                                  <Label className="col-6 font-weight-bold text-right mt-2">Resp Org:</Label>
                                  <Input className="col-6 form-control-sm mt-1" type="text" name="respOrg" id="respOrg" onChange={(ev) => this.handleOnCR(ev)} value={this.state.respOrg} disabled={this.state.disable}/>
                                </Col>
                                <Col xs="6" md="3" className="row ml-1">
                                  <Label className="font-weight-bold mr-2 mt-2">Eff. Date Time: </Label>
                                  <Row className="col-8 form-control-sm">
                                    <Col>
                                      <DatePicker
                                        dateFormat="MM/dd/yyyy hh:mm a"
                                        selected={this.state.createEffDtTm}
                                        id="createEffDtTm"
                                        showTimeSelect
                                        minDate={new Date()}
                                        timeIntervals={15}
                                        onChange={ (date) => {
                                          this.setState({createEffDtTm: date});
                                        }}
                                        className="form-control"
                                        timeCaption="time"/>
                                      {this.state.effDateErr ? <FormText>Effective Date field is required</FormText> : ""}
                                    </Col>
                                  </Row>
                                </Col>
                                <Col xs="6" md="3" className="row" style={{marginLeft: '-45px'}}>
                                  <Label className="col-6 font-weight-bold text-right mt-2">Customer Id:</Label>
                                  <Input className="col-6 form-control-sm mt-1" type="text" name="customerId" id="customerId" onChange={(ev) => this.handleOnCR(ev)} value={this.state.customerId}/>
                                </Col>
                                <Col xs="3" md="1" className="row ml-1">
                                  <Label className="col-12 font-weight-bold mt-2">Now</Label>
                                  <Input type="checkbox" name="createNow" id="createNow" className="form-control ml-3" style={{height: '20px', 'marginTop': '0.5rem'}}
                                         onChange={(ev) => this.handleCheckOnCR(ev)} checked={this.state.createNow} />
                                </Col>
                                <Col xs="3" md="2" className="row ml-2 mr-1">
                                  <Label htmlFor="highPriCreating" className="col-12 font-weight-bold mt-2">High Priority</Label>
                                  <Input type="checkbox" name="priority" id="priority" className="form-control mr-1 ml-4" style={{height: '20px', 'marginTop': '0.5rem'}}
                                         onChange={(ev) => this.handleCheckOnCR(ev)} checked={this.state.priority}/>
                                </Col>
                              </Row>


                              {/* at no creating */}
                              <Row className="mb-2 m2-2 pt-3" hidden={this.state.action === gConst.ACTION_CREATE}>
                                <Col xs="12" md="4" className="row">
                                  <Label className="col-6 font-weight-bold text-right">Resp Org:</Label>
                                  <Input className="col-6 form-control-sm" type="text" name="respOrg" id="respOrg" onChange={(ev) => this.handleOnCR(ev)} value={this.state.respOrg} disabled={!(this.state.action === gConst.ACTION_COPY && this.state.copyAction === gConst.COPYACTION_NEW)}/>
                                </Col>
                                <Col xs="12" md="4" className="row">
                                  <Label className="col-6 font-weight-bold text-right">Customer Id:</Label>
                                  <Input className="col-6 form-control-sm" type="text" name="customerId" id="customerId" onChange={(ev) => this.handleOnCR(ev)} value={this.state.customerId} disabled/>
                                </Col>
                                <Col xs="12" md="4" className="row mr-2">
                                  <Label htmlFor="highPriCreating" className="col-6 font-weight-bold text-right">High Priority</Label>
                                  <Input type="checkbox" name="priority" id="priority" className="form-control" style={{height: '20px', 'marginTop': '0.1rem', 'marginLeft': '0rem'}}
                                         onChange={(ev) => this.handleCheckOnCR(ev)} checked={this.state.priority}/>
                                </Col>
                              </Row>



                              {/************* This is the row that includes the agent, telco, hold *************/}
                              <Row className="mt-2 pb-2">
                                <Col xs="12" md="4" className="row">
                                  <Label className="col-6 text-right font-weight-bold">Agent:</Label>
                                  <Input className="col-6 form-control-sm" type="text" name="agent" id="agent" onChange={(ev) => this.handleOnCR(ev)} value={this.state.agent} disabled={this.state.action !== gConst.ACTION_CREATE} />
                                </Col>
                                <Col xs="12" md="4" className="row">
                                  <Label className="col-6 text-right font-weight-bold">Telco:</Label>
                                  <Input className="col-6 form-control-sm" type="text" name="telco" id="telco" onChange={(ev) => this.handleOnCR(ev)} value={this.state.telco} disabled={this.state.disable}/>
                                </Col>
                                <Col xs="12" md="4" className="row">
                                  <Label className="col-6 text-right font-weight-bold">Hold:</Label>
                                  <Input className="col-6 form-control-sm" type="select" name="hold" id="hold" onChange={(ev) => this.handleOnCR(ev)} value={this.state.hold} disabled={this.state.disable}>
                                    <option value="N">No</option>
                                    <option value="Y">Yes</option>
                                  </Input>
                                </Col>
                              </Row>

                              {/************* This is the row that includes the End Subscriber Name, End Subscriber Address *************/}
                              <Row className="mt-4 pb-2 ml-2 mr-5">
                                <Col xs="12" md="6" className="row">
                                  <Label className="col-6 text-right font-weight-bold">End Subscriber Name:</Label>
                                  <Input className="col-6 form-control-sm" type="text" name="endSub" id="endSub" onChange={(ev) => this.handleOnCR(ev)} value={this.state.endSub} disabled={this.state.disable}/>
                                </Col>
                                <Col xs="12" md="6" className="row">
                                  <Label className="col-6 text-right font-weight-bold">End Subscriber Address:</Label>
                                  <Input className="col-6 form-control-sm" type="text" name="endSubAddr" id="endSubAddr" onChange={(ev) => this.handleOnCR(ev)} value={this.state.endSubAddr} disabled={this.state.disable}/>
                                </Col>
                              </Row>

                              {/************* This is the row that includes the Service Order Number, Support Form Number *************/}
                              <Row className="pb-2 ml-2 mr-5">
                                <Col xs="12" md="6" className="row text-center">
                                  <Label className="col-6 text-right font-weight-bold">Service Order Number:</Label>
                                  <Input className="col-6 form-control-sm" type="text" name="svcOrderNum" id="svcOrderNum" onChange={(ev) => this.handleOnCR(ev)} value={this.state.svcOrderNum} disabled={this.state.disable}/>
                                </Col>
                                <Col xs="12" md="6" className="row">
                                  <Label className="col-6 text-right font-weight-bold">Support Form Number:</Label>
                                  <Input className="col-6 form-control-sm" type="text" name="suppFormNum" id="suppFormNum" onChange={(ev) => this.handleOnCR(ev)} value={this.state.suppFormNum} disabled={this.state.disable}/>
                                </Col>
                              </Row>

                              {/************* This is the row that includes the Approval, Last Updated, Last User, Prev User *************/}
                              <Row className="mt-4 pb-3"  hidden={this.state.action === gConst.ACTION_CREATE || (this.state.action === gConst.ACTION_COPY && this.state.copyAction === gConst.COPYACTION_NEW)}>
                                <Col xs="12" md="3" className="row">
                                  <Label className="col-6 text-right font-weight-bold">Approval:</Label>
                                  <Input className="col-6 form-control-sm" type="text" name="approval" id="approval" onChange={(ev) => this.handleOnCR(ev)} value={this.state.approval} disabled/>
                                </Col>
                                <Col xs="12" md="3" className="row">
                                  <Label className="col-6 text-right font-weight-bold">Last Updated:</Label>
                                  <Input className="col-6 form-control-sm" type="text" name="lastUpDt" id="lastUpDt" onChange={(ev) => this.handleOnCR(ev)} value={this.state.lastUpDt} disabled/>
                                </Col>
                                <Col xs="12" md="3" className="row">
                                  <Label className="col-6 text-right font-weight-bold">Last User:</Label>
                                  <Input className="col-6 form-control-sm" type="text" name="lastUser" id="lastUser" onChange={(ev) => this.handleOnCR(ev)} value={this.state.lastUser} disabled/>
                                </Col>
                                <Col xs="12" md="3" className="row">
                                  <Label className="col-6 text-right font-weight-bold">Prev User:</Label>
                                  <Input className="col-6 form-control-sm" type="text" name="prevUser" id="prevUser" onChange={(ev) => this.handleOnCR(ev)} value={this.state.prevUser} disabled/>
                                </Col>
                              </Row>
                            </div>

                            <Row>
                              {/************************* Destination Pane *************************/}
                              <Col md="6" xs="12">
                                <div className="ml-2 mr-1 mt-1 mb-2 pb-2" style={{backgroundColor: gConst.PANEL_BACKGROUND_COLOR}}>
                                  <div style={{backgroundColor: '#9a9ea3'}}>
                                    <Label className="ml-3 mt-1 mb-1 font-weight-bold">Destination</Label>
                                  </div>
                                  <table className="table-bordered table-responsive-lg mt-2 mr-4 ml-4 pb-2 col-11">
                                    <thead>
                                    <tr>
                                      <th className="text-center">Select</th>
                                      <th className="text-center">Number</th>
                                      <th className="text-center">#Lines</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {
                                      this.state.destNums && this.state.destNums.map((data, k) => {
                                        return (
                                          <tr key={k}>
                                            <td><input type="checkbox" name={"selDest_" + k} id={"selDest_" + k} className="form-control" checked={this.state.selDest[k]}
                                                       style={{height: '20px', 'marginTop': '0.1rem', 'marginLeft': '0rem'}} onChange={(ev) => this.handleDestSel(ev)} disabled={this.state.disable} /></td>
                                            <td><Input type="text" name={"destNum_" + k} id={"destNum_" + k} onChange={(ev) => this.handleDestNums(ev)} className="form-control-sm" value={data.destNum} disabled={this.state.disable}/></td>
                                            <td><Input type="text" name={"numTermLine_" + k} id={"numTermLine_" + k} onChange={(ev) => this.handleDestNums(ev)} className="form-control-sm" value={data.numTermLine} disabled={this.state.disable}/></td>
                                          </tr>
                                        )
                                      })
                                    }
                                    <tr>
                                    </tr>
                                    </tbody>
                                  </table>
                                  <div className="mt-2 mr-4 text-right">
                                    <Button size="md" className="ml-3" color="primary" disabled={this.state.disable} onClick={this.onAddDestination}>Add Row</Button>
                                    <Button size="md" className="ml-3" color="danger" disabled={this.state.disable || this.state.bNoSelDest} onClick={this.onRemoveDestination}>Remove Row</Button>
                                  </div>
                                </div>
                              </Col>

                              {/************************* Contact Information Pane *************************/}
                              <Col md="6" xs="12">
                                <div className="mb-1 mr-2 mt-1" style={{backgroundColor: gConst.PANEL_BACKGROUND_COLOR}}>
                                  <div style={{backgroundColor: '#9a9ea3'}}>
                                    <Label className="ml-3 mt-1 mb-1 font-weight-bold">Contact Information</Label>
                                  </div>
                                  <Row className="mt-2 mr-4">
                                    <Label className="col-4 font-weight-bold text-right">Contact Person:</Label>
                                    <Input className="col-8 text-left form-control-sm" type="text" name="contactName" id="contactName" onChange={(ev) => this.handleOnCR(ev)} value={this.state.contactName} disabled={this.state.disable}/>
                                  </Row>
                                  <Row className="mt-1 mr-4">
                                    <Label className="col-4 font-weight-bold text-right">Contact Number:</Label>
                                    <Input className="col-8 text-left form-control-sm" type="text" name="contactNumber" id="contactNumber" onChange={(ev) => this.handleOnCR(ev)} value={this.state.contactNumber} disabled={this.state.disable}/>
                                  </Row>
                                  <Row className="mt-1 mb-1 mr-4 pb-2">
                                    <Label className="col-4 font-weight-bold text-right">Notes:</Label>
                                    <Input className="col-8 text-left form-control-sm" type="textarea" name="notes" id="notes" rows="3" onChange={(ev) => this.handleOnCR(ev)} value={this.state.notes} disabled={this.state.disable}/>
                                  </Row>
                                </div>
                              </Col>
                            </Row>

                            {/************************* Disconnect info Pane *************************/}
                            <div className="mb-1 ml-2 mr-2 row" style={{backgroundColor: gConst.PANEL_BACKGROUND_COLOR}}
                                 hidden={this.state.status === gConst.STAT_OLD || this.state.status === gConst.STAT_ACTIVE || this.state.action === gConst.ACTION_CREATE
                                    || (this.state.disable && this.state.endIntDtTm === '' && this.state.referral === '')}>
                              <Col xs="12" md="6" className="row mt-2 mb-2">
                                <Label className="col-6 text-right">End Intercept:</Label>

                                <DatePicker
                                  id="effDate"
                                  placeholderText="MM/DD/YYYY"
                                  dateFormat="MM/dd/yyyy"
                                  selected={this.state.endIntDtTm}
                                  onChange={this.handleEndIntDtTm}
                                  timeIntervals={15}
                                  minDate={new Date()}
                                  className="form-control"
                                />
                              </Col>
                              <Col xs="12" md="6" className="row mt-2 mb-2">
                                <Label className="col-6 text-right">Referral:</Label>
                                <Input className="col-6 form-control-sm" type="select" name="referral" id="referral" onChange={(ev) => this.handleOnCR(ev)} value={this.state.referral} disabled={this.state.disable}>
                                  <option value="">SELECT</option>
                                  <option value="N">No</option>
                                  <option value="Y">Yes</option>
                                </Input>
                              </Col>
                            </div>

                            <Row className="mb-0">
                              {/*  Area Of Service */}
                              <Col md="6" xs="12">
                                <div className="ml-1" style={{backgroundColor: gConst.PANEL_BACKGROUND_COLOR}}>
                                  <div style={{backgroundColor: '#9a9ea3'}}>
                                    <Label className="ml-3 mt-1 mb-1 font-weight-bold">Area of Service</Label>
                                  </div>
                                  <div className="ml-2 mr-2 mt-1 mb-1 pb-2">
                                    <Nav tabs className="custom">
                                      {this.renderAOSNavbar("1", "Networks", false)}
                                      {this.renderAOSNavbar("2", "States", false)}
                                      {this.renderAOSNavbar("3", "NPAs", false)}
                                      {this.renderAOSNavbar("4", "LATAs", false)}
                                      {this.renderAOSNavbar("5", "Labels", false)}
                                    </Nav>

                                    <TabContent activeTab={this.state.activeAOSTab}>
                                      {/* AOS Network */}
                                      <TabPane tabId="1">
                                        <Input type="text" name="network" id="network"
                                                 onChange={(ev) => this.handleUppercase(ev)} placeholder="Networks" value={this.state.network} disabled={this.state.disable}/>
                                        <div className="mt-2 text-right">
                                          <Button size="md" className="ml-3" color="primary" disabled={this.state.disable} onClick={this.onSelectAosNetwork}>Select</Button>
                                          <Button size="md" className="ml-3" color="danger"
                                                  disabled={this.state.disable || this.state.network === ''} onClick={this.onClearAosNetwork}>Clear</Button>
                                        </div>
                                      </TabPane>

                                      {/* AOS State */}
                                      <TabPane tabId="2">
                                        <Input type="text" name="state" id="state"
                                               onChange={(ev) => this.handleUppercase(ev)} placeholder="States" value={this.state.state} disabled={this.state.disable}/>
                                        <div className="mt-2 text-right">
                                          <Button size="md" className="ml-3" color="primary" disabled={this.state.disable} onClick={this.onSelectAosState}>Select</Button>
                                          <Button size="md" className="ml-3" color="danger"
                                                  disabled={this.state.disable || this.state.state === ''} onClick={this.onClearAosState}>Clear</Button>
                                        </div>
                                      </TabPane>

                                      {/* AOS NPA */}
                                      <TabPane tabId="3">
                                        <Input type="text" name="npa" id="npa"
                                               onChange={(ev) => this.handleUppercase(ev)} placeholder="NPAs" value={this.state.npa} disabled={this.state.disable}/>
                                        <div className="mt-2 text-right">
                                          <Button size="md" className="ml-3" color="primary" disabled={this.state.disable} onClick={this.onSelectAosNPA}>Select</Button>
                                          <Button size="md" className="ml-3" color="danger"
                                                  disabled={this.state.disable || this.state.npa === ''} onClick={this.onClearAosNPA}>Clear</Button>
                                        </div>
                                      </TabPane>

                                      {/* AOS LATA */}
                                      <TabPane tabId="4">
                                        <Input type="text" name="lata" id="lata"
                                               onChange={(ev) => this.handleUppercase(ev)} placeholder="LATAs" value={this.state.lata} disabled={this.state.disable}/>
                                        <div className="mt-2 text-right">
                                          <Button size="md" className="ml-3" color="primary" disabled={this.state.disable} onClick={this.onSelectAosLATA}>Select</Button>
                                          <Button size="md" className="ml-3" color="danger"
                                                  disabled={this.state.disable || this.state.lata === ''} onClick={this.onClearAosLATA}>Clear</Button>
                                        </div>
                                      </TabPane>

                                      {/* AOS Label */}
                                      <TabPane tabId="5">
                                        <Input type="text" name="label" id="label"
                                               onChange={(ev) => this.handleUppercase(ev)} placeholder="Labels" value={this.state.label} disabled={this.state.disable}/>
                                        <div className="mt-2 text-right">
                                          <Button size="md" className="ml-3" color="primary" disabled={this.state.disable} onClick={this.onSelectAosLabel}>Select</Button>
                                          <Button size="md" className="ml-3" color="danger"
                                                  disabled={this.state.disable || this.state.label === ''} onClick={this.onClearAosLabel}>Clear</Button>
                                        </div>
                                      </TabPane>
                                    </TabContent>
                                  </div>
                                </div>
                              </Col>

                              {/*  Carriers */}
                              <Col md="6" xs="12">
                                <div className="mr-1" style={{backgroundColor: gConst.PANEL_BACKGROUND_COLOR}}>
                                  <div style={{backgroundColor: '#9a9ea3'}}>
                                    <Label className="ml-3 mt-1 mb-1 font-weight-bold">Carriers</Label>
                                  </div>
                                  <div className="ml-2 mr-2 mt-1 mb-1 pb-2">
                                    <Nav tabs className="custom">
                                      {this.renderCarrierNavbar("1", "IntraLATA", false)}
                                      {this.renderCarrierNavbar("2", "InterLATA", false)}
                                    </Nav>

                                    <TabContent activeTab={this.state.activeCarrierTab}>
                                      {/* intraLATACarrier */}
                                      <TabPane tabId="1">
                                        {/*<Input type="text" name="intraLATACarrier" id="intraLATACarrier"*/}
                                               {/*onChange={(ev) => this.handleCarrier(ev)} placeholder="Intra LATA Carrier" value={this.state.intraLATACarrier} disabled={this.state.disable}/>*/}
                                        {/*<div className="mt-2 text-right">*/}
                                          {/*<Button size="md" className="ml-3" color="primary" disabled={this.state.disable} onClick={this.onSelectIntraLATACarrier}>Select</Button>*/}
                                          {/*<Button size="md" className="ml-3" color="danger"*/}
                                                  {/*disabled={this.state.disable || this.state.intraLATACarrier === ''} onClick={this.onClearIntraLATACarrier}>Clear</Button>*/}
                                        {/*</div>*/}

                                        <Input type="select" className="form-control-sm" name="intraLATACarrier" value={this.state.intraLATACarrier}
                                               onChange={(ev)=>this.handleCarrierSelect(ev)} disabled={this.state.disable}>
                                          {gConst.CARRIER_LIST.map((value, key) => {
                                            return <option value={value} key={"Intra_" + key}>{value}</option>
                                          })}
                                        </Input>
                                      </TabPane>

                                      {/* interLATACarrier */}
                                      <TabPane tabId="2">
                                        {/*<Input type="text" name="interLATACarrier" id="interLATACarrier"*/}
                                               {/*onChange={(ev) => this.handleCarrier(ev)} placeholder="Inter LATA Carrier" value={this.state.interLATACarrier} disabled={this.state.disable}/>*/}
                                        {/*<div className="mt-2 text-right">*/}
                                          {/*<Button size="md" className="ml-3" color="primary" disabled={this.state.disable} onClick={this.onSelectInterLATACarrier}>Select</Button>*/}
                                          {/*<Button size="md" className="ml-3" color="danger"*/}
                                                  {/*disabled={this.state.disable || this.state.interLATACarrier === ''} onClick={this.onClearInterLATACarrier}>Clear</Button>*/}
                                        {/*</div>*/}

                                        <Input type="select" className="form-control-sm" name="interLATACarrier" value={this.state.interLATACarrier}
                                               onChange={(ev)=>this.handleCarrierSelect(ev)} disabled={this.state.disable}>
                                          {gConst.CARRIER_LIST.map((value, key) => {
                                            return <option value={value} key={"Inter_" + key}>{value}</option>
                                          })}
                                        </Input>
                                      </TabPane>

                                    </TabContent>
                                  </div>
                                </div>
                              </Col>
                            </Row>
                          </Card>
                        </div>
                      </TabPane>

                      {/* CPR Tab */}
                      <TabPane tabId="2">
                        <div className=" mt-0 ml-2 mr-2">

                          <Row xs="12" md="12">
                            <Col>
                              <Label className="ml-1"><strong style={{fontSize: 25}}>Call Processing</strong></Label>
                            </Col>
                            <Col className="text-right mb-1">
                              <Button size="md" color="danger" className="mr-2" disabled={this.state.disable || this.state.cprSectNames.length === 0} onClick={this.onDeleteCpr}>Delete</Button>
                            </Col>
                          </Row>
                          <Card className="mb-2">
                            <CardBody className="pb-0">

                              <Row xs="12" md="12">
                                <Col>
                                  <Nav tabs className="custom " style={{'borderBottom':'none'}}>
                                    {this.state.cprSectNames.map((value, key) => {return this.renderCPRNavbar(key, value, false)})}
                                  </Nav>
                                </Col>
                                <Col className="text-right mb-1">
                                  <Button size="md" color="primary" className="mr-2" disabled={this.state.disable || this.state.cprSectNames.length === 0} onClick={this.onEditCprSectName}>Edit</Button>
                                  <Button size="md" color="primary" className="mr-2" disabled={this.state.disable} onClick={this.onAddCprSect}>Add</Button>
                                  <Button size="md" color="danger" className="mr-2" disabled={this.state.disable || this.state.cprSectNames.length < 2} onClick={this.onDeleteCprSect}>Delete</Button>
                                </Col>
                              </Row>

                              {this.state.cprGridCategory.map((v, index) => {
                                return <TabContent activeTab={this.state.activeCPRTab} style={{'marginTop': '-2px'}} >
                                  <TabPane tabId={index}>
                                      <div className="mb-1 ml-1 mr-1 mt-1 mb-1">
                                      <Col xs="12" className="mt-2 mb-1 pt-2">
                                        <table className="table-bordered fixed_header" style={{backgroundColor: '#EBEBEF'}}>
                                          <thead>
                                          <tr>
                                            {this.state.cprGridCategory[index] && this.state.cprGridCategory[index].map((value, key) => {
                                              if (!value) value = "<select>";
                                              return (<th className="text-center" key={"gridCategory_" + key}>{value}</th>)
                                            })}
                                          </tr>
                                          </thead>
                                          <tbody style={{fontSize: 11, height:340}}>
                                          <tr>
                                            {this.state.cprGridCategory[index] && this.state.cprGridCategory[index].map((value, i) => {
                                              return (
                                                <td key={i}>
                                                  <Input type="select" name={'type_' + i} className="form-control-sm" value={value}
                                                         onClick={() => this.setCPRActiveIndexes(index, -1, i)}
                                                         onChange={(ev) => this.handleCPRSelectChange(ev, index)}
                                                         disabled={this.state.disable || this.state.cprSectNames.length === 0}>
                                                    <option value=''>&lt;select&gt;</option>
                                                    <option value="time">Time</option>
                                                    <option value="date">Date</option>
                                                    <option value="termNum">Tel#</option>
                                                    <option value="dayOfWeek">Day</option>
                                                    <option value="lata">LATA</option>
                                                    <option value="state">State</option>
                                                    <option value="areaCode">Area Code</option>
                                                    <option value="nxx">NXX</option>
                                                    <option value="switch">Switch</option>
                                                    <option value="pctAlloc">Percent</option>
                                                    <option value="carrier">Carrier</option>
                                                    <option value="announcement">Announcement</option>
                                                    <option value="sixDigit">6-digit#</option>
                                                    <option value="tenDigit">10-digit#</option>
                                                    <option value="goto">Go to</option>
                                                  </Input>
                                                </td>
                                              )
                                            })}
                                          </tr>
                                          {
                                            this.state.cprGridData[index] && this.state.cprGridData[index].map((datas, k) => {
                                              return (
                                                <tr key={k}>
                                                  {
                                                    datas.map((data, g) => {
                                                      return (
                                                        <td key={g}>
                                                          <Input type="text" className="form-control-sm" name={k + "_" + g}
                                                             value={data} onBlur={this.onCPRFieldFocusOut}
                                                             onClick={() => this.setCPRActiveIndexes(index, k, g)}
                                                             onChange={(ev) => this.handleCPRCellChange(ev, index)}
                                                             disabled={this.state.disable || this.state.cprSectNames.length === 0 || this.state.cprGridCategory[index][g] == null || this.state.cprGridCategory[index][g] === ''}/>
                                                        </td>
                                                      )
                                                    })
                                                  }
                                                </tr>
                                              )
                                            })}
                                          </tbody>
                                        </table>

                                        <div className="text-center mt-2 mb-1">
                                          <Button size="sm" color="primary" className="ml-3 mt-2"
                                                  onClick={this.onInsertCPRRowAbove} disabled={this.state.disable || this.state.cprSectNames.length === 0}>Insert Row Above</Button>
                                          <Button size="sm" color="primary" className="ml-3 mt-2"
                                                  onClick={this.onInsertCPRRowBelow} disabled={this.state.disable || this.state.cprSectNames.length === 0}>Insert Row Below</Button>
                                          <Button size="sm" color="primary" className="ml-3  mt-2"
                                                  onClick={this.onInsertCPRRowEnd} disabled={this.state.disable || this.state.cprSectNames.length === 0}>Insert Row End</Button>
                                          <Button size="sm" color="primary" className="ml-3 mt-2"
                                                  onClick={this.onDeleteCPRRowEnd} disabled={this.state.disable || this.state.cprSectNames.length === 0}>Delete Row</Button>
                                          <Button size="sm" color="primary" className="ml-3 mt-2"
                                                  onClick={this.onInsertCPRColumnBefore} disabled={this.state.disable || this.state.cprSectNames.length === 0}>Insert Column Before</Button>
                                          <Button size="sm" color="primary" className="ml-3 mt-2"
                                                  onClick={this.onInsertCPRColumnAfter} disabled={this.state.disable || this.state.cprSectNames.length === 0}>Insert Column After</Button>
                                          <Button size="sm" color="primary" className="ml-3 mt-2"
                                                  onClick={this.onInsertCPRColumnLast} disabled={this.state.disable || this.state.cprSectNames.length === 0}>Insert Column Last</Button>
                                          <Button size="sm" color="primary" className="ml-3 mt-2"
                                                  onClick={this.onDeleteCPRColumn} disabled={this.state.disable || this.state.cprSectNames.length === 0}>Delete Column</Button>
                                        </div>
                                        <div className="mt-1 pb-3">
                                        </div>
                                      </Col>
                                    </div>
                                  </TabPane>
                                </TabContent>
                              })}

                            <Row>
                              <Col xs="12">
                                <div className="mb-1 ml-1 mr-1" style={{backgroundColor: '##dfe1e3'}}>
                                  <div className="ml-1 mr-1 mt-2 row">
                                    <Col xs="6" className="row">
                                      <Col xs="6">Primary IntraLATA Carrier:</Col>
                                      <Col xs="6">
                                        <Input type="select" className="form-control-sm" name="priIntraLT" value={this.state.priIntraLT}
                                               onChange={(ev)=>this.handleOnCPR(ev)} disabled={this.state.disable || this.state.cprSectNames.length === 0}>
                                          <option value=''>Select</option>
                                          {this.state.iac_array.map((value, key) => {
                                            return <option value={value} key={"IAC_" + key}>{value}</option>
                                          })}
                                        </Input>
                                      </Col>
                                    </Col>
                                    <Col xs="6" className="row">
                                      <Col xs="6">Primary InterLATA Carrier:</Col>
                                      <Col xs="6">
                                        <Input type="select" className="form-control-sm" name="priInterLT" value={this.state.priInterLT}
                                               onChange={(ev)=>this.handleOnCPR(ev)} disabled={this.state.disable || this.state.cprSectNames.length === 0}>
                                          <option value=''>Select</option>
                                          {this.state.iec_array.map((value, key) => {
                                            return <option value={value} key={"IEC_" + key}>{value}</option>
                                          })}
                                        </Input>
                                      </Col>
                                    </Col>
                                    <Col xs="6" className="row mt-1">
                                      <Col xs="6">Timezone:</Col>
                                      <Col xs="6">
                                        <Input type="select" className="form-control-sm" value={this.state.timezone | "C"} id='timezone' name='timezone'
                                               disabled={this.state.disable} onChange={(ev)=> this.handleOnCPR(ev)}>
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
                                      <Col xs="6" className="text-right">
                                        <Input type="checkbox" checked={this.state.dayLightSaving} id='dayLightSaving' name='dayLightSaving'
                                               disabled={this.state.disable} onChange={(ev)=> this.handleCheckOnCPR(ev)}/>
                                      </Col>
                                    </Col>
                                    <Col xs="12" className="row mt-1">
                                      <Col xs="3">NPANXX count per carrier:</Col>
                                      <Col xs="9" className="text-right">
                                        <Input type="text" readOnly id='npaCntPerCarrier' name='npaCntPerCarrier' value={this.state.npaCntPerCarrier}/>
                                      </Col>
                                    </Col>
                                  </div>
                                </div>
                              </Col>
                            </Row>
                            </CardBody>
                          </Card>
                        </div>
                      </TabPane>

                      {/* LAD Tab */}
                      <TabPane tabId="3">
                        <div className=" mt-0 ml-2 mr-2 ">
                          <Label className="ml-1"><strong style={{fontSize: 25}}>Label Definition</strong></Label>
                          <Card className="mb-2">
                            <CardBody>
                              <div>
                                <div className="ml-2 mr-2 mt-1 mb-1">
                                  <Nav tabs className="custom">
                                    {this.renderLADNavbar("1", "Area Code", this.state.noGridArea)}
                                    {this.renderLADNavbar("2", "Date", this.state.noGridDate)}
                                    {this.renderLADNavbar("3", "LATA", this.state.noGridLATA)}
                                    {this.renderLADNavbar("4", "NXX", this.state.noGridNXX)}
                                    {this.renderLADNavbar("5", "State", this.state.noGridState)}
                                    {this.renderLADNavbar("6", "Tel#", this.state.noGridTel)}
                                    {this.renderLADNavbar("7", "Time", this.state.noGridTime)}
                                    {this.renderLADNavbar("8", "10-digit#", this.state.noGridTD)}
                                    {this.renderLADNavbar("9", "6-digit#", this.state.noGridSD)}
                                  </Nav>
                                  <TabContent activeTab={this.state.activeLADTab}>
                                    <LADSubTabPanel id={"1"} rows={this.state.gridArea} disable={this.state.disable} updateGrid={this.updateAreaGrid}/>
                                    <LADSubTabPanel id={"2"} rows={this.state.gridDate} disable={this.state.disable} updateGrid={this.updateDateGrid}/>
                                    <LADSubTabPanel id={"3"} rows={this.state.gridLATA} disable={this.state.disable} updateGrid={this.updateLataGrid}/>
                                    <LADSubTabPanel id={"4"} rows={this.state.gridNXX} disable={this.state.disable} updateGrid={this.updateNXXGrid}/>
                                    <LADSubTabPanel id={"5"} rows={this.state.gridState} disable={this.state.disable} updateGrid={this.updateStateGrid}/>
                                    <LADSubTabPanel id={"6"} rows={this.state.gridTel} disable={this.state.disable} updateGrid={this.updateTelGrid}/>
                                    <LADSubTabPanel id={"7"} rows={this.state.gridTime} disable={this.state.disable} updateGrid={this.updateTimeGrid}/>
                                    <LADSubTabPanel id={"8"} rows={this.state.gridTD} disable={this.state.disable} updateGrid={this.updateTDGrid}/>
                                    <LADSubTabPanel id={"9"} rows={this.state.gridSD} disable={this.state.disable} updateGrid={this.updateSDGrid}/>
                                  </TabContent>
                                </div>
                              </div>
                            </CardBody>
                          </Card>
                        </div>
                      </TabPane>
                    </TabContent>
                  </div>

                  <div className="ml-4 mr-4">
                    <div className="row mt-2 mb-2">
                      <Label className="col-1 text-right">Message:</Label>
                      <Input className="col-10" type="textarea" name="message" id="message" value={this.state.message} rows="5" readOnly/>
                    </div>
                  </div>
                  <div className="ml-4 mr-4 mb-2 mt-2">
                    <Row>
                      <Col xs="12" md="7">
                        <Button size="md" color="primary" className="mr-2" disabled={!this.state.bEditEnable} onClick={this.onEdit}>Edit</Button>
                        <Button size="md" color="primary" className="mr-2" disabled={!this.state.bCopyEnable} onClick={this.onCopy}>Copy</Button>
                        <Button size="md" color="primary" className="mr-2" disabled={!this.state.bTransferEnable} onClick={this.onTransfer}>Transfer</Button>
                        <Button size="md" color="primary" className="mr-2"  disabled={!this.state.bDeleteEnable} onClick={this.toggleDelete}>Delete</Button>
                        <Button size="md" color="primary" className="mr-2"  disabled={!this.state.bCopyEnable} onClick={this.onConvert}>Convert</Button>
                      </Col>
                      <Col xs="12" md="5" className="text-right">
                        <Button size="md" color="primary" className="mr-2" disabled={(this.state.disable || !this.state.bContentModified) && !this.state.bSubmitEnable} onClick={this.onSubmit}>Submit</Button>
                        <Button size="md" color="primary" className="mr-2" disabled={(this.state.disable || !this.state.bContentModified) && !this.state.bSaveEnable} onClick={this.onSave}>Save</Button>
                        <Button size="md" color="primary" className="mr-2" disabled={(this.state.disable || !this.state.bContentModified) && !this.state.bRevertEnable} onClick={this.onRevert}>Revert</Button>
                        <Button size="md" color="primary" className="mr-2" onClick={this.toggleCancel}>Cancel</Button>
                      </Col>
                    </Row>
                  </div>
                </Collapse>

              </Card>
            </Col>
          </Row>
          {this.renderCreateModal()}
          {this.renderCopyModal()}
          {this.renderDeleteModal(this.state.effDtTmStat)}
          {this.renderTransferModal()}
          {this.renderConvertModal()}
          {this.renderCancelModal()}
          {this.renderModifiedModal()}
          {this.renderOverwriteModal()}
          {this.renderOverwriteTargetModal()}
          {/*{this.renderModifiedDataModal()}*/}

          {/* basic modals */}
          <ChoiceModal
            visible={this.state.choiceModalVisible}
            sourceList={this.state.choiceModalList}
            choiceList={this.state.choiceList}
            headerTitle={this.state.choiceModalHeaderTitle}
            shortWord={this.state.choiceModalHeaderTitle === gConst.AOS_NETWORK_MODAL_HEADER_TITLE || this.state.choiceModalHeaderTitle === gConst.AOS_STATE_MODAL_HEADER_TITLE}
            closeHandler={this.hideChoiceModal}
            choiceListHandler={this.reflectChoiceList}
          />
          {this.renderAOSNPAChoiceModal()}

          {/* cpr modals */}
          {this.renderCprSectNameModal()}
          {this.renderCprDelSectModal()}
          {this.renderCprDeleteModal()}
          {this.renderCprImportModal()}

          <NotificationContainer/>
        </>
      );
    }

    renderMainNavbar = (id, name, state) => (
      <NavItem>
        <NavLink className={classnames({active: this.state.activeMainTab === id})} style={this.setMainNavTextColor(id)} onClick={() => {this.toggleMainTab(id);}}>
          {!state ? name : name + " *"}
        </NavLink>
      </NavItem>);

    renderAOSNavbar = (id, name, state) => (
      <NavItem>
        <NavLink className={classnames({active: this.state.activeAOSTab === id})} style={this.setAOSNavTextColor(id)} onClick={() => {this.toggleAOSTab(id);}}>
          {!state ? name : name + " *"}
        </NavLink>
      </NavItem>);

    renderCarrierNavbar = (id, name, state) => (
      <NavItem>
        <NavLink className={classnames({active: this.state.activeCarrierTab === id})} style={this.setCarrierNavTextColor(id)} onClick={() => {this.toggleCarrierTab(id);}}>
          {!state ? name : name + " *"}
        </NavLink>
      </NavItem>);

    renderCPRNavbar = (id, name, state) => (
      <NavItem>
        <NavLink className={classnames({active: this.state.activeCPRTab === id})} onClick={() => {this.toggleCPRTab(id);}}>
          {!state ? name : name + " *"}
        </NavLink>
      </NavItem>);

    renderLADNavbar = (id, name, noData) => (
      <NavItem>
        <NavLink className={classnames({active: this.state.activeLADTab === id})} style={this.setLADNavTextColor(id)} onClick={() => {this.toggleLADTab(id);}}>
          {noData ? name : name }
        </NavLink>
      </NavItem>);

    renderCreateModal = () => (
      <Modal isOpen={this.state.createModalVisible} toggle={this.toggleCreateModal} className={'modal-sm ' + this.props.className}>
        <ModalHeader toggle={this.toggleCreateModal}>No Results</ModalHeader>
        <ModalBody>
          <Label>Do you want to create a new Customer Record?</Label>
          <div style={{display: "flex", justifyContent: 'flex-end'}}>
            <Button size="md" color="primary" className="mr-2" onClick={this.createAction}>Yes</Button>
            <Button size="md" color="danger" onClick={this.toggleCreateModal}>No</Button>
          </div>
        </ModalBody>
      </Modal>
    );

    renderCopyModal = () => (
      <Modal isOpen={this.state.copyModalVisible} toggle={this.hideCopyModal} className={'modal-lg ' + this.props.className}>
        <ModalHeader toggle={this.hideCopyModal}>Copy Customer Record</ModalHeader>
        <ModalBody>
          <FormGroup row style={{"margin-bottom": "0px"}}>
            <Col xs="6">
              <Card>
                <CardHeader>Source Record</CardHeader>
                <CardBody>
                  <Label htmlFor="srcNum">Toll-Free Number:</Label>
                  <Input type="text" name="srcNum" id="num" value={formattedNumber(this.state.srcNum)} disabled/>
                  <Label htmlFor="srcEffDtTm">Effective Date/Time:</Label>
                  <Input type="text" id="srcEffDtTm" value={this.state.srcEffDtTm} disabled/>
                </CardBody>
              </Card>
            </Col>
            <Col xs="6">
              <Card>
                <CardHeader>Target Record</CardHeader>
                <CardBody>
                  <Label htmlFor="tgtNum">Toll-Free Number/Template*: </Label>
                  <Input type="text" name="tgtNum" id="tgtNum" onChange={(ev) => this.handleUppercaseOnModal(ev)} value={this.state.tgtNum}/>
                  <Label htmlFor="et_copy">Effective Date/Time*:</Label>
                  <Row>
                    <Col xs="7">
                      <DatePicker dateFormat="MM/dd/yyyy hh:mm a"
                                  selected={this.state.tgtEffDtTm}
                                  showTimeSelect
                                  timeIntervals={15}
                                  minDate={new Date()}
                                  onChange={this.copyDate}
                                  className="form-control"
                                  timeCaption="time"/>
                    </Col>
                    <div className="form-check align-content-center">
                      <Input type="checkbox" className="form-check-input" id="copyNow" name="copyNow" onChange={(ev)=>this.handleCheckOnModal(ev)} checked={this.state.copyNow} />
                      <label className="form-check-label" htmlFor="copyNow"> Now</label>
                    </div>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </FormGroup>
          <Row className="mt-0">
            <Col xs="6">
              <Card>
                <CardHeader>Action</CardHeader>
                <CardBody className="ml-lg-5">
                  <div className="form-check align-content-center">
                    <Input type="radio" className="form-control-sm" style={{'marginTop': '-0.3rem'}} id="change" name="change"
                           checked={this.state.copyAction == gConst.COPYACTION_CHANGE} onChange={() => { this.setState({copyAction: gConst.COPYACTION_CHANGE})}} />
                    <label className="form-check-label" htmlFor="change">{gConst.COPYACTION_CHANGE}</label>
                  </div>
                  <div className="form-check">
                    <Input type="radio" className="form-control-sm" style={{'marginTop': '-0.3rem'}} id="disconnect" name="disconnect"
                           checked={this.state.copyAction == gConst.COPYACTION_DISCONNECT} onChange={() => { this.setState({copyAction: gConst.COPYACTION_DISCONNECT})}} />
                    <label className="form-check-label" htmlFor="disconnect">{gConst.COPYACTION_DISCONNECT}</label>
                  </div>
                  <div className="form-check">
                    <Input type="radio" className="form-control-sm" style={{'marginTop': '-0.3rem'}} id="new" name="new"
                           checked={this.state.copyAction == gConst.COPYACTION_NEW} onChange={() => { this.setState({copyAction: gConst.COPYACTION_NEW})}} />
                    <label className="form-check-label" htmlFor="new">{gConst.COPYACTION_NEW}</label>
                  </div>
                </CardBody>
              </Card>
            </Col>
            <Col xs="6">
              <Card>
                <CardHeader>Copy Portions from Source Record</CardHeader>
                <CardBody className="ml-lg-5">
                  <div className="form-check align-content-center">
                    <Input type="checkbox" className="form-check-input" id="portionEntire" name="portionEntire"
                           checked={this.state.portionEntire} onChange={(ev)=> this.handleCheckOnModal(ev)}/>
                    <label className="form-check-label" htmlFor="portionEntire"> Entire Data</label>
                  </div>
                  <div className="form-check align-content-center">
                    <Input type="checkbox" className="form-check-input" id="portionCR" name="portionCR" checked={this.state.portionCR}
                           onChange={(ev)=> this.handleCheckOnModal(ev)} disabled={this.state.status===gConst.STAT_FAILED || this.state.status===gConst.STAT_INVALID || !this.state.bCheckCREnable}/>
                    <label className="form-check-label" htmlFor="portionCR"> CR Basic Data</label>
                  </div>
                  <div className="form-check">
                    <Input type="checkbox" className="form-check-input" id="portionCPR" name="portionCPR" checked={this.state.portionCPR}
                           onChange={(ev)=> this.handleCheckOnModal(ev)} disabled={this.state.noCPR || !this.state.bCheckCPREnable}/>
                    <label className="form-check-label" htmlFor="portionCPR"> CPR</label>
                  </div>
                  <div className="form-check">
                    <Input type="checkbox" className="form-check-input" id="portionLAD" name="portionLAD" checked={this.state.portionLAD}
                           onChange={(ev)=> this.handleCheckOnModal(ev)} disabled={this.state.noLAD || !this.state.bCheckLADEnable}/>
                    <label className="form-check-label" htmlFor="portionLAD"> LAD</label>
                  </div>

                </CardBody>
              </Card>
            </Col>
          </Row>
          <div className="row" hidden={this.state.validMsg == ''}>
            <Col xs = "1"/>
            <Input className="col-10" type="textarea" name="validMsg" id="validMsg" value={this.state.validMsg} rows="5" style={{color:'#FF0000'}} readOnly/>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="submit" size="md" color="primary" className="mr-2" onClick={this.checkValidForCopying}> Copy</Button>
          <Button type="reset" size="md" color="danger" onClick={this.hideCopyModal}> Cancel</Button>
        </ModalFooter>
      </Modal>
    );

    renderTransferModal = () => (
      <Modal isOpen={this.state.transferModalVisible} toggle={this.hideTransferModal} className={'modal-lg ' + this.props.className}>
        <ModalHeader toggle={this.hideTransferModal}>Transfer Customer Record</ModalHeader>
        <ModalBody>
          <FormGroup row>
            <Col xs="6">
              <Card>
                <CardHeader>Source Record</CardHeader>
                <CardBody>
                  <Label htmlFor="srcNum">Toll-Free Number:</Label>
                  <Input type="text" id="srcNum" value={formattedNumber(this.state.srcNum)} disabled/>
                  <Label htmlFor="srcEffDtTm">Effective Date/Time:</Label>
                  <Input type="text" id="srcEffDtTm" value={this.state.srcEffDtTm} disabled/>
                </CardBody>
              </Card>
            </Col>
            <Col xs="6">
              <Card>
                <CardHeader>Target Record</CardHeader>
                <CardBody>
                  <Label htmlFor="tgtNum">Toll-Free Number/Template*: </Label>
                  <Input type="text" name="tgtNum" id="tgtNum" onChange={(ev) => this.handleUppercaseOnModal(ev)} value={this.state.tgtNum} />
                  <Label htmlFor="et_copy">Effective Date/Time*:</Label>
                  <Row>
                    <Col xs="7">
                      <DatePicker dateFormat="MM/dd/yyyy hh:mm a"
                                  selected={this.state.tgtEffDtTm}
                                  showTimeSelect
                                  timeIntervals={15}
                                  minDate={new Date()}
                                  onChange={this.transferDate}
                                  className="form-control"
                                  timeCaption="time"/>
                    </Col>
                    <div className="form-check align-content-center">
                      <Input type="checkbox" className="form-check-input" id="copyNow" name="copyNow" onChange={(ev) => this.handleCheckOnModal(ev)} checked={this.state.copyNow} />
                      <label className="form-check-label" htmlFor="copyNow"> Now</label>
                    </div>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </FormGroup>
          <div className="row">
            <Col xs="3"/>
            <Col xs="6">
              <Card>
                <CardHeader>Transfer Portions from Source Record</CardHeader>
                <CardBody className="ml-lg-5">
                  <div className="form-check align-content-center">
                    <Input type="checkbox" className="form-check-input" id="portionEntire" name="portionEntire"
                           checked={this.state.portionEntire} onChange={(ev)=> this.handleCheckOnModal(ev)} disabled={this.state.status == 'Failed'}/>
                    <label className="form-check-label" htmlFor="portionEntire"> Entire Data</label>
                  </div>
                  <div className="form-check">
                    <Input type="checkbox" className="form-check-input" id="portionCPR" name="portionCPR"
                           checked={this.state.portionCPR} onChange={(ev)=> this.handleCheckOnModal(ev)} disabled={this.state.noCPR || !this.state.bCheckCPREnable}/>
                    <label className="form-check-label" htmlFor="portionCPR"> CPR</label>
                  </div>
                  <div className="form-check">
                    <Input type="checkbox" className="form-check-input" id="portionLAD" name="portionLAD"
                           checked={this.state.portionLAD} onChange={(ev)=> this.handleCheckOnModal(ev)} disabled={this.state.noLAD || !this.state.bCheckLADEnable}/>
                    <label className="form-check-label" htmlFor="portionLAD"> LAD</label>
                  </div>

                </CardBody>
              </Card>
            </Col>
            <Col xs="3"/>
          </div>
          <div className="row" hidden={this.state.validMsg == ''}>
            <Col xs = "1"/>
            <Input className="col-10" type="textarea" name="validMsg" id="validMsg" value={this.state.validMsg} rows="5" style={{color:'#FF0000'}} readOnly/>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="submit" size="md" color="primary" className="mr-2" onClick={this.checkValidForTransferring}>Transfer</Button>
          <Button type="reset" size="md" color="danger" onClick={this.hideTransferModal}> Cancel</Button>
        </ModalFooter>
      </Modal>
    );

    renderDeleteModal = (effDtTmStat) => (
      <Modal isOpen={this.state.deleteModalVisible} toggle={this.toggleDelete} className={'modal-sm ' + this.props.className}>
        <ModalHeader toggle={this.toggleDelete}>Delete TAD</ModalHeader>
        <ModalBody>
          <Card>
            <CardHeader>Source Record</CardHeader>
            <CardBody>
              <Label htmlFor="num">Template:</Label>
              <Input type="text" value={formattedNumber(this.state.num)} disabled/>
              <Label>Effective Date/Time:</Label>
              <Input type="text" value={effDtTmStat.split(" ")[0] + " " + effDtTmStat.split(" ")[1] + " " + effDtTmStat.split(" ")[2]} disabled/>
            </CardBody>
          </Card>
        </ModalBody>
        <ModalFooter>
          <Button size="md" color="primary" className="mr-2" onClick={this.deleteCustomerRecord}> Delete</Button>
          <Button size="md" color="danger" onClick={this.toggleDelete}> Cancel</Button>
        </ModalFooter>
      </Modal>
    );

    renderConvertModal = () => (
      <Modal isOpen={this.state.convertModalVisible} toggle={this.hideConvertModal} className={'modal-lg ' + this.props.className}>
        <ModalHeader toggle={this.hideConvertModal}>Convert Customer Record to Pointer Record</ModalHeader>
        <ModalBody>
          <FormGroup row>
            <Col xs="6">
              <Card>
                <CardHeader>Source Record</CardHeader>
                <CardBody>
                  <Label htmlFor="srcNum">Toll-Free Number:</Label>
                  <Input type="text" id="srcNum" value={formattedNumber(this.state.srcNum)} disabled/>
                  <Label htmlFor="srcEffDtTm">Effective Date/Time:</Label>
                  <Input type="text" id="srcEffDtTm" value={this.state.srcEffDtTm} disabled/>
                </CardBody>
              </Card>
            </Col>
            <Col xs="6">
              <Card>
                <CardHeader>Target Record</CardHeader>
                <CardBody>
                  <Label htmlFor="tgtTmplName">Template: </Label>
                  <Input type="text" name="tgtTmplName" id="tgtTmplName" onChange={(ev) => this.handleUppercaseOnModal(ev)} value={this.state.tgtTmplName} />
                  <Label htmlFor="et_copy">Effective Date/Time*:</Label>
                  <Row>
                    <Col xs="7">
                      <DatePicker dateFormat="MM/dd/yyyy hh:mm a"
                                  selected={this.state.tgtEffDtTm}
                                  showTimeSelect
                                  timeIntervals={15}
                                  minDate={new Date()}
                                  onChange={this.transferDate}
                                  className="form-control"
                                  timeCaption="time"/>
                    </Col>
                    <div className="form-check align-content-center">
                      <Input type="checkbox" className="form-check-input" id="copyNow" name="copyNow" onChange={(ev) => this.handleCheckOnModal(ev)} checked={this.state.copyNow} />
                      <label className="form-check-label" htmlFor="copyNow"> Now</label>
                    </div>
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </FormGroup>
          <div className="row" hidden={this.state.validMsg == ''}>
            <Col xs = "1"/>
            <Input className="col-10" type="textarea" name="validMsg" id="validMsg" value={this.state.validMsg} rows="5" style={{color:'#FF0000'}} readOnly/>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button type="submit" size="md" color="primary" className="mr-2" onClick={this.checkValidForConverting}>Convert</Button>
          <Button type="reset" size="md" color="danger" onClick={this.hideConvertModal}> Cancel</Button>
        </ModalFooter>
      </Modal>
    );

    renderCancelModal = () => (
      <Modal isOpen={this.state.cancelModalVisible} toggle={this.toggleCancel} className={'modal-sm ' + this.props.className}>
        <ModalHeader toggle={this.toggleCancel}>Confirm</ModalHeader>
        <ModalBody>
          <Label>Are you sure you wish to cancel?</Label>
          <div style={{display: "flex", justifyContent: 'flex-end'}}>
            <Button size="md" color="primary" className="mr-2" onClick={this.cancelAction}>Yes</Button>
            <Button size="md" color="danger" onClick={this.toggleCancel}> No</Button>
          </div>
        </ModalBody>
      </Modal>
    );

    renderModifiedModal = () => (
      <Modal isOpen={this.state.modifiedModalVisible} toggle={this.hideModifiedModal} className={'modal-sm ' + this.props.className}>
        <ModalHeader toggle={this.hideModifiedModal}>Confirm</ModalHeader>
        <ModalBody>
          <Label>The data that you modified will be lost. Are you sure you wish to continue?</Label>
          <div style={{display: "flex", justifyContent: 'flex-end'}}>
            <Button size="md" color="primary" className="mr-2"
                    onClick={()=> {
                      if (this.state.bRevertClicked)
                        this.doRevert()
                      else
                        this.doAnotherRecord()}
                    }>Yes</Button>
            <Button size="md" color="danger"
                    onClick={() => {
                      if (this.state.bRevertClicked)
                        this.cancelRevert()
                      else
                        this.cancelAnotherRecord()
                    }}> No</Button>
          </div>
        </ModalBody>
      </Modal>
    );

    renderOverwriteModal = () => (
      <Modal isOpen={this.state.overwriteModalVisible} toggle={this.toggleOverwrite} className={'modal-sm ' + this.props.className}>
        <ModalHeader toggle={this.toggleOverwrite}>Overwrite Confirm</ModalHeader>
        <ModalBody>
          <Label>Do you want to overwrite the existing CPR/LAD?</Label>
          <div style={{display: "flex", justifyContent: 'flex-end'}}>
            <Button size="md" color="primary" className="mr-2" onClick={this.actionOverwrite}>Yes</Button>
            <Button size="md" color="danger" onClick={this.toggleOverwrite}>No</Button>
          </div>
        </ModalBody>
      </Modal>
    );

    renderOverwriteTargetModal = () => (
      <Modal isOpen={this.state.overwriteTargetModalVisible} toggle={this.toggleOverwriteTarget} className={'modal-sm ' + this.props.className}>
        <ModalHeader toggle={this.toggleOverwriteTarget}>Overwrite Confirm</ModalHeader>
        <ModalBody>
          <Label>Target record exists. Do you want to overwrite?</Label>
          <div style={{display: "flex", justifyContent: 'flex-end'}}>
            <Button size="md" color="primary" className="mr-2" onClick={this.actionOverwriteTarget}>Yes</Button>
            <Button size="md" color="danger" onClick={this.toggleOverwriteTarget}>No</Button>
          </div>
        </ModalBody>
      </Modal>
    );

    // renderModifiedDataModal = () => (
    //   <Modal isOpen={this.state.mdfDtCpyModalVisible} toggle={()=>this.hideMdfDtCpyModal(false)} className={'modal-sm ' + this.props.className}>
    //     <ModalHeader toggle={()=>this.hideMdfDtCpyModal(false)}>Delete Section Confirm</ModalHeader>
    //     <ModalBody>
    //       <Label>There are some modified but unsaved data. Do you want to perform the action including these data?</Label>
    //       <div style={{display: "flex", justifyContent: 'flex-end'}}>
    //         <Button size="md" color="primary" className="mr-2" onClick={()=>this.hideMdfDtCpyModal(true)}>Yes</Button>
    //         <Button size="md" color="danger" onClick={()=>this.hideMdfDtCpyModal(false)}> No</Button>
    //       </div>
    //     </ModalBody>
    //   </Modal>
    // );

    renderFeedback = (text) => (
      <FormText><span style={{color: 'red'}}>{text}</span></FormText>
    );

    /****************************************************************** Basic Modals ******************************************************************/


    renderAOSNPAChoiceModal = () => (
      <Modal isOpen={this.state.npaChoiceModalVisible} toggle={this.hideAOSNPAChoiceModal}
             className={'modal-400 ' + this.props.className}>
        <ModalHeader toggle={this.hideAOSNPAChoiceModal}>Choose from the list</ModalHeader>
        <ModalBody>
          <Card>
            <Label className="mt-1 ml-5 mb-1 font-weight-bold">State-NPA list</Label>
            <div className="border ml-1 mr-1 mb-1" style={{ height: '500px', overflowY: 'scroll' }} >
              <CheckboxTree
                nodes={this.state.npaChoiceModalList}
                checked={this.state.npaChecked}
                expanded={this.state.npaExpanded}
                onCheck={checked => this.setState({npaChecked: checked })}
                onExpand={expanded => this.setState({npaExpanded: expanded })}
                icons={{
                  check: <span className="rct-icon rct-icon-check" />,
                  uncheck: <span className="rct-icon rct-icon-uncheck" />,
                  halfCheck: <span className="rct-icon rct-icon-half-check" />,
                  parentClose: '',
                  parentOpen: '',
                  leaf: ''
                }}
              />
            </div>
          </Card>
          <div style={{display: "flex", justifyContent: 'flex-end'}}>
            <Button size="md" color="primary" className="mr-2" onClick={this.reflectNPAChoiceList}>Select</Button>
            <Button size="md" color="danger" onClick={this.hideAOSNPAChoiceModal}>Cancel</Button>
          </div>
        </ModalBody>
      </Modal>

    );


    /****************************************************************** CPR Modals ******************************************************************/
    renderCprSectNameModal = () => (
      <Modal isOpen={this.state.cprSectNameModalVisible} toggle={this.toggleCprSectName} className={'modal-sm ' + this.props.className}>
        <ModalHeader toggle={this.toggleCprSectName}>{this.state.cprSectNameModalTitle}</ModalHeader>
        <ModalBody>
          <Row className="pl-2 pt-1 pr-2">
            <Label className="mr-2">Section Name: </Label>
            <Input type="text" id="cprSectSettingName" name="cprSectSettingName"
                   onKeyDown={(ev) => {
                     if (ev.key == 'Enter') {
                       this.setCprSectName()
                     }
                   }}
                   onChange={(ev) => this.handleOnModal(ev)} value={this.state.cprSectSettingName} />
          </Row>
          {this.state.cprSectNameErr ? <FormText>{this.state.cprSectNameErrMsg}</FormText> : ""}
          <div className="mt-2" style={{display: "flex", justifyContent: 'flex-end'}}>
            <Button size="md" color="primary" className="mr-2" onClick={this.setCprSectName}>{this.state.cprSectNameModalBtnName}</Button>
            <Button size="md" color="danger" onClick={this.toggleCprSectName}>Cancel</Button>
          </div>
        </ModalBody>
      </Modal>
    );

    renderCprDelSectModal = () => (
      <Modal isOpen={this.state.cprDelSectModalVisible} toggle={this.toggleCprDelSect} className={'modal-sm ' + this.props.className}>
        <ModalHeader toggle={this.toggleCprDelSect}>Delete Section Confirm</ModalHeader>
        <ModalBody>
          <Label>Are you sure you wish to delete the {this.state.cprSectNames[this.state.activeCPRTab]} section?</Label>
          <div style={{display: "flex", justifyContent: 'flex-end'}}>
            <Button size="md" color="primary" className="mr-2" onClick={this.deleteCprSect}>Yes</Button>
            <Button size="md" color="danger" onClick={this.toggleCprDelSect}> No</Button>
          </div>
        </ModalBody>
      </Modal>
    );

    renderCprDeleteModal = () => (
      <Modal isOpen={this.state.cprDeleteModalVisible} toggle={this.toggleCprDelete} className={'modal-sm ' + this.props.className}>
        <ModalHeader toggle={this.toggleCprDelete}>Delete Section Confirm</ModalHeader>
        <ModalBody>
          <Label>Are you sure you wish to delete the CPR?</Label>
          <div style={{display: "flex", justifyContent: 'flex-end'}}>
            <Button size="md" color="primary" className="mr-2" onClick={this.deleteCpr}>Yes</Button>
            <Button size="md" color="danger" onClick={this.toggleCprDelete}> No</Button>
          </div>
        </ModalBody>
      </Modal>
    );

    renderCprImportModal = () => (
      <Modal isOpen={this.state.cprImportModalVisible} toggle={this.toggleCprImport} className={'modal-sm ' + this.props.className}>
        <ModalHeader toggle={this.toggleCprImport}>Import CPR Report Data</ModalHeader>
        <ModalBody>
          <Label>{this.state.sureImportMessage}</Label>
          <div style={{display: "flex", justifyContent: 'flex-end'}}>
            <Button size="md" color="primary" className="mr-2" onClick={this.importCpr}>Yes</Button>
            <Button size="md" color="danger" onClick={this.toggleCprImport}> No</Button>
          </div>
        </ModalBody>
      </Modal>
    );

  };

}

export default renderMixin;
