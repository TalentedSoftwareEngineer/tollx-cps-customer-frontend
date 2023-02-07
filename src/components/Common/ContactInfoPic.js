import React, { useState, useRef, useEffect }  from 'react';
import * as gConst from "../../constants/GlobalConstants";
import {Button, Col, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row} from "reactstrap";
import {connect} from "react-redux";
import {refreshContact} from "../../redux/AuthRedux";
import withApiCallAndNotification from "../HOC/withLoadingAndNotification";
import RestApi from "../../service/RestApi";

const ContactInfoPic = (props) => {

  const [showModal, setShowModal] = useState(false)
  const [contactName, setContactName] = useState("")
  const [contactNumber, setContactNumber] = useState("")
  const [notes, setNotes] = useState("")
  const [defaultContact, setDefaultContact] = useState(false)

  const submitContact = () => {
    setShowModal(false)

    if (defaultContact) {
      console.log(">>> default api call before")
      props.callApi2(RestApi.updateContact, { contactName: contactName, contactNumber: contactNumber }).then(res => {
        if (res.ok) {
          console.log("refresh contact")
          props.refreshContact(contactName, contactNumber);
        }
      });
    }
    props.submitContact(contactName, contactNumber, notes)
  }

  const _onClickContactInfoButton = () => {
    setContactName(props.contactName)
    setContactNumber(props.contactNumber)
    setNotes(props.notes)
    setDefaultContact(false)
    setShowModal(true)
  }

  return (
    <div>
      <Button id={props.buttonId} size="lg" color="link" onClick={_onClickContactInfoButton}>
        <i className="fa fa-phone-square" style={{fontSize: 25}}/> Contact Information *</Button>

      <Modal isOpen={showModal} toggle={() => setShowModal(false)} className={'modal-lg ' + props.modalClassName}>
        <ModalHeader toggle={() => setShowModal(false)}>Contact Information</ModalHeader>
        <ModalBody>
          <FormGroup row>
            <Col xs="6">
              <Label htmlFor="contactName">Contact Name * </Label>
              <Input type="text" name="contactName" id="contactName"
                     onChange={(event) => setContactName(event.target.value)} value={contactName}/>
            </Col>
            <Col xs="6">
              <Label htmlFor="contactNumber">Contact Number * </Label>
              <Input type="text" name="contactNumber" id="contactNumber"
                     onChange={(event) => setContactNumber(event.target.value)} value={contactNumber}/>
            </Col>
          </FormGroup>
          <Row hidden={(props.notes === undefined || props.notes == null)}>
            <Col className="mt-3">
              <Label htmlFor="notes">Notes</Label>
              <Input type="textarea" name="notes" id="notes" rows="5"
                     onChange={(event) => setNotes(event.target.value)} value={notes}/>
            </Col>
          </Row>
          <Label htmlFor="default_setting" className="ml-sm-4 mt-2">
            <Input type="checkbox" name="default_setting" id="default_setting" onChange={(event) => setDefaultContact(event.target.checked)}/>
            Change default contact information
          </Label>
        </ModalBody>
        <ModalFooter>
          <Button type="submit" size="md" color="primary" className="mr-2"
                  onClick={submitContact}> Save</Button>
          <Button type="reset" size="md" color="danger" onClick={() => setShowModal(false)}> Cancel</Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default connect(
  state => ({}),
  dispatch => ({
    refreshContact: (contactName, contactNumber) => dispatch(refreshContact({contactName, contactNumber}))
  })
)(withApiCallAndNotification(ContactInfoPic));
