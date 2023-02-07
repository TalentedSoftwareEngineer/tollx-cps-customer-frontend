import { formatInt } from "../utils";
import {add_cpr, add_lad} from "./pointer";

export const verb = "REQ";
export const mod = "CRV";
export const id = "XQG01000";
export const ro = "XQG01";
export const timeout = "30";

export function customer_number(id, ro, num, date, time) {
  let message = "";
  if (date === "" && time === "") {
    message += ':ID=' + id + ',RO=' + ro + ',NUM="' + num + '",SIZE=Y';
  } else if (date !== "" && time === "") {
    message += ':ID=' + id + ',RO=' + ro + ',NUM="' + num + '",ED="' + date + '"';
  } else if (date === "" && time !== "") {
    message += ':ID=' + id + ',RO=' + ro + ',NUM="' + num + '",ET="' + time + '"';
  } else if (date !== "" && time !== "") {
    message += ':ID=' + id + ',RO=' + ro + ',NUM="' + num + '",ED="' + date + '",ET="' + time + '"';
  }
  return message
}

export function customer_selection(id, ro, num) {
  return ':ID=' + id + ',RO=' + ro + ',NUM="' + num + '"';
}

export function template_selection(template) {
  return ':ID=' + id + ',RO=' + ro + ',TMPLTPTR="'+ template + '"';
}

export function customer_record(num) {
  return ':ID=' + id + ',RO=' + ro + ',NUM="' + num + '"';
}

export function create_customer_record(id, ro, action, num, ed, iec, iac, abn, dau, dat, dd,
                                       hdd, li, rao, so, sf, note, agent, telco, cus, newro,
                                       la, cbi, ncon, ctel, albl, alat, anet, asta, ln, tel,
                                       city, fso, lns, hml, lsis, lso, sfg, stn, uts,lads, types, datas) {
  if (action === "" || action === null)
    action = "N";
  let message = ':ID='+id+',RO='+ro+',AC='+ action +',NUM="'+num+'"';

  if (ed === "NOW") {
    message += ',ED="' + ed + '"';
  } else {
    let date = ed.split(" ");
    message += ',ED="' + date[0] + '",ET="' + date[1] + '"';
  }
  if (iec !== "")
    if (iec.includes(',')) {
      let iec_leng = iec.split(",");
      message += ':IEC="CNT1=0' + iec_leng.length + ',' + iec.replace(/\s/g, '') + '"';
    } else {
      message += ':IEC="CNT1=01,' + iec.replace(/\s/g, '') + '"';
    }
  if (iac !== "")
    if (iac.includes(',')) {
      let iac_leng = iac.split(",");
      message += ':IAC="CNT2=0' + iac_leng.length + ',' + iac.replace(/\s/g, '') + '"';
    } else {
      message += ':IAC="CNT2=01,' + iac.replace(/\s/g, '') + '"';
    }
  if (abn && abn.length) message += ':ABN="' + abn + '"';
  if (dau && dau.length) message += ',DAU=' + dau;
  if (dat && dat.length) message += ',DAT=' + dat;
  if (dd && dd.length) message += ',DD="' + dd +'"';
  if (hdd && hdd.length) message += ':HDD='+hdd;
  if (li && li.length) message += ',LI="'+li + '"';
  if (rao && rao.length) message += ',RAO="'+rao + '"';
  if (so && so.length) message += ':SO='+ so;
  if (sf && sf.length) message += ',SF="'+sf + '"';
  if (agent && agent.length) message += ',AGENT="'+agent + '"';
  if (telco && telco.length) message += ',TELCO="'+ telco + '"';
  if (cus && cus.length) message += ',CUS="'+ cus + '"';
  if (newro && newro.length && newro !== "XQG01") message += ',NEWRO=' + newro;
  if (la && la.length) message += ',LA="'+ la+ '"';
  if (cbi && cbi.length) message += ',CBI="'+ cbi + '"';
  // if (ncon !== "" && ncon !== "KEELE,RICKY") message += ',NCON="'+ ncon+ '"';
  if (ncon && ncon.length) message += ',NCON="'+ ncon.toUpperCase()+ '"';
  if (ctel && ctel.length) message += ',CTEL='+ ctel;
  if (note && note.length) message += ',NOTE="'+note + '"';
  if (albl && albl.length) message += ':ALBL="CNT3=01,'+ albl+ '"';
  // if (aac !== "") message += ':AAC="CNT4=01,'+ aac + '"';
  if (alat && alat.length) message += ':ALAT="CNT5=01,'+ alat+ '"';
  if (anet && anet.length) message += ':ANET="CNT6=01,'+ anet+ '"';
  if (asta && asta.length) message += ':ASTA="CNT7=01,'+ asta + '"';
  // ln !== "" ? message += ':CNT8=01:LN="'+ ln + '"' : message += ':CNT8=01:LN="No Listing Name Provided"';
  if (ln && ln.length) message += ':CNT8=01:LN="'+ ln + '"';
  if (tel && tel.length) message += ':CNT9=01:TEL="'+ tel+ '"';
  if (city && city.length) message += ',CITY="'+ city+ '"';
  if (fso && fso.length) message += ',FSO="'+ fso+ '"';
  if (lns !== "") message += ',LNS=' + lns;
  if (hml && hml.length) message += ',HML="'+ hml+ '"';
  if (lsis && lsis.length) message += ',LSIS="'+ lsis+ '"';
  if (lso && lso.length) message += ',LSO="'+ lso+ '"';
  if (sfg && sfg.length) message += ',SFG="'+ sfg+ '"';
  if (stn && stn.length) message += ',STN="'+ stn+ '"';
  if (uts && uts.length) message += ',UTS="'+ uts+ '"';
  let cpr_mess = "", lad_mess = '';
  message += add_cpr(types, datas, cpr_mess);
  message += add_lad(lads, lad_mess);

  return message;
}

export function update_customer_record(id, ro, action, num, copy_sfed, iec, iac, abn, dau, dat, dd, hdd, li, rao, so, sf, note, agent, telco, cus, newro, la, cbi, ncon, ctel, albl, alat, anet, asta, ln, tel, city, fso, lns, hml, lsis, lso, sfg, stn, uts,lads, types, datas, cpr, cr, lad) {
  console.log(lns);
  let message = ':ID=' + id + ',RO=' + ro + ',AC=' + action + ',NUM="' + num + '"';
  if (copy_sfed.trim() !== "NOW") {
    let date = copy_sfed.split(" ");
    message += ',ED="' + date[0] + '",ET="' + date[1] + '"';
  } else {
    message += ',ED="' + copy_sfed.trim() + '"';
  }
  if (cr) {
    if (iec !== "")
      if (iec.includes(',')) {
        let iec_leng = iec.split(",");
        message += ':IEC="CNT1=0' + iec_leng.length + ',' + iec.replace(/\s/g, '') + '"';
      } else {
        message += ':IEC="CNT1=01,' + iec.replace(/\s/g, '') + '"';
      }
    if (iac !== "")
      if (iac.includes(',')) {
        let iac_leng = iac.split(",");
        message += ':IAC="CNT2=0' + iac_leng.length + ',' + iac.replace(/\s/g, '') + '"';
      } else {
        message += ':IAC="CNT2=01,' + iac.replace(/\s/g, '') + '"';
      }
    if (abn && abn.length) message += ':ABN="' + abn + '"';
    if (dau && dau.length) message += ',DAU=' + dau;
    if (dat && dat.length) message += ',DAT=' + dat;
    if (dd && dd.length) message += ',DD="' + dd +'"';
    if (hdd && hdd.length) message += ':HDD='+hdd;
    if (li && li.length) message += ',LI="'+li + '"';
    if (rao && rao.length) message += ',RAO="'+rao + '"';
    if (so && so.length) message += ':SO='+ so;
    if (sf && sf.length) message += ',SF="'+sf + '"';
    if (agent && agent.length) message += ',AGENT="'+agent + '"';
    if (telco && telco.length) message += ',TELCO="'+ telco + '"';
    if (cus && cus.length) message += ',CUS="'+ cus + '"';
    if (newro && newro.length && newro !== "XQG01") message += ',NEWRO=' + newro;
    if (la && la.length) message += ',LA="'+ la+ '"';
    if (cbi && cbi.length) message += ',CBI="'+ cbi + '"';
    if (ncon && ncon.length) message += ',NCON="'+ ncon+ '"';
    if (ctel && ctel.length) message += ',CTEL='+ ctel;
    if (note && note.length) message += ',NOTE="'+note + '"';
    if (albl && albl.length) message += ':ALBL="CNT3=01,'+ albl+ '"';
    // if (aac !== "") message += ':AAC="CNT4=01,'+ aac + '"';
    if (alat && alat.length) message += ':ALAT="CNT5=01,'+ alat+ '"';
    if (anet && anet.length) message += ':ANET="CNT6=01,'+ anet+ '"';
    if (asta && asta.length) message += ':ASTA="CNT7=01,'+ asta + '"';
    if (ln && ln.length) message += ':CNT8=01:LN="'+ ln + '"';
    if (tel && tel.length) message += ':CNT9=01:TEL="'+ tel+ '"';
    if (city && city.length) message += ',CITY="'+ city+ '"';
    if (fso && fso.length) message += ',FSO="'+ fso+ '"';
    if (lns !== "") message += ',LNS=' + lns;
    if (hml && hml.length) message += ',HML="'+ hml+ '"';
    if (lsis && lsis.length) message += ',LSIS="'+ lsis+ '"';
    if (lso && lso.length) message += ',LSO="'+ lso+ '"';
    if (sfg && sfg.length) message += ',SFG="'+ sfg+ '"';
    if (stn && stn.length) message += ',STN="'+ stn+ '"';
    if (uts && uts.length) message += ',UTS="'+ uts+ '"';
  }

  if (cpr) {
    let cpr_mess = "";
    message += add_cpr(types, datas, cpr_mess);
  }
  if (lad) {
    let lad_mess = '';
    message += add_lad(lads, lad_mess);
  }
  return message;
}

export function cadToPad(id, ro, date, num, template, src_date) {
  console.log(date);
  let message = ':ID=' + id + ',RO=' + ro + ',AC=C,NUM="' + num + '"';
  if (date.trim() !== "NOW") {
    let dates = date.split(" ");
    message += ',ED="' + dates[0] + '",ET="' + dates[1] + '"';
  } else {
    message += ',ED="' + date.trim() + '"';
  }
  src_date = src_date.split(" ");
  message += ',SEFD="' + src_date[0] + src_date[1] + '",TMPLTPTR="' + template + '"';
  return message;
}

export function padToCad(id, ro, date, num, src_date) {
  let message = ':ID=' + id + ',RO=' + ro + ',AC=C,NUM="' + num + '"';
  if (date.trim() !== "NOW") {
    let dates = date.split(" ");
    message += ',ED="' + dates[0] + '",ET="' + dates[1] + '"';
  } else {
    message += ',ED="' + date.trim() + '"';
  }
  src_date = src_date.split(" ");
  message += ',SEFD="' + src_date[0] + src_date[1] + '"';
  return message;
}

export function transfer(id, ro, sfed, num, date, time) {
  let message = ':ID=' + id + ',RO=' + ro + ',AC=T,NUM="' + num + '"';
  if (sfed.trim() !== "NOW") {
    let date = sfed.split(" ");
    message += ',ED="' + date[0] + '",ET="' + date[1] + '"';
  } else {
    message += ',ED="' + sfed.trim() + '"';
  }
  message += ',SEFD="' + date + time + '"';

  return message;
}

export function deleteCad(id, ro, sfed, num) {
  let message = ':ID=' + id + ',RO=' + ro + ',AC=X,NUM="' + num + '"';
  if (sfed.trim() !== "NOW") {
    let date = sfed.split(" ");
    message += ',ED="' + date[0] + '",ET="' + date[1] + '"';
  } else {
    message += ',ED="' + sfed.trim() + '"';
  }
  return message;
}

export function deletePad(id, ro, sfed, num, template) {
  let message = ':ID=' + id + ',RO=' + ro + ',AC=X,NUM="' + num + '"';
  if (sfed.trim() !== "NOW") {
    let date = sfed.split(" ");
    message += ',ED="' + date[0] + '",ET="' + date[1] + '"';
  } else {
    message += ',ED="' + sfed.trim() + '"';
  }
  message += ',TMPLTPTR="' + template + '"';
  return message;
}

export function transferPad(id, ro, sfed, num, template, date, time) {
  let message = ':ID=' + id + ',RO=' + ro + ',AC=T,NUM="' + num + '"';
  if (sfed.trim() !== "NOW") {
    let date = sfed.split(" ");
    message += ',ED="' + date[0] + '",ET="' + date[1] + '"';
  } else {
    message += ',ED="' + sfed.trim() + '"';
  }
  message += ',SEFD="' + date + time + '",TMPLTPTR="' + template + '"';
  return message;
}

export function disconnect_customer(id, ro, action, num, date, refer, eint) {
  let message = ':ID=' + id + ',RO=' + ro + ',AC=' + action + ',NUM="' + num + '"';
  if (date.toUpperCase().trim() !== "NOW") {
    date = date.split(" ");
    message += ',ED="' + date[0] + '",ET="' + date[1] + '"';
  } else {
    message += ',ED="' + date.trim() + '"';
  }
  message += ',REFER=' + refer + ',EINT="' + eint + '"'
  return message;
}

export function resend_customer(id, ro, action, num, date) {
  let message = ':ID=' + id + ',RO=' + ro + ',AC=' + action + ',NUM="' + num + '"';
  if (date.toUpperCase().trim() !== "NOW") {
    date = date.split(" ");
    message += ',ED="' + date[0] + '",ET="' + date[1] + '"';
  } else {
    message += ',ED="' + date.trim() + '"';
  }
  return message;
}
