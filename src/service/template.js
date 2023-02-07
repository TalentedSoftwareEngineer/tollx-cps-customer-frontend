import {fixed_date, formatInt, get_lad} from "../utils";
import {add_cpr, add_lad} from "./pointer";
import {LBL_TYPE_AC, LBL_TYPE_DT, LBL_TYPE_LT, LBL_TYPE_NX, LBL_TYPE_ST, LBL_TYPE_TE, LBL_TYPE_TI, LBL_TYPE_TD, LBL_TYPE_SD} from "../constants/GlobalConstants";

import numeral from 'numeral';
export const verb = "REQ";
export const id = "XQG01000";
export const ro = "XQG01";
export const timeout = "30";

Array.prototype.isAllEmpty = function () {
  for (let i = 0; i < this.length; i++) {
    if (this[i].length)
      return false;
  }
  return true;
};

/**
 * get messsage for template record
 * @param id
 * @param ro
 * @param template
 * @param sfed
 * @returns {string}
 */
export function getTadMessage(id, ro, template, sfed) {
  let message = "";
  if (sfed === "") {
    message = ':ID=' + id + ',RO=' + ro + ',TMPLTNM="' + template + '",SIZE=N';
  } else {
    sfed = sfed.split(" ");
    message = ':ID=' + id + ',RO=' + ro + ',TMPLTNM="' + template + '",ED="' + sfed[0] + '",ET="' + sfed[1] + '",SIZE=Y';
  }
  return message;
}

/**
 * get message for template record status list
 * @param id
 * @param ro
 * @param template
 * @param sfed
 * @returns {string}
 */
export function getTadStatusListMessage(id, ro, template) {
  let message = ':ID=' + id + ',RO=' + ro + ',TMPLTNM="' + template + '"';
  return message;
}

/**
 * get message for template record list
 * @param id
 * @param ro
 * @param entity
 * @param template
 * @returns {string}
 */
export function getTadListMessage(id, ro, entity, template) {
  let message = ":ID=" + id + ",RO=" + ro;
  if (entity !== "" && template === "") {
    message += ",TREN=" + entity;
  } else if (entity === "" && template !== "") {
    message += ",TREN=XQ,STMPLTNM=\"" + template + "\"";
  } else if (entity !== "" && template !== "") {
    message += ",TREN=" + entity + ",STMPLTNM=\"" + template + '"';
  }
  return message;
}

/**
 * get message for creating the template record
 * @param id
 * @param ro
 * @param action
 * @param target_ro
 * @param template
 * @param date
 * @param iec
 * @param iac
 * @param note
 * @param ncon
 * @param ctel
 * @param albl
 * @param alat
 * @param anet
 * @param asta
 * @param lns
 * @param lads
 * @param types
 * @param datas
 * @param description
 * @returns {string}
 */
export function getNewTadMessage(id, ro, action, target_ro, template, date, iec, iac, note, ncon, ctel, albl, alat, anet, asta, lns, lads, types, datas, description) {
  let message = ':ID=' + id + ',RO=' + ro;
  if (target_ro.trim() === ro || target_ro.length === 0) {
    message += ',AC=' + action + ',TMPLTNM="' + template + '"';
  } else {
    message += ',TRO=' + target_ro + ',AC=' + action + ',TMPLTNM="' + template + '"';
  }

  if (date.toUpperCase().trim() !== "NOW") {
    date = date.split(" ");
    message += ',ED="' + date[0] + '",ET="' + date[1] + '"';
  } else {
    message += ',ED="' + date.trim() + '"';
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
      message += ':IAC="CNT2=' + numeral(iac_leng.length).format('00') + ',' + iac.replace(/\s/g, '') + '"';
    } else {
      message += ':IAC="CNT2=01,' + iac.replace(/\s/g, '') + '"';
    }
  if (description !== "")
    message += ':DESCRIP="' + description + '"';
  if (ncon !== "")
    message += ':NCON="' + ncon.toUpperCase() + '"';
  if (ctel && ctel.length)
    message += ',CTEL=' + ctel;
  if (note && note.length)
    message += ',NOTE="' + note + '"';
  if (albl && albl.length)
    message += ':ALBL="CNT3=01,' + albl + '"';
  if (alat && alat.length)
    message += ':ALAT="CNT5=01,' + alat + '"';
  if (anet && anet.length)
    message += ':ANET="CNT6=01,' + anet + '"';
  if (asta && asta.length)
    message += ':ASTA="CNT7=01,' + asta + '"';
  if (lns && lns.length)
    message += ':LNS=' + lns;

  if (types && datas && datas[0].length) {
    datas = datas.filter( arr => !arr.isAllEmpty());
    let rotated = [];
    if (datas && datas[0]) {
      message += ':NODE="CNT10=' + formatInt(types.length, 3);
      for (let i = 0; i<types.length; i++) {
        message += ',' + types[i];
      }
      for (let i = 0; i < datas[0].length; i++) {
        rotated.push(Array(datas.length).fill(""));
      }
      for (let i = 0; i<datas.length; i++){
        for (let j=0; j<datas[i].length; j++) {
          rotated[j][i] = datas[i][j];
        }
      }
      rotated = rotated.filter( arr => !arr.isAllEmpty());
      message +='":CNT11=' + formatInt(rotated.length, 1);
      for (let i = 0; i < rotated.length; i++) {
        message +=':V="';
        for (let j = 0; j < rotated[i].length; j++ ) {
          if (j === rotated[i].length -1) {
            message += rotated[i][j] + '"';
          } else {
            message += rotated[i][j] + ',';
          }
        }
      }
    }
  }

  if (lads && lads.length) {
    message += ':CNT12=' + lads.length;
    for (let i=0; i<lads.length;i++) {
      let lad = lads[i];
      let def = lad.def;
      message +=':TYPE=' + lad.type + ',LBL="' + lad.label + '",DEF="CNT13=' + formatInt(def.length, 3);
      for (let j = 0; j<lad.def.length; j++) {
        message += ',' + lad.def[j]
      }
      message += '"';
    }
  }

  return message;
}


/**
 * get message for copy template.
 * @param id
 * @param ro
 * @param action
 * @param template
 * @param copy_sfed
 * @param sfed
 * @param iec
 * @param iac
 * @param note
 * @param ncon
 * @param ctel
 * @param albl
 * @param alat
 * @param anet
 * @param asta
 * @param lns
 * @param lads
 * @param types
 * @param datas
 * @param cr
 * @param cpr
 * @param lad
 * @param description
 * @returns {string}
 */
export function getChangeTadMessage(id, ro, action, template, copy_sfed, sfed, iec, iac, note, ncon, ctel, albl, alat, anet, asta, lns, lads, types, datas, cr, cpr, lad, description) {
  let message = ':ID=' + id + ',RO=' + ro + ',AC=' + action + ',TMPLTNM="' + template + '"';
  if (copy_sfed.trim() !== "NOW") {
    let date = copy_sfed.split(" ");
    message += ',ED="' + date[0] + '",ET="' + date[1] + '"';
  } else {
    message += ',ED="' + copy_sfed.trim() + '"';
  }

  if (iec !== "") {
    if (iec.includes(',')) {
      let iec_leng = iec.split(",");
      message += ':IEC="CNT1=0' + iec_leng.length + ',' + iec.replace(/\s/g, '') + '"';
    } else {
      message += ':IEC="CNT1=01,' + iec.replace(/\s/g, '') + '"';
    }
  }

  if (iac !== "") {
    if (iac.includes(',')) {
      let iac_leng = iac.split(",");
      message += ':IAC="CNT2=0' + iac_leng.length + ',' + iac.replace(/\s/g, '') + '"';
    } else {
      message += ':IAC="CNT2=01,' + iac.replace(/\s/g, '') + '"';
    }
  }

  if (cr) {
    if (description && description.length) message += ':DESCRIP="' + description + '"';
    if (ncon && ncon.length) message += ':NCON="' + ncon.toUpperCase() + '"';
    if (ctel && ctel.length) message += ',CTEL=' + ctel;
    if (note && note.length) message += ',NOTE="' + note + '"';
    if (albl && albl.length) message += ':ALBL="CNT3=01,' + albl + '"';
    if (alat && alat.length) message += ':ALAT="CNT5=01,' + alat + '"';
    if (anet && anet.length) message += ':ANET="CNT6=01,' + anet + '"';
    if (asta && asta.length) message += ':ASTA="CNT7=01,' + asta + '"';
    if (lns && lns.length) message += ':LNS=' + lns;
  }

  if (cpr) {
    let cpr_mess = "";
    message += add_cpr(types, datas, cpr_mess);
  }

  if (lad) {
    let lad_mess = "";
    message += add_lad(lads, lad_mess);
  }

  return message;
}

/**
 * get message for transfer template record
 * @param id
 * @param ro
 * @param action
 * @param template
 * @param date
 * @param sfed
 * @param description
 * @param iec
 * @param iac
 * @param note
 * @param ncon
 * @param ctel
 * @param albl
 * @param alat
 * @param anet
 * @param asta
 * @param lns
 * @param lads
 * @param types
 * @param datas
 * @returns {string}
 */
export function getTransferTadMessage(id, ro, action, template, date, sfed, description, iec, iac, note, ncon, ctel, albl, alat, anet, asta, lns, lads, types, datas) {
  let message = ':ID=' + id + ',RO=' + ro + ',AC=' + action + ',TMPLTNM="' + template + '"';
  if (date.trim() !== "NOW") {
    let fix = date.split(" ");
    message += ',ED="' + fix[0] + '",ET="' + fix[1] + '"';
  } else {
    message += ',ED="' + date.trim() + '"';
  }

  if (sfed !== "") {
    sfed = sfed.split(" ");
    message += ',SEFD="' + sfed[0] + sfed[1] + '"';
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
  if (description !== "") message += ':DESCRIP="' + description + '"';
  if (ncon !== "") message += ':NCON="' + ncon + '"';
  if (ctel && ctel.length) message += ',CTEL=' + ctel;
  if (note && note.length) message += ',NOTE="' + note + '"';
  if (albl && albl.length) message += ':ALBL="CNT3=01,' + albl + '"';
  if (alat && alat.length) message += ':ALAT="CNT5=01,' + alat + '"';
  if (anet && anet.length) message += ':ANET="CNT6=01,' + anet + '"';
  if (asta && asta.length) message += ':ASTA="CNT7=01,' + asta + '"';
  if (lns && lns.length) message += ':LNS=' + lns;
  let cpr_mess = "", lad_mess = '';
  message += add_cpr(types, datas, cpr_mess);
  message += add_lad(lads, lad_mess);
  return message;
}

/**
 * get message for deleting template record
 * @param id
 * @param ro
 * @param action
 * @param template
 * @param date
 * @returns {string}
 */
export function getDeleteTadMessage(id, ro, action, template, date) {
  let message = ':ID=' + id + ',RO=' + ro + ',AC=' + action + ',TMPLTNM="' + template + '"';
  let fix = date.split(" ");
  message += ',ED="' + fix[0] + '",ET="' + fix[1] + '"';

  return message;
}

/**
 * get message for disconnecting template record
 * @param id
 * @param ro
 * @param action
 * @param template
 * @param date
 * @param sfed
 * @returns {string}
 */
export function getDisconnectTadMessage(id, ro, action, template, date, sfed) {
  let message = ':ID=' + id + ',RO=' + ro + ',AC=' + action + ',TMPLTNM="' + template + '"';
  if (date.trim() !== "NOW") {
    let fix = date.split(" ");
    message += ',ED="' + fix[0] + '",ET="' + fix[1] + '"';
  } else {
    message += ',ED="' + date.trim() + '"';
  }
  if (sfed !== "") {
    sfed = sfed.split(" ");
    message += ',SEFD="' + sfed[0] + sfed[1] + '"';
  }
  return message;
}

/**
 * check validation for grids
 * @param ac: Area code
 * @param dt: Date
 * @param lt: LATA
 * @param nx: NXX
 * @param st: State
 * @param tl: TEL
 * @param ti: TIME
 * @param td: 10-digit
 * @param sd: 6-digit
 * @returns {Array}
 */
export function validLAD(ac, dt, lt, nx, st, tl, ti, td, sd) {
  let datas = [];
  get_lad(ac, LBL_TYPE_AC, datas);
  get_lad(dt, LBL_TYPE_DT, datas);
  get_lad(lt, LBL_TYPE_LT, datas);
  get_lad(nx, LBL_TYPE_NX, datas);
  get_lad(st, LBL_TYPE_ST, datas);
  get_lad(tl, LBL_TYPE_TE, datas);
  get_lad(ti, LBL_TYPE_TI, datas);
  get_lad(td, LBL_TYPE_TD, datas);
  get_lad(sd, LBL_TYPE_SD, datas);
  return datas;
}

/**
 *
 * @param ac
 * @returns {*}
 */
export function state_value(ac) {
  if (ac === "1") ac = "SAVED";
  else if (ac === "2") ac = "PENDING";
  else if (ac === "3") ac = "SENDING";
  else if (ac === "4") ac = "ACTIVE";
  else if (ac === "5") ac = "OLD";
  else if (ac === "6") ac = "INVALID";
  else if (ac === "7") ac = "DISCONNECT";
  else if (ac === "8") ac = "MUST CHECK";
  else if (ac === "9") ac = "FAILED";
  else if (ac === "10") ac = "HOLD";
  return ac
}

/**
 *
 * @param type
 * @returns {*}
 */
export function approval_type(type) {
  if (type === "OK") type = "APPROVAL";
  else if (type === "AW") type = "AWAIT";
  else if (type === "DN") type = "DENIED";
  else if (type === "NR") type = "NOT REQ";
  else if (type === "RJ") type = "REJECT";
  return type;
}
