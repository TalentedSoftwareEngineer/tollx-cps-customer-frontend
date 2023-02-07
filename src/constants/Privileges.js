// Define privilege
function Privilege(name, displayName) {
  this.name = name;
  this.displayName = displayName;
}

const Privileges = {
  RecordAdmin : "ADMIN_RECORD",           // Customer Record Administration
  CustomerRecord : "CAD",        // Customer Record Admin Data
  PointerRecord : "PAD",         // Pointer Record Admin Data

  TemplateAdmin : "ADMIN_TEMPLATE",
  TemplateAdminData : "TAD",
  TemplateRecordList : "TRL",

  NumberAdmin : "ADMIN_NUMBER",
  NumberSearch : "SEARCH_NUM",
  NumberList : "NUMBER_LIST",
  ReservationLimit : "RESERVATION_LIMIT",
  ReservedNumberList : "RESERVED_NUMBER_LIST",
  NumberQueryUpdate : "NUMBER_QUERY_UPDATE",
  NumberStatusChange : "NUMBER_STATUS_CHANGE",
  TroubleReferralNumberQuery : "TROUBLE_REFFERAL_NUMBER_QUERY",
  OneClickActivate : "ONE_CLICK_ACTIVATE",

  SystemAutomationAdministration : "SYSTEM_AUTOMATION",
  MultiNumberChangeRespOrg : "MULTI_NUMBER_CH_RO",
  MultiNumberQuery : "MNQ",
  MultiNumberDisconnect : "MND",
  MultiNumberSpare : "MSP",
  MultiConversionToPointerRecords : "MULTI_CONVERSION_PR",

  UserActivityAndTask : "ACTIVITY_TASK",
  UserActivity: "USER_ACTIVITY",
  TaskTracking: "TASK_TRACKING",

  SqlScriptExecution: "SQLSCRIPT_EXECUTION",

  RespOrgInfo: "RESP_ORG_INFO",
};

export const DisplayNames = {

  [Privileges.RecordAdmin] : "Customer Record Admin",           // Customer Record Administration
  [Privileges.CustomerRecord] : "CAD",        // Customer Record Admin Data
  [Privileges.PointerRecord] : "PAD",         // Pointer Record Admin Data

  [Privileges.TemplateAdmin] : "Template Record Admin",
  [Privileges.TemplateAdminData] : "TAD",
  [Privileges.TemplateRecordList] : "TRL",

  [Privileges.NumberAdmin] : "Number Admin",
  [Privileges.NumberSearch] : "Search Number",
  [Privileges.NumberList] : "Number List",
  [Privileges.ReservationLimit] : "Reservation Limit",
  [Privileges.ReservedNumberList] : "Reserved Number List",
  [Privileges.NumberQueryUpdate] : "Number Query Update",
  [Privileges.NumberStatusChange] : "Number Status Change",
  [Privileges.TroubleReferralNumberQuery] : "Trouble Referral Number Query",
  [Privileges.OneClickActivate] : "One Click Activate",

  [Privileges.SystemAutomationAdministration] : "System Automation Admin",
  [Privileges.MultiNumberChangeRespOrg] : "MRO",
  [Privileges.MultiNumberQuery] : "MNQ",
  [Privileges.MultiNumberDisconnect] : "MND",
  [Privileges.MultiNumberSpare] : "MSP",
  [Privileges.MultiConversionToPointerRecords] : "MCP",

  [Privileges.UserActivityAndTask] : "User Activity And Task",
  [Privileges.UserActivity] : "User Activity",
  [Privileges.TaskTracking] : "Task Tracking",

  [Privileges.SqlScriptExecution] : "Sql Script Execution Record",

  [Privileges.RespOrgInfo] : "Resp Org Information",
};

export default Privileges;

export const TIMEOUT_VALUE                              = 1000 * 60 * 60 * 4  // session timeout value
export const LAST_ACTIVE_TIME_COOKIE_NAME               = 'LATV'          // last active time value cookie name

export const USER_LEAVE_TIMEOUT_GUESSING_VALUE          = 1000 * 5        // timeout value that is guessed for the user leaving of website
export const LAST_BEFORE_UNLOAD_EVENT_TIME_COOKIE_NAME  = 'LBUETV'        // last before unload event time value cookie name
