
export const verb = "REQ";

export const mod = "NSR";

export const ac_s = "S";

export const ac_q = "Q";

export const ac_r = "R";

export const timeout = "30";

export function query_number(id, ro, num) {
  if (num !== "")
    num = num.toUpperCase();

  let message = "";
  if (num !== null) {
    message = ":ID=" + id + ",RO=" + ro + ",AC=" + ac_q + ",NUM=\"" + num + "\"";
  }
  return message
}

export function number_status(id, ro, num, ro_c, ncon, ctel, notes, ru, state, newRo) {
  console.log(state);
  if (ru && ru.length) {
    let fix_date = ru.split("/");
    ru = fix_date[0] + "/" + fix_date[1] + "/" + fix_date[2].substring(2, 4);
  }
  let message = "";
  if (state === "SPARE") {
    message = ':ID=' + id + ',RO=' + ro + ',AC=S,NUM="' + num + '"';
  } else {
    message += ':ID=' + id + ',RO=' + ro + ',AC=C,NUM="' + num + '"';
    if (newRo && newRo.length) {
      message += ',NEWRO=' + newRo;
    }
    // if (ru && ru.length) {
    //   message += ',RU=' + ru;
    // }
    if (ncon && ncon.length) {
      message += ',NCON="' + ncon.trim() + '"';
    }
    if (ctel && ctel.length) {
      message += ',CTEL="' + ctel.trim() + '"';
    }
    if (notes && notes.length) {
      message += ',NOTES="' + notes.trim() + '"';
    }
  }

  return message;
}

export function fix_num(num) {
  if (num.includes("-")) {
    num = num.split("-").join("");
  }
  while (num.includes("  ")) {
    num = num.replace("  ", " ");
  }
  num = num.replace(" ", "\n");
  return num.trim();
}

export function filterValidNums(numsList) {
  let invalidString = "", duplicatedString = ""
  let invalidCount = 0, duplicatedCount = 0
  let validCount = 0

  let regEx = RegExp('^(800|833|844|855|866|877|888)\\d{7}$')
  let nums = numsList[0]
  let i = 0
  let validNumString = ""
  while (i < nums.length) {
    if (regEx.test(nums[i])) {
      validCount++
    } else {
      invalidString += (invalidString == "") ? "" : ", "
      invalidString += nums[i]
      invalidCount++

      nums.splice(i, 1)
      i--
    }

    // duplicated checking
    if (validNumString.includes(nums[i])) {
      duplicatedString += (duplicatedString == "") ? "" : ", "
      duplicatedString += nums[i]
      duplicatedCount++

      nums.splice(i, 1)
      continue
    }

    validNumString += validNumString == "" ? "" : ","
    validNumString += nums[i]
    i++
  }

  console.log("invalid string: " + invalidString + ", " + invalidCount)
  console.log("duplicated string: " + duplicatedString + ", " + duplicatedCount)

  let result = invalidString + "|" + invalidCount + "|" + duplicatedString + "|" + duplicatedCount + "|" + validCount

  return result
}

export function multi_query(id, ro, nums) {

  let prefixMsg = ':ID=' + id + ',RO=' + ro;
  let numMsg = getNUMLMessage(nums);

  return prefixMsg + numMsg;
}

export function multi_spare(id, ro, nums) {

  let prefixMsg = ':ID=' + id + ',RO=' + ro + ',AC=S';
  let numMsg = getNUMLMessage(nums);

  return prefixMsg + numMsg;
}

export function multi_disconnect(id, ro, nums, referral, effDate, effTime, interDate, notes) {

  let prefixMsg = ':ID=' + id + ',RO=' + ro + ',AC=D';

  let numMsg = getNUMLMessage(nums);

  let suffixMsg = "";
  if (effDate.trim() === "NOW") {
    suffixMsg = ':ED="' + effDate;
  } else {
    suffixMsg = ':ED="' +  effDate + '",ET="' + effTime;
  }
  suffixMsg += '",REFER=' + referral + ',EINT="' + interDate;

  // The spec doc is wrong. If number count is 1 and so adds NOTE="...", the somos respond "ERRV="0003,0,NOTE:""
  // if (numMsg.includes("QT=1:")) {
  //   suffixMsg += '",NOTE="' + notes + '"';
  // } else {
  //   suffixMsg += '",NOTES="' + notes + '"';
  // }
  suffixMsg += '",NOTES=""';

  return prefixMsg + numMsg + suffixMsg;
}

/**
 * get string as :QT=qt:NUML=.......format from number list string
 * @param nums
 * @returns {string}
 */
function getNUMLMessage(nums) {

  if (nums.includes(",") && nums.includes('\n')){
    nums.replace(/\,/g,"");
    nums = nums.split("\n");

  } else if (nums.includes(",")) {
    nums = nums.split(",");

  } else if (nums.includes("\n")) {
    nums = nums.split("\n");

  } else {
    return ':QT=1:NUML="' + nums + '"';
  }

  let message = ':QT=' + nums.length + ':NUML="';
  for (let i = 0; i < nums.length; i++) {
    if (i === nums.length -1) {
      message += nums[i].trim() + '"';
    } else {
      message += nums[i].trim() + ',';
    }
  }

  return message;
}
