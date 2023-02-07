import React, { Component } from 'react'
import {
  Button, Card, Col, Input, Label, Modal, ModalHeader, ModalBody, FormGroup } from "reactstrap";
import PropTypes from "prop-types";
import '../../../scss/react-table.css'
import { withAuthApiLoadingNotification } from "../../../components/HOC/withLoadingAndNotification";
import ReactTable from 'react-table';
import * as gConst from "../../../constants/GlobalConstants";
import * as gFunc from "../../../utils";
import Cookies from "universal-cookie";
import Config from '../../../Config';


class ViewMnqListModal extends Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    toggle: PropTypes.func,
    handler: PropTypes.func,
    id: PropTypes.number,
    data: PropTypes.object,
    ...Modal.propTypes,
  };

  static defaultProps = {
    isEditable: true
  };

  constructor(props) {

    super(props);
    this.state = {
      respOrgList: this.props.data.respOrg || [],
      statusList: this.props.data.status || [],
      status: "All",
      respOrg: "All",
      numberList: [],
      showNumList: [],
      id: this.props.data.id,
      totalCount: this.props.data.totalCount,
      noRecords: this.props.data.noRecords
    };

  }

  componentWillUpdate(nextProps, nextState, nextContext) {

    console.log("componentWillUpdate number List: " + this.props.data.numberList);

    if (nextProps.data.respOrg && nextProps.data.respOrg !== this.state.respOrgList) {
      this.setState({ respOrgList: nextProps.data.respOrg.sort() })
    }

    if (nextProps.data.status && nextProps.data.status !== this.state.statusList) {
      this.setState({ statusList: nextProps.data.status.sort() })
    }

    if (nextProps.data.numberList && nextProps.data.numberList !== this.state.numberList) {
      this.setState({ numberList: nextProps.data.numberList, showNumList: nextProps.data.numberList })
      console.log("componentWillUpdate nextProps List: " + nextProps.data.numberList);
    }

    if (nextProps.data.name && nextProps.data.name !== this.state.name) {
      this.setState({ name: nextProps.data.name })
    }

    if (nextProps.data.totalCount && nextProps.data.totalCount !== this.state.totalCount) {
      this.setState({ totalCount: nextProps.data.totalCount })
    }

    if (nextProps.data.noRecords && nextProps.data.noRecords !== this.state.noRecords) {
      this.setState({ noRecords: nextProps.data.noRecords })
    }
  }

  componentWillReceiveProps(newProps) {
    this.setState({ numberList: [], totalCount: "", noRecords: false });
  }

  download = () => {
    this.downloadForm.action = Config.apiEndPoint + "/somos/automation/result/filterview/download?id=" + this.props.data.id + "&status=" + this.state.status
      + "&respOrg=" + this.state.respOrg
    this.textInput.value = this.props.token;
    this.downloadForm.submit();
    this.textInput.value = "";
  };

  onClose = () => {
    this.setState({ status: "All", respOrg: "All" });
    this.props.toggle();
  }

  handleChange = async (ev) => {

    await this.setState({ [ev.target.name]: ev.target.value })

    if (this.state.status === "All" && this.state.respOrg === "All") {
      this.setState({showNumList: this.state.numberList, totalCount: this.state.numberList.length})
      return
    }

    let showNumList = []
    for (let num of this.state.numberList) {
      if (this.state.status !== "All" && this.state.status !== num.status) { continue }

      if (this.state.respOrg === "" && (num.ctrlRespOrgId == null || num.ctrlRespOrgId === "")) {
      } else if (this.state.respOrg !== "All" && this.state.respOrg !== num.ctrlRespOrgId) { continue }

      showNumList.push(num)
    }
    this.setState({showNumList: showNumList, totalCount: showNumList.length})
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
   * go to the template record page
   * @param tmplName
   */
  gotoTADPage = (tmplName) => {
    const cookies = new Cookies();
    cookies.set("tmplName", tmplName);
    cookies.set("effDtTm", "");
    this.props.navigate('/template_admin/template_data');
  }

  numberListColumn = [
    {
      Header: 'Number',
      accessor: 'num',
      width: gConst.NUMBER_COLUMN_WIDTH,
      Cell: props => <div className="text-center">{gFunc.formattedNumber(props.value)}</div>
    },
    {
      Header: 'Resp Org',
      accessor: 'ctrlRespOrgId',
      width: gConst.ROID_COLUMN_WIDTH,
      Cell: props => <div className="text-center">{props.value}</div>,
    },
    {
      Header: 'Status',
      accessor: 'status',
      width: gConst.STATUS_COLUMN_WIDTH,
      Cell: props => <div className="text-center">{props.value}</div>
    },
    {
      Header: 'Template Name',
      accessor: 'tmplName',
      width: gConst.TMPLNAME_COLUMN_WIDTH,
      Cell: this.templateNameCell,
      getProps: () => ({
        onClickCell: (tmplName) => {
          this.gotoTADPage(tmplName)
        },
      }),
    },
    {
      Header: 'Effective Date',
      accessor: 'effDt',
      width: 120,
      Cell: props => <div className="text-center">{props.value}</div>
    },
    {
      Header: 'Last Active',
      accessor: 'lastActDt',
      width: 120,
      Cell: props => <div className="text-center">{props.value}</div>
    },
    {
      Header: 'Reserved Until',
      accessor: 'resUntilDt',
      width: 120,
      Cell: props => <div className="text-center">{props.value}</div>
    },
    {
      Header: 'Disconnect Until',
      accessor: 'discUntilDt',
      width: 120,
      Cell: props => <div className="text-center">{props.value}</div>
    },
    {
      Header: 'Contact Person',
      accessor: 'conName',
      width: 250,
      Cell: props => <div className="text-center">{props.value}</div>
    },
    {
      Header: 'Contact Number',
      accessor: 'conPhone',
      width: gConst.NUMBER_COLUMN_WIDTH,
      Cell: props => <div className="text-center">{gFunc.formattedNumber(props.value)}</div>
    },
    {
      Header: 'Result Status',
      accessor: 'resultStatus',
      width: gConst.STATUS_COLUMN_WIDTH,
      Cell: props => <div className="text-center">{props.value}</div>
    },
    {
      Header: 'Message',
      accessor: 'failReason',
      width: 300,
      Cell: props => <div className="text-center">{props.value}</div>
    },
    {
      Header: 'Notes',
      accessor: 'shrtNotes',
      width: 300,
      Cell: props => <div className="text-center">{props.value}</div>
    },
  ];

  render() {
    let noRecords = "";
    if (this.state.noRecords) {
      noRecords = <p className="top-15 text-center">No Records Found</p>
    }

    return (
      <Modal className="modal-xl" isOpen={this.props.isOpen}>
        <ModalHeader toggle={this.onClose}>View Numbers{this.state.noRecords}</ModalHeader>
        <ModalBody>
         <FormGroup row>
            <Col xl="4" className="row">
              <Label className="col-5 text-right">Resp Org:</Label>
              <Input type="select" className="col-7 form-control-sm" name="respOrg"
                onChange={this.handleChange} value={this.state.respOrg}>
                <option value="All">All</option>
                {this.state.respOrgList && this.state.respOrgList.map(s => <option key={s} value={s}>{s}</option>)}
              </Input>
            </Col>

            <Col xl="4" className="row">
              <Label className="col-5 text-right">Status:</Label>
              <Input type="select" className="col-7 form-control-sm" name="status"
                onChange={this.handleChange} value={this.state.status}>
                <option value="All">All</option>
                {this.state.statusList && this.state.statusList.map(s => <option key={s} value={s}>{s}</option>)}
              </Input>
            </Col>

            <Col xl="2" className="row ml-5 mt-1 mr-2">
              <p> Total Records :
                <span className="font-weight-bold text-right"> { this.state.totalCount }</span>
              </p>
            </Col>

           <Col xl="2" className="row text-right">
              <Button size="sm" color="success" className="ml-5 " onClick={this.download}>
                <i className="fa fa-download"></i> Download
              </Button>
           </Col>
        </FormGroup>

        <FormGroup row>
          <Col md={12}>
            <Card>
              <ReactTable
                data={this.state.showNumList} columns={this.numberListColumn} defaultPageSize={10} minRows="1" className="-striped -highlight col-12"
                ref={(r) => this.selectActivityLogTable = r}
              />
            </Card>
          </Col>
        </FormGroup>

        </ModalBody>
        <form ref={(node) => { this.downloadForm = node }} action="" target="_blank" method="post">
          <input type="hidden" ref={(input) => { this.textInput = input }} name="access_token" value="" />
        </form>
      </Modal>
    );
  }
}

export default withAuthApiLoadingNotification(ViewMnqListModal)
