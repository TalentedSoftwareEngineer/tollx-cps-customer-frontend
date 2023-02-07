
export const verb = "REQ";

export const mod_reserve = "NSR";

export const mod_customer = "CRC";

export const id = "XQG01000";

export const ro = "XQG01";

export const timeout = "30";

export const ac_r = "R";

export const ac_n = "N";

export function customer_create(id, ro, num, ed, time, ctel, ncon, template, timezone, now, so, lns) {
  console.log(num);

  let message = ':ID=' + id + ',RO=' + ro + ',AC=' + ac_n + ',NUM="' + num;

  if (now) {
    message += '",ED="NOW';

  } else {

    if (ed !== null) {
      let fix_date = ed.split("/");
      ed = fix_date[0] + "/" + fix_date[1] + "/" + fix_date[2].substring(2, 4);
    }

    if (time !== null) {
      if (time.includes("AM")){
        time = time.substring(0, 5) + "A/" + timezone;
      } else {
        time = time.substring(0, 5) + "P/" + timezone;
      }
    }

    message += '",ED="' +ed+ '",ET="' + time;
  }

  message += '",TMPLTPTR="'+ template + '",SO=' + so;

  if (now) {
    message += ':CNT9=01';
  } else {
    message += ':CNT9=001';
  }

  message += ':TEL="' + num + '",LNS=' + lns;

  return message;
}
