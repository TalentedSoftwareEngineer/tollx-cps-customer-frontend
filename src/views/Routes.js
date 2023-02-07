import React from 'react';
import Privileges from "../constants/Privileges";
import {Redirect} from "react-router-dom";

const Dashboard = React.lazy(()=> import('./Dashboard'));

const NumberSearch = React.lazy(()=> import('./Number_admin/NumberSearch'));
const NumberList = React.lazy(()=> import('./Number_admin/NumberList'));
const ReservationLimit = React.lazy(()=> import('./Number_admin/ReservationLimit'));
const NumberQuery = React.lazy(()=> import('./Number_admin/NumberQuery'));
const NumberStatus = React.lazy(()=> import('./Number_admin/NumberStatus'));
const Trouble = React.lazy(()=> import('./Number_admin/Trouble'));
const OneClick = React.lazy(()=> import('./Number_admin/OneClick'));
const Bulk = React.lazy(()=> import('./Number_admin/Bulk'));
const RNL = React.lazy(() => import('./Number_admin/RNL'));


const CAD = React.lazy(()=> import('./Customer_admin/CustomerData'));
const CustomerSelection = React.lazy(()=> import('./Customer_admin/CustomerSelection'));
const PointerData = React.lazy(()=> import('./Customer_admin/PointerData'));
const CPR = React.lazy(() => import('./Customer_admin/CPR'));
const LAD = React.lazy(() => import('./Customer_admin/LAD'));
const Audit = React.lazy(()=> import('./Customer_admin/Audit'));

const TemplateList = React.lazy(() => import('./Template_admin/TemplateList'));
const TAD = React.lazy(() => import('./Template_admin/TAD'));
const TemplateSelection = React.lazy(()=> import('./Template_admin/TemplateSelection'));

const MRO = React.lazy(() => import('./System_admin/MRO'));
const MNQ = React.lazy(() => import('./System_admin/MNQ'));
const MND = React.lazy(() => import('./System_admin/MND'));
const MSP = React.lazy(() => import('./System_admin/MSP'));
const MCP = React.lazy(() => import('./System_admin/MCP'));
const ARN = React.lazy(() => import('./System_admin/ARN'));

const UserActivity = React.lazy(() => import('./Activity_task/Activity'));
const Tasks = React.lazy(() => import('./Activity_task/TaskTracking'));

const SqlScriptExecutionRecord = React.lazy(() => import('./Sqlscript_execution'));

const RespOrgInfo = React.lazy(() => import('./Resp_org/Information'));

const getRoutes = (privileges) => {
  const result = [
    { path: '/dashboard', exact: true, name: 'Dashboard', component: Dashboard  },
    { path: '/', exact: true, name: 'Home', component: (props) => <Redirect to="/dashboard"/> },
  ];

  // Number Administration Menu
  let route = {path: '/number_admin', exact:true, name:'Number Administration'};
  result.push(route);
  if (privileges.includes(Privileges.NumberSearch)) {
    result.push({ path: '/number_admin/number_search', name: 'Number Search', component: NumberSearch });
    if (!route.component)
      route.component = (props) => <Redirect to="/number_admin/number_search"/>
  }
  if (privileges.includes(Privileges.NumberList)) {
    result.push({ path: '/number_admin/number_list', name: 'Number List', component: NumberList });
    if (!route.component)
      route.component = (props) => <Redirect to="/number_admin/number_list"/>
  }
  if (privileges.includes(Privileges.ReservedNumberList)) {
    result.push({ path: '/number_admin/rnl', name: 'Reserved Number List', component: RNL});
    if (!route.component)
      route.component = (props) => <Redirect to="/number_admin/number_search"/>
  }
  if (privileges.includes(Privileges.NumberQueryUpdate)) {
    result.push({ path: '/number_admin/number_query', name: 'Number Query and Update', component: NumberQuery });
    if (!route.component)
      route.component = (props) => <Redirect to="/number_admin/number_search"/>
  }
  if (privileges.includes(Privileges.NumberStatusChange)) {
    result.push({ path: '/number_admin/number_status', name: 'Number Status Change', component: NumberStatus});
    if (!route.component)
      route.component = (props) => <Redirect to="/number_admin/number_search"/>
  }
  if (privileges.includes(Privileges.OneClickActivate)) {
    result.push({ path: '/number_admin/oneClick', name: 'One Click Activate', component: OneClick});
    if (!route.component)
      route.component = (props) => <Redirect to="/number_admin/number_search"/>
  }
  if (privileges.includes(Privileges.TroubleReferralNumberQuery)) {
    result.push({ path: '/number_admin/trouble', name: 'Trouble Refferral Number Query', component: Trouble});
    if (!route.component)
      route.component = (props) => <Redirect to="/number_admin/number_search"/>
  }
  // if (privileges.includes(Privileges.Bulk)) {
  //   result.push({ path: '/number_admin/bulk', name: 'NumberStatus Request List', component: Bulk });
  //   if (!route.component)
  //     route.component = (props) => <Redirect to="/number_admin/number_search"/>
  // }
  if (!route.component){
    result.pop();
  }

  // Customer Administration Menu
  route = {path: '/customer_admin', exact:true, name:'Customer Administration'};
  result.push(route);
  if (privileges.includes(Privileges.CustomerRecord)) {
    result.push({ path: '/customer_admin/customer_data', name: 'Customer Admin Data', component: CAD });
    if (!route.component)
      route.component = (props) => <Redirect to="/customer_admin/customer_data"/>
  }
  if (privileges.includes(Privileges.CustomerRecord)) {
    result.push({ path: '/customer_admin/LAD', name: 'Label Definition', component: LAD });
    if (!route.component)
      route.component = (props) => <Redirect to="/customer_admin/LAD"/>
  }
  if (privileges.includes(Privileges.CustomerRecord)) {
    result.push({ path: '/customer_admin/CPR', name: 'Call Processing', component: CPR });
    if (!route.component)
      route.component = (props) => <Redirect to="/customer_admin/CPR"/>
  }
  if (privileges.includes(Privileges.PointerRecord)) {
    result.push({ path: '/customer_admin/pointer_data', name: 'Pointer Admin Data', component: PointerData});
    if (!route.component)
      route.component = (props) => <Redirect to="/customer_admin/pointer_data"/>
  }
  if (!route.component){
    result.pop(); // Remove added item again.
  }

  // Template Administration Menu
  route = {path: '/template_admin', exact:true, name:'Template Administration'};
  result.push(route);
  if (privileges.includes(Privileges.TemplateAdminData)) {
    result.push({ path: '/template_admin/template_data', name: 'Template Admin Data', component: TAD});
    if (!route.component)
      route.component = (props) => <Redirect to="/template_admin/template_data"/>
  }
  if (privileges.includes(Privileges.TemplateRecordList)) {
    result.push({ path: '/template_admin/template_list', name: 'Template Record List', component: TemplateList});
    if (!route.component)
      route.component = (props) => <Redirect to="/template_admin/template_list"/>
  }
  if (!route.component){
    result.pop(); // Remove added item again.
  }

  // System Automation Administration Menu
  route = {path: '/system_admin', exact:true, name:'System Automation Administration'};
  result.push(route);
  if (privileges.includes(Privileges.MultiNumberChangeRespOrg)) {
    result.push({ path: '/system_admin/mro', name: 'Multi Dial Number Resp Org Change', component: MRO });
    if (!route.component)
      route.component = (props) => <Redirect to="/system_admin/mro"/>
  }

  if (privileges.includes(Privileges.MultiConversionToPointerRecords)) {
    result.push({ path: '/system_admin/mcp', name: 'Multiple Conversion to Pointer Record', component: MCP });
    if (!route.component)
      route.component = (props) => <Redirect to="/system_admin/mcp"/>
  }

  {
    result.push({ path: '/system_admin/arn', name: 'Auto Reserve Numbers', component: ARN });
    if (!route.component)
      route.component = (props) => <Redirect to="/system_admin/arn"/>
  }

  if (privileges.includes(Privileges.MultiNumberQuery)) {
    result.push({ path: '/system_admin/mnq', name: 'Multi Dial Number Query', component: MNQ });
    if (!route.component)
      route.component = (props) => <Redirect to="/system_admin/mnq"/>
  }

  if (privileges.includes(Privileges.MultiNumberDisconnect)) {
    result.push({ path: '/system_admin/mnd', name: 'Multi Dial Number Disconnect', component: MND });
    if (!route.component)
      route.component = (props) => <Redirect to="/system_admin/mnd"/>
  }

  if (privileges.includes(Privileges.MultiNumberSpare)) {
    result.push({ path: '/system_admin/msp', name: 'Multi Dial Number Spare', component: MSP });
    if (!route.component)
      route.component = (props) => <Redirect to="/system_admin/msp"/>
  }

  if (!route.component){
    result.pop();
  }

  // User Activity And Task Menu
  route = {path: '/activity_task', exact:true, name:'User Activity And Task'};
  result.push(route);
  if (privileges.includes(Privileges.UserActivity)) {
    result.push({ path: '/activity_task/activity', name: 'User Activity', component: UserActivity});
    if (!route.component)
      route.component = (props) => <Redirect to="/activity_task/activity"/>
  }
  if (privileges.includes(Privileges.TaskTracking)) {
    result.push({ path: '/activity_task/task_tracking', name: 'Task Tracking', component: Tasks});
    if (!route.component)
      route.component = (props) => <Redirect to="/activity_task/task_tracking"/>
  }

  if (privileges.includes(Privileges.SqlScriptExecution)) {
    result.push({ path: '/sqlscript_execution', name: 'Sql Script Execution Records', component: SqlScriptExecutionRecord});
    if (!route.component)
      route.component = (props) => <Redirect to="/sqlscript_execution"/>
  }

  route = {path: '/resporg', exact:true, name:'Resp Org Manangement'};
  result.push(route);
  if (privileges.includes(Privileges.RespOrgInfo)) {
    result.push({ path: '/resporg/info', name: 'Resp Org Information', component: RespOrgInfo});
    if (!route.component)
      route.component = (props) => <Redirect to="/resporg/info"/>
  }
  if (!route.component){
    result.pop(); // Remove added item again.
  }

  return result;
};

export default getRoutes;
