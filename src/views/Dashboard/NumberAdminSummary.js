import React from 'react';
import {DASHBOARD_SUMMARY_PANEL_HEIGHT} from '../../constants/GlobalConstants'
import withNoToggleCard from "../../components/HOC/withNoToggleCard";

class NumberAdminSummary extends React.Component {
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

export default withNoToggleCard('Number Admin Summary', NumberAdminSummary);
