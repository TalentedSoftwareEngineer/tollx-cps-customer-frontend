import React from 'react';
import {connect} from "react-redux";
import renderMixin from './TAD.render';
import methodMixin from './TAD.method';
import {selectRo, cadToTadState} from "../../../redux/AuthRedux";

import {withAuthApiLoadingNotification} from "../../../components/HOC/withLoadingAndNotification";

class Component extends React.Component {}
const TAD = renderMixin(methodMixin(Component));
export default connect((state) => ({somos: state.auth.profile.somos, cadState: state.auth.cadState}),
  dispatch => ({
    cadToTadState:(cadState) => dispatch(cadToTadState({cadState})),
    selectRo:(ro) => dispatch(selectRo(ro)),
  })
)(withAuthApiLoadingNotification(TAD));
