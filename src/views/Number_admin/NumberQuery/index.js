import React, {Component} from 'react';
import {  Button,  Card,  CardBody,  CardHeader,  Col,  FormGroup,  Input,  Label,  Row,  Fade,  Collapse, FormText } from 'reactstrap';

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// notification
import {NotificationContainer, NotificationManager} from'react-notifications';
import 'react-notifications/lib/notifications.css';

import $ from 'jquery'
import {connect} from 'react-redux'
import { timeout } from "../../../service/numberSearch";
import "react-toastify/dist/ReactToastify.css";
import 'react-overlay-loader/styles.css';
import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import RestApi from "../../../service/RestApi";
import * as gConst from "../../../constants/GlobalConstants";
import * as gFunc from "../../../utils";

const INVALID_NUM_TYPE_NONE = 0
const INVALID_NUM_TYPE_TENDIGIT = 1
const INVALID_NUM_TYPE_NPA = 2

class NumberQuery extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selectRo: this.props.somos.selectRo,

      srchCollapse: true,
      rsltCollapse: true,
      toggleSearch: true,
      fadeInResult: true,
      timeoutSearch: 300,
      timeoutResult: 300,
      
      disabled: false,
     
      num: '',
      invalidNumType: true,

      respOrg: "",
      validRespOrg: true,

      effDate: '',
      lastActiveDate: "",
      
      retreivedStatus: '',
      status: "",

      reservedUntil: "",
      validReservedUntil: true,

      contactName: "",
      contactNumber: "",
      notes: "",
      recVersionId: '',
      isResult: false,
    };
  }

  componentDidMount() {
    $("#num").focus()
    setInterval(() => { this.monitorRoChange()}, gConst.RO_CHANGE_MONITOR_INTERVAL)
  }

  /**
   * this is called when changing the ro selection
   * @returns {Promise<void>}
   */
  monitorRoChange = async () => {
    if (this.state.selectRo === this.props.somos.selectRo)
      return

    await this.cancel()
    this.state.selectRo = this.props.somos.selectRo
  }

  toggleSearch = () => {
    this.setState({srchCollapse: !this.state.srchCollapse});
  };

  toggleResult = () => {
    this.setState({rsltCollapse: !this.state.rsltCollapse});
  };

  handleDate = (date, name) => {
    const state = {};
    state[name] = date
    this.setState(state);
  };

  handleChange = (event) => {
    const state = {};
    state[event.target.name] = event.target.value;
    this.setState(state);
  };

  /**
   *
   */
  queryNumber = async () => {
    this.setState({isResult: false});

    let numRegExp = gConst.NUM_REG_EXP
    let tfNumRegExp = gConst.TFNUM_REG_EXP
    if (!numRegExp.test(this.state.num)) {
      this.setState({invalidNumType: INVALID_NUM_TYPE_TENDIGIT});
      return false;

    } else if (!tfNumRegExp.test(this.state.num)) {
      this.setState({invalidNumType: INVALID_NUM_TYPE_NPA});
      return false;

    } else  {
      this.setState({invalidNumType: INVALID_NUM_TYPE_NONE});
    }

    let body = {
      numList:[
        this.state.num.replace(/\-/g, "")
      ]
    }

    this.props.callApi2(RestApi.numberQuery, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout}).then(res => {
      if (res.ok && res.data && res.data.queryResult) {

        let result = res.data.queryResult[0]
        let effDate = ""
        if (result.effDt)
          effDate = gFunc.fromUTCDateStrToCTDateStr(result.effDt)

        let lastActDt = ""
        if (result.lastActDt)
          lastActDt = gFunc.fromUTCDateStrToCTDateStr(result.lastActDt)

        let contactName = ""
        if (result.conName)
          contactName = result.conName

        let contactNumber = ""
        if (result.conPhone)
          contactNumber = result.conPhone

        let notes = ""
        if (result.shrtNotes)
          notes = result.shrtNotes

        let reservedUntil = ""
        if (result.resUntilDt)
          reservedUntil = new Date(result.resUntilDt).getTime()

        this.setState({
          respOrg: result.ctrlRespOrgId,
          retreivedStatus: result.status,
          status: result.status,
          effDate: effDate,
          lastActiveDate: lastActDt,
          contactName: contactName,
          contactNumber: contactNumber,
          notes: notes,
          reservedUntil: reservedUntil,
          recVersionId: result.recVersionId,
          isResult: true,
        })

        if (result.status !== gConst.TFNUM_STATE_RESERVED && result.status !== gConst.TFNUM_STATE_TRANSITIONAL) {
          this.setState({disabled: true})

        } else {
          // if (this.props.somos.ro.indexOf(result.ctrlRespOrgId) === -1)
          //   this.setState({disabled: true})
          // else
          //   this.setState({disabled: false})

          this.setState({disabled: false})
        }

      } else if (res.data && res.data.errList) {
        let errMsg = gFunc.synthesisErrMsg(res.data.errList)
        if (res.data.errList[0].errLvl === "ERROR")
          NotificationManager.error("", errMsg)
        else
          NotificationManager.warning("", errMsg)
      }
    })
  };

  cancel = async () => {
    await this.setState({isResult: false, num: ''});
    $("#num").focus()
  };

  /**
   * update the number
   */ 
  updateTFNumber = async () => {
    
    if (this.state.respOrg === '') {
      this.setState({validRespOrg: false})
      return

    } else {
      this.setState({validRespOrg: true})
    }
    
    let body = {
      tfNumList: [{
        num: this.state.num.replace(/\-/g, ""),
        recVersionId: this.state.recVersionId
      }],
      status: this.state.status
    }

    switch (this.state.status) {
      case gConst.TFNUM_STATE_SPARE:
        break
      case gConst.TFNUM_STATE_RESERVED:
      case gConst.TFNUM_STATE_TRANSITIONAL:
        body.ctrlRespOrgId = this.state.respOrg
        if (this.state.reservedUntil && this.state.reservedUntil !== '')
          body.resUntilDt = gFunc.fromCTTimeToUTCStr(new Date(this.state.reservedUntil)).substring(0, 10)

      default:
        if (this.state.contactName && this.state.contactName !== '')
          body.conName = this.state.contactName
        if (this.state.contactNumber && this.state.contactNumber !== '')
          body.conPhone = this.state.contactNumber
        if (this.state.notes && this.state.notes !== '')
          body.shrtNotes = this.state.notes
        break
    }

    this.props.callApi2(RestApi.numberUpdate, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout}).then(res => {
      if (res.ok && res.data && res.data.updateResult) {
        let result = res.data.updateResult
        if (result[0].errList) {
          let err = result[0].errList[0]
          let errMsg = err.errMsg + "(" + err.errCode + ")"

          if (err.errLvl === "ERROR") {
            NotificationManager.error("", errMsg)
            return

          } else {
            NotificationManager.warning("", errMsg)
          }
        }

        this.queryNumber()

      } else if (res.data.errList) {
        for (let err of res.data.errList) {
          let errMsg = err.errMsg + "(" + err.errCode + ")"

          if (err.errLvl === "ERROR") {
            NotificationManager.error("", errMsg)
          } else {
            NotificationManager.warning("", errMsg)
          }
        }
      }
    })

  };
  
  render() {
    return (
      <div className="animated fadeIn">
        <Label className="ml-1"><strong style={{fontSize: 30}}>Number Query and Update</strong></Label>
        <Row className="mt-3">
          <Col xs="12">
            <Fade timeout={this.state.timeoutSearch} in={this.state.fadeInSrch}>
              <Card>
                <CardHeader>
                  <strong style={{fontSize: 20}}>Retrieve</strong>
                  <div className="card-header-actions">
                    <a className="card-header-action btn btn-minimize" data-target="#collapseExample"
                       onClick={this.toggleSearch.bind(this)}><i
                      className={this.state.srchCollapse ? "icon-arrow-up" : "icon-arrow-down"}/></a>
                  </div>
                </CardHeader>
                <Collapse isOpen={this.state.srchCollapse} id="collapseExample">
                  <CardBody>
                    <Label>Toll-Free Number *</Label>
                    <Input type="text" name="num" id="num" onChange={(ev)=> this.handleChange(ev)} value={this.state.num}/>
                    { this.state.invalidNumType === INVALID_NUM_TYPE_TENDIGIT ? <FormText><p style={{color: 'red'}}>Starting Toll Free Number: Must be 10 digits</p></FormText> : ""}
                    { this.state.invalidNumType === INVALID_NUM_TYPE_NPA ? <FormText><p style={{color: 'red'}}>Must be an existing 3-digit 8xx Toll-Free NPA code known to the TFN Registry (e.g., 800).</p></FormText> : ""}
                    <Col className="text-right">
                      <Button size="md" color="primary" className="mt-3" onClick={this.queryNumber}>Retrieve</Button>
                    </Col>
                  </CardBody>
                </Collapse>
              </Card>
            </Fade>
          </Col>

          <Col xs="12">
            <Fade timeout={this.state.timeoutResult} in={this.state.fadeInResult}>
              <Card>
                <CardHeader>
                  <strong style={{fontSize: 20}}>Result</strong>
                  <div className="card-header-actions">
                    <a className="card-header-action btn btn-minimize" data-target="#collapseExample"
                       onClick={this.toggleResult.bind(this)}><i
                      className={this.state.rsltCollapse ? "icon-arrow-up" : "icon-arrow-down"}/></a>
                  </div>
                </CardHeader>
                <Collapse isOpen={/*this.state.rsltCollapse*/true} id="collapseExample">
                  <CardBody>
                    {this.state.isResult &&
                    <div>
                      <FormGroup row>

                        {/* Resp Org, Effective Date, Last Active */}
                        <Col xs="12" md="6">
                          {/* Resp Org*/}
                          <FormGroup row>
                            <Col md="4">
                              <Label htmlFor="respOrg">Resp Org : </Label>
                            </Col>
                            <Col xs="12" md="8">
                              <Input type="text" id="respOrg" name="respOrg" autoComplete="text" disabled={this.state.disabled}
                                     onChange={(ev) => this.handleChange(ev)} value={this.state.respOrg}/>
                              { !this.state.validRespOrg  ? <FormText><p style={{color: 'red'}}>Resp Org is required. Enter 5 alphanumeric like 'BANJ1'</p></FormText> : ""}
                            </Col>
                          </FormGroup>

                          {/* Effective Date */}
                          <FormGroup row>
                            <Col md="4">
                              <Label htmlFor="ed">Effective Date :</Label>
                            </Col>
                            <Col xs="12" md="8">
                              <Input type="text" id="effDate" name="effDate" autoComplete="text" disabled
                                     onChange={(ev) => this.handleChange(ev)} value={this.state.effDate}/>
                              {/*<DatePicker*/}
                                {/*id="effDate"*/}
                                {/*placeholderText="MM/DD/YYYY"*/}
                                {/*dateFormat="MM/dd/yyyy"*/}
                                {/*selected={this.state.effDate}*/}
                                {/*onChange={(date) => this.handleDate(date, "effDate")}*/}
                                {/*className="form-control"*/}
                              {/*/>*/}
                            </Col>
                          </FormGroup>

                          {/* Last Active */}
                          <FormGroup row>
                            <Col md="4">
                              <Label htmlFor="lastActiveDate">Last Active :</Label>
                            </Col>
                            <Col xs="12" md="8">
                              <Input type="text" id="lastActiveDate" name="lastActiveDate" autoComplete="text" disabled
                                     onChange={(ev) => this.handleChange(ev)} value={this.state.lastActiveDate}/>
                            </Col>
                          </FormGroup>
                        </Col>

                        {/* Status, Disconnect Until */}
                        <Col xs="12" md="6">
                          {/* Status */}
                          <FormGroup row>
                            <Col md="4">
                              <Label htmlFor="status">Status : </Label>
                            </Col>
                            <Col xs="12" md="8">
                              {this.state.retreivedStatus === gConst.TFNUM_STATE_RESERVED || this.state.retreivedStatus === gConst.TFNUM_STATE_TRANSITIONAL ?
                                <Input type="select" id="status" name="status" autoComplete="text" onChange={(ev) => this.handleChange(ev)} value={this.state.status} disabled={this.state.disabled}>
                                  <option value={this.state.retreivedStatus}>{this.state.retreivedStatus}</option>
                                  {this.state.retreivedStatus === gConst.TFNUM_STATE_RESERVED
                                          ? <option value={gConst.TFNUM_STATE_SPARE}>SPARE</option>
                                          : <option value={gConst.TFNUM_STATE_RESERVED}>RESERVED</option>}
                                </Input>
                              :
                                <Input type="text" id="status" name="status" autoComplete="text" disabled
                                       onChange={(ev) => this.handleChange(ev)} value={this.state.status}/>
                              }
                            </Col>
                          </FormGroup>

                          {/* Disconnect Until */}
                          <FormGroup row>
                            <Col md="4">
                              <Label htmlFor="reservedUntil">Reserved Until : </Label>
                            </Col>
                            <Col xs="12" md="8">
                              <DatePicker
                                id="reservedUntil"
                                placeholderText="MM/DD/YYYY"
                                dateFormat="MM/dd/yyyy"
                                selected={this.state.reservedUntil}
                                onChange={(date) => this.handleDate(date, "reservedUntil")}
                                className="form-control"
                                disabled={this.state.disabled}
                              />
                            </Col>
                          </FormGroup>
                        </Col>
                      </FormGroup>

                      {/* Contact Information */}
                      <div style={{backgroundColor: '#a3a3a3', borderRadius: 5}}>
                        <Label className="ml-2 pt-1"><strong style={{fontSize: 20}}>Contact Information</strong></Label>
                      </div>
                      <FormGroup row className="mt-3">
                        <Col xs="12" md="6">
                          <Label htmlFor="contactName">Contact Name : </Label>
                          <Input type="text" id="contactName" name="contactName" autoComplete="text" disabled={this.state.retreivedStatus === gConst.TFNUM_STATE_SPARE}
                                 onChange={(ev) => this.handleChange(ev)} value={this.state.contactName}/>
                        </Col>
                        <Col xs="12" md="6">
                          <Label htmlFor="contactNumber">Contact Number : </Label>
                          <Input id="contactNumber" name="contactNumber" disabled={this.state.retreivedStatus === gConst.TFNUM_STATE_SPARE}
                                 onChange={(ev) => this.handleChange(ev)} value={gFunc.formattedNumber(this.state.contactNumber)}/>
                        </Col>
                        <Col className="mt-3">
                          <Label htmlFor="notes">Notes</Label>
                          <Input type="textarea" name="notes" id="notes" rows="5" disabled={this.state.retreivedStatus === gConst.TFNUM_STATE_SPARE}
                                 onChange={(ev) => this.handleChange(ev)} value={this.state.notes}/>
                        </Col>
                      </FormGroup>

                      {/* Buttons */}
                      <Col className="text-right">
                        <Button size="md" color="primary" className="mr-2" onClick={this.updateTFNumber} disabled={this.state.retreivedStatus === gConst.TFNUM_STATE_SPARE}>Save</Button>
                        <Button size="md" color="danger" onClick={this.cancel}>Cancel</Button>
                      </Col>
                    </div>
                    }
                  </CardBody>
                </Collapse>
              </Card>
            </Fade>
          </Col>
        </Row>

        <NotificationContainer/>
      </div>
    );
  }
}

export default connect(
  (state) => ({somos: state.auth.profile.somos, token: state.auth.token,})
)(withLoadingAndNotification(NumberQuery));
