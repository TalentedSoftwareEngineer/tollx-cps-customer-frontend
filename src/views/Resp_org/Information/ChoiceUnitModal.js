import React, { useState, useEffect }  from 'react';
import PropTypes from 'prop-types';

import {Button, Label, Modal, ModalBody, ModalHeader} from "reactstrap";
import {connect} from "react-redux";
import {refreshContact} from "../../../redux/AuthRedux";
import withApiCallAndNotification from "../../../components/HOC/withLoadingAndNotification";

const ChoiceUnitModal = (props) => {

  const [unit, setUnit] = useState(props.unit)
  const [srchVal, setSrchVal] = useState("")
  const [displayList, setDisplayList] = useState(props.unitList)

  useEffect(() => {
    setDisplayList(props.unitList)
    setUnit(props.unit)
    setSrchVal("")
  }, [props.unitList, props.unit])

  /**
   * this is called at changing the search input value
   * @param ev
   */
  const onChangeSearchValue = (ev) => {

    console.log(">>> display list: ", displayList)

    let value = ev.target.value.toUpperCase()
    setSrchVal(value)

    let srchResultList = props.unitList.filter(unit => unit.includes(value))
    setDisplayList(srchResultList)
  }


  return (<Modal isOpen={props.visible} className={'modal-sm'} >
      <ModalHeader toggle={props.onClose}>Choose from the list</ModalHeader>
      <ModalBody>
        <div style={{width: '100%'}}>
          <div className="row ml-1 mr-1 mb-2">
            Search:
            <input type="text" value={srchVal} onChange={(ev) => {onChangeSearchValue(ev)}}/>
          </div>

          <table className="border" style={{width: '100%', height: '93%', display: 'flex', flexFlow: 'column'}}>
            <tbody className="mt-2" style={{width: '100%', height: '450px', overflowY: 'auto', overflowX: 'hidden'}}>
            {displayList.map((element, index) => {
              return <tr style={{borderWidth: 1, borderStyle: 'solid', borderColor: '#c8ced3'}} key={"tr_" + index}>
                <td>
                  <input type="radio" className="form-control-sm" style={{marginLeft: 15, marginRight: 15}} id={"td_" + index}
                         checked={unit === element} onChange={() => setUnit(element)} />
                </td>
                <td style={{width:'200px', 'paddingBottom': '0px'}}>
                  <Label style={{width: '100%', height:'30px', marginBottom: '0px', 'paddingTop': '2px'}} id={"tr_" + index} onClick={() => setUnit(element)}>{element}</Label>
                </td>
              </tr>
            })}
            </tbody>
          </table>
        </div>

        <div style={{marginTop:"1vw", display: "flex", justifyContent: 'flex-end'}}>
          <Button size="md" color="primary" className="mr-2" onClick={() => props.setUnit(unit)}>Select</Button>
          <Button size="md" color="danger" onClick={props.onClose}>Cancel</Button>
        </div>
      </ModalBody>
    </Modal>
  )
}

export default connect()(ChoiceUnitModal)

// export default connect(
//   state => ({}),
//   dispatch => ({
//     refreshContact: (contactName, contactNumber) => dispatch(refreshContact({contactName, contactNumber}))
//   })
// )(withApiCallAndNotification(ContactInfoPic));
