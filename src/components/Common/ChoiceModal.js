import React from 'react'
import PropTypes from 'prop-types';

import {Button, Label, Modal, ModalBody, ModalHeader} from "reactstrap";

export default class ChoiceModal extends React.Component {

  static propTypes = {
    sourceList: PropTypes.array.isRequired,
    choiceList: PropTypes.array.isRequired,
    headerTitle: PropTypes.string.isRequired,
    shortWord: PropTypes.bool.isRequired,
    choiceListHandler: PropTypes.func.isRequired,
    closeHandler: PropTypes.func.isRequired,
  };

  // static defaultProps = {
  // };

  constructor(props) {
    super(props);

    this.state = {
      displayList: [],
      choiceList: [],
      checkList: [],
      searchValue: '',
    };
  }

  async componentDidUpdate(nextProps) {

    if (nextProps.sourceList != this.props.sourceList) {
      await this.setState({ displayList: JSON.parse(JSON.stringify(this.props.sourceList)) })
      this.generateCheckList()
    }

    if (nextProps.choiceList != this.props.choiceList) {
      let choiceList = JSON.parse(JSON.stringify(this.props.choiceList))


      // if words that is unregistered in the system exist in the list, remove the words
      for (let i = choiceList.length - 1; i >= 0; i--) {
        if (!this.props.shortWord) {
          if (this.props.sourceList.indexOf(choiceList[i]) === -1) {
            choiceList.splice(i, 1)
          }

        } else {
          let bContain = false
          for (let value of this.props.sourceList) {
            if (value.includes("(" + choiceList[i] + ")")) {
              bContain = true
              break
            }
          }

          if (!bContain) {
            choiceList.splice(i, 1)
          }
        }
      }

      await this.setState({ choiceList: choiceList })
      this.generateCheckList()
    }

  }

  /**
   * generate the check list for check input from display list and choice list
   */
  generateCheckList = () => {

    let checkList = Array(this.state.displayList.length).fill(false)

    this.state.displayList.map((value, index) => {
      let checkWord = value
      if (this.props.shortWord) {
        let shortWord = value.split("(")[1].substr(0, 2)
        checkWord = shortWord
      }

      if (this.state.choiceList.indexOf(checkWord) !== -1) {
        checkList[index] = true
      }
    })

    this.setState({checkList: checkList})
  }

  /**
   * this is called at changing the search input value
   * @param ev
   */
  onChangeSearchValue = async (ev) => {

    let srchVal = ev.target.value.toLowerCase()

    let displayList = []

    if (srchVal !== '') {
      for (let item of this.props.sourceList) {
        if (item.toLowerCase().includes(srchVal))
          displayList.push(item)
      }
    } else {
      displayList = this.props.sourceList
    }

    await this.setState({ searchValue: ev.target.value, displayList: displayList })
    this.generateCheckList()
  }

  /**
   * This is called at changing for the choice on the choice modal
   * @param ev
   */
  onChangeChecked = (ev) => {
    let index = ev.target.id.split("_")[1]
    let checkList = [...this.state.checkList]
    checkList[index] = !checkList[index]

    // reflect the checked or unchecked value to the choice list
    let choiceList = [...this.state.choiceList]
    let choiceValue = this.state.displayList[index]
    if (this.props.shortWord) {
      choiceValue = choiceValue.split("(")[1].substr(0, 2)
    }

    // if checked, add the value to the choice list
    if (checkList[index]) {
      choiceList.push(choiceValue)

    } else { // if unchecked, remove the value from the choice list
      const i = choiceList.indexOf(choiceValue)
      if (i > -1)
        choiceList.splice(i, 1)
    }

    this.setState({checkList, choiceList})
  }

  /**
   * this is called at click select button.
   */
  onSetChoiceList = () => {
    this.setState({searchValue: '', displayList: this.props.sourceList})
    this.props.choiceListHandler(this.state.choiceList.join(","))
  }

  /**
   * this is called at changing the choice list input value
   * @param ev
   */
  onChangeChoiceList = async (ev) => {
    let value = ev.target.value.replace(/\ /g, "").trim().toUpperCase()
    await this.setState({choiceList: value.split(",")})
    this.generateCheckList()
  }

  onClose = () => {
    this.setState({searchValue: '', displayList: this.props.sourceList})
    this.props.closeHandler()
  }

  render() {

    return (<Modal isOpen={this.props.visible} className={'modal-sm ' + this.props.className} >
        <ModalHeader toggle={this.props.hideChoiceModal}>Choose from the list</ModalHeader>
        <ModalBody>
          <div style={{width: '100%'}}>
            <div className="row ml-1 mr-1 mb-3">
              <input type="text" className="col-12 form-control-sm" value={this.state.choiceList.join(",")} onChange={(ev) => {this.onChangeChoiceList(ev)}} readOnly/>
            </div>
            <div className="row ml-1 mr-1 mb-2">
              Search:
              <input type="text" value={this.state.searchValue} onChange={(ev) => {this.onChangeSearchValue(ev)}}/>
            </div>

            <table className="border" style={{width: '100%', height: '93%', display: 'flex', flexFlow: 'column'}}>
              <thead>
              <tr>
                <th style={{width: '15%'}}/>
                <th>{this.props.headerTitle}</th>
              </tr>
              </thead>
              <tbody className="mt-2" style={{width: '100%', height: '450px', overflowY: 'auto', overflowX: 'hidden'}}>
              {this.state.displayList.map((element, index) => {
                return <tr style={{borderWidth: 1, borderStyle: 'solid', borderColor: '#c8ced3'}} key={"tr_" + index}>
                  <td>
                    <input type="checkbox" className="form-control-sm" style={{marginLeft: 15, marginRight: 15}} id={"td_" + index}
                           checked={this.state.checkList[index]} onChange={(evt) => this.onChangeChecked(evt)} />
                  </td>
                  <td style={{width:'200px', 'paddingBottom': '0px'}}>
                    <Label style={{width: '100%', height:'30px', marginBottom: '0px', 'paddingTop': '2px'}} id={"tr_" + index} onClick={(evt)=>this.onChangeChecked(evt)}>{element}</Label>
                  </td>
                </tr>
              })}
              </tbody>
            </table>
          </div>

          <div style={{marginTop:"1vw", display: "flex", justifyContent: 'flex-end'}}>
            <Button size="md" color="primary" className="mr-2" onClick={this.onSetChoiceList}>Select</Button>
            <Button size="md" color="danger" onClick={this.onClose}>Cancel</Button>
          </div>
        </ModalBody>
      </Modal>
    )
  }
}
