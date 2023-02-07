import React, {Component} from 'react';
import $ from 'jquery'
import {  Button,  Card,  CardBody,  CardHeader,  FormGroup,  FormText,  Input,  Label,  Fade,  Collapse,  Modal,  ModalBody,  ModalFooter,  ModalHeader,  Tooltip,  Badge } from 'reactstrap';
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'

import {connect} from 'react-redux'

import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

// notification
import {NotificationContainer, NotificationManager} from'react-notifications';
import 'react-notifications/lib/notifications.css';

import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import RestApi from "../../../service/RestApi";
import * as gConst from "../../../constants/GlobalConstants";

import * as gFunc from "../../../utils";

import ReactTable from 'react-table';
import 'react-table/react-table.css'

import ChoiceUnitModal from './ChoiceUnitModal'

const SEARCH_TYPE_UNIT    = "SEARCH_TYPE_UNIT"
const SEARCH_TYPE_ENTITY  = "SEARCH_TYPE_ENTITY"
const SEARCH_TYPE_NUMBER  = "SEARCH_TYPE_NUMBER"

class RespOrgInfo extends Component {
  constructor(props) {
    super(props);


    this.state = {

      entityList: [],
      unitList: [],

      srchType: SEARCH_TYPE_UNIT,
      srchUunit: '',
      srchEntity: '',
      srchNumber: '',

      selUnitModalVisible: false,
      modalOpened: false,

      entity: '',
      compName: '',
      contactNum: '',
      email: '',

      respOrgList: [],

      collapseSearch: true,         // the flag to represent if the search panel is collapse
      collapseAdvancedSearch: true, // the flag to represent if the advanced search panel is collapse
      fadeInSearch: true,           // the value of fade in for the search panel
      fadeInResult: true,           // the value of fade in for the result panel
      timeoutSearch: 300,           // the value of timeout for the search panel
      timeoutResult: 300,           // the value of timeout for the result panel

    }
  }


  componentDidMount = async () => {
    this.getEntitiesAndUnits()
  }

  getEntitiesAndUnits = async () => {

    // retrieves the entity list by calling api.
    let params = {}
    await this.props.callApi2(RestApi.getRespOrgEntityLst, params).then(res => {
      if (res.ok && res.data) {
        let entityString = ""
        let entityList = []

        let respOrgList = res.data.respOrgList
        for (let i = 0; i < respOrgList.length; i++) {
          let entity = respOrgList[i]
          if (entityString === "") {
            entityString = entity.respOrgEntity
          }

          entityList.push(entity.respOrgEntity)
        }

        this.setState({srchEntity: entityString, entityList: entityList});

      } else if (res.data && res.data.errList) {
        NotificationManager.error("", gFunc.synthesisErrMsg(res.data.errList))
      }
    })

    // retrieves the unit list by calling api.
    await this.props.callApi2(RestApi.getRespOrgUnitList, params).then(res => {
      if (res.ok && res.data) {
        let unitString = ""
        let unitList = []

        let respOrgList = res.data.respOrgList
        for (let i = 0; i < respOrgList.length; i++) {
          let unit = respOrgList[i]
          if (unitString == "") {
            unitString = unit.respOrgId
          }

          unitList.push(unit.respOrgId)
        }

        this.setState({srchUnit: unitString, unitList: unitList});

      } else if (res.data && res.data.errList) {
        NotificationManager.error("", gFunc.synthesisErrMsg(res.data.errList))
      }
    })
  }


  /**
   *
   * @param event
   */
  handleUppercase = async (event) => {
    console.log("HandleUppercase")
    const input = event.target;

    let state = {}
    state[input.name] = input.value.toUpperCase()

    await this.setState(state);
  };

  /**
   *
   */
  handleChange = (event) => {
    const state = {};
    state[event.target.name] = event.target.value;
    this.setState(state);
  }

  retrieve = async () => {
    let response = null
    let params = {}
    switch (this.state.srchType) {
      case SEARCH_TYPE_UNIT:
        if (this.state.srchUnit === '') {
          NotificationManager.error("", "Please input resp org id.")
          return
        }

        params.unit = this.state.srchUnit
        await this.props.callApi2(RestApi.getRespOrgForUnit, params).then(res => {
          if (res.ok && res.data) {
            response = res.data

          } else if (res.data && res.data.errList) {
            NotificationManager.error("", gFunc.synthesisErrMsg(res.data.errList))
          }
        })
        break

      case SEARCH_TYPE_ENTITY:
        if (this.state.srchEntity === '') {
          NotificationManager.error("", "Please input resp org entity.")
          return
        }

        params.entity = this.state.srchEntity
        await this.props.callApi2(RestApi.getRespOrgForEntity, params).then(res => {
          if (res.ok && res.data) {
            response = res.data

          } else if (res.data && res.data.errList) {
            NotificationManager.error("", gFunc.synthesisErrMsg(res.data.errList))
          }
        })
        break

      case SEARCH_TYPE_NUMBER:
        if (this.state.srchNumber === '') {
          NotificationManager.error("", "Please input toll-free number.")
          return
        }

        params.number = this.state.srchNumber
        await this.props.callApi2(RestApi.getRespOrgForNumber, params).then(res => {
          if (res.ok && res.data) {
            response = res.data

          } else if (res.data && res.data.errList) {
            NotificationManager.error("", gFunc.synthesisErrMsg(res.data.errList))
          }
        })
        break
    }

    if (response != null) {
      this.setState({
        entity: response.respOrgEntity,
        compName: response.companyName,
        contactNum: response.contactPhone,
        email: response.emailId,
        respOrgList: response.associatedRespOrgs != undefined ? response.associatedRespOrgs : []
      })
    }
  }

  onFocusUnit = () => {
    if (!this.state.modalOpened)
      this.setState({selUnitModalVisible: true, modalOpened: true})
    else
      this.setState({modalOpened: false})
  }

  onBlurUnit = () => {

  }

  closeSelUnitModal = async () => {
    await this.setState({selUnitModalVisible: false})
    $('#unitRaido').focus()
  }

  setUnit = (unit) => {
    this.setState({srchUnit: unit})
    this.closeSelUnitModal()
  }

  // result Columns
  resultColumns = [
    {
      Header: "Resp Org ID",
      accessor: 'respOrgId',
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Business Unit Name",
      accessor: 'businessUnitName',
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Trouble Referral Number",
      accessor: 'troubleRef',
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Primary E-mail",
      accessor: 'email',
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Status",
      accessor: 'status',
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    }
  ]

  render() {
    return (
      <Container fluid="xs">
        <Label className="ml-1"><strong style={{fontSize: 30}}>Resp Org Information</strong></Label>
        <Row xs={1} className="mt-3">
          <Col>
            <Fade timeout={this.state.timeoutSearch} in={this.state.fadeInSearch}>
              <Card>

                <CardHeader>
                  <strong>Search</strong>
                </CardHeader>

                <CardBody>
                  <Row>

                    <Col lg={11} xl={3} className="ml-4 mr-2 mb-4">
                      <Row style={{display: "flex", justifyContent: 'space-around'}}>
                        <Col xs={5} >
                          <Input type="radio" className="form-control-sm" style={{'marginTop': '-0.3rem'}} id="unitRaido" name="unitRaido"
                                 checked={this.state.srchType === SEARCH_TYPE_UNIT} onChange={() => { this.setState({srchType: SEARCH_TYPE_UNIT})}} />
                          <label className="form-check-label" htmlFor="unitRaido">Resp Org ID</label>
                        </Col>
                        <Col xs={6}>
                          <Input className="form-control-sm" type="text" name="srchUnit" id="srchUnit" value={this.state.srchUnit}
                                 onClick={this.onFocusUnit} onBlur={this.onBlurUnit} disabled={this.state.srchType !== SEARCH_TYPE_UNIT}/>
                        </Col>
                      </Row>
                    </Col>

                    <Col lg={11} xl={3} className="ml-4 mr-2 mb-4">
                      <Row style={{display: "flex", justifyContent: 'space-around'}}>
                        <Col xs={5}>
                          <Input type="radio" className="form-control-sm" style={{'marginTop': '-0.3rem'}} id="entityRadio" name="entityRadio"
                                 checked={this.state.srchType === SEARCH_TYPE_ENTITY} onChange={() => { this.setState({srchType: SEARCH_TYPE_ENTITY})}} />
                          <label className="form-check-label" htmlFor="entityRadio">Resp Org Entity</label>
                        </Col>
                        <Col xs={6}>
                          <select className="form-control-sm" disabled={this.state.srchType !== SEARCH_TYPE_ENTITY}
                                  name="srchEntity" id="srchEntity" onChange={(ev) => this.handleUppercase(ev)} value={this.state.srchEntity}>
                            <>{this.state.entityList.map(value => {return <option key={value}>{value}</option>})}</>
                          </select>
                        </Col>
                      </Row>
                    </Col>

                    <Col lg={11} xl={4} className="ml-4 mr-4 mb-4">
                      <Row style={{display: "flex", justifyContent: 'space-around'}}>
                        <Col xs={5}>
                          <Input type="radio" className="form-control-sm" style={{'marginTop': '-0.3rem'}} id="numberRadio" name="numberRadio"
                                 checked={this.state.srchType === SEARCH_TYPE_NUMBER} onChange={() => { this.setState({srchType: SEARCH_TYPE_NUMBER})}} />
                          <label className="form-check-label" htmlFor="numberRadio">Toll-Free Number</label>
                        </Col>
                        <Col xs={6}>
                          <Input className="form-control-sm mt-1" type="text" name="srchNumber" id="srchNumber" onChange={(ev) => this.handleChange(ev)} value={this.state.srchNumber} disabled={this.state.srchType !== SEARCH_TYPE_NUMBER}/>
                        </Col>
                      </Row>
                    </Col>

                    <Col xs={12} style={{display: "flex", justifyContent: 'flex-end'}}>
                      <Button type="submit" size="md" color="primary" className="mr-2" onClick={this.retrieve}>Retrieve</Button>
                    </Col>

                  </Row>
                </CardBody>

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
                <CardBody>

                  <Card>
                    <CardHeader>
                      <strong>Entity Information</strong>
                    </CardHeader>

                    <CardBody>
                      <div className="row" >
                        <Col style={{backgroundColor: gConst.PANEL_BACKGROUND_COLOR, marginLeft: '2px', height: 30}}>Entity ID</Col>
                        <Col style={{backgroundColor: gConst.PANEL_BACKGROUND_COLOR, marginLeft: '2px'}}>Company Name</Col>
                        <Col style={{backgroundColor: gConst.PANEL_BACKGROUND_COLOR, marginLeft: '2px'}}>Contact Number</Col>
                        <Col style={{backgroundColor: gConst.PANEL_BACKGROUND_COLOR, marginLeft: '2px'}}>E-mail Address</Col>
                      </div>

                      <div className="row mt-1">
                        <Col style={{backgroundColor: gConst.PANEL_BACKGROUND_COLOR, marginLeft: '2px', height: 30}}>{this.state.entity}</Col>
                        <Col style={{backgroundColor: gConst.PANEL_BACKGROUND_COLOR, marginLeft: '2px'}}>{this.state.compName}</Col>
                        <Col style={{backgroundColor: gConst.PANEL_BACKGROUND_COLOR, marginLeft: '2px'}}>{this.state.contactNum}</Col>
                        <Col style={{backgroundColor: gConst.PANEL_BACKGROUND_COLOR, marginLeft: '2px'}}>{this.state.email}</Col>
                      </div>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardHeader>
                      <strong>Resp Org List</strong>
                    </CardHeader>

                    <CardBody>
                      <div className="row">
                        <Col>
                          Total: { this.state.respOrgList.length}
                        </Col>
                      </div>

                      <div className="mt-2">
                        <ReactTable
                          data={this.state.respOrgList} columns={this.resultColumns} defaultPageSize={10} minRows="1" className="-striped -highlight col-12"
                          ref={(r) => this.selectActivityLogTable = r}
                        />
                      </div>
                    </CardBody>
                  </Card>
                </CardBody>
              </Card>
            </Fade>
          </Col>
        </Row>

        <form ref={(node) => { this.downloadForm = node }} action="" target="_blank" method="post">
          <input type="hidden" ref={(input) => { this.textInput = input }} name="access_token" value="" />
        </form>

        <ChoiceUnitModal
          visible={this.state.selUnitModalVisible}
          unit={this.state.srchUnit}
          unitList={this.state.unitList}
          setUnit={(unit) => this.setUnit(unit)}
          onClose={this.closeSelUnitModal}
        />
        {/*{this.renderSelUnitModal()}*/}

        <NotificationContainer/>

      </Container>
    );
  }

  renderSelUnitModal = () => (
    <Modal isOpen={this.state.selUnitModalVisible} toggle={this.closeSelUnitModal} className={'modal-lg ' + this.props.className}>
      <ModalHeader toggle={this.closeSelUnitModal}>Select Resp Org ID</ModalHeader>
      <ModalBody>
        <div style={{width: '100%'}}>
          <div className="row ml-1 mr-1 mb-2">
            Search:
            <input type="text" value={this.state.searchValue} onChange={(ev) => {this.onChangeSearchValue(ev)}}/>
          </div>

          <table className="border" style={{width: '100%', height: '93%', display: 'flex', flexFlow: 'column'}}>
            <thead>
            <tr>
              <th style={{width: '15%'}}/>
              <th>{this.props.headerTitle}</th>
            </tr>
            </thead>
            <tbody className="mt-2" style={{width: '100%', height: '450px', overflowY: 'auto', overflowX: 'hidden'}}>
            {this.state.displayList.map((element, index) => {
              return <tr style={{borderWidth: 1, borderStyle: 'solid', borderColor: '#c8ced3'}} key={"tr_" + index}>
                <td>
                  <input type="checkbox" className="form-control-sm" style={{marginLeft: 15, marginRight: 15}} id={"td_" + index}
                         checked={this.state.checkList[index]} onChange={(evt) => this.onChangeChecked(evt)} />
                </td>
                <td style={{width:'200px', 'paddingBottom': '0px'}}>
                  <Label style={{width: '100%', height:'30px', marginBottom: '0px', 'paddingTop': '2px'}} id={"tr_" + index} onClick={(evt)=>this.onChangeChecked(evt)}>{element}</Label>
                </td>
              </tr>
            })}
            </tbody>
          </table>
        </div>

        <div style={{marginTop:"1vw", display: "flex", justifyContent: 'flex-end'}}>
          <Button size="md" color="primary" className="mr-2" onClick={this.onSetChoiceList}>Select</Button>
          <Button size="md" color="danger" onClick={this.onClose}>Cancel</Button>
        </div>
      </ModalBody>
    </Modal>
  );
}

export default connect(
  (state) => ({
    somos: state.auth.profile.somos,
    token: state.auth.token,
    data: state.auth
  })
)(withLoadingAndNotification(RespOrgInfo));

