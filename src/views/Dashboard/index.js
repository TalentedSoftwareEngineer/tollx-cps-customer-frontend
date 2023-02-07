import React, {Component} from 'react'
import withLoadingAndNotification from "../../components/HOC/withLoadingAndNotification"
import {Col, Row} from "reactstrap"
import NewsAndEvents from "./NewsAndEvents"
import CustomerRecordSummary from "./CustomerRecordSummary"
import ReservationLimits from "./ReservationLimits"
import TfnsToBeSpared from "./TfnsToBeSpared"
import TemplateRecordList from "./TemplateRecordList"
import NumberAdminSummary from "./NumberAdminSummary"
import RestApi from "../../service/RestApi";
import {connect} from "react-redux";

// class Tasks extends Component {
class Dashboard extends Component {

  constructor(props) {
    super(props);
    this.state = {
      events: [],                  // task list
      cusRecs: [],              // task list for displaying
      resvLimits: {
        workingNumCnt: 0,
        reservNums: 0,
        maxReservLimits: 2000,
        remainReserv: 2000
      },
      tfnsToBeSpared: [],
      tmplRecs: [],
      numAdmins: []
    }
  }

  componentDidMount() {

    // this.props.callApi2(RestApi.getDashboardData, {}).then(res => {
    //   if (res.ok && res.data) {
    //     for (let el of res.data) {
    //       switch (el.id) {
    //         case "EVENT_DETAILS_SUMMARY":
    //           let eventList = []
    //           for (let ev of el.data) {
    //             for (let msg of ev.colValues) {
    //               let event = {
    //                 dt: msg.split("~")[0],
    //                 content: msg.split("~")[1]
    //               }
    //
    //               eventList.push(event)
    //             }
    //           }
    //
    //           this.setState({events: eventList})
    //           break
    //
    //         case "CUSTOMER_RECORD_SUMMARY":
    //           let cusRecList = []
    //           for (let cusEl of el.data) {
    //             let cusRec = {
    //               status: cusEl.rowName,
    //               cad: cusEl.colValues[0],
    //               pad: cusEl.colValues[1],
    //             }
    //
    //             cusRecList.push(cusRec)
    //           }
    //
    //           this.setState({cusRecs: cusRecList})
    //           break
    //
    //         case "REL_SUMMARY":
    //           let resvLimits = {}
    //           for (let info of el.data) {
    //             switch (info.rowName) {
    //               case "Working Number Count":
    //                 resvLimits.workingNumCnt = info.colValues[0]
    //                 break
    //
    //               case "Reserved Numbers":
    //                 resvLimits.reservNums = info.colValues[0]
    //                 break
    //
    //               case "Max Reservation Limit":
    //                 resvLimits.maxReservLimits = info.colValues[0]
    //                 break
    //
    //               case "Remaining Reservation":
    //                 resvLimits.remainReserv = info.colValues[0]
    //                 break
    //             }
    //           }
    //
    //           this.setState({resvLimits: resvLimits})
    //           break
    //
    //         case "TFN_SPARE_SUMMARY":
    //           let tfnsToBeSpared = []
    //           for (let info of el.data) {
    //             let tfnInfo = {
    //               npa: info.rowName,
    //               cnt: info.colValues[0]
    //             }
    //
    //             tfnsToBeSpared.push(tfnInfo)
    //           }
    //
    //           this.setState({tfnsToBeSpared: tfnsToBeSpared})
    //           break
    //
    //         case "TEMPLATE_RECORD_SUMMARY":
    //           let tmplRecList = []
    //           for (let info of el.data) {
    //             let tmplInfo = {
    //               status: info.rowName,
    //               cnt: info.colValues[0]
    //             }
    //
    //             tmplRecList.push(tmplInfo)
    //           }
    //
    //           this.setState({tmplRecs: tmplRecList})
    //           break
    //
    //         case "NUMBER_ADMIN_SUMMARY":
    //           let numAdminList = []
    //           for (let info of el.data) {
    //             let numInfo = {
    //               status: info.rowName,
    //               cnt: info.colValues[0]
    //             }
    //
    //             numAdminList.push(numInfo)
    //           }
    //
    //           this.setState({numAdmins: numAdminList})
    //           break
    //       }
    //     }
    //   }
    // })
  }

  render() {
    return (
      <>
        <Row>
          <Col className="xs-4">
            <NewsAndEvents/>
          </Col>
          <Col className="xs-4">
            <CustomerRecordSummary/>
          </Col>
          <Col className="xs-4">
            <ReservationLimits/>
          </Col>
        </Row>
        <Row>
          <Col className="xs-4">
            <TfnsToBeSpared/>
          </Col>
          <Col className="xs-4">
            <TemplateRecordList/>
          </Col>
          <Col className="xs-4">
            <NumberAdminSummary/>
          </Col>
        </Row>
      </>
    )
  }
}

export default withLoadingAndNotification(Dashboard)
