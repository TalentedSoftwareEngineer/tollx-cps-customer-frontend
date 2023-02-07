
import produce from "immer";
import Cookies from "universal-cookie";
import RestApi from "../../../service/RestApi";
import {timeout} from "../../../service/customer";
import {NotificationManager} from'react-notifications';
import * as XLSX from 'xlsx';
import $ from 'jquery';

import * as gConst from "../../../constants/GlobalConstants";
import * as gFunc from "../../../utils";
import moment from "moment";

const INIT_LAD_GRID_LENGTH = 9;
const INIT_CPR_GRID_LENGTH = 7;


const CPR_SECT_NAME_SET_BUTTON        = "Set"
const CPR_SECT_NAME_ADD_BUTTON        = "Add"

const AOS_NETWORK_MODAL_HEADER_TITLE  = "Areas of Service: Networks"
const AOS_STATE_MODAL_HEADER_TITLE    = "Areas of Service: States"
const AOS_LATA_MODAL_HEADER_TITLE     = "Areas of Service: LATAs"
const IAC_MODAL_HEADER_TITLE          = "Carriers: IntraLATACarriers"
const IEC_MODAL_HEADER_TITLE          = "Carriers: InterLATACarriers"

const CAD_RETRIEVE_SUCCESSFUL         = "CAD retrieved successfully!"
const CAD_CREATE_SUCCESSFUL           = "CAD created successfully!"
const CAD_UPDATE_SUCCESSFUL           = "CAD updated successfully!"
const CAD_COPY_SUCCESSFUL             = "CAD copied successfully!"
const CAD_TRANSFER_SUCCESSFUL         = "CAD transferred successfully!"
const CAD_DISCONNECT_SUCCESSFUL       = "CAD disconnected successfully!"
const CAD_DELETE_SUCCESSFUL           = "CAD deleted successfully!"

const DATA_EXIST_COLOR                = '#0000FF'

function methodMixin(Component) {
  return class Method extends Component {
    constructor(props) {
      super(props);
      this.state = {
        selectRo:                 this.props.somos.selectRo,
        retrieveCardTitle:        gConst.RETRIEVE_CARD_TITLE_PREFIX,
        resultCardTitle:          gConst.RESULT_CARD_TITLE_PREFIX1,

        bExpRetrieve:             true,    // the flag whether the retrieve card should be expanded or collapsed
        bExpResult:               false,   // the flag whether the result card should be expanded or collapsed
        bRetrieveCardIconHidden:  false,   // the flag whether the icon of the retrieve card is hidden or not
        searchNum:                '',      // toll-free number for search
        searchEffDtTm:            0,       // effective date time for search
        bResultHeaderHidden:      false,   // the flag whether the result card header is hidden or not
        bEffDtTmListHidden:       true,    // the flag whether effective date time status select field is hidden or not
        bEffDtTmDisable:          false,

        numParam:                 '',      // the state to use as number parameter for calling retrieve customer record
        effDtTmParam:             '',      // the state to use as effective date time parameter for calling retrieve customer record
        preEffDtTmStat:           '',      // the state to save previous eff date time state at changing selection on the eff date time state select field

        action:                   gConst.ACTION_NONE,
                                           // action was triggered: ACTION_NONE, ACTION_CREATE, ACTION_COPY, ACTION_TRANSFER
        disable:                  true,    // not editable status
        // disable:                  false,    // not editable status

        effDtTmStat:              '',      // current selected effective date time status
        effDtTmStatList:          [],      // effective date time status list
        lstEffDtTms:              [],      // list of effective date times
        status:                   '',      // customer record status

        num:                      '',      // retrieved toll free number
        activeMainTab:            '1',
        activeAOSTab:             '1',     // Area of Service Tab
        activeCarrierTab:         '1',     // Carriers Tab
        activeCPRTab:             0,       // Cpr section Tab
        activeLADTab:             '1',     // Lad grid Tab

        bContentModified:         false,   // if user action has triggered for any one input field, this state is true
        bModifiedCR:              false,   // the basic data has been modified
        bModifiedCPR:             false,   // the CPR data has been modified
        bModifiedLAD:             false,   // the LAD data has been modified

        // button disable/enable flags
        bRetrieveEnable:          true,     // Retrieve button enable status
        bEditEnable:              false,    // Edit button enable status
        bCopyEnable:              false,    // Copy button enable status
        bTransferEnable:          false,    // Transfer button enable status
        bDeleteEnable:            false,    // Delete button enable status
        bSubmitEnable:            false,    // Submit button enable status
        bSaveEnable:              false,    // Save button enable status
        bRevertEnable:            false,    // Revert button enable status
        bCancelEnable:            false,    // Cancel button enable status

        // Modal Window visible
        createModalVisible:     false,
        modifiedModalVisible:     false,
        copyModalVisible:         false,
        deleteModalVisible:       false,
        convertModalVisible:      false,
        cancelModalVisible:       false,
        transferModalVisible:     false,
        overwriteModalVisible:    false,
        mdfDtCpyModalVisible:     false,
        overwriteTargetModalVisible: false,


        bRevertClicked:           false,

        message:                  '',       // api call result messages

        noCR:                     true,    // there is no CR data
        noCPR:                    true,    // there is no CPR data
        noLAD:                    true,    // there is no LAD data


        // copy & transfer modal
        srcNum:                   '',       // source number on the copy or transfer modal
        srcEffDtTm:               '',       // source effective date time on the copy or transfer modal
        srcRecVersionId:          '',       // source record version id
        tgtNum:                   '',       // target number for copying or transferring
        tgtTmplName:              '',       // target template name for converting
        tgtEffDtTm:               '',       // effective date time for copying or transferring
        copyNow:                  false,    // now check for copying or transferring
        validMsg:                 '',       // message for validation on modal
        copyAction:               gConst.COPYACTION_CHANGE,
        portionEntire:            false,
        portionCR:                true,
        portionCPR:               false,
        portionLAD:               false,
        bCheckCPREnable:          true,
        bCheckLADEnable:          true,

        tgtRetrieveData:          {},     // retrieve data of target record
        lockParam:                {},     // parameter that was used for calling lock api


        /*********************************** Basic Data *************************************/
        createEffDtTm:            0,       // effective date time value for creating
        effDateErr:               '',       // effective date time error
        createNow:                false,    // now check value

        respOrg:                  '',       // resp organization
        priority:                 false,    // high priority
        customerId:                '',       // customer id

        agent:                     '',       // agent
        telco:                     '',       // telco
        hold:                     'N',      // the flag if holding

        endSub:                   '',       // end subscriber name
        endSubAddr:               '',       // end subscriber address
        svcOrderNum:              '',       // service order num
        suppFormNum:              '',       // support form num

        lastUpDt:                 '',       // the date time of last changed
        approval:                 '',       // approval
        lastUser:                 '',       // last user
        prevUser:                 '',       // prev user

        destNums:                 [
          {
            destNum:              '',
            numTermLine:          '',
            localServOff:         '',
            forServOff:           '',
          }
        ],       // destination numbers
        selDest:                  [false],   // the array variable for selection of destination
        bNoSelDest:               true,      // the flag if no selection of destination

        contactName:              '',       // contact name
        contactNumber:            '',       // contact telephone
        notes:                    '',       // notes

        endIntDtTm:               '',       // end intercept date time
        referral:                 '',       // referral

        network:                  '',       // Area of Service: network
        state:                    '',       // Area of Service: state
        npa:                      '',       // Area of Service: npa
        lata:                     '',       // Area of Service: lata
        label:                    '',       // Area of Service: label

        noNetworks:               true,    // there is no newtorks
        noStates:                 true,    // there is no states
        noNPAs:                   true,    // there is no NPAs
        noLATAs:                  true,    // there is no LATAs
        noLabels:                 true,    // there is no labels
        noIAC:                    true,    // there is no intraLATACarrier
        noIEC:                    true,    // there is no interLATACarrier

        interLATACarrier:         '',       // interLATACarrier
        intraLATACarrier:         '',       // intraLATACarrier

        choiceModalList:          [],       // list that is displayed on the choice list modal
        choiceList:               [],       // list of the choice index on the choice list modal
        choiceModalHeaderTitle:   '',       // the title of list header on the choice list modal
        choiceModalVisible:       false,    //  choice modal visible
        npaChoiceModalVisible:    false,    // NPA modal visible
        npaChoiceModalList:       [],       // tree list of the NPA choice index on the NPA choice list modal
        npaChecked:               [],       // checked list on the NPA choice list modal
        npaExpanded:              [],       // expanded list on the NPA choice list modal

        recVersionId:             '',       // record version id
        custRecCompPart:          '',       // customer record component part

        iac_array: gConst.DEFAULT_CARRIERS, // intraLATACarrier list
        iec_array: gConst.DEFAULT_CARRIERS, // interLATACarrier list
        priIntraLT: ''/*gConst.DEFAULT_CARRIERS[0]*/, // primary intra LATA carrier
        priInterLT: ''/*gConst.DEFAULT_CARRIERS[0]*/, // primary inter LATA carrier
        timezone: '',                     // timezone
        dayLightSaving: gFunc.isCurrentDayLightSavingTime(),             // if day light saving time true, else false
        npaCntPerCarrier: "",             // npanxx count per carrier

        /*********************************** CPR Data ***********************************/
        sureImportMessage:        "",
        isImporting:  false,

        // section names
        cprSectNames: ["MAIN"],

        // category list of each tab
        cprGridCategory: Array(1).fill(Array(8).fill('')),

        // grid data of each tab
        cprGridData: Array(1).fill(Array(INIT_CPR_GRID_LENGTH).fill(Array(8).fill(''))),

        // current active row index of each tab
        cprCurActiveRow: Array(1).fill(gConst.INVALID_ROW),

        // current active col index of each tab
        cprCurActiveCol: Array(1).fill(gConst.INVALID_COL),


        cprSectNameModalVisible: false,   // section setting modal visible
        cprSectNameModalTitle: '',        // modal title
        cprSectNameModalBtnName: '',      // modal buttonName
        cprSectSettingName: '',           // section name on the section setting modal
        cprSectNameErr: false,            // flag for the error
        cprSectNameErrMsg: 'Must start with \'M\' (denoting Main section) or \'S\' (denoting Sub section), followed by up to 7 alphanumeric characters and may include % or #.',        // error message

        cprDelSectModalMsg: '',           // message content of the delete section modal
        cprDelSectModalVisible: false,    // section delete modal visible

        /*********************************** LAD Data ***********************************/

        gridArea:                 [],     // area
        gridDate:                 [],     // date
        gridLATA:                 [],     // LATA
        gridNXX:                  [],     // NXX
        gridState:                [],     // state
        gridTel:                  [],     // tel
        gridTime:                 [],     // time
        gridTD:                   [],     // 10-digit
        gridSD:                   [],     // 6-digit

        noGridArea:               true,    // there is no grid area
        noGridDate:               true,    // there is no grid date
        noGridLATA:               true,    // there is no grid LATA
        noGridNXX:                true,    // there is no grid NXX
        noGridState:              true,    // there is no grid state
        noGridTel:                true,    // there is no grid tel
        noGridTime:               true,    // there is no grid time
        noGridTD:                 true,    // there is no grid ten digit
        noGridSD:                 true,    // there is no grid six digit
      };

      this.initialState = produce(this.state, (r) => {});
      this.lastActionState = JSON.parse(JSON.stringify(this.state));

      this.onDownload = this.onDownload.bind(this)
      this.onPrint = this.onPrint.bind(this)
      this.onSearchNumber = this.onSearchNumber.bind(this)
      this.retrieveCustomerRecord = this.retrieveCustomerRecord.bind(this)
      this.createAction = this.createAction.bind(this)
    }

    /**
     * is called when has mounted the component
     */
    componentDidMount() {
      this.initialDataLoading();
    }

    initialDataLoading = () => {

      this.initCPRData()
      this.initLADGrids()

      // setInterval(() => { this.monitorRoChange()}, gConst.RO_CHANGE_MONITOR_INTERVAL)

      const cookies = new Cookies();

      let num = cookies.get("cusNum");
      let effDtTm = cookies.get("cusEffDtTm");
      let action = cookies.get("action")

      if (action) {
        switch (action) {
          case gConst.RECORD_PAGE_ACTION_RETRIEVE:
            if (effDtTm) {
              let ctDtTmStr = gFunc.fromUTCStrToCTStr(effDtTm)
              let time = new Date(ctDtTmStr)
              this.setState({searchNum: num, searchEffDtTm: time.getTime(), bRetrieveEnable: false});

            } else {
              this.setState({searchNum: num, bRetrieveEnable: false});
            }

            if (this.retrieveCustomerRecord(num, effDtTm, true)) {
              this.setState({message: CAD_RETRIEVE_SUCCESSFUL})
            }
            break

          case gConst.RECORD_PAGE_ACTION_CREATE:
            let retrieveCardTitle = "Create a New Customer Record: " + gFunc.formattedNumber(num)
            this.setState({
              action:                   gConst.ACTION_CREATE,
              disable:                  false,
              num:                      num.replace(/-/g, ""),
              destNums:                  [
                {
                  destNum: gFunc.formattedNumber(num),
                  numTermLine: '9999',
                  localServOff:         '',
                  forServOff:           '',
                }
              ],
              svcOrderNum:              'N' + moment().format('MMDDYY'),
              retrieveCardTitle:        retrieveCardTitle,
              bRetrieveCardIconHidden:  true,
              bResultHeaderHidden:        true,
              bExpRetrieve:             false,
              bExpResult:               true,

              bEditEnable:              false,
              bCopyEnable:              false,
              bTransferEnable:          false,
              bDeleteEnable:            false,

              contactName:              this.props.contactName,
              contactNumber:            this.props.contactNumber,
              network:                  'US',
              interLATACarrier:          'ATX-0288',
              intraLATACarrier:          'ATX-0288',
            })


            let body = {
              numList:[
                num.replace(/\-/g, "")
              ]
            }

            this.props.callApi2(RestApi.numberQuery, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout}).then(res => {
              if (res.ok && res.data && res.data.queryResult) {
                let result = res.data.queryResult[0]
                this.setState({respOrg: result.ctrlRespOrgId })
              }
            })
            break
        }

        cookies.remove("cusNum");
        cookies.remove("cusEffDtTm");
        cookies.remove("action");

      } else {
        $('#searchNum').focus()
      }
    }

    /**
     * This is called when moving to another page or page is disappeared.
     */
    componentWillUnmount() {
      console.log("componentWillUnmount")
      this.unlockCustomerRecord()
    }

    /**
     * unlock the customer record
     */
    unlockCustomerRecord = () => {

      let lockParam = this.state.lockParam

      // if tgtTmplName exists, that means this is the state that moves from CAD to TAD. Should not unlock.
      if (lockParam && lockParam.custRecAction && lockParam.tgtTmplName == null) {
        let body = {}

        switch (lockParam.custRecAction) {
          case gConst.ACTION_COPY:
          case gConst.ACTION_TRANSFER:
          case gConst.ACTION_DISCONNECT:
            body.num = lockParam.tgtNum
            body.effDtTm = lockParam.tgtEffDtTm
            break

          case gConst.ACTION_UPDATE:
            body.num = lockParam.srcNum
            body.effDtTm = lockParam.srcEffDtTm
            break
        }

        this.props.callApiHideLoading(RestApi.unlockCadRec, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout}).then(res => { })
      }
    }

    /**
     * this is called when changing the ro selection
     * @returns {Promise<void>}
     */
    monitorRoChange = async () => {
      if (this.state.selectRo === this.props.somos.selectRo)
        return

      let searchNum = this.state.searchNum
      let searchEffDtTm = this.state.searchEffDtTm

      if (this.state.bExpResult) {
        searchNum = ''
        searchEffDtTm = ''
      }

      await this.cancelAction()
      await this.setState({ searchNum: searchNum, searchEffDtTm: searchEffDtTm, selectRo: this.props.somos.selectRo })

      // $('#searchNum').focus()
    }

    /**
     * go to the Pointer record page
     * @param num
     * @param effDtTm
     */
    gotoPTRPage = (num, effDtTm) => {
      const cookies = new Cookies();
      cookies.set("ptrNum", num);
      cookies.set("ptrEffDtTm", effDtTm);
      cookies.set("action", gConst.RECORD_PAGE_ACTION_RETRIEVE)
      this.props.navigate('/customer_admin/pointer_data');

      this.setState(JSON.parse(JSON.stringify(this.initialState)));
    }

    /**
     * go to the Template Admin Data page with this state
     */
    gotoTADPage = async (cadToTadType) => {
      const cookies = new Cookies();

      await this.props.cadToTadState(JSON.stringify(this.state))
      cookies.set(gConst.CADTOTADTYPE_COOKIE_NAME, cadToTadType)

      this.props.navigate('/template_admin/template_data');
      this.setState(JSON.parse(JSON.stringify(this.initialState)));
    }

    /**
     * return after 60 days date time value
     * @param utcDtTm
     * @returns {*}
     */
    getDateValAfter60days = (utcDtTm) => {
      let dtVal = new Date().getTime()

      if (utcDtTm !== "NOW") {
        dtVal = gFunc.fromUTCStrToDateVal(utcDtTm)
      }

      return dtVal + 59 * 24 * 60 * 60 * 1000
    }


    /**
     * // clear basic data
     */
    initBasicData = () => {
      this.setState({
        createEffDtTm:            '',       // effective date time value for creating
        effDateErr:               '',       // effective date time error
        createNow:                  false,    // now check value

        respOrg:                  this.props.somos.selectRo,       // resp organization
        priority:                 false,    // high priority
        customerId:                '',       // customer id

        agent:                     '',       // agent
        telco:                     '',       // telco
        hold:                     'N',    // the flag if holding

        endSub:                   '',       // end subscriber name
        endSubAddr:               '',       // end subscriber address
        svcOrderNum:              '',       // service order num
        suppFormNum:              '',       // support form num

        lastUpDt:                 '',       // the date time of last changed
        approval:                 '',       // approval
        lastUser:                 '',       // last user
        prevUser:                 '',       // prev user

        destNums:                 [
          {
            destNum:              '',
            numTermLine:          '',
            localServOff:         '',
            forServOff:           '',
          }
        ],       // destination number

        contactName:              '',       // contact name
        contactNumber:            '',       // contact telephone
        notes:                    '',       // notes

        endIntDtTm:               '',       // end intercept date time
        referral:                 '',       // referral

        network:                  '',       // Area of Service: network
        state:                    '',       // Area of Service: state
        npa:                      '',       // Area of Service: npa
        lata:                     '',       // Area of Service: lata
        label:                    '',       // Area of Service: label
        choiceModalList:          [],       // list that is displayed on the choice list modal
        choiceList:               [],       // list of the choice index on the choice list modal
        choiceModalHeaderTitle:   '',       // the title of list header on the choice list modal
        choiceModalVisible:       false,    //  choice modal visible
        npaChoiceModalVisible:    false,    // NPA modal visible
        npaChoiceModalList:       [],       // tree list of the NPA choice index on the NPA choice list modal
        npaChecked:               [],       // checked list on the NPA choice list modal
        npaExpanded:              [],       // expanded list on the NPA choice list modal

        interLATACarrier:         '',       // interLATACarrier
        intraLATACarrier:         '',       // intraLATACarrier

        noCR:                     true,

        noNetworks:               true,
        noStates:                 true,
        noNPAs:                   true,
        noLATAs:                  true,
        noLabels:                 true,
        noIAC:                    true,
        noIEC:                    true,
        message:                  '',
      })
    }

    /**
     * initialize CPR data
     */
    initCPRData = () => {
      this.setState({
        activeCPRTab: 0,
        cprSectNames: ["MAIN"],
        cprGridCategory: Array(1).fill(Array(8).fill('')),
        cprGridData: Array(1).fill(Array(INIT_CPR_GRID_LENGTH).fill(Array(8).fill(''))),
        cprCurActiveRow: Array(1).fill(gConst.INVALID_ROW),
        cprCurActiveCol: Array(1).fill(gConst.INVALID_COL),
        priIntraLT: '',
        priInterLT: '',
        timezone: 'C',
        dayLightSaving: gFunc.isCurrentDayLightSavingTime(),

        noCPR:true,
      })
    }

    /**
     * initialize LAD grids
     */
    initLADGrids = () => {
      let grid = []
      for (let i =0; i < 8; i++) {
        grid.push({ lbl: "", def1: "", def2: "", def3: "", def4: "", def5: "", def6: "", def7: "" })
      }

      this.setState({
        gridArea: grid.slice(),
        gridDate: grid.slice(),
        gridLATA: grid.slice(),
        gridNXX: grid.slice(),
        gridState: grid.slice(),
        gridTel: grid.slice(),
        gridTime: grid.slice(),
        gridTD: grid.slice(),
        gridSD: grid.slice(),

        noGridArea:   true,
        noGridDate:   true,
        noGridLATA:   true,
        noGridNXX:    true,
        noGridState:  true,
        noGridTel:    true,
        noGridTime:   true,
        noGridTD:     true,
        noGridSD:     true,
        noLAD:        true,
      })
    }

    /**
     * clear all data including basic, cpr, lad
     */
    clearAllData = async () => {
      await this.initBasicData()
      await this.initCPRData()
      await this.initLADGrids()
    }

    /**
     * save current state data to last state data.
     */
    backupStateToLastAction = () => {
      this.lastActionState = JSON.parse(JSON.stringify(this.state));
    }

    /**
     *
     */
    checkDataExistForCR = () => {

      // check if the CR data exists
      let bExistCR = false
      let bExistNetworks = false, bExistStates = false, bExistNPAs = false, bExistLATAs = false, bExistLabels = false
      let bExistIAC = false, bExistIEC = false

      if (this.state.action === gConst.ACTION_CREATE) {
        if (this.state.createEffDtTm != null && this.state.createEffDtTm !== '')
          bExistCR = true

        if (!bExistCR && this.state.createNow)                bExistCR = true
        if (!bExistCR && this.state.respOrg !== '')           bExistCR = true
      }

      if (!bExistCR && this.state.priority)                   bExistCR = true
      if (!bExistCR && this.state.customerId !== '')          bExistCR = true
      if (!bExistCR && this.state.agent !== '')               bExistCR = true
      if (!bExistCR && this.state.telco !== '')               bExistCR = true
      if (!bExistCR && this.state.hold !== 'N')               bExistCR = true

      if (!bExistCR && this.state.endSub !== '')             bExistCR = true
      if (!bExistCR && this.state.endSubAddr !== '')         bExistCR = true
      if (!bExistCR && this.state.svcOrderNum !== '')        bExistCR = true
      if (!bExistCR && this.state.suppFormNum !== '')        bExistCR = true

      if (!bExistCR) {
        for (let el of this.state.destNums) {
          if (el.destNum !== '' || el.numTermLine !== '' || el.localServOff !== '' || el.forServOff !== '') {
            bExistCR = true
            break
          }
        }
      }

      if (!bExistCR && this.state.contactName !== '')         bExistCR = true
      if (!bExistCR && this.state.contactNumber !== '')       bExistCR = true
      if (!bExistCR && this.state.notes !== '')               bExistCR = true

      if (!bExistCR && this.state.endIntDtTm !== '')          bExistCR = true
      if (!bExistCR && this.state.referral !== '')            bExistCR = true

      if (this.state.network !== '') {
        bExistCR = true
        bExistNetworks = true
      }
      if (this.state.state !== '') {
        bExistCR = true
        bExistStates = true
      }
      if (this.state.npa !== '') {
        bExistCR = true
        bExistNPAs = true
      }
      if (this.state.lata !== '') {
        bExistCR = true
        bExistLATAs = true
      }
      if (this.state.label !== '') {
        bExistCR = true
        bExistLabels = true
      }
      if (this.state.intraLATACarrier !== '') {
        bExistCR = true
        bExistIAC = true
      }
      if (this.state.interLATACarrier !== '') {
        bExistCR = true
        bExistIEC = true
      }

      this.setState({
        noCR: !bExistCR,
        noNetworks: !bExistNetworks,   
        noStates: !bExistStates,
        noNPAs: !bExistNPAs,
        noLATAs: !bExistLATAs,
        noLabels: !bExistLabels,
        noIAC: !bExistIAC,
        noIEC: !bExistIEC
      })
    }

    /**
     *
     */
    checkDataExistForCPR = () => {

      // check if the CPR data exists
      let bExistCPR = false
      if (this.state.priIntraLT !== this.initialState.priIntraLT)             bExistCPR = true
      if (this.state.priInterLT !== this.initialState.priInterLT)             bExistCPR = true
      if (this.state.timezone !== this.initialState.timezone)                 bExistCPR = true
      if (this.state.dayLightSaving !== this.initialState.dayLightSaving)     bExistCPR = true
      if (this.state.cprSectNames.length)                                     bExistCPR = true

      this.setState({noCPR: !bExistCPR})
    }

    /**
     * check if there is no data in the grid
     * @param grid
     * @returns {boolean}
     */
    checkDataExistForLADGrid = (grid) => {
      for (let row of grid) {
        for (let cell of Object.values(row)) {
          if (cell !== "") return true
        }
      }

      return false
    }

    /**
     *
     */
    checkDataExistForLAD = () => {

      // check if the LAD data exists
      let bExistArea = false, bExistDate = false, bExistLATA = false, bExistNXX = false
      let bExistState = false, bExistTel = false, bExistTime = false, bExistTD = false, bExistSD = false

      console.log("this.state.gridArea: " + this.state.gridArea)
      console.log("this.initialState.gridArea: " + this.initialState.gridArea)
      for (let row of this.state.gridArea) {
        for (let cell of Object.values(row)) {
          if (cell !== "") { bExistArea = true; break; }
        }
        if (bExistArea) break
      }

      for (let row of this.state.gridDate) {
        for (let cell of Object.values(row)) {
          if (cell !== "") { bExistDate = true; break; }
        }
        if (bExistDate) break
      }

      for (let row of this.state.gridLATA) {
        for (let cell of Object.values(row)) {
          if (cell !== "") { bExistLATA = true; break; }
        }
        if (bExistLATA) break
      }

      for (let row of this.state.gridNXX) {
        for (let cell of Object.values(row)) {
          if (cell !== "") { bExistNXX = true; break; }
        }
        if (bExistNXX) break
      }

      for (let row of this.state.gridState) {
        for (let cell of Object.values(row)) {
          if (cell !== "") { bExistState = true; break; }
        }
        if (bExistState) break
      }

      for (let row of this.state.gridTel) {
        for (let cell of Object.values(row)) {
          if (cell !== "") { bExistTel = true; break; }
        }
        if (bExistTel) break
      }

      for (let row of this.state.gridTime) {
        for (let cell of Object.values(row)) {
          if (cell !== "") { bExistTime = true; break; }
        }
        if (bExistTime) break
      }

      for (let row of this.state.gridTD) {
        for (let cell of Object.values(row)) {
          if (cell !== "") { bExistTD = true; break; }
        }
        if (bExistTD) break
      }

      for (let row of this.state.gridSD) {
        for (let cell of Object.values(row)) {
          if (cell !== "") { bExistSD = true; break; }
        }
        if (bExistSD) break
      }

      let bExistLAD = bExistArea | bExistDate | bExistLATA | bExistNXX | bExistState | bExistTel | bExistTime | bExistTD | bExistSD

      console.log("bExistArea: " + bExistArea)

      this.setState({
        noLAD: !bExistLAD,
        noGridArea: !bExistArea,
        noGridDate: !bExistDate,
        noGridLATA: !bExistLATA,
        noGridNXX: !bExistNXX,
        noGridState: !bExistState,
        noGridTel: !bExistTel,
        noGridTime: !bExistTime,
        noGridTD: !bExistTD,
        noGridSD: !bExistSD,
      })
    }

    /**
     *
     * @param id:
     *      1: Basic, 2: CPR, 3: LAD
     */
    setMainNavTextColor = (id) => {
      let emptyTextcolor = {}
      if (id === "1" && !this.state.noCR) {  // basic tab
        return gConst.DATA_TAB_CSS
      }
      if (id === "2" && !this.state.noCPR) {
        return gConst.DATA_TAB_CSS
      }
      if (id === "3" && !this.state.noLAD) {
        return gConst.DATA_TAB_CSS
      }
      return emptyTextcolor
    }

    /**
     *
     * @param id:
     *        1: networks, 2: states, 3: NPAs, 4: LATAs, 5: labels
     */
    setAOSNavTextColor = (id) => {
      let emptyTextcolor = {}
      if (id === "1" && !this.state.noNetworks) {  // basic tab
        return gConst.DATA_TAB_CSS
      }
      if (id === "2" && !this.state.noStates) {
        return gConst.DATA_TAB_CSS
      }
      if (id === "3" && !this.state.noNPAs) {
        return gConst.DATA_TAB_CSS
      }
      if (id === "4" && !this.state.noLATAs) {
        return gConst.DATA_TAB_CSS
      }
      if (id === "5" && !this.state.noLabels) {
        return gConst.DATA_TAB_CSS
      }
      return emptyTextcolor
    }

    /**
     *
     * @param id:
     *      1: IntraLATACarrier, 2: InterLATACarrier
     */
    setCarrierNavTextColor = (id) => {
      let emptyTextcolor = {}
      if (id === "1" && !this.state.noIAC) {  // basic tab
        return gConst.DATA_TAB_CSS
      }
      if (id === "2" && !this.state.noIEC) {
        return gConst.DATA_TAB_CSS
      }
      return emptyTextcolor
    }

    /**
     *
     * @param id:
     *        1: area, 2: date, 3: LATA, 4: NXX, 5: state, 6: tel, 7: time, 8: ten digit, 9: six digit
     */
    setLADNavTextColor = (id) => {
      let emptyTextcolor = {}

      if (id === "1" && !this.state.noGridArea) {  // basic tab
        return gConst.DATA_TAB_CSS
      }
      if (id === "2" && !this.state.noGridDate) {
        return gConst.DATA_TAB_CSS
      }
      if (id === "3" && !this.state.noGridLATA) {
        return gConst.DATA_TAB_CSS
      }
      if (id === "4" && !this.state.noGridNXX) {
        return gConst.DATA_TAB_CSS
      }
      if (id === "5" && !this.state.noGridState) {
        return gConst.DATA_TAB_CSS
      }
      if (id === "6" && !this.state.noGridTel) {
        return gConst.DATA_TAB_CSS
      }
      if (id === "7" && !this.state.noGridTime) {
        return gConst.DATA_TAB_CSS
      }
      if (id === "8" && !this.state.noGridTD) {
        return gConst.DATA_TAB_CSS
      }
      if (id === "9" && !this.state.noGridSD) {
        return gConst.DATA_TAB_CSS
      }
      return emptyTextcolor
    }


    /**
     *
     * @param srcState
     */
    overwriteBasicData = (srcState) => {
      this.setState({
        priority: srcState.priority,
        customerId: srcState.customerId,

        agent: srcState.agent,
        telco: srcState.telco,
        hold:  srcState.hold,

        endSub: srcState.endSub,
        endSubAddr: srcState.endSubAddr,
        svcOrderNum: srcState.svcOrderNum,
        suppFormNum: srcState.suppFormNum,

        destNums: JSON.parse(JSON.stringify(srcState.destNums)),

        contactName: srcState.contactName,
        contactNumber: srcState.contactNumber,
        notes: srcState.notes,
        network: srcState.network,
        state: srcState.state,
        npa: srcState.npa,
        lata: srcState.lata,
        label: srcState.label,
        interLATACarrier: srcState.interLATACarrier,
        intraLATACarrier: srcState.intraLATACarrier,
        iac_array: JSON.parse(JSON.stringify(srcState.iac_array)),
        iec_array: JSON.parse(JSON.stringify(srcState.iec_array))
      })
      this.checkDataExistForCR()
    }

    /**
     *
     * @param srcState
     */
    overwriteCPRData = (srcState) => {
      this.setState({
        priIntraLT: srcState.priIntraLT,
        priInterLT: srcState.priInterLT,
        timezone: srcState.timezone,
        dayLightSaving: srcState.dayLightSaving,
        cprSectNames: JSON.parse(JSON.stringify(srcState.cprSectNames)),
        cprGridCategory: JSON.parse(JSON.stringify(srcState.cprGridCategory)),
        cprGridData: JSON.parse(JSON.stringify(srcState.cprGridData)),
        cprCurActiveRow: JSON.parse(JSON.stringify(srcState.cprCurActiveRow)),
        cprCurActiveCol: JSON.parse(JSON.stringify(srcState.cprCurActiveCol))
      })
      this.checkDataExistForCPR()
    }

    /**
     *
     * @param srcState
     */
    overwriteLADData = (srcState) => {
      this.setState({
        gridArea: JSON.parse(JSON.stringify(srcState.gridArea)),
        gridDate: JSON.parse(JSON.stringify(srcState.gridDate)),
        gridLATA: JSON.parse(JSON.stringify(srcState.gridLATA)),
        gridNXX: JSON.parse(JSON.stringify(srcState.gridNXX)),
        gridState: JSON.parse(JSON.stringify(srcState.gridState)),
        gridTel: JSON.parse(JSON.stringify(srcState.gridTel)),
        gridTime: JSON.parse(JSON.stringify(srcState.gridTime)),
        gridTD: JSON.parse(JSON.stringify(srcState.gridTD)),
        gridSD: JSON.parse(JSON.stringify(srcState.gridSD)),
      })
      this.checkDataExistForLAD()
    }

    /**
     * downloads the record content as the excel file
     */
    onDownload() {

    }

    /**
     * prints the record content
     */
    onPrint() {

    }

    /**
     * handles collapse or expand status of retrieve card
     */
    toggle_retrieve() {
      this.setState({bExpRetrieve: !this.state.bExpRetrieve});
    }

    /**
     * handles collapse or expand status of result card
     */
    toggle_result() {
      this.setState({bExpResult: !this.state.bExpResult});
    }

    /**
     *
     * @param tab
     */
    toggleMainTab = (tab) => {
      this.state.activeMainTab !== tab && this.setState({activeMainTab: tab});
    };

    /**
     *
     * @param tab
     */
    toggleAOSTab = (tab) => {
      this.state.activeAOSTab !== tab && this.setState({activeAOSTab: tab});
    };

    /**
     *
     * @param tab
     */
    toggleCarrierTab = (tab) => {
      this.state.activeCarrierTab !== tab && this.setState({activeCarrierTab: tab});
    };

    /**
     * convert from effective date time state string to UTC date time string
     * @param effDtTmStat
     */
    fromEffDtTmStatToUTCStr = (effDtTmStat) => {
      let tempArr = effDtTmStat.split(" ")
      let CTTimeStr = tempArr[0] + " " + tempArr[1] + " " + tempArr[2]
      return gFunc.fromCTStrToUTCStr(CTTimeStr)
    }

    /**
     * get current effective date time
     * @returns {string}
     */
    getCurEffDtTm = () => {
      let tempArr = this.state.effDtTmStat.split(" ")
      return tempArr[0] + " " + tempArr[1] + " " + tempArr[2]
    }

    /**
     *
     */
    checkModifiedState = () => {

      // first check if the basic data has been modified
      let bModifiedCR = false
      if (this.state.contactName !== this.lastActionState.contactName)           bModifiedCR = true
      if (this.state.contactNumber !== this.lastActionState.contactNumber)       bModifiedCR = true
      if (this.state.notes !== this.lastActionState.notes)                       bModifiedCR = true
      if (this.state.network !== this.lastActionState.network)                   bModifiedCR = true
      if (this.state.state !== this.lastActionState.state)                       bModifiedCR = true
      if (this.state.npa !== this.lastActionState.npa)                           bModifiedCR = true
      if (this.state.lata !== this.lastActionState.lata)                         bModifiedCR = true
      if (this.state.label !== this.lastActionState.label)                       bModifiedCR = true
      if (this.state.interLATACarrier !== this.lastActionState.interLATACarrier) bModifiedCR = true
      if (this.state.interLATACarrier !== this.lastActionState.interLATACarrier) bModifiedCR = true

      // next, check if the CPR data has been modified
      let bModifiedCPR = false
      if (this.state.priIntraLT !== this.lastActionState.priIntraLT)            bModifiedCPR = true
      if (this.state.priInterLT !== this.lastActionState.priInterLT)            bModifiedCPR = true
      if (this.state.timezone !== this.lastActionState.timezone)                bModifiedCPR = true
      if (this.state.dayLightSaving !== this.lastActionState.dayLightSaving)    bModifiedCPR = true
      if (this.state.cprSectNames !== this.lastActionState.cprSectNames)        bModifiedCPR = true
      if (this.state.cprGridCategory !== this.lastActionState.cprGridCategory)  bModifiedCPR = true
      if (this.state.cprGridData !== this.lastActionState.cprGridData)          bModifiedCPR = true

      // last, check if the LAD data has been modified
      let bModifiedLAD = false
      if (this.state.gridArea !== this.lastActionState.gridArea)                bModifiedLAD = true
      if (this.state.gridDate !== this.lastActionState.gridDate)                bModifiedLAD = true
      if (this.state.gridLATA !== this.lastActionState.gridLATA)                bModifiedLAD = true
      if (this.state.gridNXX !== this.lastActionState.gridNXX)                  bModifiedLAD = true
      if (this.state.gridState !== this.lastActionState.gridState)              bModifiedLAD = true
      if (this.state.gridTel !== this.lastActionState.gridTel)                  bModifiedLAD = true
      if (this.state.gridTime !== this.lastActionState.gridTime)                bModifiedLAD = true
      if (this.state.gridTD !== this.lastActionState.gridTD)                    bModifiedLAD = true
      if (this.state.gridSD !== this.lastActionState.gridSD)                    bModifiedLAD = true

      this.setState({bModifiedCR: bModifiedCR, bModifiedCPR: bModifiedCPR, bModifiedLAD: bModifiedLAD})
    }



    /**
     * this function is called at clicking the retrieve button of the retrieve card.
     */
    onSearchNumber() {
      let searchUTCString = ""
      if (this.state.searchEffDtTm != "") {
        let searchCTDtTm = new Date(this.state.searchEffDtTm)
        searchUTCString = gFunc.fromCTTimeToUTCStr(searchCTDtTm)
      }

      // if any modified, shows the modal asking if really will do
      if (this.state.bContentModified) {
        this.setState({
          numParam: this.state.searchEffDtTm,
          effDtTmParam: searchUTCString,
          preEffDtTmStat: '',   // sets as empty here
          modifiedModalVisible: true
        })
      } else if (this.retrieveCustomerRecord(this.state.searchNum, searchUTCString, true)) {
        this.setState({message: CAD_RETRIEVE_SUCCESSFUL})
      }
    }

    /**
     * This function is called at pressing keydown on the search record number on the search effective date time
     * @param event
     */
    onKeyDownToRetrieve = (event) => {
      if (event.key == 'Enter') {
        this.onSearchNumber()
      }
    }

    /**
     * this function is called at clicking the Edit button
     */
    onEdit = () => {
      let UTCTimeStr = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)

      let body = { custRecAction: gConst.ACTION_UPDATE, srcNum: this.state.num, srcEffDtTm: UTCTimeStr, custRecCompPart: this.state.custRecCompPart }
      this.props.callApi2(RestApi.lockCadRec, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout}).then(res => {
        if (res.ok && res.data) {
          if (res.data.updateStatus.isAllowed === 'Y') {

            this.setState({
              lockParam: body,
              action: gConst.ACTION_UPDATE,

              disable: false,
              bEditEnable: false,
              bSubmitEnable: true,
              bSaveEnable: true
            })
            return
          }
        }

        if (res.data && res.data.updateStatus && res.data.updateStatus.statusMessages !== null) {
          this.setState({message: gFunc.synthesisErrMsg(res.data.updateStatus.statusMessages)})
        }
      })
    }

    /**
     * clear basic datas
     */
    onClearBasicData = () => {
      this.initBasicData()
    }

    /**
     * this function is called at changing selection of effective date time state select field
     * @param ev
     */
    onEffDtTmSelChange = (ev) => {
      let UTCTimeStr = this.fromEffDtTmStatToUTCStr(ev.target.value)

      this.setState({effDtTmStat: ev.target.value})

      // if any modified, shows the modal asking if really will do
      if (this.state.bContentModified) {
        this.setState({
          numParam: this.state.num,
          effDtTmParam: UTCTimeStr,
          preEffDtTmStat: this.state.effDtTmStat,
          modifiedModalVisible: true
        })
      } else if (this.retrieveCustomerRecord(this.state.num, UTCTimeStr, true)) {
        this.setState({message: CAD_RETRIEVE_SUCCESSFUL})
      }
    }

    /**
     * this is called at clicking Import CPR Reporting
     */
    onImportCprReportData = () => {
      console.log(">>> onImportCprReportData")

      let bEmptyCpr = true

      console.log("cprGridData: " + JSON.stringify(this.state.cprGridData))
      // check if cpr data is empty
      for (let grid of this.state.cprGridData) {
        for (let row of grid) {
          for (let cell of row) {
            if (cell !== "") {
              bEmptyCpr = false
              break
            }
          }

          if (!bEmptyCpr) break
        }

        if (!bEmptyCpr) break
      }

      let bEmptyLad = true
      for (let row of this.state.gridSD) {
        for (let cell of Object.values(row)) {
          if (cell !== "") {
            bEmptyLad = false
            break
          }
        }

        if (!bEmptyLad) break
      }

      // if cpr and lad are empty, import the data
      if (bEmptyCpr && bEmptyLad) {
        this.importCpr()
        return
      }

      // show the dialog for comfirming the importing.
      let message = "There are existing data on the CPR or LAD tab.\nAre you sure wish to import CPR report data?"
      this.setState({cprImportModalVisible: true, sureImportMessage: message})
    }

    /**
     * this is called at clicking import on the import dialog.
     */
    importCpr = () => {
      console.log(">>> importCpr")

      this.setState({cprImportModalVisible: false})

      $('#attachment').click()
    }

    /**
     * this is called when the file attached control's value is changed
     * @param ev
     */
    onImportFileSelected = (ev) => {
      console.log(">>> onImportFileSelected: " + ev.target.files[0].name)

      const reader = new FileReader()

      this.setState({ isImporting: true})

      reader.addEventListener('load', (event) => {
        this.parseCprReportData(event.target.result)
        $('#attachment').val("")
      });
      reader.readAsBinaryString(ev.target.files[0])
    }

    /**
     * parse cpr report data and set the cpr and labels
     * @param data
     */
    parseCprReportData = (data) => {

      let wb = XLSX.read(data, {type: 'binary'})

      if (wb.SheetNames.length < 2) {
        let message = "The excel file to import is invalid. Please check the file or import another file."
        this.setState({ message: message, isImporting: false, })

        NotificationManager.error('', message)

        return
      }

      let cprSheetName = wb.SheetNames[0]
      let cprSheet = wb.Sheets[cprSheetName]
      let cprSheetData = XLSX.utils.sheet_to_csv(cprSheet, {header: 1})

      let ladSheetName = wb.SheetNames[1]
      let ladSheet = wb.Sheets[ladSheetName]
      let ladSheetData = XLSX.utils.sheet_to_csv(ladSheet, {})

      if (cprSheetData == '' && ladSheetData == '') {
        let message = "There is no data to import."
        this.setState({ message: message, isImporting: false, })
        NotificationManager.error('', message)
        return
      }

      // first, parse the cpr data
      let lineList = cprSheetData.split("\n")
      let bStartsWidthLATA = false
      let colSize = 3, cicIndex = 1
      if (lineList[0].startsWith("LATA")) {
        bStartsWidthLATA = true
        colSize = 4
        cicIndex = 2
      }

      // parse cpr data
      let cprGridCategory = [...this.state.cprGridCategory]
      if (bStartsWidthLATA)
        cprGridCategory[0] = Array('lata', 'sixDigit', 'carrier', 'termNum')
      else
        cprGridCategory[0] = Array('sixDigit', 'carrier', 'termNum')

      let cprGridData = [...this.state.cprGridData]
      cprGridData[0] = Array(1).fill(Array(colSize).fill(''))

      let npanxxList = []

      let cprIndex = 0
      for (let line of lineList) {
        line = line.replace("\r", "")
        if (bStartsWidthLATA && line.startsWith("LATA"))  continue
        if (!bStartsWidthLATA && line.startsWith("6-digit"))  continue

        let cellList = line.split(",")

        if (cellList.length === 1 || cellList[0] === '') {
          break
        }

        if (cprIndex >= cprGridData.length)
          cprGridData[0].push(Array(colSize).fill(''))

        for (let i = 0; i < colSize; i++) {
          cprGridData[0][cprIndex][i] = cellList[i]
        }

        npanxxList.push(cellList[cicIndex - 1])

        cprIndex++
      }

      // next, parse lad data
      lineList = ladSheetData.split("\n")

      let gridSD = Array(INIT_LAD_GRID_LENGTH)
      for (let i = 0; i < INIT_LAD_GRID_LENGTH; i++)
        gridSD[i] = {lbl: '', def1: '', def2: '', def3: '', def4: '', def5: '', def6: '', def7: ''}

      let rowIndex = 0
      for (let line of lineList) {
        if (line === "") continue

        if (rowIndex >= gridSD.length) {
          gridSD.push({lbl: '', def1: '', def2: '', def3: '', def4: '', def5: '', def6: '', def7: ''})
        }

        let tempArray = line.split("\"")
        console.log(">> temp array: ")
        console.log(tempArray)
        if (tempArray.length < 3)   continue

        let cells = tempArray[0].split(",")
        if (cells[0].startsWith("*"))
          gridSD[rowIndex].lbl = cells[0]
        else if (cells[1].startsWith("*"))
          gridSD[rowIndex].lbl = cells[1]

        let sixDigitList = tempArray[1].split(",")
        let rowOffset = 0
        while (true) {
          if (rowOffset * 7 < sixDigitList.length) {
            if (rowOffset > 0 && rowIndex >= gridSD.length) {
              gridSD.push({lbl: '', def1: '', def2: '', def3: '', def4: '', def5: '', def6: '', def7: ''})
            }

            gridSD[rowIndex].def1 = sixDigitList[rowOffset * 7]
          } else {
            rowIndex++; break
          }

          if (rowOffset * 7 + 1 < sixDigitList.length) {
            gridSD[rowIndex].def2 = sixDigitList[rowOffset * 7 + 1]
          } else {
            rowIndex++; break
          }

          if (rowOffset * 7 + 2 < sixDigitList.length) {
            gridSD[rowIndex].def3 = sixDigitList[rowOffset * 7 + 2]
          } else {
            rowIndex++; break
          }

          if (rowOffset * 7 + 3 < sixDigitList.length) {
            gridSD[rowIndex].def4 = sixDigitList[rowOffset * 7 + 3]
          } else {
            rowIndex++; break
          }

          if (rowOffset * 7 + 4 < sixDigitList.length) {
            gridSD[rowIndex].def5 = sixDigitList[rowOffset * 7 + 4]
          } else {
            rowIndex++; break
          }

          if (rowOffset * 7 + 5 < sixDigitList.length) {
            gridSD[rowIndex].def6 = sixDigitList[rowOffset * 7 + 5]
          } else {
            rowIndex++; break
          }

          if (rowOffset * 7 + 6 < sixDigitList.length) {
            gridSD[rowIndex].def7 = sixDigitList[rowOffset * 7 + 6]
          } else {
            rowIndex++; break
          }

          rowOffset++
          rowIndex++
        }
      }

      this.setState({
        cprGridCategory,
        cprGridData,
        cprCurActiveRow: Array(this.state.cprSectNames.length).fill(gConst.INVALID_ROW),
        cprCurActiveCol: Array(this.state.cprSectNames.length).fill(gConst.INVALID_COL),

        gridSD: gridSD,

        message: "CPR report data has been imported.",

        noCPR: false,
        noLAD: false,
        noGridSD: false,

        activeMainTab: '2',
        isImporting: false,
      })

      NotificationManager.success('', "CPR report data has been imported.")
    }

    /**
     * This is the function that performs the actions(Create, Update, Copy, Transfer, Disconnect)
     * @param cmd: 'U' - submit the pointer record to SCP, 'S' - save the the pointer record to Somos
     */
    performAction = (cmd) => {

      switch (this.state.action) {
        case gConst.ACTION_NONE:
        case gConst.ACTION_UPDATE:
          this.updateCustomerRecord(cmd)
          break
        case gConst.ACTION_CREATE:
          this.createCustomerRecord(cmd)
          break
        case gConst.ACTION_COPY:
          if (this.state.referral === '')
            this.copyCustomerRecord(cmd)
          else
            this.disconnectCustomerRecord(cmd)
          break
        case gConst.ACTION_TRANSFER:
          this.transferCustomerRecord(cmd)
          break
        case gConst.ACTION_DISCONNECT:
          if (this.state.referral === '') {
            this.setState({message: 'Please select referral data'})
            return
          }
          this.disconnectCustomerRecord(cmd)
          break
      }
    }

    /**
     * this function is called at clicking Submit button
     */
    onSubmit = () => {
      this.performAction('U')
    }

    /**
     * this function is called at clicking Save button
     */
    onSave = () => {
      this.performAction('S')
    }

    /**
     * this function is called at clicking Revert button
     */
    onRevert = () => {
      this.setState({bRevertClicked: true, modifiedModalVisible: true})
    }

    /**
     *
     */
    onCopy = () => {
      this.checkModifiedState()   // check if the data has been modified

      this.setState({
        srcNum: this.state.num,
        srcEffDtTm: this.getCurEffDtTm(),
        tgtNum: gFunc.formattedNumber(this.state.num),
        tgtEffDtTm: '',
        copyNow: false,
        validMsg: '',
        bCheckCREnable: true,
        bCheckCPREnable: true,
        bCheckLADEnable: true,
        portionEntire: false,
        portionCR: false,
        portionCPR: false,
        portionLAD: false,
        copyAction: gConst.COPYACTION_CHANGE,
        copyModalVisible: true
      })

    }

    /**
     *
     */
    onTransfer = () => {
      this.checkModifiedState()   // check if the data has been modified

      this.setState({
        srcNum: this.state.num,
        srcEffDtTm: this.getCurEffDtTm(),
        tgtNum: gFunc.formattedNumber(this.state.num),
        tgtEffDtTm: '',
        copyNow: false,
        validMsg: '',
        bCheckCPREnable: true,
        bCheckLADEnable: true,
        portionEntire: false,
        portionCR: true,
        portionCPR: false,
        portionLAD: false,
        transferModalVisible: true
      })
    }

    /**
     * this is called at clicking the convert button
     */
    onConvert = () => {
      this.setState({
        srcNum: this.state.num,
        srcEffDtTm: this.getCurEffDtTm(),
        tgtNum: '',
        tgtEffDtTm: '',
        copyNow: false,
        validMsg: '',
        copyAction: gConst.COPYACTION_CONVERT,
        convertModalVisible: true
      })
    }

    /**
     * this function is called at clicking the yes button on the modal asking if will revert
     */
    doRevert = () => {
      let activeMainTab = this.state.activeMainTab
      let activeAOSTab = this.state.activeAOSTab
      let activeCarrierTab = this.state.activeCarrierTab
      let activeCPRTab = this.state.activeCPRTab
      let activeLADTab = this.state.activeLADTab

      console.log("doRevert lastActionState: " + JSON.stringify(this.state.cprGridData))
      this.setState(JSON.parse(JSON.stringify(this.lastActionState)));
      this.setState({
        bEditEnable: false,
        disable: false,
        activeMainTab: activeMainTab,
        activeAOSTab: activeAOSTab,
        activeCarrierTab: activeCarrierTab,
        activeCPRTab: activeCPRTab,
        activeLADTab: activeLADTab,
      })


      console.log("doRevert this state: " + JSON.stringify(this.state.cprGridData))
    }

    /**
     * this function is called at clicking the no button on the modal asking if will revert
     */
    cancelRevert = () => {
      this.setState({bRevertClicked: false, modifiedModalVisible: false})
    }

    /**
     * this function is called at clicking the yes button on the modal asking if will retrieve another record
     */
    doAnotherRecord = () => {
      this.hideModifiedModal()

      if (this.retrieveCustomerRecord(this.state.numParam, this.state.effDtTmParam, true)) {
        this.setState({message: CAD_RETRIEVE_SUCCESSFUL})
      }
    };

    /**
     * this function is called at clicking the no button on the modal asking if will retrieve another record
     */
    cancelAnotherRecord = () => {
      this.hideModifiedModal();

      if (this.state.preEffDtTmStat != '')
        this.setState({effDtTmStat: this.state.preEffDtTmStat});
    };

    /**
     * checks the validation for the inputed fields
     */
    checkValidation = () => {
      console.log("this.state.createEffDtTm: " + this.state.createEffDtTm)

      let message = ''

      if (this.state.respOrg === '') {
        message += 'Resp Org field is required.'
      }

      if (this.state.action === gConst.ACTION_CREATE && !this.state.createNow) {
        if (this.state.createEffDtTm === 0 || this.state.createEffDtTm === '') {
          message += (message === '') ? '' : '\r\n'
          message += 'Effective Date Time field is required.'
        }
      }

      if (this.state.network === '' && this.state.state === '' && this.state.npa === '' && this.state.lata === '' && this.state.label === '') {
        message += (message === '') ? '' : '\r\n'
        message += 'At least one field of the Area of Service is required.'
      }

      if (this.state.intraLATACarrier === '' || this.state.interLATACarrier === '') {
        message += (message === '') ? '' : '\r\n'
        message += 'Intra and Inter Carriers are required.'
      }

      // if (!this.state.noCPR && (this.state.priIntraLT === '' || this.state.priInterLT === '')) {
      //   message += (message === '') ? '' : '\r\n'
      //   message += 'Default carriers are required on the CPR tab.'
      // }

      if (message != '') {
        this.setState({message: message})
        return false
      }
      return true
    }

    /**
     * get the merged carriers between Default carriers and carriers that the user added
     * @param carriers: the carriers that the user added
     */
    getMergedCarriers = (carriers) => {
      let mergedCarriers = [...gConst.DEFAULT_CARRIERS]

      // merge carriers
      for (let carrier of carriers) {
        if (mergedCarriers.indexOf(carrier) === - 1) {
          mergedCarriers.push(carrier)
        }
      }

      // sort a to z
      mergedCarriers.sort(function (a, b) {
        if (a > b)
          return 1
        else if (a < b)
          return -1

        return 0
      })

      return mergedCarriers
    }

    /**
     * reflect the retrieved data on page
     * @param data
     */
    reflectDataOnPage = (num, data) => {

      let effDtTm = data.effDtTm

      // gets the list of effective date time
      let lstEffDtTms = data.lstEffDtTms

      // if no result, shows the message if moves to create mode
      if (lstEffDtTms == undefined || lstEffDtTms == null) {
        this.setState({createModalVisible: true,})
        return
      }

      // effective date time status list
      let nEffIndex = 0
      let dtTmStatList = []

      for (let i = 0; i < lstEffDtTms.length; i++) {

        let edt = lstEffDtTms[i]
        let dtTmString = gFunc.fromUTCStrToCTStr(edt.effDtTm)
        let dtTmStat = dtTmString + " CT " + edt.custRecStat.replace("_", " ") + " " + edt.custRecCompPart.substring(0, 3)
        dtTmStatList.push(dtTmStat)

        if (effDtTm == edt.effDtTm) {
          nEffIndex = i;
        }
      }

      // if the record was activated by PAD, go to the PAD page
      if (lstEffDtTms[nEffIndex].custRecCompPart.includes("PAD")) {
        this.gotoPTRPage(num, effDtTm)
        return
      }

      let status = lstEffDtTms[nEffIndex].custRecStat.replace("_", " ")

      this.setState({
        num:           num.replace(/-/g, ""),
        retrieveCardTitle:  gConst.RETRIEVE_CARD_TITLE_PREFIX + ": " + gFunc.formattedNumber(num),
        bRetrieveCardIconHidden: true,
        resultCardTitle:    gConst.RESULT_CARD_TITLE_PREFIX2,
        bResultHeaderHidden:false,
        bEffDtTmListHidden: false,
        bExpRetrieve:       false,
        bExpResult:         true,
        effDtTmStatList:    dtTmStatList,
        effDtTmStat:        dtTmStatList[nEffIndex],
        status:             status,
        custRecCompPart:    lstEffDtTms[nEffIndex].custRecCompPart.replace(/\_/g, ", ")
      })

      // get basic data
      let interLATACarrier = data.interLATACarrier != null ? data.interLATACarrier : []
      let intraLATACarrier = data.intraLATACarrier != null ? data.intraLATACarrier : []

      let aosLbl = [], aosNPA = [], aosLATA = [], aosNet = [], aosState = []
      if (data.aos) {
        aosLbl = data.aos.aosLbl != null ? data.aos.aosLbl : []
        aosNPA = data.aos.aosNPA != null ? data.aos.aosNPA : []
        aosLATA = data.aos.aosLATA != null ? data.aos.aosLATA : []
        aosNet = data.aos.aosNet != null ? data.aos.aosNet : []
        aosState = data.aos.aosState != null ? data.aos.aosState : []
      }

      let noCPR = true, noLAD = true
      if (data.lbl && data.lbl.length)
        noLAD = false
      if (data.cprSectName && data.cprSectName.length)
        noCPR = false

      this.initLADGrids()

      // get lad information and arrange
      let temp = {}
      let lblList = data.lbl
      if (!noLAD) {
        for (let lbl of lblList) {
          let lblType = lbl.lblType
          let lblName = lbl.lblName

          let name = {name: lblName, value: []}

          for (let val of lbl.lblVals) {
            name.value.push(val)
          }

          if (temp[lblType] == undefined) {
            temp[lblType] = {type: lblType, value: []}
            temp[lblType].value.push(name)
          } else {
            let i = 0
            for (i = 0; i < temp[lblType].value.length; i++) {
              if (name.name.localeCompare(temp[lblType].value[i].name) === -1) {
                break
              }
            }
            temp[lblType].value.splice(i, 0, name)
          }
        }

        // configure grid from arranged lad information
        for (let tname in temp) {
          let type = temp[tname]

          let grid = []
          let nColIndex = 0;
          let row = {lbl: '', def1: '', def2: '', def3: '', def4: '', def5: '', def6: '', def7: ''}
          for (let name of type.value) {
            if (grid.length > 0) {
              grid.push(row)
              row = {lbl: '', def1: '', def2: '', def3: '', def4: '', def5: '', def6: '', def7: ''}
            }

            row.lbl = name.name
            nColIndex = 1
            for (let value of name.value) {
              if (nColIndex === 8) {
                grid.push(row)

                row = {lbl: '', def1: '', def2: '', def3: '', def4: '', def5: '', def6: '', def7: ''}
                nColIndex = 1
              }

              switch (nColIndex) {
                case 1: row.def1 = value; break;
                case 2: row.def2 = value; break;
                case 3: row.def3 = value; break;
                case 4: row.def4 = value; break;
                case 5: row.def5 = value; break;
                case 6: row.def6 = value; break;
                case 7: row.def7 = value; break;
              }

              nColIndex++
            }
          }
          grid.push(row)

          // make the grid with more than default length
          let rowLenDiff = INIT_LAD_GRID_LENGTH - grid.length
          if (rowLenDiff > 0) {
            for (let i = 0; i < rowLenDiff; i++) {
              grid.push({lbl: '', def1: '', def2: '', def3: '', def4: '', def5: '', def6: '', def7: ''})
            }
          }

          switch (type.type) {
            case gConst.LBL_TYPE_AC:
              this.setState({gridArea: grid, noGridArea: false})
              break
            case gConst.LBL_TYPE_DT:
              this.setState({gridDate: grid, noGridDate: false})
              break
            case gConst.LBL_TYPE_LT:
              this.setState({gridLATA: grid, noGridLATA: false})
              break
            case gConst.LBL_TYPE_NX:
              this.setState({gridNXX: grid, noGridNXX: false})
              break
            case gConst.LBL_TYPE_SD:
              this.setState({gridSD: grid, noGridSD: false})
              break
            case gConst.LBL_TYPE_ST:
              this.setState({gridState: grid, noGridState: false})
              break
            case gConst.LBL_TYPE_TD:
              this.setState({gridTD: grid, noGridTD: false})
              break
            case gConst.LBL_TYPE_TE:
              this.setState({gridTel: grid, inoGridTel: false})
              break
            case gConst.LBL_TYPE_TI:
              this.setState({gridTime: grid, noGridTime: false})
              break
          }
        }
      }

      // set the prev user and last user
      let lastUsr = '', prevUsr = '', lastUpDt = ''
      if (data.lastUsr != null)
        lastUsr = data.lastUsr
      if (data.prevUsr != null)
        prevUsr = data.prevUsr
      if (data.lastUpDt != null && data.lastUpDt != '')
        lastUpDt = gFunc.fromUTCStrToCTStr(data.lastUpDt)

      // get cpr types
      // get real row size and col size
      let cprGridCategory = []
      let cprGridData = []
      let cprSectNames = []
      let cprCurActiveRow = []
      let cprCurActiveCol = []
      if (data.cprSectName != undefined && data.cprSectName != null && data.cprSectName.length > 0) {

        let sectCount = data.cprSectName.length
        cprCurActiveRow = new Array(sectCount).fill(gConst.INVALID_ROW)
        cprCurActiveCol = new Array(sectCount).fill(gConst.INVALID_COL)

        for (let sect of data.cprSectName) {

          // add section name
          cprSectNames.push(sect.name)

          let cprRows = 0
          let cprCols = 0

          // config category and add to cpr grid category
          for (let node of sect.nodes) {
            cprRows = Math.max(cprRows, node.rowIndex)
            cprCols = Math.max(cprCols, node.colIndex)
          }

          let subCategory = new Array(cprCols).fill('')
          let nIndex = 0
          for (let category of sect.nodeSeq) {
            subCategory[nIndex++] = category
          }
          cprGridCategory.push(subCategory)

          // configure cpr grid
          let subData = new Array(cprRows).fill(0).map(() => new Array(cprCols).fill(''));
          for (let node of sect.nodes) {
            if (node.values.length > 0)
              subData[node.rowIndex - 1][node.colIndex - 1] = node.values[0]
          }
          cprGridData.push(subData)
        }

        this.setState({
          cprSectNames: cprSectNames,
          cprGridCategory: cprGridCategory,
          cprGridData:  cprGridData,
          cprCurActiveRow: cprCurActiveRow,
          cprCurActiveCol: cprCurActiveCol,
        })

      } else { // no cpr data then, config initial cpr data
        this.initCPRData()
      }

      let destNums = []
      if (data.destNums != null && data.destNums.length > 0) {
        for (let el of data.destNums) {
          let destNum = {
            destNum: gFunc.formattedNumber(el.destNum),
            numTermLine: el.numTermLine ? el.numTermLine : '',
            localServOff: el.localServOff ? el.localServOff : '',
            forServOff: el.forServOff ? el.forServOff : ''
          }
          destNums.push(destNum)
        }
      }

      if (destNums.length === 0) {
        let destNum = {
          destNum: '',
          numTermLine: '',
          localServOff: '',
          forServOff: ''
        }
        destNums.push(destNum)
      }

      this.setState({
        num:          num.replace(/-/g, ""),

        respOrg:      data.ctrlRespOrgId,
        approval:     data.lstEffDtTms[nEffIndex].apprStat.replace(/\_/g, " "),
        priority:     (data.priority == 'Y'),
        customerId:   data.onAccCust ? data.onAccCust : '',

        agent:        data.agent ? data.agent: '',
        telco:        data.telco ? data.telco: '',
        hold:         data.hldIndFlag,

        endSub:       data.endSub ? data.endSub : '',
        endSubAddr:   data.endSubAddr ? data.endSubAddr : '',
        svcOrderNum:  data.svcOrderNum ? data.svcOrderNum : '',
        suppFormNum:  data.suppFormNum ? data.suppFormNum : '',

        lastUpDt:     lastUpDt,
        lastUser:     lastUsr,
        prevUser:     prevUsr,

        destNums:     destNums,
        contactName:  data.conName ? data.conName : '',
        contactNumber: data.conTel ? gFunc.formattedNumber(data.conTel) : '',
        notes:        data.notes ? data.notes : '',

        network:      aosNet.join(','),
        label:        aosLbl.join(','),
        npa:          aosNPA.join(','),
        lata:         aosLATA.join(','),
        state:        aosState.join(','),

        intraLATACarrier: intraLATACarrier.join(','),
        interLATACarrier: interLATACarrier.join(','),

        noCPR:        noCPR,
        noLAD:        noLAD,
        noCR:         false,

        noNetworks:    aosNet.length === 0,
        noStates:      aosState.length === 0,
        noNPAs:        aosNPA.length === 0,
        noLATAs:       aosLATA.length === 0,
        noLabels:      aosLbl.length === 0,
        noIAC:         intraLATACarrier.length === 0,
        noIEC:         interLATACarrier.length === 0,

        iec_array:    this.getMergedCarriers(interLATACarrier),
        iac_array:    this.getMergedCarriers(intraLATACarrier),
        priIntraLT:   data.priIntraLT != null ? data.priIntraLT : '',
        priInterLT:   data.priInterLT != null ? data.priInterLT : '',
        timezone:     data.tmZn,
        dayLightSaving: (data.dayLightSavings === 'Y'),

        recVersionId: data.recVersionId,
      });


      // check if the user has permission for the customer record
      if (data.errList != null && data.errList.length) {

        let errList = data.errList
        let errMsg = gFunc.synthesisErrMsg(errList)

        if (errList[0].errLvl === gConst.ERRLVL_WARNING)
          NotificationManager.warning("", errMsg)
        else
          NotificationManager.error("", errMsg)

        if (data.errList[0].errLvl === gConst.ERRLVL_ERROR) {  // error
          this.setState({
            disable: true,
            bContentModified: false,
            bRetrieveEnable: true,
            bEditEnable: false,
            bCopyEnable: false,
            bTransferEnable: false,
            bDeleteEnable: false,
            bSubmitEnable: false,
            bSaveEnable: false,
            bRevertEnable: false,
            bCancelEnable: true,

            bEffDtTmDisable: false,
          })
          return
        }
      }

      // if current date is before than the the date of selected record
      let ctEffDtTmStr = this.getCurEffDtTm()
      let localEffDtTm = gFunc.fromCTStrToLocalTime(ctEffDtTmStr)
      let curTime = new Date()

      if (localEffDtTm >= curTime) {
        this.setState({bEditEnable: true, bDeleteEnable: true})
      } else {
        this.setState({bEditEnable: false, bDeleteEnable: false})
      }

      let bTransferEnable = true
      if (status === gConst.STAT_ACTIVE || status === gConst.STAT_OLD
            || status === gConst.STAT_SENDING || status === gConst.STAT_DISCONNECT) {
        bTransferEnable = false
      }

      let bCopyEnable = true
      if (status === gConst.STAT_OLD || status === gConst.STAT_FAILED)
        bCopyEnable = false

      let bSubmitEnable = false
      if (status === gConst.STAT_SAVED)
        bSubmitEnable = true

      this.setState({
        disable: true,
        bContentModified: false,
        bRetrieveEnable: true,
        bCopyEnable: bCopyEnable,
        bTransferEnable: bTransferEnable,
        bSubmitEnable: bSubmitEnable,
        bSaveEnable: false,
        bRevertEnable: false,
        bCancelEnable: true,

        bEffDtTmDisable: false,

      })
    }

    /**
     * retrieve record.
     * @param num
     * @param effDtTm: UTC time string of YYYY-MM-DDTHH:mmZ type
     * @returns {Promise<void>}
     */
    retrieveCustomerRecord = async (num, effDtTm, isUserAct = false) => {

      this.setState({bRetrieveEnable: false})

      num = num.replace(/\-/g, "")
      if (effDtTm != "NOW")
        effDtTm = effDtTm.replace(/\-/g, "").replace(":", "");
      let params = { num: num, effDtTm: effDtTm, isUserAct: isUserAct }
      return await this.props.callApi2(RestApi.retrieveCadRec, params).then(res => {
        console.log(">>> retrieveCadRec: ", res)
        if (res.ok && res.data) {

          let data = res.data
          if (data.errList != null && data.errList.length) {

            let errList = data.errList
            let errMsg = gFunc.synthesisErrMsg(errList)
            if (data.num == null) {

              if (data.numStatus != null && data.numStatus === "RESERVED") {
                this.setState({createModalVisible: true})
                return false

              } else {
                NotificationManager.error("", errMsg)
                this.setState({bRetrieveEnable: true})
                return false
              }

            }
          }

          this.unlockCustomerRecord()
          this.reflectDataOnPage(num, res.data)
          this.backupStateToLastAction()
          return true

        } else if (res.data !== undefined && res.data.errList !== undefined && res.data.errList.length) {
          NotificationManager.error("", gFunc.synthesisErrMsg(res.data.errList))
          this.setState({message: gFunc.synthesisErrMsg(res.data.errList), bRetrieveEnable: true})
          return false

        } else {
          let message = "An unknown error occurred."
          NotificationManager.error("", message)
          this.setState({message: message, bRetrieveEnable: true})
          return false
        }
      })
    };

    /**
     * create record
     * @param cmd: 'U' or 'S'
     * @returns {Promise<boolean>}
     */
    createCustomerRecord = async (cmd) => {

      if (!this.checkValidation()) {
        return false
      }

      let body = this.getCreateRequestBody(cmd)

      console.log(">>> customer record create: ", JSON.stringify(body))

      // let userInfo = {usrName: 'aaa', oldPassword: 'bbb', newPassword: 'ccc'}
      // this.props.callApi(RestApi.createCadRec, response=> {}, userInfo)


      let res = await this.props.callApi2(RestApi.createCadRec, JSON.stringify(body))
      if (res.ok && res.data) {

        let data = res.data
        if (data.recVersionId != undefined && data.recVersionId != null) {
          this.setState({recVersionId: data.recVersionId})
        }

        // if there is any error
        let errList = data.errList
        if (errList != undefined && errList != null) {

          let message = gFunc.synthesisErrMsg(errList)
          // error, but able to retrieve
          if (data.recVersionId != null) {
            if (await this.retrieveCustomerRecord(body.num, body.effDtTm)) {
              if (errList[0].errLvl === "ERROR") {
                NotificationManager.error("", message)

              } else {
                NotificationManager.warning("", message)
              }

              this.setState({message: message})
            }

          } else {

            this.setState({message: message})

            if (errList[0].errLvl === "ERROR") {
              NotificationManager.error("", message)
              return false

            } else {
              NotificationManager.warning("", message)
            }
          }

        } else {

          // no error, update successful
          if (await this.retrieveCustomerRecord(body.num, data.effDtTm)) {
            NotificationManager.success("", CAD_CREATE_SUCCESSFUL)
            this.setState({message: '', action: gConst.ACTION_NONE})
          }
        }

      } else if (res.data != undefined) {

        // if there is any error
        let errList = res.data.errList
        if (errList != undefined && errList != null) {

          let message = gFunc.synthesisErrMsg(errList)
          this.setState({message: message})
          NotificationManager.error("", message)

          return false
        }
      }

      return true;
    };

    /**
     * Update record
     * @param cmd: 'U' or 'S'
     * @returns {Promise<boolean>}
     */
    updateCustomerRecord = async (cmd) => {

      if (!this.checkValidation()) {
        return false
      }

      let body = this.getUpdateRequestBody(cmd)

      let res = await this.props.callApi2(RestApi.updateCadRec, JSON.stringify(body))
      if (res.ok && res.data) {

        let data = res.data
        if (data.recVersionId != undefined && data.recVersionId != null) {
          this.setState({recVersionId: data.recVersionId})
        }

        // if there is any error
        let errList = data.errList
        if (errList != undefined && errList != null) {

          let message = gFunc.synthesisErrMsg(errList)
          // error, but able to retrieve
          if (data.recVersionId != null) {
            if (await this.retrieveCustomerRecord(body.num, body.effDtTm)) {
              if (errList[0].errLvl === "ERROR") {
                NotificationManager.error("", message)

              } else {
                NotificationManager.warning("", message)
              }

              this.setState({message: message})
            }

          } else {

            this.setState({message: message})

            if (errList[0].errLvl === "ERROR") {
              NotificationManager.error("", message)
              return false

            } else {
              NotificationManager.warning("", message)
            }
          }

        } else {

          // no error, update successful
          if (await this.retrieveCustomerRecord(body.num, body.effDtTm)) {
            NotificationManager.success("", CAD_UPDATE_SUCCESSFUL)
            this.setState({message: CAD_UPDATE_SUCCESSFUL})
          }
        }

      } else if (res.data != undefined) {

        // if there is any error
        let errList = res.data.errList
        if (errList != undefined && errList != null) {

          let message = gFunc.synthesisErrMsg(errList)
          this.setState({message: message})
          NotificationManager.error("", message)

          return false
        }
      }

      return true
    }

    /**
     * this is called at clicking Yes button on the copy modal
     * @returns {Promise<void>}
     */
    checkValidForCopying = async () => {
      if (!this.state.copyNow && this.state.tgtEffDtTm === '') {
        this.setState({validMsg: "Please input effective date/time"})
        return
      }

      let srcNum = this.state.srcNum.replace(/\-/g, "")
      let tgtNum = this.state.tgtNum.replace(/\-/g, "")
      let tgtTmplName = this.state.tgtNum

      switch (this.state.copyAction) {
        case gConst.COPYACTION_CHANGE:
          break
        case gConst.COPYACTION_DISCONNECT:
          if (srcNum !== tgtNum) {
            this.setState({validMsg: "Copy of a Disconnect TR is allowed only to the same Number"})
            return
          }
          if (this.state.referral !== '') {
            this.setState({validMsg: "Action must be Change or New"})
            return
          }
          break
        case gConst.COPYACTION_NEW:
          if (srcNum === tgtNum) {
            this.setState({validMsg: "Action must be Change or Disconnect"})
            return
          }
          break
      }

      if (!this.state.portionCR && !this.state.portionCPR && !this.state.portionLAD) {
        this.setState({validMsg: "Select at least one checkbox"})
        return
      }

      // gets source date time
      let srcEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)

      // gets target date time
      let tgtEffDtTm = "NOW"
      if (!this.state.copyNow) {
        tgtEffDtTm = gFunc.fromCTTimeToUTCStr(new Date(this.state.tgtEffDtTm))
      }

      // configs component part
      let custRecCompPart = ''
      if (this.state.portionCR) {   // basic
        custRecCompPart = "CAD"
      }

      // LAD data
      if (this.state.portionLAD) {
        custRecCompPart += (custRecCompPart == '') ? '' : ', '
        custRecCompPart += "LAD"
      }

      // CPR data
      if (this.state.portionCPR) {
        custRecCompPart += (custRecCompPart == '') ? '' : ', '
        custRecCompPart += "CPR"
      }

      let custRecAction = gConst.ACTION_COPY
      if (this.state.referral !== '' || this.state.copyAction === gConst.COPYACTION_DISCONNECT) {
        custRecAction = gConst.ACTION_DISCONNECT
      }

      let regNum = gConst.TFNUM_REG_EXP
      let regTmpl = gConst.TMPLNAME_REG_EXP
      if (!regNum.test(tgtNum) && !regTmpl.test(tgtTmplName)) {
        this.setState({validMsg: "Invalid target toll-free number/template name"})
        return
      }

      // configs parameter for calling lock api
      let body = {
        custRecAction: custRecAction,
        overWriteTGT: 'Y',
        srcNum: srcNum,
        srcEffDtTm: srcEffDtTm,
        tgtEffDtTm: tgtEffDtTm,
        custRecCompPart: custRecCompPart
      }

      if (regNum.test(tgtNum)) {
        body.tgtNum = tgtNum
      } else {
        body.tgtTmplName = tgtTmplName
      }

      // calls lock api
      let res = await this.props.callApi2(RestApi.lockCadRec, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})
      if (res.ok && res.data) {
        if ((res.data.copyStatus && res.data.copyStatus.isAllowed === 'Y')
          || (res.data.disconnectStatus && res.data.disconnectStatus.isAllowed === 'Y')) {

          await this.setState({srcRecVersionId: this.state.recVersionId, lockParam: body})

          // if the copy from cad to tad
          if (regTmpl.test(tgtTmplName)) {

            let params = { tmplName: tgtTmplName, roId: this.props.somos.selectRo, isUserAct: false }
            let resTmplQuery = await this.props.callApi2(RestApi.queryTmplRec, params)  // get template info
            if (resTmplQuery.ok && resTmplQuery.data) {

              let data = resTmplQuery.data
              if (data.errList && data.errList[0].errCode === "540001") { // Record does not exist

                // if not select CPR, remove the CPR data
                if (!this.state.portionCPR) {
                  this.initCPRData()
                }

                // if not select LAD, remove the LAD data
                if (!this.state.portionLAD) {
                  this.initLADGrids()
                }

                this.gotoTADPage(gConst.CADTOTADTYPE_NEW)
                return

              } else if (data.lstEffDtTms && data.lstEffDtTms.length > 0) {

                // find the template record before than target date time
                let i = data.lstEffDtTms.length - 1
                for (; i >= 0; i++) {
                  let el = data.lstEffDtTms[i]
                  if (el.effDtTm <= tgtEffDtTm) {
                    break
                  }
                }

                // retrieve the template record with template name and effective date time
                let tmplEffDtTm = data.lstEffDtTms[i].effDtTm.replace(/\-/g, "").replace(":", "")
                params = { tmplName: tgtTmplName, effDtTm: tmplEffDtTm, roId: this.props.somos.selectRo }
                let resTmpl = await this.props.callApi2(RestApi.retrieveTmplRec, params)
                if (resTmpl.ok && resTmpl.data) {

                  let data = resTmpl.data
                  await this.setState({tgtRetrieveData: data})

                  let bOverwrite = false

                  if (data.effDtTm === this.state.lockParam.tgtEffDtTm) {

                    // if cpr data of target template record exits, should overwrite.
                    if (this.state.portionCPR && data.cprSectName && data.cprSectName.length)
                      bOverwrite = true

                    // if lad data of target template record exits, should overwrite.
                    if (this.state.portionLAD && data.lbl && data.lbl.length)
                      bOverwrite = true

                  }

                  if (bOverwrite) {
                    // asks the user if will overwrite.
                    this.setState({overwriteModalVisible: true})

                  } else {  // if no overwrite
                    this.gotoTADPage(gConst.CADTOTADTYPE_EXIST)
                  }
                }
              }
            }
            return
          }

          let utcTgtEffDtTm = body.tgtEffDtTm
          if (utcTgtEffDtTm === "NOW")
            utcTgtEffDtTm = gFunc.getUTCString(new Date())

          // if create record
          if (body.srcNum !== body.tgtNum) {
            await this.retrieveNumForTgtNum(body.tgtEffDtTm)
            return
          }

          let nextUtcEffDtTm = ""
          let index = this.state.effDtTmStatList.indexOf(this.state.effDtTmStat)
          if (index + 1 < this.state.effDtTmStatList.length)
            nextUtcEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStatList[index + 1])

          // if target date time is future than current record date time, no need to retrieve
          let utcEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)
          if (utcEffDtTm < utcTgtEffDtTm) {

            // if next effective date time is selected, retrieve next.
            if (nextUtcEffDtTm === utcTgtEffDtTm) {
              await this.retrieveNumForTgtNum(nextUtcEffDtTm)
              return
            }

            if (!this.state.portionCPR) // if no select for the CPR, initialize the CPR
              this.initCPRData()

            if (!this.state.portionLAD) // if no select for the LAD, initialize the LAD
              this.initLADGrids()

          } else { // if target date time is before than current record date time, should retrieve the before record.
            let effDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStatList[index - 1])
            await this.retrieveNumForTgtNum(effDtTm)
            return
          }

          let effDtTmStat = "NOW"
          if (body.tgtEffDtTm != "NOW")
            effDtTmStat = gFunc.fromUTCStrToCTStr(body.tgtEffDtTm)
          let effDtTmStatList = [effDtTmStat]

          this.setState({
            effDtTmStatList: effDtTmStatList,
            effDtTmStat: effDtTmStat,
            num: body.tgtNum
          })

          this.finishCpyTrnsfrOp()

          return
        }
      }

      if (res.data.errList) {
        this.setState({validMsg: gFunc.synthesisErrMsg(res.data.errList)})
      } else if (res.data.copyStatus && res.data.copyStatus.statusMessages !== null) {
        this.setState({validMsg: gFunc.synthesisErrMsg(res.data.copyStatus.statusMessages)})
      } else if (res.data.disconnectStatus && res.data.disconnectStatus.statusMessages !== null) {
        this.setState({validMsg: gFunc.synthesisErrMsg(res.data.disconnectStatus.statusMessages)})
      }
    }

    /**
     * retrieve target record that is set on the copy modal or transfer modal
     * effDtTm : effective date time to retrieve
     */
    retrieveNumForTgtNum = (effDtTm) => {

      let params = { num: this.state.lockParam.tgtNum, effDtTm: effDtTm.replace(/[-|:]/g, ''), isUserAct: false }
      console.log("retrieveNumForTgtNum: " + params.num + ", " + params.effDtTm)

      this.props.callApi2(RestApi.retrieveCadRec, params).then(res => {
        if (res.ok && res.data && (res.data.errList === undefined || res.data.errList === null)) {

          let data = res.data
          this.setState({tgtRetrieveData: data})

          let bOverwrite = false

          if (res.data.effDtTm === this.state.lockParam.tgtEffDtTm) {

            // if cpr data of target record exits, should overwrite.
            if (this.state.portionCPR && data.cprSectName && data.cprSectName.length)
              bOverwrite = true

            // if lad data of target record exits, should overwrite.
            if (this.state.portionLAD && data.lbl && data.lbl.length)
              bOverwrite = true

          }

          if (bOverwrite) {
            // asks the user if will overwrite.
            this.setState({overwriteModalVisible: true})

          } else {  // if no overwrite
            this.migrateSurAndTgtCad()
          }

          return
        }

        // if no result, create new record
        this.createNewCadRecBasedOnSource()

      })
    }

    /**
     * create new record based on source record
     */
    createNewCadRecBasedOnSource = () => {

      let effDtTmStat = "NOW"
      if (this.state.lockParam.tgtEffDtTm != "NOW")
        effDtTmStat = gFunc.fromUTCStrToCTStr(this.state.lockParam.tgtEffDtTm)
      let effDtTmStatList = [effDtTmStat]

      // if not selected CPR, init CPR data
      if (!this.state.portionCPR) {
        this.initCPRData()
      }

      // if not selected LAD, init LAD data
      if (!this.state.portionLAD) {
        this.initLADGrids()
      }

      let retrieveCardTitle = "Create a New Customer Record: " + this.state.lockParam.tgtNum

      this.setState({
        effDtTmStatList: effDtTmStatList,
        effDtTmStat: effDtTmStat,
        num: this.state.lockParam.tgtNum,
        retrieveCardTitle: retrieveCardTitle,
      })

      this.finishCpyTrnsfrOp()
    }

    /**
     * migrate the source record and target record.
     */
    migrateSurAndTgtCad = async () => {
      let srcState = this.state

      // retrieve the target record data
      await this.reflectDataOnPage(this.state.lockParam.tgtNum, this.state.tgtRetrieveData)

      let effDtTmStat = "NOW"
      if (this.state.lockParam.tgtEffDtTm != "NOW")
        effDtTmStat = gFunc.fromUTCStrToCTStr(this.state.lockParam.tgtEffDtTm)
      let effDtTmStatList = [effDtTmStat]
      this.setState({
        effDtTmStat: effDtTmStat,
        effDtTmStatList: effDtTmStatList
      })

      // if target effective date time is different from retrieved effective date time
      // that means we should take only CR data from retrieved record and take CPR or LAD from original record.
      if (this.state.lockParam.tgtEffDtTm !== this.state.tgtRetrieveData.effDtTm) {

        // for the cpr data,
        if (!this.state.portionCPR) {
          this.initCPRData() // initialize the cpr data because no selection for CPR
        }

        // for the lad data,
        if (!this.state.portionLAD) {
          this.initLADGrids() // initialize the LAD data because no selection for LAD
        }
      }

      // for the cpr data,
      if (this.state.portionCPR) {
        this.overwriteCPRData(srcState) // overwrite the data
      }

      // for the lad data,
      if (this.state.portionLAD) {
        this.overwriteLADData(srcState) // overwrite the data
      }

      this.finishCpyTrnsfrOp()
    }

    /**
     * this function is called when the copy or transfer operation is finished.
     */
    finishCpyTrnsfrOp = () => {

      let action = gConst.ACTION_TRANSFER
      let message = gConst.TRANSFER_PENDING_MSG
      switch (this.state.lockParam.custRecAction) {
        case gConst.ACTION_COPY:
          action = gConst.ACTION_COPY
          message = gConst.COPY_PENDING_MSG
          break
        case gConst.ACTION_TRANSFER:
          action = gConst.ACTION_TRANSFER
          message = gConst.TRANSFER_PENDING_MSG
          break
        case gConst.ACTION_DISCONNECT:
          action = gConst.ACTION_DISCONNECT
          message = gConst.DISCONNECT_PENDING_MSG
          break
      }

      this.setState({
        bEffDtTmDisable: true,

        disable: false,

        bEditEnable: false,
        bCopyEnable: false,
        bTransferEnable: false,
        bDeleteEnable: false,

        bSubmitEnable: true,
        bSaveEnable: true,
        bRevertEnable: false,

        action: action,
        message: message,

        finishCpyTrnsfrOp: {}
      })

      this.hideCopyModal()
      this.hideTransferModal()

      NotificationManager.success("", message)

    }

    /**
     * calls copy record request
     * @param cmd
     */
    copyCustomerRecord = async (cmd) => {

      let body = this.getCopyRequestBody(cmd)

      let res = await this.props.callApi2(RestApi.copyCadRec, {'body': JSON.stringify(body), roId: this.state.respOrg, 'timeout': timeout})
      if (res.ok && res.data) {

        let data = res.data
        if (data.recVersionId != undefined && data.recVersionId != null) {
          this.setState({recVersionId: data.recVersionId})
        }

        // if there is any error
        let errList = data.errList
        if (errList != undefined && errList != null) {

          let message = gFunc.synthesisErrMsg(errList)
          // error, but able to retrieve
          if (data.recVersionId != null && data.effDtTm != null) {
            if (await this.retrieveCustomerRecord(body.tgtNum, data.effDtTm)) {
              if (errList[0].errLvl === "ERROR") {
                NotificationManager.error("", message)

              } else {
                NotificationManager.warning("", message)
              }

              this.setState({message: message})
            }

          } else {

            this.setState({message: message})

            if (errList[0].errLvl === "ERROR") {
              NotificationManager.error("", message)
              return false

            } else {
              NotificationManager.warning("", message)
            }
          }

        } else {

          // no error, update successful
          if (await this.retrieveCustomerRecord(body.tgtNum, res.data.effDtTm)) {
            NotificationManager.success("", CAD_COPY_SUCCESSFUL)
            this.setState({message: CAD_COPY_SUCCESSFUL, action: gConst.ACTION_NONE})
          }
        }

      } else if (res.data != undefined) {

        // if there is any error
        let errList = res.data.errList
        if (errList != undefined && errList != null) {

          let message = gFunc.synthesisErrMsg(errList)
          this.setState({message: message})
          NotificationManager.error("", message)

          return false
        }
      }

      return true
    }

    /**
     * this function is called at clicking Transfer button on the transfer modal
     */
    checkValidForTransferring = async () => {
      if (!this.state.copyNow && this.state.tgtEffDtTm === '') {
        this.setState({validMsg: "Please input effective date/time"})
        return
      }

      let srcNum = this.state.srcNum.replace(/\-/g, "")
      let tgtNum = this.state.tgtNum.replace(/\-/g, "")
      let tgtTmplName = this.state.tgtNum

      // gets source date time
      let srcEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)

      // gets target date time
      let tgtEffDtTm = "NOW"
      if (!this.state.copyNow) {
        tgtEffDtTm = gFunc.fromCTTimeToUTCStr(new Date(this.state.tgtEffDtTm))
      }

      // configs component part
      let custRecCompPart = ''
      if (this.state.portionEntire) {   // entire components
        custRecCompPart = "CAD"
        if (!this.state.noLAD) {
          custRecCompPart += ", LAD"
        }
        if (!this.state.noCPR) {
          custRecCompPart += ", CPR"
        }

      } else {                        // individual components (CPR or LAD or CPR, LAD)
        if (this.state.portionLAD) {
          custRecCompPart += (custRecCompPart == '') ? '' : ', '
          custRecCompPart += "LAD"
        }
        if (this.state.portionCPR) {
          custRecCompPart += (custRecCompPart == '') ? '' : ', '
          custRecCompPart += "CPR"
        }
      }

      let regNum = gConst.TFNUM_REG_EXP
      let regTmpl = gConst.TMPLNAME_REG_EXP
      if (!regNum.test(tgtNum) && !regTmpl.test(tgtTmplName)) {
        this.setState({validMsg: "Invalid target toll-free number/template name"})
        return
      }

      // configs parameter for calling lock api
      let body = {
        custRecAction: gConst.ACTION_TRANSFER,
        overWriteTGT: 'Y',
        srcNum: this.state.srcNum,
        srcEffDtTm: srcEffDtTm,
        tgtEffDtTm: tgtEffDtTm,
        custRecCompPart: custRecCompPart
      }

      if (regNum.test(tgtNum)) {
        body.tgtNum = tgtNum
      } else {
        body.tgtTmplName = tgtTmplName
      }

      // calls lock api
      let res = await this.props.callApi2(RestApi.lockCadRec, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})
      if (res.ok && res.data) {
        if (res.data.transferStatus.isAllowed === 'Y') {

          await this.setState({srcRecVersionId: this.state.recVersionId, lockParam: body})

          // if the copy from cad to tad
          if (regTmpl.test(tgtTmplName)) {

            let params = { tmplName: tgtTmplName, roId: this.props.somos.selectRo, isUserAct: false }
            let resTmplQuery = await this.props.callApi2(RestApi.queryTmplRec, params)  // get template info
            if (resTmplQuery.ok && resTmplQuery.data) {

              let data = resTmplQuery.data
              if (data.errList && data.errList[0].errCode === "540001") { // Record does not exist

                this.gotoTADPage(gConst.CADTOTADTYPE_NEW)
                return

              } else if (data.lstEffDtTms && data.lstEffDtTms.length > 0) {

                // find the template record before than target date time
                let i = data.lstEffDtTms.length - 1
                for (; i >= 0; i++) {
                  let el = data.lstEffDtTms[i]
                  if (el.effDtTm <= tgtEffDtTm) {
                    break
                  }
                }

                // retrieve the template record with template name and effective date time
                let tmplEffDtTm = data.lstEffDtTms[i].effDtTm.replace(/\-/g, "").replace(":", "")
                params = { tmplName: tgtTmplName, effDtTm: tmplEffDtTm, roId: this.props.somos.selectRo }
                let resTmpl = await this.props.callApi2(RestApi.retrieveTmplRec, params)
                if (resTmpl.ok && resTmpl.data) {

                  let data = resTmpl.data
                  await this.setState({tgtRetrieveData: data})

                  let bOverwrite = false

                  if (data.effDtTm === this.state.lockParam.tgtEffDtTm) {

                    // if cpr data of target template record exits, should overwrite.
                    if (this.state.portionCPR && data.cprSectName && data.cprSectName.length)
                      bOverwrite = true

                    // if lad data of target template record exits, should overwrite.
                    if (this.state.portionLAD && data.lbl && data.lbl.length)
                      bOverwrite = true

                  }

                  if (bOverwrite) {
                    // asks the user if will overwrite.
                    this.setState({overwriteModalVisible: true})

                  } else {  // if no overwrite
                    this.gotoTADPage(gConst.CADTOTADTYPE_EXIST)
                  }
                }
              }
            }
            return
          }

          if (!this.state.portionEntire) {

            let utcTgtEffDtTm = body.tgtEffDtTm
            if (utcTgtEffDtTm === "NOW")
              utcTgtEffDtTm = gFunc.getUTCString(new Date())

            let nextUtcEffDtTm = ""
            let index = this.state.effDtTmStatList.indexOf(this.state.effDtTmStat)
            if (index + 1 < this.state.effDtTmStatList.length)
              nextUtcEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStatList[index + 1])

            // if target date time is future than current record date time, no need to retrieve
            let utcEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)
            if (utcEffDtTm < utcTgtEffDtTm) {

              // if next effective date time is selected, retrieve next.
              if (nextUtcEffDtTm === utcTgtEffDtTm) {
                await this.retrieveNumForTgtNum(nextUtcEffDtTm)
                return
              }

              if (!this.state.portionCPR) // if no select for the CPR, initialize the CPR
                this.initCPRData()

              if (!this.state.portionLAD) // if no select for the LAD, initialize the LAD
                this.initLADGrids()

            } else { // if target date time is before than current record date time, should retrieve the before record.
              let effDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStatList[index - 1])
              await this.retrieveNumForTgtNum(effDtTm)
              return
            }
          }

          let effDtTmStat = "NOW"
          if (body.tgtEffDtTm != "NOW")
            effDtTmStat = gFunc.fromUTCStrToCTStr(body.tgtEffDtTm)
          let effDtTmStatList = [effDtTmStat]

          this.setState({
            effDtTmStatList: effDtTmStatList,
            effDtTmStat: effDtTmStat,
            num: body.tgtNum,
            endIntDtTm: "",
            // endIntDtTm: this.getDateValAfter60days(tgtEffDtTm)
          })

          this.finishCpyTrnsfrOp()
          return
        }
      }

      if (res.data.errList) {
        this.setState({validMsg: gFunc.synthesisErrMsg(res.data.errList)})
      } else if (res.data.transferStatus && res.data.transferStatus.statusMessages !== null) {
        this.setState({validMsg: gFunc.synthesisErrMsg(res.data.transferStatus.statusMessages)})
      }

    }

    /**
     * calls transfer record request
     * @returns {Promise<void>}
     */
    transferCustomerRecord = async (cmd) => {

      let body = this.getTransferRequestBody(cmd)

      let res = await this.props.callApi2(RestApi.transferCadRec, {'body': JSON.stringify(body), roId: this.state.respOrg, 'timeout': timeout})
      if (res.ok && res.data) {

        let data = res.data
        if (data.recVersionId != undefined && data.recVersionId != null) {
          this.setState({recVersionId: data.recVersionId})
        }

        // if there is any error
        let errList = data.errList
        if (errList != undefined && errList != null) {

          let message = gFunc.synthesisErrMsg(errList)
          // error, but able to retrieve
          if (data.recVersionId != null && data.effDtTm != null) {
            if (await this.retrieveCustomerRecord(body.tgtNum, data.effDtTm)) {
              if (errList[0].errLvl === "ERROR") {
                NotificationManager.error("", message)

              } else {
                NotificationManager.warning("", message)
              }

              this.setState({message: message})
            }

          } else {

            this.setState({message: message})

            if (errList[0].errLvl === "ERROR") {
              NotificationManager.error("", message)
              return false

            } else {
              NotificationManager.warning("", message)
            }
          }

        } else {

          // no error, update successful
          if (await this.retrieveCustomerRecord(body.tgtNum, res.data.effDtTm)) {
            NotificationManager.success("", CAD_TRANSFER_SUCCESSFUL)
            this.setState({message: CAD_TRANSFER_SUCCESSFUL, action: gConst.ACTION_NONE})
          }
        }

      } else if (res.data != undefined) {

        // if there is any error
        let errList = res.data.errList
        if (errList != undefined && errList != null) {

          let message = gFunc.synthesisErrMsg(errList)
          this.setState({message: message})
          NotificationManager.error("", message)

          return false
        }
      }

      return true
    }

    /**
     * this function is called at clicking Convert button on the convert modal
     */
    checkValidForConverting = async () => {

      // gets the template name
      if (this.state.tgtTmplName === '') {
        this.setState({validMsg: 'Please input template name'})
        return
      }

      // gets target date time
      let tgtEffDtTm = "NOW"
      if (!this.state.copyNow) {
        if (this.state.tgtEffDtTm === '') {
          this.setState({validMsg: 'Please input effective date/time'})
          return
        }
        tgtEffDtTm = gFunc.fromCTTimeToUTCStr(new Date(this.state.tgtEffDtTm))
      }


      for (let effDtTmStat of this.state.effDtTmStatList) {
        let utcEffDtTm = this.fromEffDtTmStatToUTCStr(effDtTmStat)
        if (utcEffDtTm === tgtEffDtTm) {
          this.toggleOverwriteTarget()
          return
        }
      }

      this.convertCustomerRecord()
    }

    /**
     * convert the pointer record to the customer record
     */
    convertCustomerRecord = async () => {

      // gets target date time
      let tgtEffDtTm = "NOW"
      if (!this.state.copyNow) {
        tgtEffDtTm = gFunc.fromCTTimeToUTCStr(new Date(this.state.tgtEffDtTm))
      }

      // configs parameter for calling lock api
      let body = {
        recVersionId: this.state.recVersionId,
        numList: [this.state.srcNum],
        srcEffDtTm: gFunc.fromCTStrToUTCStr(this.state.srcEffDtTm),
        tgtEffDtTm: tgtEffDtTm,
        tmplName: this.state.tgtTmplName,
      }

      // calls lock api
      let res = await this.props.callApi2(RestApi.convertCadRec, {'body': JSON.stringify(body), roId: this.state.respOrg, 'timeout': timeout})
      if (res.ok && res.data && res.data.effDtTm) {
        this.gotoPTRPage(this.state.srcNum, res.data.effDtTm)
        return
      }

      if (res.data.errList) {
        this.setState({validMsg: gFunc.synthesisErrMsg(res.data.errList)})
      }
    }

    /**
     * calls disconnect record request
     * @returns {Promise<void>}
     */
    disconnectCustomerRecord = async (cmd) => {

      let body = this.getDisconnectRequestBody(cmd)

      let res = await this.props.callApi2(RestApi.disconnectCadRec, {'body': JSON.stringify(body), roId: this.state.respOrg, 'timeout': timeout})
      if (res.ok && res.data) {

        let data = res.data
        if (data.recVersionId != undefined && data.recVersionId != null) {
          this.setState({recVersionId: data.recVersionId})
        }

        // if there is any error
        let errList = data.errList
        if (errList != undefined && errList != null) {

          let message = gFunc.synthesisErrMsg(errList)
          // error, but able to retrieve
          if (data.recVersionId != null && data.effDtTm != null) {
            if (await this.retrieveCustomerRecord(body.tgtNum, data.effDtTm)) {
              if (errList[0].errLvl === "ERROR") {
                NotificationManager.error("", message)

              } else {
                NotificationManager.warning("", message)
              }

              this.setState({message: message})
            }

          } else {

            this.setState({message: message})

            if (errList[0].errLvl === "ERROR") {
              NotificationManager.error("", message)
              return false

            } else {
              NotificationManager.warning("", message)
            }
          }

        } else {

          // no error, update successful
          if (await this.retrieveCustomerRecord(body.tgtNum, res.data.effDtTm)) {
            NotificationManager.success("", CAD_DISCONNECT_SUCCESSFUL)
            this.setState({message: CAD_DISCONNECT_SUCCESSFUL, action: gConst.ACTION_NONE})
          }
        }

      } else if (res.data != undefined) {

        // if there is any error
        let errList = res.data.errList
        if (errList != undefined && errList != null) {

          let message = gFunc.synthesisErrMsg(errList)
          this.setState({message: message})
          NotificationManager.error("", message)

          return false
        }
      }

      return true
    }

    /**
     *  calls delete record request
     * @returns {Promise<void>}
     */
    deleteCustomerRecord = async () => {
      this.toggleDelete()

      let utcEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)  // YYYY-MM-DDTHH:mmZ

      let params = { num: this.state.num, effDtTm: utcEffDtTm, recVersionId: this.state.recVersionId }
      this.props.callApi2(RestApi.deleteCadRec, params).then(res => {
        if (res.ok && res.data) {
          if (res.data.errList == undefined || res.data.errList == null) {
            NotificationManager.success("", CAD_DELETE_SUCCESSFUL)
            this.setState({message: ''})

            if (this.state.effDtTmStatList.length == 1) { // only one record, goes to initial state of page
              this.cancelAction()
            } else { // if next record exists, shows next record, else shows previous record

              this.clearAllData()

              // gets index
              let index = this.state.effDtTmStatList.indexOf(this.state.effDtTmStat)

              let effDtTmStatList = [...this.state.effDtTmStatList]
              effDtTmStatList.splice(index, 1)
              effDtTmStatList.splice(0, 0, "SELECT")

              this.setState({
                effDtTmStatList,
                effDtTmStat: "SELECT",
                bEditEnable: false,
                bCopyEnable: false,
                bTransferEnable: false,
                bDeleteEnable: false,
                bSubmitEnable: false,
                bSaveEnable: false,
                bRevertEnable: false,
                bCancelEnable: true,
              })
            }

            return
          }
        }

        if (res.data && res.data.errList) {

          let message = gFunc.synthesisErrMsg(res.data.errList)
          this.setState({message: message})
          NotificationManager.error("", message)
        }
      })
    }

    /**
     * get label list from grid like lata, nxx, state, 6-digit ...
     * @param lblList: already configured label list
     * @param lblType: type of grid label, for example if the grid is lata then LT, if the grid is 6-digit then SD
     * @param grid: lata or nxx or state or ...
     */
    getLabelDataFromGrid = (lblData, lblType, grid) => {

      let lbl = {lblType: lblType, lblName: '', lblVals: []}
      let bFirstLblName = true

      for (let row of grid) {
        let i = 0
        for (let cellVal of Object.values(row)) {
          if (cellVal === undefined || cellVal === '') {
            i++
            continue
          }

          if (i === 0) {  // if label name
            if (!bFirstLblName) {
              lblData.lblList.push(Object.assign({}, lbl))
            }
            lbl.lblName = cellVal
            lbl.lblVals = []

            bFirstLblName = false

          } else {
            lbl.lblVals.push(cellVal)
          }

          i++
        }
      }

      if (lbl.lblVals.length)
        lblData.lblList.push(Object.assign({}, lbl)) // push the last item
    }

    /**
     * get label data from grids
     * @returns {Array}
     */
    getLabelData = () => {
      let lblData = {lblList: []}
      this.getLabelDataFromGrid(lblData, gConst.LBL_TYPE_AC, this.state.gridArea)
      this.getLabelDataFromGrid(lblData, gConst.LBL_TYPE_DT, this.state.gridDate)
      this.getLabelDataFromGrid(lblData, gConst.LBL_TYPE_LT, this.state.gridLATA)
      this.getLabelDataFromGrid(lblData, gConst.LBL_TYPE_NX, this.state.gridNXX)
      this.getLabelDataFromGrid(lblData, gConst.LBL_TYPE_ST, this.state.gridState)
      this.getLabelDataFromGrid(lblData, gConst.LBL_TYPE_TE, this.state.gridTel)
      this.getLabelDataFromGrid(lblData, gConst.LBL_TYPE_TI, this.state.gridTime)
      this.getLabelDataFromGrid(lblData, gConst.LBL_TYPE_TD, this.state.gridTD)
      this.getLabelDataFromGrid(lblData, gConst.LBL_TYPE_SD, this.state.gridSD)

      return lblData.lblList
    }

    /**
     * get cpr section content
     * @returns {Array}
     */
    getCprSect = () => {
      let cprSect = []

      // check if there are all blank cpr data
      let blank = true
      for (let grid of this.state.cprGridData) {
        for (let row of grid) {
          for (let cell of row) {
            if (cell != null && cell !== "") {
              blank = false
              break
            }
          }

          if (!blank) break
        }

        if (!blank) break
      }

      if (blank === true) {
        return cprSect
      }

      for (let index = 0; index < this.state.cprSectNames.length; index++) {

        let name = this.state.cprSectNames[index]

        // config node seq and nodes
        let gridData = JSON.parse(JSON.stringify(this.state.cprGridData[index]))

        let nodeSeq = [...this.state.cprGridCategory[index]]
        let colIndex = nodeSeq.length - 1
        while (colIndex >= 0) {
          if (nodeSeq[colIndex] === undefined || nodeSeq[colIndex] === '') {
            nodeSeq.splice(colIndex, 1)
            for (let i = 0; i < gridData.length; i++)
              gridData[i].splice(colIndex, 1)
          }
          colIndex--
        }

        // config nodes
        let nodes = []
        for (let i = 0; i < gridData.length; i++) {
          let row = gridData[i]
          if (row.join("") === '') continue

          for (let j = 0; j < row.length; j++) {
            let cell = row[j]

            let values = []
            if (cell !== undefined && cell != null && cell !== "")
              values.push(cell)

            let node = {rowIndex: i + 1, colIndex: j + 1, values: values}
            nodes.push(node)
          }
        }

        let cprItem = {name: name, nodeSeq: nodeSeq, nodes: nodes}
        cprSect.push(cprItem)
      }


      return cprSect
    }

    /**
     * get the content of common request
     * @param cmd
     * @returns {{notes: *, aos, tmplDesc: *, conTel: (string|*), conName: (string|*), cmd: *, numTermLine: *, tmZn: (string|*), dayLightSavings: string, priority: string}}
     */
    getCommonRequestBody = (cmd) => {

      let cprSectName = this.getCprSect()
      let lblList = this.getLabelData()

      let priIntraLT = this.state.priIntraLT
      let priInterLT = this.state.priInterLT

      let intraLATACarrier = []
      if (this.state.intraLATACarrier !== '') {
        intraLATACarrier = this.state.intraLATACarrier.replace(/\ /g, "").split(",")
      }

      let interLATACarrier = []
      if (this.state.interLATACarrier !== '') {
        interLATACarrier = this.state.interLATACarrier.replace(/\ /g, "").split(",")
      }

      let aos = {}
      let aosNet = this.state.network
      if (aosNet != '')
        aos.aosNet = aosNet.replace(/\ /g, "").split(",")
      else
        aos.aosNet = []

      let aosState = this.state.state
      if (aosState != '')
        aos.aosState = aosState.replace(/\ /g, "").split(",")
      else
        aos.aosState = []

      let aosNPA = this.state.npa
      if (aosNPA != '')
        aos.aosNPA = aosNPA.replace(/\ /g, "").split(",")
      else
        aos.aosNPA = []

      let aosLATA = this.state.lata
      if (aosLATA != '')
        aos.aosLATA = aosLATA.replace(/\ /g, "").split(",")
      else
        aos.aosLATA = []

      let aosLbl = this.state.label
      if (aosLbl != '')
        aos.aosLbl = aosLbl.replace(/\ /g, "").split(",")
      else
        aos.aosLbl = []

      let destNums = []
      for (let el of this.state.destNums) {
        if (el.destNum === '' && el.numTermLine === '' && el.localServOff === '' && el.forServOff === '') {
          continue
        }

        let destNum = {}
        if (el.destNum !== '')           destNum.destNum = el.destNum.replace(/\-/g, "")
        if (el.numTermLine !== '')       destNum.numTermLine = el.numTermLine
        if (el.localServOff !== '')      destNum.localServOff = el.localServOff
        if (el.forServOff !== '')        destNum.forServOff = el.forServOff

        destNums.push(destNum)
      }

      let body = {
        cmd: cmd,

        priority: this.state.priority ? 'Y' : 'N',
        telco: this.state.telco,
        hldIndFlag: this.state.hold,

        destNums: destNums,

        aos: aos,

        dayLightSavings: this.state.dayLightSaving ? 'Y' : 'N',
      }

      // if (this.state.customerId !== '')
      //   body.onAccCust = this.state.customerId
      //
      // if (this.state.agent !== '')
      //   body.agent = this.state.agent

      if (this.state.endSub !== '')
        body.endSub = this.state.endSub

      if (this.state.endSubAddr !== '')
        body.endSubAddr = this.state.endSubAddr

      if (this.state.svcOrderNum !== '')
        body.svcOrderNum = this.state.svcOrderNum

      if (this.state.suppFormNum !== '')
        body.suppFormNum = this.state.suppFormNum

      if (this.state.contactName !== '')
        body.conName = this.state.contactName

      if (this.state.contactNumber !== '')
        body.conTel = this.state.contactNumber.replace(/\-/g, "")

      if (this.state.notes !== '')
        body.notes = this.state.notes

      if (intraLATACarrier.length)
        body.intraLATACarrier = intraLATACarrier
      else
        body.intraLATACarrier = []

      if (interLATACarrier.length)
        body.interLATACarrier = interLATACarrier
      else
        body.interLATACarrier = []

      if (cprSectName.length)
        body.cprSectName = cprSectName
      else
        body.cprSectName = []

      if (lblList.length)
        body.lbl = lblList
      else
        body.lbl = []

      if (priIntraLT != null && priIntraLT !== '')
        body.priIntraLT = priIntraLT

      if (priInterLT != null && priInterLT !== '')
        body.priInterLT = priInterLT

      if (this.state.timezone != null && this.state.timezone != '')
        body.tmZn = this.state.timezone

      return body
    }

    /**
     * get the content of create request
     */
    getCreateRequestBody = (cmd) => {

      let body = this.getCommonRequestBody(cmd)

      body.num = this.state.num

      let effDtTm = "NOW"
      if (!this.state.createNow)
        effDtTm = gFunc.fromCTTimeToUTCStr(new Date(this.state.createEffDtTm))
      body.effDtTm = effDtTm

      body.newRespOrgId = this.state.respOrg

      return body
    }

    /**
     * get the content of update request
     */
    getUpdateRequestBody = (cmd) => {

      let body = this.getCommonRequestBody(cmd)

      body.num = this.state.num
      body.effDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)
      if (this.state.endIntDtTm !== '')
        body.endInterceptDt = gFunc.fromTimeValueToUTCDateStr(new Date(this.state.endIntDtTm))
      if (this.state.referral !== '')
        body.referral = this.state.referral
      body.recVersionId = this.state.recVersionId

      return body
    }

    /**
     * get the content of transfer request
     */
    getTransferRequestBody = (cmd) => {

      let body = this.getCommonRequestBody(cmd)

      body.srcNum = this.state.srcNum
      body.srcEffDtTm = gFunc.fromCTStrToUTCStr(this.state.srcEffDtTm)
      body.srcRecVersionId = this.state.srcRecVersionId

      body.tgtNum = this.state.num
      if (this.state.effDtTmStat == "NOW")
        body.tgtEffDtTm = "NOW"
      else
        body.tgtEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)
      body.tgtRecVersionId = this.state.recVersionId

      if (this.state.endIntDtTm !== '')
        body.endInterceptDt = gFunc.fromTimeValueToUTCDateStr(new Date(this.state.endIntDtTm))
      if (this.state.referral !== '')
        body.referral = this.state.referral

      body.custRecCompPart = this.state.lockParam.custRecCompPart
      body.overWriteTGT = 'Y'

      return body
    }

    /**
     * get the content of copy request
     */
    getCopyRequestBody = (cmd) => {

      console.log("cpr grid data: " + this.state.cprGridData)

      let body = this.getCommonRequestBody(cmd)

      body.srcNum = this.state.srcNum
      body.srcEffDtTm = gFunc.fromCTStrToUTCStr(this.state.srcEffDtTm)
      body.srcRecVersionId = this.state.srcRecVersionId

      body.tgtNum = this.state.num
      if (this.state.effDtTmStat == "NOW")
        body.tgtEffDtTm = "NOW"
      else
        body.tgtEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)
      body.tgtRecVersionId = this.state.recVersionId

      // configs component part
      body.custRecCompPart = this.state.lockParam.custRecCompPart
      body.overWriteTGT = 'Y'

      return body
    }

    /**
     * get the content of disconnect request
     */
    getDisconnectRequestBody = (cmd) => {

      let body = this.getCommonRequestBody(cmd)

      body.srcNum = this.state.srcNum
      body.srcEffDtTm = gFunc.fromCTStrToUTCStr(this.state.srcEffDtTm)
      body.srcRecVersionId = this.state.srcRecVersionId

      body.tgtNum = this.state.num
      if (this.state.effDtTmStat == "NOW")
        body.tgtEffDtTm = "NOW"
      else
        body.tgtEffDtTm = this.fromEffDtTmStatToUTCStr(this.state.effDtTmStat)

      if (this.state.endIntDtTm !== '')
        body.endInterceptDt = gFunc.fromTimeValueToUTCDateStr(new Date(this.state.endIntDtTm))
      if (this.state.referral !== '')
        body.referral = this.state.referral

      // configs component part
      let custRecCompPart = ''
      if (this.state.portionCR) {   // entire components
        custRecCompPart = "CAD"
      }

      if (this.state.portionLAD) {
        custRecCompPart += (custRecCompPart == '') ? '' : ', '
        custRecCompPart += "LAD"
      }

      if (this.state.portionCPR) {
        custRecCompPart += (custRecCompPart == '') ? '' : ', '
        custRecCompPart += "CPR"
      }

      body.custRecCompPart = custRecCompPart
      body.overWriteTGT = 'Y'

      return body
    }

    /**
     * This function is called at clicking Yes on the create record modal.
     * @returns {Promise<boolean>}
     */
    createAction = async () => {

      // lock the number
      let body = { custRecAction: gConst.ACTION_ALL, srcNum: this.state.searchNum.replace(/-/g, ""), custRecCompPart: "CAD" }
      let res = await this.props.callApi2(RestApi.lockCadRec, {'body': JSON.stringify(body), roId: this.props.somos.selectRo, 'timeout': timeout})
      if (res.ok && res.data && res.data.createStatus) {
        if (res.data.createStatus.isAllowed === 'N') {

          this.setState({bRetrieveEnable: true, createModalVisible: false})
          if (res.data.createStatus.statusMessages)
            NotificationManager.error("", res.data.createStatus.statusMessages[0].errMsg)

          return
        }

        // if (res.data.errList && res.dat)
      }

      let retrieveCardTitle = "Create a New Customer Record: " + gFunc.formattedNumber(this.state.searchNum)
      this.setState({
        action:                   gConst.ACTION_CREATE,
        disable:                  false,
        num:                 this.state.searchNum.replace(/-/g, ""),
        retrieveCardTitle:        retrieveCardTitle,
        bRetrieveCardIconHidden:  true,
        bResultHeaderHidden:        true,
        bExpRetrieve:             false,
        bExpResult:               true,

        bEditEnable:              false,
        bCopyEnable:              false,
        bTransferEnable:          false,
        bDeleteEnable:            false,
      })

      this.clearAllData();
      this.toggleCreateModal();

      // get user information from the server and set the mail.
      this.props.callApi2(RestApi.userInfo, {}).then(res => {
        if (res.ok && res.data) {
          this.setState({ contactName: res.data.profile.contactName, contactNumber: gFunc.formattedNumber(res.data.profile.contactNumber) })
        }
      })
    };

    /**
     * cancel record admin data
     * @returns {Promise<boolean>}
     */
    cancelAction = async () => {
      console.log("cancelAction: "+ this.state.action)

      await this.unlockCustomerRecord()
      await this.setState(this.initialState);
      await this.setState({searchNum: '', searchEffDtTm: '', cancelModalVisible: false})

      $('#searchNum').focus()
    };

    /**
     *
     */
    actionOverwrite = () => {
      this.toggleOverwrite()

      if (this.state.tgtRetrieveData.tmplId) {
        this.gotoTADPage(gConst.CADTOTADTYPE_EXIST)
      } else {
        this.migrateSurAndTgtCad()
      }
    }

    /**
     *
     */
    actionOverwriteTarget = () => {
      this.toggleOverwriteTarget()
      this.convertCustomerRecord()
    }

    /**
     *
     * @param date
     */
    copyDate = (date) => {
      this.setState({tgtEffDtTm: date});
    };

    /**
     *
     * @param date
     */
    transferDate = (date) => {
      this.setState({tgtEffDtTm: date});
    };

    /**
     *
     * @param event
     */
    handleOnCR = async (event) => {
      let state = {}
      state[event.target.name] = event.target.value
      state['bContentModified'] = true
      await this.setState(state);


      this.checkDataExistForCR()
    };

    /**
     *
     * @returns {Promise<void>}
     */
    handleEndIntDtTm = async (date) => {
      await this.setState({endIntDtTm: date, bContentModified: true})

      this.checkDataExistForCR()
    }

    /**
     *
     * @param event
     */
    handleDestSel = async (event) => {
      let nameArr = event.target.name.split("_")
      let index= nameArr[1]

      let selDest = [...this.state.selDest]
      if (event.target.checked)
        selDest[index] = true
      else
        selDest[index] = false

      let bNoSelDest = true
      for (let sel of selDest) {
        if (sel) {
          bNoSelDest = false
          break
        }
      }

      await this.setState({selDest, bNoSelDest: bNoSelDest});
    };
    /**
     *
     * @param event
     */
    handleDestNums = async (event) => {
      let nameArr = event.target.name.split("_")
      let name = nameArr[0]
      let index= nameArr[1]

      let destNums = [...this.state.destNums]
      destNums[index][name] = event.target.value

      this.setState({bContentModified: true, destNums});

      this.checkDataExistForCR()
    };

    /**
     *
     * @param event
     * @returns {Promise<void>}
     */
    handleContactNumber = async (event) => {
      let state = {}
      state[event.target.name] = gFunc.formattedNumber(event.target.value)
      state['bContentModified'] = true
      this.setState(state);

      // this.checkDataExistForCR()
    }

    /**
     *
     * @param event
     */
    handleOnCPR = async (event) => {
      let state = {}
      state[event.target.name] = event.target.value
      state['bContentModified'] = true
      await this.setState(state);

      this.checkDataExistForCPR()
    };

    /**
     *
     * @param event
     */
    handleOnModal = (event) => {
      let state = {}
      state[event.target.name] = event.target.value
      this.setState(state);
    };

    /**
     *
     * @param event
     */
    handleUppercase = async (event) => {
      const input = event.target;
      const start = input.selectionStart;
      const end = input.selectionEnd;

      let state = {}
      state[input.name] = input.value.toUpperCase()

      if (input.name != "searchNum") {
        state['bContentModified'] = true
      }
      await this.setState(state, ()=>input.setSelectionRange(start, end));
      this.checkDataExistForCR()
    };

    /**
     * this function is called when the inter lata carrier or intra lata carrier is changed.
     * @param event
     */
    handleCarrier = async (event) => {
      const input = event.target;
      const start = input.selectionStart;
      const end = input.selectionEnd;

      let state = {}
      let value = input.value.toUpperCase()
      state[input.name] = value

      let carriers = []
      let temp = value.replace(/\ /g, "").split(",")
      for (let carrier of temp) {
        if (gConst.CARRIER_LIST.indexOf(carrier) !== -1)
          carriers.push(carrier)
      }
      if (input.name === 'interLATACarrier')
        this.setState({iec_array: this.getMergedCarriers(carriers)})
      else if (input.name === 'intraLATACarrier')
        this.setState({iac_array: this.getMergedCarriers(carriers)})

      state['bContentModified'] = true
      await this.setState(state, ()=>input.setSelectionRange(start, end));
      this.checkDataExistForCR()
    };

    /**
     * this function is called when the inter lata carrier or intra lata carrier is changed.
     * @param event
     * @returns {Promise<void>}
     */
    handleCarrierSelect = async (event) => {
      let state = {}
      let value = event.target.value.toUpperCase()
      state[event.target.name] = value

      state['bContentModified'] = true
      await this.setState(state);
      this.checkDataExistForCR()
    }

    /**
     *
     * @param event
     */
    handleUppercaseOnModal = (event) => {
      const input = event.target;
      const start = input.selectionStart;
      const end = input.selectionEnd;

      let state = {}
      state[input.name] = input.value.toUpperCase()

      this.setState(state, ()=>input.setSelectionRange(start, end));
    };

    /**
     *
     */
    hideCopyModal = () => {
      this.setState({
        copyModalVisible: false,
      });
    };

    /**
     *
     */
    hideConvertModal = () => {
      this.setState({
        convertModalVisible: false,
      });
    };

    /**
     * this function is called at clicking Yes or No on the Modified Data Copy Modal
     * @param bIncluding: if true, including modified data
     *                    if false, non including modified data
     */
    // hideMdfDtCpyModal = async (bIncluding) => {
    //   await this.setState({mdfDtCpyModalVisible: false})
    //
    //   if (!bIncluding)
    //     this.state = this.lastActionState
    //
    //   this.retrieveNumForTgtNum()
    // }

    /**
     *
     */
    toggleCancel = () => {
      this.setState({cancelModalVisible: !this.state.cancelModalVisible});
    };

    /**
     *
     */
    toggleOverwrite = () => {
      this.setState({overwriteModalVisible: !this.state.overwriteModalVisible})
    }

    /**
     *
     */
    toggleOverwriteTarget = () => {
      this.setState({overwriteTargetModalVisible: !this.state.overwriteTargetModalVisible})
    }

    /**
     *
     */
    toggleCreateModal = () => {
      this.setState({createModalVisible: !this.state.createModalVisible});
    };

    /**
     *
     */
    hideModifiedModal = () => {
      this.setState({modifiedModalVisible: false});
    };

    /**
     *
     */
    toggleDelete = () => {
      this.setState({deleteModalVisible: !this.state.deleteModalVisible})
    };

    /**
     *
     */
    reflectChoiceList = async (selects) => {
      let selList = selects.split(",")

      switch (this.state.choiceModalHeaderTitle) {
        case AOS_NETWORK_MODAL_HEADER_TITLE:
          this.setState({network: selects})
          break

        case AOS_STATE_MODAL_HEADER_TITLE:
          this.setState({state: selects})
          break

        case AOS_LATA_MODAL_HEADER_TITLE:
          this.setState({lata: selects})
          break

        case IAC_MODAL_HEADER_TITLE:
          this.setState({intraLATACarrier: selects, iac_array: this.getMergedCarriers(selList)})
          if (selList.indexOf(this.state.priIntraLT) == -1) {
            this.setState({priIntraLT: ''})
          }
          break

        case IEC_MODAL_HEADER_TITLE:
          this.setState({interLATACarrier: selects, iec_array: this.getMergedCarriers(selList)})
          if (selList.indexOf(this.state.priInterLT) == -1) {
            this.setState({priInterLT: ''})
          }
          break
      }

      await this.setState({bContentModified: true})

      this.checkDataExistForCR()

      this.hideChoiceModal()
    }

    /**
     *
     */
    hideChoiceModal = () => {
      this.setState({choiceModalVisible: false})
    }

    /**
     *
     */
    reflectNPAChoiceList = async () => {
      let npas = this.state.npaChecked.join(",")
      await this.setState({npa: npas, bContentModified: true})
      this.checkDataExistForCR()
      this.hideAOSNPAChoiceModal()
    }

    /**
     *
     */
    hideAOSNPAChoiceModal = () => {
      this.setState({npaChoiceModalVisible: false});
    };

    /**
     * this is called at clicking the Add Row on the Destination panel
     */
    onAddDestination = () => {
      let destNum = {
        destNum: '',
        numTermLine: '',
        localServOff: '',
        forServOff: ''
      }
      let destNums = [...this.state.destNums]
      destNums.push(destNum)
      this.setState({destNums})

    }

    /**
     * this is called at clicking the Remove Row on the Destination panel
     */
    onRemoveDestination = async () => {
      let destNums = [...this.state.destNums]
      let selDest = [...this.state.selDest]

      // remove the selected elements
      for (let i = selDest.length - 1; i >= 0; i--) {
        if (selDest[i]) {
          selDest.splice(i, 1)
          destNums.splice(i, 1)
        }
      }

      // if all deleted, add empty element
      if (selDest.length === 0) {
        let destNum = {
          destNum: '',
          numTermLine: '',
          localServOff: '',
          forServOff: ''
        }
        destNums.push(destNum)
        selDest.push(false)
      }

      await this.setState({destNums, selDest, bNoSelDest: true})
      this.checkDataExistForCR()
    }


    /**
     * This is called at changing for the choice on the choice modal
     * @param ev
     */
    onChangeChoiceChecked = (ev) => {
      console.log("target.name: " + ev.target.id)
      let index = ev.target.id.split("_")[1]
      let choiceList = [...this.state.choiceList]
      choiceList[index] = !choiceList[index]
      this.setState({choiceList})
    }

    /**
     *
     */
    onSelectAosNetwork = () => {
      let choiceList = []
      if (this.state.network !== '')
        choiceList = this.state.network.replace(/\ /g, "").split(",")

      this.setState({
        choiceModalVisible: true,
        choiceModalHeaderTitle: AOS_NETWORK_MODAL_HEADER_TITLE,
        choiceModalList: gConst.AOS_NETWORK_LIST,
        choiceList: choiceList
      })
    }

    /**
     *
     */
    onClearAosNetwork = async () => {
      await this.setState({network: '', bContentModified: true})
      this.checkDataExistForCR()
    }

    /**
     *
     */
    onSelectAosState = () => {
      let choiceList = []
      if (this.state.state !== '')
        choiceList = this.state.state.replace(/\ /g, "").split(",")

      this.setState({
        choiceModalVisible: true,
        choiceModalHeaderTitle: AOS_STATE_MODAL_HEADER_TITLE,
        choiceModalList: gConst.AOS_STATE_LIST,
        choiceList: choiceList
      })

    }

    /**
     *
     */
    onClearAosState = async () => {
      await this.setState({state: '', bContentModified: true})
      this.checkDataExistForCR()
    }

    /**
     *
     */
    onSelectAosNPA = () => {

      // config state-npa list
      let npaChoiceModalList = []
      gConst.AOS_STATE_LIST.map((state, index) => {
        let stateNPA = {label: state, value: state, children: []}

        let npaList = gConst.AOS_NPA_LIST[index].split(",")
        npaList.map((npa) => {
          let npaLeaf = {label: npa, value: npa}
          stateNPA.children.push(npaLeaf)
        })

        npaChoiceModalList.push(stateNPA)
      })

      // get checked list
      let npaObject = this.state.npa
      if (typeof this.state.npa == "string") {
        npaObject = this.state.npa.trim().split(",")
      }

      this.setState({npaChoiceModalVisible: true, npaChoiceModalList: npaChoiceModalList, npaChecked: npaObject, npaExpanded: []})
    }

    /**
     *
     */
    onClearAosNPA = async () => {
      await this.setState({npa: '', bContentModified: true})
      this.checkDataExistForCR()
    }

    /**
     *
     */
    onSelectAosLATA = () => {
      let choiceList = []
      if (this.state.lata !== '')
        choiceList = this.state.lata.replace(/\ /g, "").split(",")

      let lataList = gConst.AOS_LATA.split(",")

      this.setState({
        choiceModalVisible: true,
        choiceModalHeaderTitle: AOS_LATA_MODAL_HEADER_TITLE,
        choiceModalList: lataList,
        choiceList: choiceList
      })
    }

    /**
     *
     */
    onClearAosLATA = async () => {
      await this.setState({lata: '', bContentModified: true})
      this.checkDataExistForCR()
    }

    /**
     *
     */
    onSelectAosLabel = () => {
    }

    /**
     *
     */
    onClearAosLabel = async () => {
      await this.setState({label: '', bContentModified: true})
      this.checkDataExistForCR()
    }

    /**
     *
     */
    onSelectIntraLATACarrier = () => {
      let choiceList = []
      if (this.state.intraLATACarrier !== '')
        choiceList = this.state.intraLATACarrier.replace(/\ /g, "").split(",")

      this.setState({
        choiceModalVisible: true,
        choiceModalHeaderTitle: IAC_MODAL_HEADER_TITLE,
        choiceModalList: gConst.CARRIER_LIST,
        choiceList: choiceList
      })

    }

    /**
     *
     */
    onClearIntraLATACarrier = async () => {
      await this.setState({intraLATACarrier: '', iac_array: gConst.DEFAULT_CARRIERS, priIntraLT: ''/*gConst.DEFAULT_CARRIERS[0]*/, bContentModified: true})
      this.checkDataExistForCR()
    }

    /**
     *
     */
    onSelectInterLATACarrier = () => {
      let choiceList = []
      if (this.state.interLATACarrier !== '')
        choiceList = this.state.interLATACarrier.replace(/\ /g, "").split(",")

      this.setState({
        choiceModalVisible: true,
        choiceModalHeaderTitle: IEC_MODAL_HEADER_TITLE,
        choiceModalList: gConst.CARRIER_LIST,
        choiceList: choiceList
      })

    }

    /**
     *
     */
    onClearInterLATACarrier = async () => {
      await this.setState({interLATACarrier: '', iec_array: gConst.DEFAULT_CARRIERS, priInterLT: ''/*gConst.DEFAULT_CARRIERS[0]*/, bContentModified: true})
      this.checkDataExistForCR()
    }

    /**
     *
     */
    hideTransferModal = () => {
      this.setState({
        transferModalVisible: false,
      })
    };

    /**
     *
     * @param event
     */
    handleCheckOnCR = async (event) => {
      let state = {};
      state[event.target.name] = event.target.checked;
      state['bContentModified'] = true
      await this.setState(state);

      this.checkDataExistForCR()
    };

    /**
     *
     * @param event
     */
    handleCheckOnCPR = async (event) => {
      let state = {};
      state[event.target.name] = event.target.checked;
      state['bContentModified'] = true
      await this.setState(state);

      this.checkDataExistForCPR()
    };

    /**
     *
     * @param event
     */
    handleCheckOnModal = async (event) => {
      let state = {};
      state[event.target.name] = event.target.checked;
      let targetName = event.target.name

      if (targetName === "portionEntire") {

        if (this.state.status !== gConst.STAT_FAILED && this.state.status !== gConst.STAT_INVALID && !this.state.transferModalVisible)
          state["portionCR"] = event.target.checked

        if (!this.state.noCPR)
          state["portionCPR"] = event.target.checked

        if (!this.state.noLAD)
          state["portionLAD"] = event.target.checked

        state["bCheckCREnable"] = !event.target.checked
        state["bCheckCPREnable"] = !event.target.checked
        state["bCheckLADEnable"] = !event.target.checked
      }
      await this.setState(state);

      if (targetName !== "portionEntire") {
        if (this.state.portionCR && this.state.portionCPR && this.state.portionLAD) {
          this.setState({
            portionEntire: true,
            bCheckCREnable: false,
            bCheckCPREnable: false,
            bCheckLADEnable: false,
          })
        }
      }
    };

    /************************************************************** CPR functions ***************************************************************/

    /**
     *
     * @param tab
     */
    toggleCPRTab = (tab) => {
      this.state.activeCPRTab !== tab && this.setState({activeCPRTab: tab});
    };

    /**
     *
     */
    toggleCprDelete = () => {
      this.setState({cprDeleteModalVisible: !this.state.cprDeleteModalVisible})
    }

    /**
     *
     */
    toggleCprSectName = () => {
      this.setState({cprSectNameModalVisible: !this.state.cprSectNameModalVisible})
    }

    /**
     *
     */
    toggleCprDelSect = () => {
      this.setState({cprDelSectModalVisible: !this.state.cprDelSectModalVisible})
    }

    /**
     * initialize CPR tab
     */
    deleteCpr = () => {
      this.initCPRData()
      this.toggleCprDelete()
    }

    /**
     * this is called at clicking Yes button on the Setting CPR section modal
     */
    setCprSectName = async () => {

      let sectNameCount = this.state.cprSectNames.length

      // validation check
      // check if M is started for only one section
      if ((this.state.cprSectNameModalBtnName == CPR_SECT_NAME_ADD_BUTTON && sectNameCount == 0)
            || (this.state.cprSectNameModalBtnName == CPR_SECT_NAME_SET_BUTTON && sectNameCount == 1)) {

        let reg = /^[M][a-zA-Z%#]{1,6}$/
        if (!reg.test(this.state.cprSectSettingName)) {
          this.setState({
            cprSectNameErr: true,
            cprSectNameErrMsg: "Must start with 'M' (denoting Main section), followed by up to 7 alphanumeric characters and may include % or #."
          })
          return
        }
      } else {  // check if M or S is started

        let reg = /^[M|S][a-zA-Z%#]{1,6}$/
        if (!reg.test(this.state.cprSectSettingName)) {
          this.setState({
            cprSectNameErr: true,
            cprSectNameErrMsg: "Must start with 'M' (denoting Main section) or 'S' (denoting Sub section), followed by up to 7 alphanumeric characters and may include % or #."
          })
          return
        }
      }

      let cprSectNames = [...this.state.cprSectNames]
      let cprSectSettingName = this.state.cprSectSettingName

      // check duplicating.
      let dupSectName = cprSectNames.find(function (element) {
        return element == cprSectSettingName;
      })
      if ((this.state.cprSectNameModalBtnName == CPR_SECT_NAME_ADD_BUTTON && dupSectName != null)
          || (this.state.cprSectNameModalBtnName == CPR_SECT_NAME_ADD_BUTTON && dupSectName != null && dupSectName.length > 1)) {
        this.setState({cprSectNameErr: true, cprSectNameErrMsg: "The section name already exists. Please input another name."})
        return
      }

      if (this.state.cprSectNameModalBtnName == CPR_SECT_NAME_SET_BUTTON) { // edit
        let index = this.state.activeCPRTab

        cprSectNames[index] = cprSectSettingName
        await this.setState({cprSectNames, bContentModified: true})

      } else if (this.state.cprSectNameModalBtnName == CPR_SECT_NAME_ADD_BUTTON) { // add


        let cprGridCategory = [...this.state.cprGridCategory]
        let cprGridData = [...this.state.cprGridData]
        let cprCurActiveRow = [...this.state.cprCurActiveRow]
        let cprCurActiveCol = [...this.state.cprCurActiveCol]

        if (sectNameCount == 0) {
          cprSectNames.push(cprSectSettingName)
        } else {
          cprSectNames.push(cprSectSettingName)
          cprGridCategory.push(Array(8).fill(''))
          cprGridData.push(Array(INIT_CPR_GRID_LENGTH).fill(Array(8).fill('')))
          cprCurActiveRow.push(gConst.INVALID_ROW)
          cprCurActiveCol.push(gConst.INVALID_COL)
        }

        await this.setState({cprSectNames, cprGridCategory, cprGridData, cprCurActiveRow, cprCurActiveCol, bContentModified: true})

      }
      this.toggleCprSectName()

      this.checkDataExistForCPR()
    }

    /**
     * this is called at clicking Yes button on the deleting CPR section modal
     */
    deleteCprSect = async () => {
      let index = this.state.activeCPRTab
      let cprSectNames = [...this.state.cprSectNames]
      let cprGridCategory = [...this.state.cprGridCategory]
      let cprGridData = [...this.state.cprGridData]
      let cprCurActiveRow = [...this.state.cprCurActiveRow]
      let cprCurActiveCol = [...this.state.cprCurActiveCol]

      cprSectNames.splice(index, 1)
      cprGridCategory.splice(index, 1)
      cprGridData.splice(index, 1)
      cprCurActiveRow.splice(index, 1)
      cprCurActiveCol.splice(index, 1)

      if (cprSectNames.length == index) {
        index--
      }

      await this.setState({
        activeCPRTab: index,
        cprSectNames,
        cprGridCategory,
        cprGridData,
        cprCurActiveRow,
        cprCurActiveCol,
        bContentModified: true,
        message: ''
      })

      this.toggleCprDelSect()

      this.checkDataExistForCPR()
    }

    /**
     * this is called at clicking Edit Section button on the CPR tab
     */
    onEditCprSectName = () => {
      let index = this.state.activeCPRTab

      this.setState({
        cprSectNameModalTitle: 'Edit Section Name',
        cprSectSettingName: this.state.cprSectNames[index],
        cprSectNameModalBtnName: CPR_SECT_NAME_SET_BUTTON,
        cprSectNameErr: false,
        cprSectNameModalVisible: true,
      })
    }

    /**
     * this is called at clicking Add Section button on the CPR tab
     */
    onAddCprSect = () => {
      let settingName = ''
      if (this.state.cprSectNames.length == 0) {
        settingName = 'MAIN'
      }
      this.setState({
        cprSectNameModalTitle: 'Add Section',
        cprSectSettingName: settingName,
        cprSectNameModalBtnName: CPR_SECT_NAME_ADD_BUTTON,
        cprSectNameErr: false,
        cprSectNameModalVisible: true,
      })
    }

    /**
     * this is called at clicking Delete CPR button on the CPR tab
     */
    onDeleteCpr = () => {
      this.setState({cprDeleteModalVisible: true})
    }

    /**
     * this is called at clicking Delete CPR Section button on the CPR tab
     */
    onDeleteCprSect = () => {
      let index = this.state.activeCPRTab
      let curSectName = this.state.cprSectNames[index]

      // if current section name is started with M, check if another section name is started with M
      if (curSectName[0] == 'M') {
        let bAnotherM = false
        for (let i = 0; i < this.state.cprSectNames.length; i++) {
          if (i == index) continue

          if (this.state.cprSectNames[i][0] == 'M') {
            bAnotherM = true
            break
          }
        }

        // if there is no section that the name is started with M
        if (!bAnotherM) {
          NotificationManager.warning("", "The current section can't be deleted because there is no section that is started with M")
          return
        }
      }
      this.setState({cprDelSectModalVisible: true})
    }


    /**
     * insert row before indicated row
     */
    onInsertCPRRowAbove = () => {
      let index = this.state.activeCPRTab
      let cprGridData = [...this.state.cprGridData]
      let cprCurActiveRow = [...this.state.cprCurActiveRow]

      console.log("index: " + index)
      console.log("cprGridData[index]: " + cprGridData[index])

      let activeRow = cprCurActiveRow[index] != gConst.INVALID_ROW ? cprCurActiveRow[index] : 0;
      cprGridData[index].splice(activeRow, 0, Array(cprGridData[index][0].length).fill(""))
      cprCurActiveRow[index] = gConst.INVALID_ROW

      console.log("gridData : " + cprGridData)

      this.setState({cprGridData, cprCurActiveRow, bContentModified: true});
    }

    /**
     * insert row after indicated row
     */
    onInsertCPRRowBelow = () => {
      let index = this.state.activeCPRTab
      let cprGridData = [...this.state.cprGridData]
      let cprCurActiveRow = [...this.state.cprCurActiveRow]

      let activeRow = cprCurActiveRow[index] != gConst.INVALID_ROW ? cprCurActiveRow[index] : cprGridData[index].length;
      let belowRow = activeRow == 0 ? activeRow : activeRow + 1
      cprGridData[index].splice(belowRow, 0, Array(cprGridData[index][0].length).fill(""))
      cprCurActiveRow[index] = gConst.INVALID_ROW

      this.setState({cprGridData, cprCurActiveRow, bContentModified: true});
    }

    /**
     * insert a row to last
     */
    onInsertCPRRowEnd = () => {
      let index = this.state.activeCPRTab
      let cprGridData = [...this.state.cprGridData]
      cprGridData[index] = gFunc.insert_row(cprGridData[index]);
      this.setState({cprGridData, bContentModified: true});
    };

    /**
     * delete last row
     */
    onDeleteCPRRowEnd = () => {
      let index = this.state.activeCPRTab
      let rowLength = this.state.cprGridData[index].length;
      if(rowLength == 1) return false;

      let cprCurActiveCol = [...this.state.cprCurActiveCol]
      let activeCol = cprCurActiveCol[index] == gConst.INVALID_COL ? rowLength - 1 : this.state.cprCurActiveRow[index];
      let cprGridData = [...this.state.cprGridData];
      cprGridData[index].splice(activeCol, 1);
      cprCurActiveCol[index] = gConst.INVALID_COL

      this.setState({cprGridData,  cprCurActiveCol, bContentModified: true});
    };

    /**
     * insert column to left of indicated col
     */
    onInsertCPRColumnBefore = () => {
      let index = this.state.activeCPRTab
      let cprGridData = [...this.state.cprGridData]
      let cprGridCategory = [...this.state.cprGridCategory]
      let cprCurActiveCol = [...this.state.cprCurActiveCol]

      let colLength = cprGridData[index][0].length
      let activeCol = cprCurActiveCol[index] == gConst.INVALID_COL ? 0 : cprCurActiveCol[index];
      activeCol = activeCol < 0 ? 0 : activeCol;

      cprGridData[index][0].splice(activeCol, 0, "");
      if (cprGridData[index].length > 1 && cprGridData[index][1].length == colLength) {
        for (let i = 1; i < cprGridData[index].length; i++) {
          cprGridData[index][i].splice(activeCol, 0, "");
        }
      }
      cprGridCategory[index].splice(activeCol, 0, "");
      cprCurActiveCol[index] = gConst.INVALID_COL

      this.setState({cprGridData, cprGridCategory, cprCurActiveCol, bContentModified: true});
    }

    /**
     * insert column to right of indicated col
     */
    onInsertCPRColumnAfter = () => {
      let index = this.state.activeCPRTab
      let cprGridData = [...this.state.cprGridData]
      let cprGridCategory = [...this.state.cprGridCategory]
      let cprCurActiveCol = [...this.state.cprCurActiveCol]

      let colLength = cprGridData[index][0].length
      let activeCol = cprCurActiveCol[index] == gConst.INVALID_COL ? colLength : cprCurActiveCol[index] + 1

      cprGridData[index][0].splice(activeCol, 0, "")
      if (cprGridData[index].length > 1 && cprGridData[index][1].length == colLength) {
        for (let i = 1; i < cprGridData[index].length; i++) {
          cprGridData[index][i].splice(activeCol, 0, "")
        }
      }
      cprGridCategory[index].splice(activeCol, 0, "")
      cprCurActiveCol[index] = gConst.INVALID_COL

      this.setState({cprGridData, cprGridCategory, cprCurActiveCol, bContentModified: true});
    }

    /**
     * insert a column to last
     */
    onInsertCPRColumnLast = () => {
      let index = this.state.activeCPRTab
      let cprGridData = [...this.state.cprGridData];
      let cprGridCategory = [...this.state.cprGridCategory];

      let colLength = cprGridData[index][0].length;
      let activeCol = cprGridData[index][0].length;

      cprGridData[index][0].splice(activeCol, 0, "");
      if (cprGridData[index].length > 1 && cprGridData[index][1].length == colLength) {
        for (let i = 1; i < cprGridData[index].length; i++) {
          cprGridData[index][i].splice(activeCol, 0, "");
        }
      }

      cprGridCategory[index].splice(activeCol, 0, "");

      this.setState({cprGridData, cprGridCategory, bContentModified: true});
    };

    /**
     * delete active column
     */
    onDeleteCPRColumn = () => {
      let index = this.state.activeCPRTab
      let cprGridCategory = Array.from(this.state.cprGridCategory)
      let cprGridData = Array.from(this.state.cprGridData)
      let cprCurActiveCol = Array.from(this.state.cprCurActiveCol)

      let colLength = cprGridData[index][0].length
      let activeCol = cprCurActiveCol[index] === gConst.INVALID_COL ? colLength - 1  : cprCurActiveCol[index];
      if(colLength === 1) return false;

      console.log("onDeleteCPRColumn Last state: " + JSON.stringify(this.lastActionState.cprGridData))
      console.log("CPRGRID: " + JSON.stringify(cprGridData))

      for (let i = 0; i < cprGridData[index].length; i++) {
        // for (let j = activeCol; j < colLength - 1; j++) {
        //   cprGridData[index][i][j] = cprGridData[index][i][j + 1] !== null ? cprGridData[index][i][j + 1] : ""
        // }
        // cprGridData[index][i].splice(colLength - 1, 1);
        cprGridData[index][i].splice(activeCol, 1);
      }

      // cprGridData[index][0].splice(activeCol, 1);
      // if (cprGridData[index].length > 1 && cprGridData[index][1].length === colLength) {
      //   for (let i = 1; i < cprGridData[index].length; i++) {
      //     cprGridData[index][i].splice(activeCol, 1);
      //   }
      // }

      console.log("CPRGRID: " + JSON.stringify(cprGridData))

      cprGridCategory[index].splice(activeCol, 1);
      cprCurActiveCol[index] = gConst.INVALID_COL

      this.setState({
        cprGridCategory: cprGridCategory,
        cprGridData: cprGridData,
        cprCurActiveCol: cprCurActiveCol,
        bContentModified: true
      });

      console.log("onDeleteCPRColumn Last state: " + JSON.stringify(this.lastActionState.cprGridData))
    };

    /**
     * get copy & paste value
     */
    getCopyPasteValue = (ev) => {
      let cprGridData = [...this.state.cprGridData];
      let [ row, col ] = ev.target.name.split("_");

      let values = ev.target.value.split(" ");
      values.map(items => {
        let item = items.split("\t");
        if(item.length > 1) {
          item.map(cpr => {
            if(!cprGridData[row]) {
              cprGridData.push(Array(8).fill(''));
            }
            cprGridData[row][col] = cpr;
            col++
          })
          row++; col = 0;
        }
      })

      return cprGridData;
    }

    /**
     *
     */
    onCPRFieldFocusOut = () => {
      this.checkDataExistForCPR()
    }

    /**
     * handle value changing
     */
    handleCPRCellChange = async (ev, index) => {

      let cprGridData = [...this.state.cprGridData]

      if(ev.target.value.includes("\t")) {
        cprGridData[index] = this.getCopyPasteValue(ev)
        this.setState({cprGridData});

      } else {
        cprGridData[index] = gFunc.handle_value_cpr(ev, this.state.cprGridData[index])
        this.setState({cprGridData});

      }
      await this.setState({bContentModified: true})

      //this.checkDataExistForCPR() // do not call because no need
    };

    /**
     * handle select change event of CPR grid
     * @param ev: event of component
     * @param index: index of section tab
     */
    handleCPRSelectChange = async (ev, index) => {

      let cprGridCategory = [...this.state.cprGridCategory]
      cprGridCategory[index] = gFunc.handle_change(ev, this.state.cprGridCategory[index])

      await this.setState({cprGridCategory, bContentModified: true});

      // this.checkDataExistForCPR()  // do not call because no need
    };

    /**
     * set active indexes of cpr grid
     * @param index: index of section tab
     * @param row
     * @param cell
     * @returns {Promise<void>}
     */
    setCPRActiveIndexes = async(index, row, cell) => {

      let cprCurActiveRow = [...this.state.cprCurActiveRow]
      let cprCurActiveCol = [...this.state.cprCurActiveCol]

      cprCurActiveRow[index] = row
      cprCurActiveCol[index] = cell

      await this.setState({cprCurActiveRow, cprCurActiveCol})
    }


    /****************************************************************** LAD functions *****************************************************************/

    /**
     *
     * @param tab
     */
    toggleLADTab = (tab) => {
      this.state.activeLADTab !== tab && this.setState({activeLADTab: tab});
    };

    /**
     * update area grid
     * @param grid
     * @returns {Promise<void>}
     */
    updateAreaGrid = async (grid) => {
      await this.setState({gridArea: JSON.parse(JSON.stringify(grid))})
      let bExistData = this.checkDataExistForLADGrid(grid)
      this.setState({
        noGridArea: !bExistData,
        noLAD: !bExistData & this.state.noGridDate & this.state.noGridLATA & this.state.noGridNXX
          & this.state.noGridState & this.state.noGridTel & this.state.noGridTime & this.state.noGridTD & this.state.noGridSD
      })
    }

    /**
     * update date grid
     * @param grid
     * @returns {Promise<void>}
     */
    updateDateGrid = async (grid) => {
      await this.setState({gridDate: JSON.parse(JSON.stringify(grid))})
      let bExistData = this.checkDataExistForLADGrid(grid)
      this.setState({
        noGridDate: !bExistData,
        noLAD: this.state.noGridArea & !bExistData & this.state.noGridLATA & this.state.noGridNXX
          & this.state.noGridState & this.state.noGridTel & this.state.noGridTime & this.state.noGridTD & this.state.noGridSD
      })
    }

    /**
     * update lata grid
     * @param grid
     * @returns {Promise<void>}
     */
    updateLataGrid = async (grid) => {
      await this.setState({gridLATA: JSON.parse(JSON.stringify(grid))})
      let bExistData = this.checkDataExistForLADGrid(grid)
      this.setState({
        noGridLATA: !bExistData,
        noLAD: this.state.noGridArea & this.state.noGridDate & !bExistData & this.state.noGridNXX
          & this.state.noGridState & this.state.noGridTel & this.state.noGridTime & this.state.noGridTD & this.state.noGridSD
      })
    }

    /**
     * update NXX grid
     * @param grid
     * @returns {Promise<void>}
     */
    updateNXXGrid = async (grid) => {
      await this.setState({gridNXX: JSON.parse(JSON.stringify(grid))})
      let bExistData = this.checkDataExistForLADGrid(grid)
      this.setState({
        noGridNXX: !bExistData,
        noLAD: this.state.noGridArea & this.state.noGridDate & this.state.noGridLATA & !bExistData
          & this.state.noGridState & this.state.noGridTel & this.state.noGridTime & this.state.noGridTD & this.state.noGridSD
      })
    }

    /**
     * update state grid
     * @param grid
     * @returns {Promise<void>}
     */
    updateStateGrid = async (grid) => {
      await this.setState({gridState: JSON.parse(JSON.stringify(grid))})
      let bExistData = this.checkDataExistForLADGrid(grid)
      this.setState({
        noGridState: !bExistData,
        noLAD: this.state.noGridArea & this.state.noGridDate & this.state.noGridLATA & this.state.noGridNXX
          & !bExistData & this.state.noGridTel & this.state.noGridTime & this.state.noGridTD & this.state.noGridSD
      })
    }

    /**
     * update tel grid
     * @param grid
     * @returns {Promise<void>}
     */
    updateTelGrid = async (grid) => {
      await this.setState({gridTel: JSON.parse(JSON.stringify(grid))})
      let bExistData = this.checkDataExistForLADGrid(grid)
      this.setState({
        noGridTel: !bExistData,
        noLAD: this.state.noGridArea & this.state.noGridDate & this.state.noGridLATA & this.state.noGridNXX
          & this.state.noGridState & !bExistData & this.state.noGridTime & this.state.noGridTD & this.state.noGridSD
      })
    }

    /**
     * update time grid
     * @param grid
     * @returns {Promise<void>}
     */
    updateTimeGrid = async (grid) => {
      await this.setState({gridTime: JSON.parse(JSON.stringify(grid))})
      let bExistData = this.checkDataExistForLADGrid(grid)
      this.setState({
        noGridTime: !bExistData,
        noLAD: this.state.noGridArea & this.state.noGridDate & this.state.noGridLATA & this.state.noGridNXX
          & this.state.noGridState & this.state.noGridTel & !bExistData & this.state.noGridTD & this.state.noGridSD
      })
    }

    /**
     * update ten digit grid
     * @param grid
     * @returns {Promise<void>}
     */
    updateTDGrid = async (grid) => {
      await this.setState({gridTD: JSON.parse(JSON.stringify(grid))})
      let bExistData = this.checkDataExistForLADGrid(grid)
      this.setState({
        noGridTD: !bExistData,
        noLAD: this.state.noGridArea & this.state.noGridDate & this.state.noGridLATA & this.state.noGridNXX
          & this.state.noGridState & this.state.noGridTel & this.state.noGridTime & !bExistData & this.state.noGridSD
      })
    }

    /**
     * update six digit grid
     * @param grid
     * @returns {Promise<void>}
     */
    updateSDGrid = async (grid) => {
      await this.setState({gridSD: JSON.parse(JSON.stringify(grid))})
      let bExistData = this.checkDataExistForLADGrid(grid)
      this.setState({
        noGridSD: !bExistData,
        noLAD: this.state.noGridArea & this.state.noGridDate & this.state.noGridLATA & this.state.noGridNXX
          & this.state.noGridState & this.state.noGridTel & this.state.noGridTime & this.state.noGridTD & !bExistData
      })
    }

  };
}

export default methodMixin;
