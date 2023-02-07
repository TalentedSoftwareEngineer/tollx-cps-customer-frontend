import React from 'react';
import {connect} from "react-redux";
import renderMixin from './CAD.render';
import methodMixin from './CAD.method';
import {cadToTadState, selectRo} from "../../../redux/AuthRedux";

import {withAuthApiLoadingNotification} from "../../../components/HOC/withLoadingAndNotification";

class Component extends React.Component {}
const CAD = renderMixin(methodMixin(Component));
export default connect(
  state => ({
    somos: state.auth.profile.somos,
    contactName: state.auth.profile.contactName,
    contactNumber: state.auth.profile.contactNumber,
    cadState: state.auth.cadState
  }),
  dispatch => ({
    cadToTadState:(cadState) => dispatch(cadToTadState({cadState})),
    selectRo:(ro) => dispatch(selectRo(ro)),
  })
)(withAuthApiLoadingNotification(CAD));
