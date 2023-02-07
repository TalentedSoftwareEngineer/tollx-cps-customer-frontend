import React, {Component} from 'react';
import $ from "jquery"

import {  Button,  Card,  CardBody,  CardHeader,  Col,  FormGroup,  Input,  Label,  Row,  Fade,  Collapse,  Modal,  ModalHeader,  ModalBody,  FormText } from 'reactstrap';
import "react-toastify/dist/ReactToastify.css";
import '../../../scss/react-table.css'
import _ from "lodash";
import ReactTable from 'react-table';
import {connect} from 'react-redux';

import { state_value } from '../../../service/template'
import Cookies from 'universal-cookie';
import RestApi from "../../../service/RestApi";
import withLoadingAndNotification from "../../../components/HOC/withLoadingAndNotification";
import * as gFunc from "../../../utils";

// notification
import {NotificationContainer, NotificationManager} from'react-notifications';
import 'react-notifications/lib/notifications.css';

import ReactExport from "react-export-excel";

const ExcelFile = ReactExport.ExcelFile;
const ExcelSheet = ReactExport.ExcelFile.ExcelSheet;
const ExcelColumn = ReactExport.ExcelFile.ExcelColumn;

const ENTITY_LIST = [ "AK", "EJ", "TT", "XQ", "ZX" ];

class TemplateList extends React.Component {

  constructor(props) {
    super(props);
    this.toggle_retrieve = this.toggle_retrieve.bind(this);
    this.state = {
      bExpRetrieve: true,   // the flag whether the retrieve card should be expanded or collapsed
      bExpResult: true,     // the flag whether the result card should be expanded or collapsed
      timeout_retrieve: 300,
      timeout_result: 300,
      templates: [],        // template list near by current time
      allTemplates: [],     // all template list
      entity: "",           // selected value of entity select field
      entityList: [],       // option list of entity select field
      template: "",         // starting template name
      validTemplate: true,  //
      isModal: false,       // modal show boolean variable
      selTmplName: '',      // selected template name to show the modal
      selEffDtTm: '',       // effective date time of the template record that is selected on the modal
      status: '',           // status of the template record that is selected on the modal
      selTmplList: [],      // template list to show on the modal
      checked: false,       // checked on modal
      disable: true,        // download, print button disable
      bReadyDownload: false,  //
    };

    this.tmplInputRef = React.createRef()
  }


  toggle_retrieve() {
    this.setState({bExpRetrieve: !this.state.bExpRetrieve});
  }

  toggle_result() {
    this.setState({bExpResult: !this.state.bExpResult});
  }

  componentDidMount() {

    this.setState({entity: ENTITY_LIST[0], entityList: ENTITY_LIST});

    // retrieves the entity list calling api.
    // let params = { }
    // this.props.callApi2(RestApi.getRespOrgEntityLst, params).then(res => {
    //
    //   if (res.ok && res.data) {
    //     let entityString = ""
    //     let entityList = []
    //
    //     let respOrgList = res.data.respOrgList
    //     for (let i = 0; i < respOrgList.length; i++) {
    //       let entity = respOrgList[i]
    //       if (entityString == "") {
    //         entityString = entity.respOrgEntity
    //       }
    //
    //       entityList.push(entity.respOrgEntity)
    //     }
    //
    //     this.setState({entity: entityString, entityList: entityList});
    //
    //   } else if (res.data && res.data.errList) {
    //     NotificationManager.error("", gFunc.synthesisErrMsg(res.data.errList))
    //   }
    // })

  }

  /* Retrieve Template List
  * request params: entity or template name
  * */
  retrieve_templates = async () => {

    if (this.state.entity === "") {
      NotificationManager.warning("", "Please input entity.")
      return false;
    }

    // check if the template name value is proper to the rule of the template name
    let reg = RegExp(`^\\*${this.state.entity}[A-Z|-]{1}`)
    const template = this.state.template.trim();

    if (template !== '' && !reg.test(template)) {
      await this.setState({validTemplate: false})
      $('#template').focus()
      return false
    } else {
      this.setState({validTemplate: true})
    }

    console.log(`--------- template:${template}--------`);

    let params = { entity: this.state.entity, startTmplName: template, roId: this.props.somos.selectRo }
    this.props.callApi2(RestApi.getTmplRecLstForEntity, params).then(res => {

      if (res.ok && res.data) {
        let showTmplList = [];  // real showing template list
        let tmplNameList = [];  // only template name list
        let allTmplList = [];   // all template list that is received

        let params = {};

        let amountList = res.data.amountList
        let tmplList = res.data.tmplList
        if (tmplList === undefined || tmplList == null) {
          if (res.data.errList) {
            let errMsgs = gFunc.synthesisErrMsg(res.data.errList)
            NotificationManager.error("", errMsgs)
          }
          return
        }

        for (let i = 0; i < tmplList.length; i++) {
          let tmpl = tmplList[i]
          let amount = amountList[i]

          let effDtTm = gFunc.fromUTCStrToCTStr(tmpl.effDtTm)

          params = {
            'tmplName': tmpl.tmplName,
            'description': tmpl.description,
            'effDtTm': effDtTm,
            'effUTCDtTm': tmpl.effDtTm,
            'custRecStat': tmpl.custRecStat,
            'amount': amount
          };

          let bShouldAddTemplate = false

          if (template !== '') {
            if (tmpl.tmplName.indexOf(template) === 0) {
              bShouldAddTemplate = true
            }
          } else {
            bShouldAddTemplate = true
          }

          if (bShouldAddTemplate) {
            allTmplList.push(params);

            // check if the same template name exists
            let dupTmplName = tmplNameList.find(function (element) {
              return element == tmpl.tmplName;
            })

            if (dupTmplName == null) {
              tmplNameList.push(tmpl.tmplName)
            }
          }
        }

        this.setState({allTemplates: allTmplList})

        // sort template name list
        tmplNameList.sort(function (a, b) {
          if (a > b)
            return 1
          else if (a < b)
            return -1

          return 0
        })

        let curUTCTime = gFunc.getUTCString(new Date())

        for (let tmplName of tmplNameList) {
          let tmplListWithSameName = allTmplList.filter(function (element) {
            return element.tmplName == tmplName
          })

          // sort by effective date&time
          tmplListWithSameName.sort(function (a, b) {
            if (a.effDtTm > b.effDtTm) {
              return 1;
            } else if (a.effDtTm < b.effDtTm) {
              return -1;
            }

            return 0;
          })

          // find the active template nearby current date time
          // if there is no active template, find the template nearby current date time
          let nearActiveTmplIndex = -1
          let nearTmplIndex = 0
          for (let i = tmplListWithSameName.length - 1; i >= 0; i--) {
            if (tmplListWithSameName[i].effUTCDtTm <= curUTCTime) {
               nearTmplIndex = i

              if (tmplListWithSameName[i].custRecStat === 'ACTIVE') {
                nearActiveTmplIndex = i
                break;
              }
            }
          }

          if (nearActiveTmplIndex === -1)
            showTmplList.push(tmplListWithSameName[nearTmplIndex])
          else
            showTmplList.push(tmplListWithSameName[nearActiveTmplIndex])
        }


        console.log("Templates:" + JSON.stringify(showTmplList))

        this.setState({templates: showTmplList, disable: showTmplList.length === 0});

      } else if (res.data && res.data.errList && res.data.errList.length) {
        NotificationManager.error("", res.data.errList[0].errMsg)
      }
    })

  };

  //Get the input value on change event
  handleChange = (event) => {
    const state = {};
    state[event.target.name] = event.target.value;
    this.setState(state);
  };

  //Get the input value on change event
  handleUppercase = (event) => {
    const input = event.target;
    const start = input.selectionStart;
    const end = input.selectionEnd;

    let state = {}
    state[input.name] = input.value.toUpperCase()
    state['validTemplate'] = true

    this.setState(state, ()=>input.setSelectionRange(start, end));
  };

  //Display modal.
  showModal = async (template) => {

    //Display Loading and Modal.
    this.setState({isModal: !this.state.isModal});

    // This phrase is the part that calls API for selected template
    let params = { tmplName: template, roId: this.props.somos.selectRo, isUserAct: true }
    this.props.callApi2(RestApi.queryTmplRec, params).then(res => {

      if (res.ok && res.data) {
        let selTmplList = [];
        let params = {};

        let selEffDtTm = '', status = ''

        let lstEffDtTms = res.data.lstEffDtTms
        for (let i = 0; i < lstEffDtTms.length; i++) {
          let effDtTm = lstEffDtTms[i]
          let tmArr = gFunc.fromUTCStrToCTStr(effDtTm.effDtTm).split(' ')
          params = {
            'index': i,
            'isSavedToDB' : effDtTm.isSavedToDB,
            'effDtTm': effDtTm.effDtTm,
            'effDate': tmArr[0],
            'effTime': tmArr[1] + ' ' + tmArr[2],
            'status': effDtTm.custRecStat,
            'approval': effDtTm.apprStat.replace("_", " "),
            'compPart': effDtTm.custRecCompPart.replace(/\_/g, ", ")
          };

          if (i == 0) {
            selEffDtTm = tmArr[0] + ' ' + tmArr[1] + ' ' + tmArr[2]
            status = effDtTm.custRecStat
          }

          console.log(params);
          selTmplList.push(params);
        }

        this.setState({
          selTmplName: template,
          selEffDtTm: selEffDtTm,
          status: state_value(status),
        })

        this.setState({selTmplList: selTmplList});

      } else if (res.data.errList && res.data.errList.length) {
        NotificationManager.error("", res.data.errList[0].errMsg)
      }
    })
  };

  closeModal = () => {
    this.setState({isModal: false});
  };

  /*
  * Set cookie
  * @params: template, ed, et
  * */
  set_cookie = () => {
    console.log("Cookie: " + this.state.selTmplName + ", " + this.state.selEffDtTm)
    const cookies = new Cookies();
    cookies.set("tmplName", this.state.selTmplName);
    cookies.set("effDtTm", this.state.selEffDtTm);
  };

  //Go TAD
  tad = async () => {
    if (this.state.checked) {
      this.set_cookie();
      this.props.navigate('/template_admin/template_data');
      // push('/template_admin/template_data');
    } else {
      NotificationManager.warning("", "Please select template!")
    }
  };

  //Go LAD
  lad = () => {
    if (this.state.checked) {
      this.set_cookie();
      this.props.history.push('/customer_admin/LAD');
    } else {
      NotificationManager.warning("", "Please select template!")
    }
  };

  //Go CPR
  cpr = () => {
    if (this.state.checked) {
      this.set_cookie();
      this.props.history.push('/customer_admin/CPR');
    } else {
      NotificationManager.warning("", "Please select template!")
    }
  };

  //Get params when event happen in input radio
  onChangeChecked = (evt) => {
    if (evt.target.checked) {
      this.setState({
        checked: evt.target.checked,
        selEffDtTm: evt.target.id,
      });
    }
  };

  /**
   *
   */
  download = () => {
    let allTemplates = [...this.state.allTemplates]
    console.log("All Template: " + allTemplates)

    allTemplates.sort(function (a, b) {
      if (a.tmplName > b.tmplName) {
        return 1;
      } else if (a.tmplName < b.tmplName) {
        return -1;
      }

      if (a.effDtTm > b.effDtTm) {
        return 1;
      } else if (a.effDtTm < b.effDtTm) {
        return -1;
      }

      return 0;
    })

    let params = {
      'tmplName': '',
      'description': '',
      'effDtTm': '',
      'effUTCDtTm': '',
      'custRecStat': ''
    };

    allTemplates.splice(0, 0, params)

    this.setState({allTemplates})

    console.log("Sorted Template: " + allTemplates)

    this.setState({bReadyDownload: true})
  }


  /**
   * print
   * */
  print = () => {

  }

  /**
   * save the template to database
   * tmplName: template name
   * effDtTm: effective date time
   */
  saveToDatabase = async (tmplName, effDtTm) => {

    let paramEffDtTm = effDtTm.replace(/[-|:]/g, "")

    // This phrase is the part that calls API for selected template
    let params = { tmplName: tmplName, effDtTm: paramEffDtTm, roId: this.props.somos.selectRo }
    await this.props.callApi2(RestApi.saveTmplToDB, params).then(res => {
      if (res.ok) {
        let tmplList = [...this.state.selTmplList]

        for (let i = 0; i < tmplList.length; i++) {
          if (tmplList[i].effDtTm === effDtTm) {
            tmplList[i].isSavedToDB = true
            break
          }
        }

        this.setState({selTmplList: tmplList})

      } else if (res.data && res.data.errList && res.data.errList.length) {
        NotificationManager.error("", res.data.errList[0].errMsg)
      }
    })
  }


  // Template List Columns
  templateListColumns = [
    {
      Header: "Template Name",
      accessor: 'tmplName',
      Cell: props => <div md={2} className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Template Description",
      accessor: 'description',
      Cell: props => <div md={6} className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Effective Date Time",
      accessor: 'effDtTm',
      Cell: props => <div md={3} className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "CR Status",
      accessor: 'custRecStat',
      Cell: props => <div md={2} className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Total Amount of Numbers",
      accessor: 'amount',
      Cell: props => <div md={2} className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Action",
      accessor: 'tmplName',
      Cell: props => <div dm={1} className="text-center" style={{marginTop: 10}}>
        <Button size="sm" onClick={() => this.showModal(props.value)} color="primary" className="ml-2">
          <i className="fa fa-eye"></i>
        </Button>
      </div>
    }
  ]

  render() {
    return (
      <div className="animated fadeIn">
        <Label className="ml-1"><strong style={{fontSize: 30}}>Template Record List</strong></Label>
        <Row className="mt-3">
          <Col xs="12">
            <Fade timeout={this.state.timeout_retrieve} in={true}>
              <Card>
                <CardHeader>
                  <strong style={{fontSize: 20}}>Retrieve</strong>
                  <div className="card-header-actions">
                    <a className="card-header-action btn btn-minimize" data-target="#collapseExample"
                       onClick={this.toggle_retrieve.bind(this)}><i
                      className={this.state.bExpRetrieve ? "icon-arrow-up" : "icon-arrow-down"}/></a>
                  </div>
                </CardHeader>
                <Collapse isOpen={this.state.bExpRetrieve} id="collapseExample">
                  <CardBody>
                    <FormGroup row>
                      <Col xs={6} md={4}>
                        <Label>Entity</Label>
                        <Input type="select" className="form-control-sm " id="entity" name="entity" value={this.state.entity} onChange={(ev)=> this.handleChange(ev)}>
                          {this.state.entityList && this.state.entityList.map(s => <option key={s} value={s}>{s}</option>)}
                        </Input>
                      </Col>

                      <Col xs={6} md={6}>
                        <Label>Starting Template Name</Label>
                        <Input type="text" name="template" id="template" value={this.state.template} onChange={(ev) => this.handleUppercase(ev)} ref={this.tmplInputRef}/>
                        {!this.state.validTemplate ?
                          <FormText>
                            <p style={{color: 'red'}}>Template Name: Must start with '*', then a valid 2 character Entity ID, followed by 1-12 alphanumerics. Must be 4-15 characters wide. Dashes are optional in the 4th-15th character positions.</p>
                          </FormText>
                          : ""}
                      </Col>
                      <Col xs={4} md={2}>
                        <Button size="md-10" color="primary" className="mt-3" onClick={this.retrieve_templates.bind(this)}>Retrieve</Button>
                      </Col>
                    </FormGroup>
                  </CardBody>
                </Collapse>
              </Card>
            </Fade>
          </Col>

          <Col xs="12">
            <Fade timeout={this.state.timeout_result} in={true}>
              <Card>
                <CardHeader>
                  <strong style={{fontSize: 20}}>Result</strong>
                  <div className="card-header-actions">
                    <a className="card-header-action btn btn-minimize" data-target="#collapseExample"
                       onClick={this.toggle_result.bind(this)}><i
                      className={this.state.bExpResult ? "icon-arrow-up" : "icon-arrow-down"}/></a>
                  </div>
                </CardHeader>
                <Collapse isOpen={this.state.bExpResult} id="collapseExample">
                  <CardBody>
                    <Row>
                      <Col xs="12" md="12" className="text-right pb-2" >
                        {/*<Button size="md" color="primary" className="mr-2" disabled={this.state.disable} onClick={this.download}>Download</Button>*/}
                        {/*<RenderExcelCom allTemplates={this.state.allTemplates}/>*/}

                        {/*<Button size="md" color="primary" className="mr-2" disabled={this.state.disable} onClick={this.print}>Print</Button>*/}
                      </Col>
                    </Row>

                    <div>
                      <ReactTable
                        data={this.state.templates}
                        columns={this.templateListColumns}
                        defaultPageSize={10} minRows="1"
                        className="-striped -highlight col-12"
                        ref={(r) => this.selectActivityLogTable = r}
                      />
                    </div>
                  </CardBody>
                </Collapse>
              </Card>
            </Fade>

            <Modal isOpen={this.state.isModal} toggle={this.closeModal}
                   className={'modal-lg ' + this.props.className}>
              <ModalHeader toggle={this.closeModal}>
                Template Record Selection
              </ModalHeader>
              <ModalBody>
                <Row>
                  <Col xs="6">Template Name: {this.state.selTmplName}</Col>
                </Row>
                <Card className="mt-3">
                  <CardHeader>Template Record List</CardHeader>
                  <CardBody>
                    <Card>
                      <CardBody>
                        <table style={{width: '100%'}}>
                          <thead>
                          <tr>
                            <th style={{width: '7%'}}/>
                            <th style={{width: '13%', 'text-align': 'center'}}>Eff.Date</th>
                            <th style={{width: '10%', 'text-align': 'center'}}>Time</th>
                            <th style={{width: '15%', 'text-align': 'center'}}>CR Status</th>
                            <th style={{width: '20%', 'text-align': 'center'}}>Approval</th>
                            <th style={{width: '15%', 'text-align': 'center'}}>Components</th>
                            <th style={{'text-align': 'center'}}>Action</th>
                          </tr>
                          </thead>
                          <tbody className="mt-2">
                          {this.state.selTmplList.map((e) => {
                            return <tr style={{borderWidth: 1, borderStyle: 'solid', borderColor: '#c8ced3'}}>
                              <td style={{paddingTop: '7px'}}><input type="radio" className="form-control-sm" style={{marginLeft: 15}} name="check"
                                         onChange={(evt) => this.onChangeChecked(evt)} id={e.effDate + " " + e.effTime} /></td>
                              <td style={{'text-align': 'center'}}>{e.effDate}</td>
                              <td style={{'text-align': 'center'}}>{e.effTime}</td>
                              <td style={{'text-align': 'center'}}>{e.status}</td>
                              <td style={{'text-align': 'center'}}>{e.approval}</td>
                              <td style={{'text-align': 'center'}}>{e.compPart}</td>
                              <td style={{'text-align': 'center'}}>
                                <Button size="md-10" color="primary" disabled={e.isSavedToDB} onClick={()=> {this.saveToDatabase(this.state.selTmplName, e.effDtTm)}}>Save To DB</Button>
                              </td>
                            </tr>
                          })}
                          </tbody>
                        </table>
                      </CardBody>
                    </Card>
                    <FormGroup row className="mt-2 ml-4">
                      <Col xs="12" md="12" className="text-right pb-2" >
                        <Button size="sm" color="primary" className="mr-5" disabled={!this.state.checked} onClick={this.tad}>TAD</Button>
                      </Col>
                    </FormGroup>
                  </CardBody>
                </Card>
              </ModalBody>
            </Modal>
          </Col>
        </Row>

        <NotificationContainer/>
      </div>
    );
  }
}

class RenderExcelCom extends React.Component {
  render(){
    return (
      <ExcelFile element={<button class="mr-2 btn btn-primary btn-md" id="btnDownload" disabled>Download</button>} >
        <ExcelSheet data={this.props.allTemplates} name="Templates">
          <ExcelColumn label="Template Name" value="tmplName"/>
          <ExcelColumn label="Template Description" value="description"/>
          <ExcelColumn label="Effective Date & Time" value="effDtTm"/>
          <ExcelColumn label="CR Status" value="custRecStat"/>
        </ExcelSheet>
      </ExcelFile>
    );
  }
}

export default connect((state) => ({somos: state.auth.profile.somos}))(withLoadingAndNotification(TemplateList));
