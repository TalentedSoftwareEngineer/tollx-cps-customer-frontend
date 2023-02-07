import React, {Component} from 'react';
import { DropdownItem, DropdownMenu, DropdownToggle, Dropdown, Input, Label, Nav, Modal, ModalHeader, ModalBody, ModalFooter } from 'reactstrap';
import {  Col, Button, Form } from 'react-bootstrap';
import PropTypes from 'prop-types';
import {AppHeaderDropdown, AppNavbarBrand, AppSidebarToggler} from '@coreui/react';
import {connect} from "react-redux";
import { CircularProgressbarWithChildren } from 'react-circular-progressbar';
import ReactToolTip from 'react-tooltip';
import 'react-circular-progressbar/dist/styles.css';
import { logout as logOutActionCreator, selectRo, setProgress } from '../../redux/AuthRedux';
import RestApi from "../../service/RestApi";
import {callApi} from "../../redux/ApiRedux";
import {ToastContainer, toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import 'react-overlay-loader/styles.css';

// notification
import {NotificationContainer, NotificationManager} from'react-notifications';
import 'react-notifications/lib/notifications.css';
import Image from '../../components/Image';
import Config from '../../Config';

const propTypes = {
  children: PropTypes.node,
};

const defaultProps = {};

class Header extends Component {
  constructor(props) {
    super(props);
    this.state = {
      progress: [],
      dropdownOpen: false,
      pwdModal: false,
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
      validated: false,

      isSomosPassword: false,

      selectRo: '',
      roChangeModalVisible: false
    };
  }

  componentDidMount() {
    this.backPressureEvent();
  }

  handleChange = (ev) => {
    const { name, value } = ev.target;
    this.setState({[name]: value});
  }

  toggle = () => {
    this.setState({
      dropdownOpen: !this.state.dropdownOpen
    });
  }

  changePassword = (ev) => {
    ev.preventDefault();
    this.setState({validated: true});
    let isValidForm = true;
    if (this.state.newPassword !== this.state.confirmPassword) {
      NotificationManager.error("", "Password does not match")
      this.setState({validated: false})
      isValidForm = false
      return false
    }

    const form = ev.currentTarget;
    if (form.checkValidity() === true && isValidForm === true) {
      let req = { oldPassword: this.state.oldPassword, newPassword: this.state.newPassword }
      this.props.callApi(RestApi.updatePassword, (response) => {
        if (response.ok && response.data.msg) {
          this.closePwdModal()
          NotificationManager.success("", response.data.msg)

        } else if (response.data.msg) {
          NotificationManager.error("", response.data.msg)
          this.setState({validated: false})
        }
      }, req);
    }
  }

  openPwdModal = () => {
    this.setState({
      pwdModal: true,
    });
  }

  closePwdModal = () => {
    this.setState({pwdModal: false, validated: false, oldPassword: "", newPassword: "", confirmPassword: ""})
  }

  logout = () => {
    this.props.callApi2(RestApi.logout, this.props.id)
    this.props.logout()
  }

  backPressureEvent = () => {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = undefined;
    }
    if (!this.props.token) return;

    const eventSource = new EventSource(Config.eventSourceEndPoint + '/backpressure_events/?access_token=' + this.props.token, {withCredentials: false});
    eventSource.onmessage = (event) => {
      console.log("Event Source data", JSON.parse(event.data));
      try {
        const data = JSON.parse(event.data);
        this.setState({progress: data})
        this.props.setProgress(data)
      } catch(ex){
        console.log(ex);
      }
    };
    this.eventSource = eventSource
  };

  /**
   * this is called at clicking the yes button on the resp org change modal
   **/
  changeRespOrgAction = async () => {
    await this.setState({ roChangeModalVisible: false })
    this.props.selectRo(this.state.selectRo)
  }

  /**
   * this is called at changing the resp org drop down value
   **/
  onChangeRespOrg = (ev) => {
    console.log(ev.target.value);

    // this.setState({ selectRo: ev.target.value })
    // this.props.selectRo(ev.target.value)
    this.setState({ selectRo: ev.target.value, roChangeModalVisible: true })
  }

  /**
   *
   */
  cancelRoChange = () => {
    this.setState({ roChangeModalVisible: false, selectRo: this.props.profile.somos.selectRo });
  }

  render() {
    const { children, profile, ...attributes } = this.props;
    let data = [];
    if (profile.somos.ro) {
      let ros = profile.somos.ro;
      if (ros.includes(",")) {
        data = ros.split(",");
      } else {
        data.push(ros);
      }
    }
    let name = [];
    if (profile.firstName || profile.lastName) {
      name.push(profile.firstName);
      name.push(profile.lastName);
    } else {
      name.push(profile.username)
    }

    return (
      <React.Fragment>
        <AppSidebarToggler className="d-lg-none" display="md" mobile />
        <Label><strong style={{fontSize: 40}} className="ml-5">CPS</strong></Label>

        <Nav className="ml-7" navbar>
          {/*<NavItem className="d-md-down-none">*/}
            {/*<NavLink href="#"><i className="icon-bell"/><Badge pill color="danger">5</Badge></NavLink>*/}
          {/*</NavItem>*/}

          {/*{this.state.progress.map(prog => {*/}
            {/*let {description, progress, category } = prog;*/}
            {/*progress = Math.round(progress * 100);*/}
            {/*return <div style={{width: 110}} className="mr-3">*/}
              {/*<a data-tip data-for="cadBulk">*/}
                {/*<CircularProgressbarWithChildren value={progress} strokeWidth={11}>*/}
                  {/*<div style={{ fontSize: 12}}><strong>{progress}%</strong></div>*/}
                {/*</CircularProgressbarWithChildren>*/}
              {/*</a>*/}
              {/*<ReactToolTip id='cadBulk' type='dark' effect="solid"><span>{description}</span></ReactToolTip>*/}
            {/*</div>*/}
          {/*})}*/}

          <span className="mr-2">RO: </span>
          <Input type="select" bsSize='sm' onChange={this.onChangeRespOrg} className="mr-4" value={this.state.selectRo}>
            {data.map((d, i) => <option key={i} value={d.trim()}>{d.trim()}</option>)}
          </Input>
          {name.map((n, i) => <span key={i} className="mr-1">{n}</span>)}
          <Dropdown className="mr-4" isOpen={this.state.dropdownOpen} toggle={this.toggle}>
            <DropdownToggle nav>
              <Image src='/assets/img/avatars/avatar.png' style={{width: 100, height:42}} className="img-avatar"/>
            </DropdownToggle>
            <DropdownMenu right >
              {/*<DropdownItem><i className="fa fa-user"/> Profile</DropdownItem>*/}
              <DropdownItem onClick={this.openPwdModal}><i className="fa fa-lock"/> Change Password</DropdownItem>
              <DropdownItem onClick={this.logout}><i className="fa fa-lock"/> Logout</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        </Nav>

        <Modal isOpen={this.state.roChangeModalVisible} toggle={this.cancelRoChange} className={'modal-sm ' + this.props.className}>
          <ModalHeader toggle={this.cancelRoChange}>Confirm</ModalHeader>
          <ModalBody>
            <Label>Are you sure you want to change your Resp Org?</Label>
            <div style={{display: "flex", justifyContent: 'flex-end'}}>
              <Button size="md" color="primary" className="mr-2" onClick={this.changeRespOrgAction}>Yes</Button>
              <Button size="md" color="danger" onClick={this.cancelRoChange}> No</Button>
            </div>
          </ModalBody>
        </Modal>

        <Modal isOpen={this.state.pwdModal} toggle={this.closePwdModal} size="lg">
          <Form noValidate validated={this.state.validated} onSubmit={this.changePassword}>
            <ModalHeader toggle={this.closePwdModal}>Change Password</ModalHeader>
            <ModalBody>
              <Form.Row>
                <Form.Group md="4" as={Col} controlId="oldPassword">
                  <Form.Label>Old Password</Form.Label>
                  <Form.Control required type="password" placeholder="Old Password"
                    name="oldPassword" onChange={this.handleChange}
                    defaultValue={this.state.oldPassword}
                  />
                </Form.Group>
                <Form.Group md="4" as={Col} controlId="newPassword">
                  <Form.Label>New Password</Form.Label>
                  <Form.Control required type="password" placeholder="New Password"
                    name="newPassword" onChange={this.handleChange}
                    defaultValue={this.state.newPassword}
                  />
                </Form.Group>
                <Form.Group md="4" as={Col} controlId="confirmPassword">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control required type="password" placeholder="Confirm Password"
                    name="confirmPassword" onChange={this.handleChange}
                    defaultValue={this.state.confirmPassword}
                  />
                </Form.Group>
              </Form.Row>
            </ModalBody>
            <ModalFooter className="text-center">
              <Button color="primary"  type="submit">Change</Button>
              <Button color="danger" onClick={this.closePwdModal}>Cancel</Button>
            </ModalFooter>
          </Form>
        </Modal>
        <NotificationContainer/>
      </React.Fragment>
    );
  }
}

Header.propTypes = propTypes;
Header.defaultProps = defaultProps;


export default connect(
  state => ({
    profile: state.auth.profile,
    token: state.auth.token,
    id: state.auth.profile.id
  }),
  dispatch => ({
    logout: () => dispatch(logOutActionCreator()),
    selectRo: (ro) => dispatch(selectRo(ro)),
    setProgress: (progress) => dispatch(setProgress(progress)),
    callApi: (method, callback, ...args) => dispatch(callApi(method, callback, ...args)),
    callApi2: (method, ...args) => new Promise((resolve, _) => {
      dispatch(callApi(method, resolve, ...args))
    }),
  }))(Header)
