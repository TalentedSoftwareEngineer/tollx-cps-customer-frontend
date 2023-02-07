import React, {Component} from 'react';
import {
  Button,
  Card,
  CardBody,
  CardGroup,
  Col,
  Container,
  FormFeedback,
  FormGroup,
  Input,
  Label,
  Modal, ModalBody, ModalHeader,
  Row
} from 'reactstrap';
import {connect} from "react-redux";
import {showNotification} from "../../redux/NotificationRedux"
import {Type as NotificationType} from '../../constants/Notifications';
import {login, cancelOverwriteSessionModal} from "../../redux/AuthRedux";
import * as gFunc from "../../utils";

import Loader from "../../components/Loader";
import "../../components/Loader/style.css"

function onChange(value) {
  console.log("Captcha value:", value);
}
class Login extends Component {

  constructor(props) {
    super(props);
    this.state = {
      isVerified: true,
      username: null,
      password: null,
      prevUsername: '',
      prevPassword: '',
      remember: false,
      isUsername: true,
      isPassword: true,
      isActive: false
    };
  }

  // componentWillUpdate(prevProps, prevState, snapshot) {
  //   if (!this.props.overwriteSessionModal) {
  //     this.setState({prevUsername: this.state.username, prevPassword: this.state.password})
  //   }
  //   console.log("username: " + this.state.username, "prevUsername: " + this.state.prevUsername)
  // }

  onloadCallback = () => {
    console.log("captcha is successfully");
  };

  verifyCallback = (response) => {
    if (response) {
      this.setState({
        isVerified: true
      })
    }
  };

  handleSubscribe = () => {
    if (this.state.username === null) {
      this.setState({isUsername: false});
      return false;
    } else {
      this.setState({isUsername: true})
    }

    if (this.state.password === null) {
      this.setState({isPassword: false});
      return false;
    } else {
      this.setState({isPassword: true})
    }

    gFunc.putLog("Sign In Button Pressed")

    if (!this.state.isVerified) {
      this.props.toast(NotificationType.WARNING, "Please verify that you are a human!");
    } else {
      this.props.login(this.state.username, this.state.password, false);
    }

    console.log("click sign in")
  };

  handleKeyPress = (ev) => {
    if (ev.key === "Enter") {
      this.handleSubscribe();
    }
  };

  /**
   *
   */
  loginWithOverwrite = () => {
    this.props.login(this.state.username, this.state.password, true);
  }

  /**
   *
   */
  toggleOverwrite = () => {
    this.props.cancelOverwriteSessionModal()
  }

  onChangeUsername = async (evt) => {
    await this.setState({username: evt.target.value})
    console.log("1. username: " + this.state.username, "prevUsername: " + this.state.prevUsername)
    if (!this.props.overwriteSessionModal) {
      await this.setState({prevUsername: this.state.username})
    } else {
      await this.setState({username: this.state.prevUsername})
    }
    console.log("2. username: " + this.state.username, "prevUsername: " + this.state.prevUsername)
  }

  onChangePassword = async (evt) => {
    await this.setState({password: evt.target.value})
    console.log("1. password: " + this.state.password, "prevPassword: " + this.state.prevPassword)
    if (!this.props.overwriteSessionModal) {
      await this.setState({prevPassword: this.state.password})
    } else {
      await this.setState({password: this.state.prevPassword})
    }
    console.log("2. password: " + this.state.password, "prevPassword: " + this.state.prevPassword)
  }

  render() {
    return (
        <div className="app align-items-center" style={{height: 10}}>
          {this.props.isLoggingIn && <Loader fullPage loading/> }
          <Container className="mt-5">
            <Row className="justify-content-center">
              <Col md="5">
                <CardGroup>
                  <Card className="p-4">
                    <CardBody>
                      <Label>Username</Label>
                      <Input type="text"
                             onChange={(evt) => this.onChangeUsername(evt)}
                             invalid={!this.state.isUsername}
                             value={this.state.username}
                             onKeyPress={this.handleKeyPress}/>
                      {!this.state.isUsername ? <FormFeedback>Please input your username</FormFeedback> : ""}

                      <Label className="mt-4">Password</Label>
                      <Input type="password"
                             onChange={(evt) => this.onChangePassword(evt)}
                             invalid={!this.state.isPassword}
                             value={this.state.password}
                             onKeyPress={this.handleKeyPress}/>
                      {!this.state.isPassword ? <FormFeedback>Please input your password</FormFeedback> : ""}
                      {/*<div className="text-center" style={{marginTop: 20, marginLeft: 25}}>
                        <ReCaptcha
                          render="explicit"
                          sitekey="6LfEqngUAAAAADtqVhY2IKUQl0lKbL-In_AWPPe8"
                          onloadCallback={this.onloadCallback}
                          verifyCallback={this.verifyCallback}
                          theme="light"
                          type="image"
                          onChange={onChange}
                        />
                      </div>*/}
                      <Row className="mt-4">
                        <Col xs="6">
                          <FormGroup check inline>
                            <Label check>
                              <Input type="checkbox" onChange={(evt) => {this.setState({remember: evt.target.checked})}}/> Remember me
                            </Label>
                          </FormGroup>
                        </Col>
                        <Col xs="6" className="text-right">
                          <Button size="md" color="primary" onClick={this.handleSubscribe}><strong className="text-white">Sign In</strong></Button>
                        </Col>
                      </Row>
                    </CardBody>
                  </Card>
                </CardGroup>
              </Col>
            </Row>
          </Container>
          {this.renderOverwriteSession()}
        </div>
    );
  }

  renderOverwriteSession = () => {
    return <Modal isOpen={this.props.overwriteSessionModal} toggle={this.toggleOverwrite} className={'modal-sm ' + this.props.className}>
      <ModalHeader toggle={this.toggleOverwrite}>Overwrite Session</ModalHeader>
      <ModalBody>
        <Label>You currently have an active session. Do you want to overwrite the current session?</Label>
        <div style={{display: "flex", justifyContent: 'flex-end'}}>
          <Button size="md" color="primary" className="mr-2" onClick={this.loginWithOverwrite}>Yes</Button>
          <Button size="md" color="danger" onClick={this.toggleOverwrite}> No</Button>
        </div>
      </ModalBody>
    </Modal>
  };
}

export default connect(
  (state) => ({
    isLoggingIn: state.auth.isLoggingIn || false,
    overwriteSessionModal: state.auth.overwriteSessionModal
  }),
  (dispatch) => ({
    toast:(type, message) => dispatch(showNotification(type, message)),
    login:(username, password, overwriteSession) => dispatch(login(username, password, overwriteSession)),
    cancelOverwriteSessionModal:() => dispatch(cancelOverwriteSessionModal())
  }))(Login);
