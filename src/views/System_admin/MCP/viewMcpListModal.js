import React, { Component } from 'react'
import {  Button, Card, Col, Input, Label, Modal, ModalHeader, ModalBody,  FormGroup } from "reactstrap";
import PropTypes from "prop-types";
import '../../../scss/react-table.css'
import { withAuthApiLoadingNotification } from "../../../components/HOC/withLoadingAndNotification";
import ReactTable from 'react-table';
import Cookies from "universal-cookie";
import * as gConst from "../../../constants/GlobalConstants";
import * as gFunc from "../../../utils";
import Config from '../../../Config';


class ViewMcpListModal extends Component {
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
      statusList: this.props.data.status || [],
      status: "All",
      numberList: [],
      showNumList: [],
      id: this.props.data.id,
      totalCount: this.props.data.totalCount,
      noRecords: this.props.data.noRecords
    };

  }

  componentWillUpdate(nextProps, nextState, nextContext) {

    if (nextProps.data.status && nextProps.data.status !== this.state.statusList) {
      this.setState({ statusList: nextProps.data.status.sort() })
    }

    if (nextProps.data.numberList && nextProps.data.numberList !== this.state.numberList) {
      this.setState({ numberList: nextProps.data.numberList, showNumList: nextProps.data.numberList })
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

  /**
   * call when the user click the download button
   * */
  download = () => {
    this.downloadForm.action = Config.apiEndPoint + "/somos/automation/result/filterview/download?id=" + this.props.data.id + "&status=" + this.state.status
    this.textInput.value = this.props.token;
    this.downloadForm.submit();
    this.textInput.value = "";
  };

  onClose = () => {
    this.setState({ status: "All" });
    this.props.toggle();
  }

  handleChange = async (ev) => {
    await this.setState({ [ev.target.name]: ev.target.value })

    let showNumList = []
    for (let num of this.state.numberList) {
      if (this.state.status !== "All" && this.state.status !== num.status) { continue }

      showNumList.push(num)
    }
    this.setState({showNumList: showNumList, totalCount: showNumList.length})
  }

  /**
   * number cell
   * @param value
   * @param onClickPAD
   * @returns {*}
   */
  numCell = ({ value, columnProps: { rest: { onClickPAD } } }) => {
    return <div className="text-center" style={{marginTop: 10}}><a href="#" onClick={() => onClickPAD(value)}>{gFunc.formattedNumber(value)}</a></div>
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

  // Number List Columns
  numberListColumn = [
    {
      Header: "Number",
      accessor: 'num',
      width: gConst.NUMBER_COLUMN_WIDTH,
      Cell: this.numCell,
      getProps: () => ({
        onClickPAD: (number) => {
          this.gotoPADPage(number)
        },
      }),
    },
    {
      Header: "Result",
      accessor: 'status',
      width: gConst.STATUS_COLUMN_WIDTH,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
    {
      Header: "Message",
      accessor: 'failReason',
      // width: 400,
      Cell: props => <div className="text-center" style={{marginTop: 10}}>{props.value}</div>
    },
  ]

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
            <Col lg={4} className="row">
              <Label className="col-5 text-right">Result:</Label>
              <Input type="select" className="col-7 form-control-sm" name="status"
                onChange={this.handleChange} value={this.state.status}>
                <option value="All">All</option>
                {this.state.statusList && this.state.statusList.map(s => <option key={s} value={s}>{s}</option>)}
              </Input>
            </Col>
            <Col lg={2} className="row"></Col>
            <Col lg={2} className="row">
              <p> Total Records :
                <span className="font-weight-bold"> { this.state.totalCount }</span>
              </p>
            </Col>
           <Col lg={2} className="row"></Col>
           <Col lg={2} className="row">
             <Button size="sm" color="success" className="ml-2" onClick={this.download}>
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

export default withAuthApiLoadingNotification(ViewMcpListModal)
