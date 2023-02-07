import React from 'react';
import withNoToggleCard from '../../components/HOC/withNoToggleCard';
import {DASHBOARD_SUMMARY_PANEL_HEIGHT} from '../../constants/GlobalConstants'

class CustomerRecordSummary extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return(
      <div style={{height: DASHBOARD_SUMMARY_PANEL_HEIGHT}}>
      </div>
    );
  }
}

export default withNoToggleCard('Customer Record Summary', CustomerRecordSummary);
