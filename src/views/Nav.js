import produce from 'immer';
import Privileges from '../constants/Privileges';
import React from "react";

function MenuItem(name, url, icon, children){
  this.name = name;
  this.url = url;
  if (icon)
    this.icon = icon;
  if (children)
    this.children = children;
}

const CustomerAdmin = new MenuItem('Customer Administration', '/customer_admin');
const CustomerData = new MenuItem('Customer Admin Data', '/customer_admin/customer_data');
const PointerData = new MenuItem('Pointer Admin Data', '/customer_admin/pointer_data');

const TemplateAdmin = new MenuItem('Template Administration', '/template_admin');
const TemplateData = new MenuItem('Template Admin Data', '/template_admin/template_data');
const TemplateList = new MenuItem('Template Record List', '/template_admin/template_list');

const NumberAdmin = new MenuItem('Number Administration', '/number_admin');
const NumberSearch = new MenuItem('Number Search', '/number_admin/number_search');
const ReservationLimit = new MenuItem('Reservation Limit', '/number_admin/reservation_limit');
const RNL = new MenuItem('Reserved Number List', '/number_admin/rnl');
const NumberQuery = new MenuItem('Number Query', '/number_admin/number_query');
const NumberList = new MenuItem('Number List', '/number_admin/number_list');
const NumberStatus = new MenuItem('Number Status', '/number_admin/number_status');
const Trouble = new MenuItem('Trouble Referral Number Query', '/number_admin/trouble');
const OneClick = new MenuItem('One Click Activation', '/number_admin/oneClick');

const systemAdmin = new MenuItem('System Automation Administration', '/system_admin');
const MRO = new MenuItem('Multi Dial Number Resp Org Change', '/system_admin/mro');
const MNQ = new MenuItem('Multi Dial Number Query', '/system_admin/mnq');
const MND = new MenuItem('Multi Dial Number Disconnect', '/system_admin/mnd');
const MSP = new MenuItem('Multi Dial Number Spare', '/system_admin/msp');
const MCP = new MenuItem('Multiple Conversion to Pointer Record', '/system_admin/mcp');
const ARN = new MenuItem('Auto Reserve Numbers', '/system_admin/arn');

const UserActivityAndTask = new MenuItem('User Activity And Task', '/activity_task');
const UserActivity = new MenuItem('User Activity', '/activity_task/activity');
const TaskTracking = new MenuItem('Task Tracking', '/activity_task/task_tracking');

const sqlScriptExecution = new MenuItem('Sql Script Execution Records', '/sqlscript_execution');

const RespOrgManagement = new MenuItem('Resp Org Management', '/resporg');
const RespOrgInfo = new MenuItem('Resp Org Information', '/resporg/info');

const Dashboard =  new MenuItem('Dashboard', '/dashboard');

function menuItems(privileges){
  let result = [];

  //Dashboard
  result.push(Dashboard);

  // Customer Administration Menu
  let item = produce(CustomerAdmin, item => {
    item.url = 'fakeUrl'
    item.children = [];
    if (privileges.includes(Privileges.CustomerRecord)) {
      item.children.push(CustomerData);
    }
    if (privileges.includes(Privileges.PointerRecord)) {
      item.children.push(PointerData);
    }
  });
  if (item.children.length)
    result.push(item);

  // Template Administration Menu
  item = produce(TemplateAdmin, item => {
    item.url = 'fakeUrl'
    item.children = [];
    if (privileges.includes(Privileges.TemplateAdminData)) {
      item.children.push(TemplateData);
    }
    if (privileges.includes(Privileges.TemplateRecordList)) {
      item.children.push(TemplateList);
    }
  });
  if (item.children.length)
    result.push(item);

  // Number Administration Menu
  item = produce(NumberAdmin, item => {
    item.url = 'fakeUrl'
    item.children = [];
    if (privileges.includes(Privileges.NumberSearch))
      item.children.push(NumberSearch);
    if (privileges.includes(Privileges.NumberList))
      item.children.push(NumberList);
    if (privileges.includes(Privileges.ReservedNumberList))
      item.children.push(RNL);
    if (privileges.includes(Privileges.NumberQueryUpdate))
      item.children.push(NumberQuery);
    // if (privileges.includes(Privileges.NumberStatusChange))
    //   item.children.push(NumberStatus);
    if (privileges.includes(Privileges.OneClickActivate))
      item.children.push(OneClick);
    if (privileges.includes(Privileges.TroubleReferralNumberQuery))
      item.children.push(Trouble);
  });
  if (item.children.length)
    result.push(item);

  // System Automation Administration Menu
  item = produce(systemAdmin, item => {
    item.url = 'fakeUrl'
    item.children = [];
    if (privileges.includes(Privileges.MultiNumberQuery))
      item.children.push(MNQ);
    if (privileges.includes(Privileges.MultiNumberDisconnect))
      item.children.push(MND);
    if (privileges.includes(Privileges.MultiNumberSpare))
      item.children.push(MSP);
    if (privileges.includes(Privileges.MultiNumberChangeRespOrg))
      item.children.push(MRO);
    if (privileges.includes(Privileges.MultiConversionToPointerRecords))
      item.children.push(MCP);

    item.children.push(ARN);
  });
  if (item.children.length)
    result.push(item);

  // Resp Org Management Menu
  item = produce(RespOrgManagement, item => {
    item.url = 'fakeUrl'
    item.children = [];
    if (privileges.includes(Privileges.RespOrgInfo))
      item.children.push(RespOrgInfo);
  });
  if (item.children.length)
    result.push(item);

  // User Activity And Task Menu
  item = produce(UserActivityAndTask, item => {
    item.url = 'fakeUrl'
    item.children = [];
    if (privileges.includes(Privileges.UserActivity))
      item.children.push(UserActivity);
    if (privileges.includes(Privileges.TaskTracking))
      item.children.push(TaskTracking);
  });
  if (item.children.length)
    result.push(item);

  if (privileges.includes(Privileges.SqlScriptExecution)) {
    result.push(sqlScriptExecution)
  }

  return {items: result};
}

export default menuItems;
