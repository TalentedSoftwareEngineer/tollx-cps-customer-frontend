import {Component} from "react";
import PropTypes from "prop-types";
import {Button, Card, CardBody, Col, FormGroup, Modal, ModalBody, ModalHeader} from "reactstrap";
import {withAuthApiLoadingNotification} from "../../../components/HOC/withLoadingAndNotification";
import React from "react";
import * as gFunc from "../../../utils";

class ViewReservedNumbersModal extends Component {
  static propTypes = {
    isOpen: PropTypes.bool,
    toggle: PropTypes.func,
    data: PropTypes.object,
    ...Modal.propTypes,
  };

  constructor(props) {
    super(props);
    this.state = {
      csvHeader: this.props.data.csvHeader,
      numGrid: this.props.data.numGrid,
      totalCount: this.props.data.totalCount,
    };
  }

  componentWillUpdate(nextProps, nextState, nextContext) {

    if (nextProps.data.csvHeader && nextProps.data.csvHeader !== this.state.csvHeader) {
      this.setState({ csvHeader: nextProps.data.csvHeader })
    }

    if (nextProps.data.numGrid && nextProps.data.numGrid !== this.state.numGrid) {
      this.setState({ numGrid: nextProps.data.numGrid })
    }

    if (nextProps.data.totalCount && nextProps.data.totalCount !== this.state.totalCount) {
      this.setState({ totalCount: nextProps.data.totalCount })
    }
  }

  componentWillReceiveProps(newProps) {
    this.setState({ csvHeader: '', totalCount: "", numGrid: [] });
  }

  onClose = () => {
    this.props.toggle();
  }

  download = async (ev) => {
    let csv = this.state.csvHeader

    if (this.state.totalCount) {
      csv += "Reserved Numbers\r\n"
      for (let row of this.state.numGrid) {
        for (let number of row) {
          if (number === '')  continue

          const num = number.substr(0, 3) + "-" + number.substr(3, 3) + "-" + number.substr(6, 4)
          csv += `${num}\r\n`
        }
      }
    }

    const downloadLink = document.createElement("a");
    const blob = new Blob(["\ufeff", csv]);
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = "Auto Reserve Information.csv";  //Name the file here
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  }

  render() {
    return (
      <Modal className="modal-xl" isOpen={this.props.isOpen}>
        <ModalHeader toggle={this.onClose}>View Reserved Numbers</ModalHeader>
        <ModalBody>
          <FormGroup row>
            <Col lg={8} className="row"></Col>
            <Col lg={1} className="row">
              <p> Total :
                <span className="font-weight-bold"> { this.state.totalCount }</span>
              </p>
            </Col>
            <Col lg={1} className="row"></Col>
            <Col lg={2} className="row">
              <Button size="sm" color="success" className="ml-2" onClick={this.download}>
                <i className="fa fa-download"></i> Download
              </Button>
            </Col>
          </FormGroup>

          <FormGroup row>
            <Col md={12}>
              <Card className="mb-2">
                <CardBody className="pb-4">
                  <table className="table-bordered fixed_header">
                    <tbody style={{fontSize: 11 }} style={{height:240}}>
                    {
                      this.state.numGrid && this.state.numGrid.map((datas, i) => {
                        return (
                          <tr key={i} style={{height: '30px'}}>
                            {
                              datas.map((data, j) => {
                                return (
                                  <td key={j} style={{textAlign: 'center'}}>
                                    {gFunc.formattedNumber(this.state.numGrid[i][j])}
                                  </td>
                                )
                              })
                            }
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </CardBody>
              </Card>
            </Col>
          </FormGroup>

        </ModalBody>
      </Modal>
    );
  }
}

export default withAuthApiLoadingNotification(ViewReservedNumbersModal)
