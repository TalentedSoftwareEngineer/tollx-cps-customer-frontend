import _ from "lodash";
import {US_CT_TIMEZONE} from "./constants/GlobalConstants";
import {zonedTimeToUtc} from "date-fns-tz";

/*
* Format integer
* */
export function formatInt(number, digits) {
  return new Intl.NumberFormat('en-IN', {'minimumIntegerDigits': digits, useGrouping:false}).format(number);
};

//Check the empty array.
Array.prototype.isAllEmpty = function () {
  for (let i = 0; i < this.length; i++) {
    if (this[i].length)
      return false;
  }
  return true;
};

/**
 * synthesis api error messages
 * @param errList
 * @returns {string}
 */
export function synthesisErrMsg(errList){

  let message = ''
  for (let err of errList) {
    message += (message == '') ? '' : '\r\n'
    message += (err.errMsg + "(" + err.errCode + ")")
    if (err.errPath && err.errPath !== "")
      message += "(" + err.errPath + ")"
  }

  return message
}

/**
 *
 * @param carrier
 * @param name
 * @param datas
 * @returns {*}
 */
export function get_lad(carrier, name, datas) {
  if (carrier && carrier.length) {
    let currentType = undefined;
    let currentDefs = [];

    for (let i = 0; i < carrier.length; i++) {
      if (carrier[i].isAllEmpty())
        continue;

      for (let j = 0; j < carrier[i].length; j++) {
        if (j === 0) {
          if (carrier[i][0].trim().length) {
            if (currentType && currentDefs.length) {datas.push({type: name, label: currentType, def: currentDefs});}
            currentType = carrier[i][0].trim();
            currentDefs = [];
          }
        }
        else if (carrier[i][j].trim().length) {
          currentDefs.push(carrier[i][j].trim());
        }
      }
    }

    if (currentType && currentDefs.length) {
      datas.push({
        type: name,
        label: currentType,
        def: currentDefs
      });
    }

    return datas;
  }
}

/**
 * push cpr
 * @param column
 * @param value
 * @returns {*}
 */
export function push_cpr(column, value) {
  let defs = value.DEF.split(",").splice(1);

  column = column.concat(_.chunk(defs, 7).map((arr, index) => {
    arr = arr.concat(Array(7 - arr.length).fill(""));
    arr.unshift(index === 0 ? value.LBL : "");
    return arr;
  }));

  return column;
}

/**
 * handle lad event
 * @param ev
 * @param state
 * @returns {*}
 */
export function handle_lad (ev, state) {
  console.log("ev.target.name: " + ev.target.name);
  let indexes = ev.target.name.split("_");
  let newArray = state.map(function (arr) {
    return arr.slice();
  });
  let row = indexes[1];
  let col = indexes[2];

  console.log("ev.target.value: " + ev.target.value);
  let valArray = ev.target.value.split(" ");
  

  if (valArray.length > 1) {
    var prevItem = ""
    valArray.forEach((item, index) => {

      if (item.length > 0 && item[0] == '*') {
        if (col > 0) {
          if (row == newArray.length - 1) {
            newArray.push(Array(8).fill(""));
          }
          row++;
        }

        newArray[row][0] = item;
        col = 1;

      } else {

        if (col == 0) {
          if (prevItem.length == 0 || prevItem[0] != '*') {
            newArray[row][0] = '';
          }
          col++;
        }
        newArray[row][col] = item;

        col++;
        if (col > 7) {
          row++;
          col = 0;
        }

        if (row == newArray.length && valArray.length != (index + 1)) {
          newArray.push(Array(8).fill(""));
        }
      }
      prevItem = item
    });
  } else {
    newArray[row][col] = ev.target.value;
    if (row === newArray.length - 1 && col === newArray[0].length - 1 && ev.target.value) {
      newArray.push(Array(11).fill(""));
    }
  }
  return newArray;
}

/**
 * delete indicated cell
 * @param data
 * @param rowIndex
 * @param colIndex
 * @returns {*}
 */
// export function delete_cell(data, rowIndex, colIndex) {
//   let colSize = data[0].length;
//   let rowSize = data.length;
//
//   let newArray = data.slice(0);
//
//   // shift cells to prev position
//   let prevCellRowIndex = rowIndex;
//   let prevCellColIndex = colIndex;
//   for (let i = rowIndex; i < rowSize; i++) {
//     for (let j = 0; j < colSize; j++) {
//       if (i == rowIndex && j <= colIndex) { continue; }
//
//       newArray[prevCellRowIndex][prevCellColIndex] = newArray[i][j];
//
//       prevCellColIndex = j;
//       prevCellRowIndex = i;
//     }
//   }
//
//   // delete last row if all cells of last row are blank
//   let bLastRowAllBlank = true;
//   for (let j = 0; j < colSize; j++) {
//     if (newArray[rowSize - 1][j] != "") {
//       bLastRowAllBlank = false;
//       break;
//     }
//   }
//   if (bLastRowAllBlank) {
//     newArray = delete_row(newArray);
//   }
//
//   return newArray;
// }

/**
 * delete indicated cell
 * @param data
 * @param rowIndex
 * @param colIndex
 * @returns {*}
 */
export function delete_cell(data, rowIndex, colIndex) {
  let colSize = data[0].length;
  let rowSize = data.length;

  let newArray = data.slice(0);

  // if the user is going to delete label
  if (colIndex == 0) {
    newArray[rowIndex][colIndex] = "";
    return newArray;
  }

  // shift cells to prev position
  let prevCellRowIndex = rowIndex;
  let prevCellColIndex = colIndex;
  let stopRowIndex = -1;
  for (let i = rowIndex; i < rowSize; i++) {
    for (let j = 0; j < colSize; j++) {
      if (i == rowIndex && j <= colIndex) { continue; }
      if (j == 0) {
        if (newArray[i][j] != "") {
          stopRowIndex = i - 1;
          break;
        } else {
          continue;
        }
      }

      newArray[prevCellRowIndex][prevCellColIndex] = newArray[i][j];
      newArray[i][j] = "";
      prevCellColIndex = j;
      prevCellRowIndex = i;
    }

    if (stopRowIndex != -1) break;  // that means what meet label that not empty.
  }

  // delete last row of label if all cells of last row of label are blank
  if (stopRowIndex == - 1) {
    stopRowIndex = rowSize - 1;
  }

  let bStopRowAllBlank = true;
  for (let j = 0; j < colSize; j++) {
    if (newArray[stopRowIndex][j] != "") {
      bStopRowAllBlank = false;
      break;
    }
  }
  if (bStopRowAllBlank) {
    newArray = delete_row(newArray, stopRowIndex);
  }

  return newArray;
}

/**
 * insert cell to indicated row and col
 * @param data
 * @param rowIndex
 * @param colIndex
 * @returns {*}
 */
// export function insert_cell(data, rowIndex, colIndex) {
//   let colSize = data[0].length;
//   let rowSize = data.length;
//
//   let newArray = data.slice(0);
//
//   // last cell is not empty, add a row to last
//   if (data[rowSize - 1][colSize - 1] != "") {
//     newArray = insert_row(data);
//     rowSize++;
//   }
//
//   // shift cells to next position
//   let nextCellRowIndex = rowSize - 1;
//   let nextCellColIndex = colSize - 1;
//   for (let i = rowSize - 1; i >= rowIndex; i--) {
//     for (let j = colSize - 1; j >= 0; j--) {
//       newArray[nextCellRowIndex][nextCellColIndex] = newArray[i][j];
//       if (i == rowIndex && j == colIndex) {
//         break;
//       }
//       nextCellColIndex = j;
//       nextCellRowIndex = i;
//     }
//   }
//
//   newArray[rowIndex][colIndex] = "";
//   return newArray;
// }

/**
 * insert sd(6-digit) cell to indicated row and col
 * @param data
 * @param rowIndex
 * @param colIndex
 * @returns {*}
 */
export function insert_cell(data, rowIndex, colIndex) {
  let colSize = data[0].length;
  let rowSize = data.length;

  let newArray = data.slice(0);

  if (colIndex == 0) colIndex++;

  // first find stop row(the previous row of next label)
  let stopRowIndex = rowSize - 1;
  for (let i = rowIndex + 1; i < rowSize; i++) {
    if (newArray[i][0] != '') {
      stopRowIndex = i - 1;
      break;
    }
  }

  // last cell of current label is not empty, add a row to last
  if (data[stopRowIndex][colSize - 1] != "") {
    newArray = insert_row(data, stopRowIndex + 1);
    stopRowIndex++;
  }

  // shift cells to next position
  let nextCellRowIndex = stopRowIndex;
  let nextCellColIndex = colSize - 1;
  for (let i = stopRowIndex; i >= rowIndex; i--) {
    for (let j = colSize - 1; j >= 0; j--) {
      // if label position, skip
      if (j == 0) { continue; }

      newArray[nextCellRowIndex][nextCellColIndex] = newArray[i][j];
      if (i == rowIndex && j == colIndex) {
        break;
      }
      nextCellColIndex = j;
      nextCellRowIndex = i;
    }
  }

  newArray[rowIndex][colIndex] = "";
  return newArray;
}

/**
 * delete indicated row
 * @param data
 * @param rowIndex
 * @returns {*}
 */
export function delete_row(data, rowIndex = -1) {
  let newArray = data.map(function (arr) {
    return arr.slice();
  });

  if (rowIndex == -1) { rowIndex = data.length - 1; }
  newArray.splice(rowIndex, 1);

  return newArray;
}

/**
 * insert a row to indicated row
 * @param data
 * @param rowIndex
 * @returns {*}
 */
export function insert_row(data, rowIndex = -1) {
  let newArray = data.slice(0);

  if (rowIndex == -1) { rowIndex = data.length; }
  newArray.splice(rowIndex, 0, Array(data[0].length).fill(""));

  return newArray;
}

/**
 * handle cpr value
 * @param ev
 * @param state
 * @returns {*}
 */
export function handle_value_cpr(ev, state) {
  let indexes = ev.target.name.split("_");
  let newArray = state.map(function (arr) {
    return arr.slice();
  });

  let row = indexes[0];
  let col = indexes[1];
  newArray[row][col] = ev.target.value;
  if (row === newArray.length - 1 && col === newArray[0].length - 1 && ev.target.value) {
    newArray.push(Array(11).fill(""));
  }

  console.log(newArray);
  return newArray;
}

/**
 * handle change event.
 * @param ev
 * @param state
 * @returns {*}
 */
export function handle_change(ev, state) {
  let name = ev.target.name.split("_");
  let newArray = state.map(function (arr) {return arr.slice();});
  newArray[name[1]] = ev.target.value;

  return newArray;
}

/**
 * configure date according now and date
 * @param sfed
 * @param now
 * @returns {string}
 */
export function fixed_date (sfed, now) {
  let fixed_date = '';

  if (sfed !== null && !now) {
    let date = sfed.format("MM/DD/YY hh:mm A").toString();
    date = date.split(" ");

    if (date[2] === "AM") {
      fixed_date = date[0] + " " + date[1] + "A/C";
    } else if (date[2] === "PM") {
      fixed_date = date[0] + " " + date[1] + "P/C";
    }
  } else {fixed_date = "NOW";}

  return fixed_date;
}

/**
 *
 * @param type
 */
export function cleanLocalStorage(type) {
  if (type === "CPR") {
    localStorage.setItem("gridType", JSON.stringify(Array(8).fill('')));
    localStorage.setItem("gridData", JSON.stringify(Array(5).fill(Array(8).fill(''))));  
  } else if (type === "LAD") {
    localStorage.setItem("gridSD", JSON.stringify(Array(7).fill(Array(8).fill(''))));
    localStorage.setItem("gridTD", JSON.stringify(Array(7).fill(Array(8).fill(''))));
    localStorage.setItem("gridLATA", JSON.stringify(Array(7).fill(Array(8).fill(''))));
    localStorage.setItem("gridArea", JSON.stringify(Array(7).fill(Array(8).fill(''))));
    localStorage.setItem("gridDate", JSON.stringify(Array(7).fill(Array(8).fill(''))));
    localStorage.setItem("gridState", JSON.stringify(Array(7).fill(Array(8).fill(''))));
    localStorage.setItem("gridNXX", JSON.stringify(Array(7).fill(Array(8).fill(''))));
    localStorage.setItem("gridTime", JSON.stringify(Array(7).fill(Array(8).fill(''))));
    localStorage.removeItem("isTime");
    localStorage.removeItem("isSD");
    localStorage.removeItem("isTD");
    localStorage.removeItem("isLATA");
    localStorage.removeItem("isDate");
    localStorage.removeItem("isState");
    localStorage.removeItem("isArea");
    localStorage.removeItem("isNXX");
    localStorage.removeItem("disable");
    localStorage.removeItem("template");
    localStorage.removeItem("iec");
    localStorage.removeItem("iac");
  }
}

/**
 * return percentage of total and completed + failed
 * @param total
 * @param completed
 * @param failed
 * @returns {number}
 */
export function getPercentValue(total, completed, failed) {
  let progressCnt = completed + failed
  let percentage =  Math.floor(progressCnt * 100 / total)
  return percentage
}

/**
 * return if the current is daylight saving time or not
 */
export function isCurrentDayLightSavingTime() {

  // let localTime = new Date(2020, 11, 5, 10, 20)
  let localTime = new Date()
  let localTimeValue = localTime.getTime() - (localTime.getTime() % 1000)
  let localTimezoneOffsetValue = localTime.getTimezoneOffset() * 60 * 1000

  let utcTime = new Date( localTimeValue + localTimezoneOffsetValue)
  console.log("utcTime: " + utcTime)
  let ctTimeString = localTime.toLocaleString("en-US", {timeZone: US_CT_TIMEZONE});
  console.log("ctTimeString: " + ctTimeString)
  let ctTime = new Date(ctTimeString)
  console.log("ctTime: " + ctTime)

  let hourOffest = (utcTime.getTime() - ctTime.getTime()) / 1000 / 3600

  if (hourOffest === 5)
    return true

  return false
}

/**
 * put the log (log and time)
 * @param logName
 */
export function putLog(logTitle) {
  let dt = new Date()

  let hour = dt.getHours() > 9 ? dt.getHours() : '0' + dt.getHours()
  let minute = dt.getMinutes() > 9 ? dt.getMinutes() : '0' + dt.getMinutes()
  let second = dt.getSeconds() > 9 ? dt.getSeconds() : '0' + dt.getSeconds()

  let milliSecond = dt.getMilliseconds()
  if (milliSecond < 10)
    milliSecond = '00' + milliSecond
  else if (milliSecond < 100)
    milliSecond = '0' + milliSecond

  console.log(`>>> ${logTitle}: ${hour}:${minute}:${second}.${milliSecond}`)
}

export function fromUTCStrToDateVal(utcDtTm) {
  let dtObj = new Date(utcDtTm.replace("T", " "))
  return dtObj.getTime()
}

/**
 * convert UTC String(YYYY-MM-DD HH:mm:ss) to Centeral Time(MM/DD/YYYY HH:mm:ss A) of USA
 * @param strDateTime
 */
export function fromUTCWithoutTStrToCTStrWithSec(strDateTime) {

  if (strDateTime === undefined || strDateTime == null || strDateTime === "") return ""

  if (strDateTime.includes("NOW")) return strDateTime

  if (strDateTime.length === 10) {
    // parse the year, month, date
    let [year, month, date] = strDateTime.split("-")

    return month + '/' + date + '/' + year
  }

  // parse the year, month, date, hour, minute
  let [year, month, date] = strDateTime.split(" ")[0].split("-")
  let [hour, minute, second] = strDateTime.split(" ")[1].split(":")

  // convert UTC time to CT time of USA
  let utcTime = new Date(Date.UTC(year, month - 1, date, hour, minute, second))
  let ctTimeString = utcTime.toLocaleString("en-US", {timeZone: US_CT_TIMEZONE});
  let ctTime = new Date(ctTimeString)

  // configure the date time string time format
  year = ctTime.getFullYear()
  month = ctTime.getMonth() + 1
  if (month < 10) month = '0' + month
  date = ctTime.getDate()
  if (date < 10)  date = '0' + date

  let hour12 = (ctTime.getHours() % 12 === 0) ? 12 : ctTime.getHours() % 12
  if (hour12 < 10)  hour12 = '0' + hour12

  minute = ctTime.getMinutes()
  if (minute < 10)  minute = '0' + minute

  second = ctTime.getSeconds()
  if (second < 10)  second = '0' + second

  let strShowDate = month + '/' + date + '/' + year + ' ' + hour12 + ':' + minute + ':' + second
  if (ctTime.getHours() >= 12)
    strShowDate += ' PM'
  else
    strShowDate += ' AM'

  return strShowDate
}

/**
 * convert UTC String(YYYY-MM-DDTHH:mmZ) to Centeral Time(MM/DD/YYYY HH:mm A) of USA
 * @param strDateTime
 */
export function fromUTCStrToCTStr(strDateTime) {

  if (strDateTime === undefined || strDateTime == null || strDateTime === "") return ""

  if (strDateTime.includes("NOW")) return strDateTime

  if (strDateTime.length === 10) {
    // parse the year, month, date
    let [year, month, date] = strDateTime.split("-")

    return month + '/' + date + '/' + year
  }

  // parse the year, month, date, hour, minute
  let [year, month, date] = strDateTime.split("T")[0].split("-")
  let [hour, minute] = strDateTime.split("T")[1].replace("Z", "").split(":")

  // convert UTC time to CT time of USA
  let utcTime = new Date(Date.UTC(year, month - 1, date, hour, minute))
  let ctTimeString = utcTime.toLocaleString("en-US", {timeZone: US_CT_TIMEZONE});
  let ctTime = new Date(ctTimeString)

  // configure the date time string time format
  year = ctTime.getFullYear()
  month = ctTime.getMonth() + 1
    if (month < 10) month = '0' + month
  date = ctTime.getDate()
    if (date < 10)  date = '0' + date

  let hour12 = (ctTime.getHours() % 12 == 0) ? 12 : ctTime.getHours() % 12
    if (hour12 < 10)  hour12 = '0' + hour12

  minute = ctTime.getMinutes()
    if (minute < 10)  minute = '0' + minute

  let strShowDate = month + '/' + date + '/' + year + ' ' + hour12 + ':' + minute
  if (ctTime.getHours() >= 12)
    strShowDate += ' PM'
  else
    strShowDate += ' AM'

  return strShowDate
}

/**
 * convert UTC String(YYYY-MM-DD HH:mm:ss) to Current Local Time(MM/DD/YYYY HH:mm:ss A)
 * @param strDateTime
 */
export function fromUTCStrToCurLocaleStr(strDateTime, diffTime = 0) {

  if (strDateTime === undefined || strDateTime == null || strDateTime === "") return ""

  if (strDateTime.includes("NOW")) return strDateTime

  if (strDateTime.length === 10) {
    // parse the year, month, date
    let [year, month, date] = strDateTime.split("-")

    return month + '/' + date + '/' + year
  }

  // parse the year, month, date, hour, minute
  let [year, month, date] = strDateTime.split(" ")[0].split("-")
  let [hour, minute, second] = strDateTime.split(" ")[1].split(":")

  // convert UTC time to CT time of USA
  let time = new Date(Date.UTC(year, month - 1, date, hour, minute, second).valueOf() + diffTime)
  // let ctTime = new Date(ctTimeString)

  // configure the date time string time format
  year = time.getFullYear()
  month = time.getMonth() + 1
  if (month < 10) month = '0' + month
  date = time.getDate()
  if (date < 10)  date = '0' + date

  let hour12 = (time.getHours() % 12 === 0) ? 12 : time.getHours() % 12
  if (hour12 < 10)  hour12 = '0' + hour12

  minute = time.getMinutes()
  if (minute < 10)  minute = '0' + minute

  second = time.getSeconds()
  if (second< 10)  second = '0' + second

  let strShowDate = month + '/' + date + '/' + year + ' ' + hour12 + ':' + minute + ':' + second
  if (time.getHours() >= 12)
    strShowDate += ' PM'
  else
    strShowDate += ' AM'

  return strShowDate
}

/**
 * convert UTC String(YYYY-MM-DDTHH:mmZ) list (seperated by comma) to Centeral Time(MM/DD/YYYY HH:mm A) list of USA
 * @param strDateTime
 */
export function fromUTCStrListToCTStrList(strDateTimes) {
  if (strDateTimes === undefined || strDateTimes == null || strDateTimes === "")  return ""

  let strDateTimeList = strDateTimes.split(",")
  let ctStrList = []
  for (let strDateTime of strDateTimeList) {
    let ctStr = fromUTCStrToCTStr(strDateTime)
    ctStrList.push(ctStr)
  }

  return ctStrList.join(",")
}

/**
 * convert UTC Date String(YYYY-MM-DD) to Centeral Date String of USA (MM/DD/YYYY)
 * @param strDateTime
 */
export function fromUTCDateStrToCTDateStr(utcDateStr) {
  let tempArr = utcDateStr.split("-")
  return tempArr[1] + "/" + tempArr[2] + "/" + tempArr[0]
}

/**
 * convert Time of USA to UTC Format String(YYYY-MM-DD)
 * @param strDateTime
 */
export function fromTimeValueToUTCDateStr(ctTime) {

  let year = ctTime.getFullYear()
  let month = ctTime.getMonth() + 1
  if (month < 10) month = '0' + month
  let date = ctTime.getDate()
  if (date < 10)  date = '0' + date

  return year + '-' + month + '-' + date
}

/**
 * convert Centeral Time of USA to UTC String(YYYY-MM-DDTHH:mmZ)
 * @param strDateTime
 */
export function fromCTTimeToUTCStr(ctTime) {

  let year = ctTime.getFullYear()
  let month = ctTime.getMonth() + 1
    if (month < 10) month = '0' + month
  let date = ctTime.getDate()
    if (date < 10)  date = '0' + date

  let hour = ctTime.getHours()
    if (hour < 10)  hour = '0' + hour
  let minute = ctTime.getMinutes()
    if (minute < 10)  minute = '0' + minute

  const ctTimeString = year + '-' + month + '-' + date + ' ' + hour + ':' + minute

  // convert from CT to UTC
  const utcTime = zonedTimeToUtc(ctTimeString, US_CT_TIMEZONE)

  // get UTC string of the type "YYYY-MM-DDTHH:mmZ"
  const strUTCDate = getUTCString(utcTime)

  return strUTCDate
}

/**
 * convert Centeral Time of USA to UTC String(YYYY-MM-DDTHH:mmZ)
 * @param strDateTime
 */
export function fromCTTimeToUTCWithSecondStr(ctTime) {

  let year = ctTime.getFullYear()
  let month = ctTime.getMonth() + 1
  if (month < 10) month = '0' + month
  let date = ctTime.getDate()
  if (date < 10)  date = '0' + date

  let hour = ctTime.getHours()
  if (hour < 10)  hour = '0' + hour
  let minute = ctTime.getMinutes()
  if (minute < 10)  minute = '0' + minute
  let second = ctTime.getSeconds()
  if (second < 10)  second = '0' + second

  const ctTimeString = year + '-' + month + '-' + date + ' ' + hour + ':' + minute + ':' + second

  // convert from CT to UTC
  const utcTime = zonedTimeToUtc(ctTimeString, US_CT_TIMEZONE)

  // get UTC string of the type "YYYY-MM-DD HH:mm:ss"
  const strUTCDate = getUTCWithSecondString(utcTime)

  return strUTCDate
}

/**
 * convert Centeral Time(MM/DD/YYYY HH:mm A) of USA to UTC String(YYYY-MM-DDTHH:mmZ)
 * @param strDateTime
 */
export function fromCTStrToUTCStr(strDateTime) {

  if (strDateTime === undefined || strDateTime == null || strDateTime === '')   return ""

  // parse the year, month, date, hour, minute
  let [month, date, year] = strDateTime.split(" ")[0].split("/")
  let [hour, minute] = strDateTime.split(" ")[1].split(":")
  let am = strDateTime.split(" ")[2]

  hour = parseInt(hour, 10)
  hour = hour % 12
  if (am === "PM")
    hour += 12
  if (hour < 10)
    hour = '0' + hour

  // config the date time string of CT of USA
  let ctTimeString = year + '-' + month + '-' + date + ' ' + hour + ':' + minute

  // get local time from CT
  const localTime = zonedTimeToUtc(ctTimeString, US_CT_TIMEZONE)

  // get UTC string of the type "YYYY-MM-DDTHH:mmZ"
  const strUTCDate = getUTCString(localTime)

  return strUTCDate
}

/**
 * convert Centeral Time(MM/DD/YYYY HH:mm A) of USA to Local Time value
 * @param strDateTime
 */
export function fromCTStrToLocalTime(strDateTime) {

  // parse the year, month, date, hour, minute
  let [month, date, year] = strDateTime.split(" ")[0].split("/")
  let [hour, minute] = strDateTime.split(" ")[1].split(":")
  let am = strDateTime.split(" ")[2]

  hour = parseInt(hour, 10)
  hour = hour % 12
  if (am === "PM")
    hour += 12
  if (hour < 10)
    hour = '0' + hour

  // config the date time string of CT of USA
  let ctTimeString = year + '-' + month + '-' + date + ' ' + hour + ':' + minute

  // get local time from CT
  const localTime = zonedTimeToUtc(ctTimeString, US_CT_TIMEZONE)

  return localTime
}

/**
 * convert local time to UTC and return UTC string
 */
export function fromLocalToUTCString(strDateTime) {
  let dt = new Date(strDateTime)
  return getUTCString(dt)
}

/**
 * return UTC string
 */
export function getUTCString(dt, isStandFormat = true, bExistSec = false) {

  let year = dt.getUTCFullYear()
  let month = dt.getUTCMonth() + 1
  if (month < 10) month = '0' + month
  let date = dt.getUTCDate()
  if (date < 10)  date = '0' + date

  let hour = dt.getUTCHours()
  if (hour < 10)  hour = '0' + hour
  let minute = dt.getUTCMinutes()
  if (minute < 10)  minute = '0' + minute
  let second = dt.getUTCSeconds()
  if (second < 10) second = '0' + second

  let strShowDate = year + '-' + month + '-' + date
  if (isStandFormat)
    strShowDate += 'T'
  else
    strShowDate += ' '

  strShowDate += hour + ':' + minute
  if (bExistSec)
    strShowDate += ':' + second

  if (isStandFormat)
    strShowDate += 'Z'

  return strShowDate
}

/**
 * return US Centeral Standard string
 */
export function getUSCSTString(dt) {

  let year = dt.getUTCFullYear()
  let month = dt.getUTCMonth() + 1
  if (month < 10) month = '0' + month
  let date = dt.getUTCDate()
  if (date < 10)  date = '0' + date

  let hour = dt.getUTCHours()
  if (hour < 10)  hour = '0' + hour
  let minute = dt.getUTCMinutes()
  if (minute < 10)  minute = '0' + minute
  let second = dt.getUTCSeconds()
  if (second < 10) second = '0' + second

  let strShowDate = year + '-' + month + '-' + date
  strShowDate += hour + ':' + minute
  strShowDate += ':' + second

  // get local time from CT
  const localTime = zonedTimeToUtc(strShowDate, US_CT_TIMEZONE)

  const cstString = getUSCSTString(localTime)
  console.log('>>>>>> cst string: ', cstString)

  return strShowDate
}

/**
 * return UTC string
 */
export function getUTCWithSecondString(dt) {

  let year = dt.getUTCFullYear()
  let month = dt.getUTCMonth() + 1
  if (month < 10) month = '0' + month
  let date = dt.getUTCDate()
  if (date < 10)  date = '0' + date

  let hour = dt.getUTCHours()
  if (hour < 10)  hour = '0' + hour
  let minute = dt.getUTCMinutes()
  if (minute < 10)  minute = '0' + minute
  let second = dt.getUTCMinutes()
  if (second < 10)  second = '0' + second

  const strShowDate = year + '-' + month + '-' + date + ' ' + hour + ':' + minute + ':' + second

  return strShowDate
}

/**
 * retrieves the formatted contact number
 * @param number
 * @returns {*}
 */
export function formattedNumber(number) {
  if (number == null || number.length === 0)
    return ""

  let numList = number.replace(/\ /g, "").split(",")
  for (let i = 0; i < numList.length; i++) {
    let num = numList[i]

    num = num.replace(/\-/g, "")
    if (num.length > 6)
      num = num.substring(0, 3) + "-" + num.substring(3, 6) + "-" + num.substring(6, Math.max(6, num.length))
    else if (num.length > 3)
      num = num.substring(0, 3) + "-" + num.substring(3, num.length)

    numList[i] = num
  }

  return numList.join(",")
}

/**
 * sort activity log with data by order from z to a
 * @param data
 */
export function sortNumberListWithDateZA(data) {

  // sort template name list
  data.sort(function (a, b) {
    if (a.submitDate < b.submitDate)
      return 1
    else if (a.submitDate > b.submitDate)
      return -1

    return 0
  })
}

/**
 * sort activity log with data by order from z to a
 * @param data
 */
export function sortActivityLogWithDateZA(data) {

  // sort template name list
  data.sort(function (a, b) {
    if (a.subDtTm < b.subDtTm)
      return 1
    else if (a.subDtTm > b.subDtTm)
      return -1

    return 0
  })
}

/**
 * * parse imported file's numbers
 * @param numberString
 * @returns {{realNumbers: string, duplicatedCount: number, invalidCount: number, validCount: number}}
 */
export function parseNumList(numberString) {
  const tempNumbers = numberString.replaceAll(",\n", ",").replaceAll("\n", ",")
  const tempNumList = tempNumbers.split(",")

  let realNumbers = ""
  let validCount = 0
  let invalidCount = 0
  let duplicatedCount = 0

  const numberReg = RegExp('^8(00|33|44|55|66|77|88)\\d{7}$')

  for (let number of tempNumList) {
    number = number.replaceAll("-", "")
    number = number.replaceAll("\uFEFF", "")

    if (number === '') continue;

    // valid checking
    if (!numberReg.test(number)) {
      console.log('invalid number: ', number)
      invalidCount++;
      continue;
    }

    // duplicated checking
    if (realNumbers.includes(number)) {
      duplicatedCount++;
      continue;
    }

    realNumbers += realNumbers === '' ? '' : '\n'
    realNumbers += (number.substring(0, 3) + "-" + number.substring(3, 6) + "-" + number.substring(6, Math.max(6, number.length)))

    validCount++
  }

  // return the result
  return  {
    validCount: validCount,
    invalidCount: invalidCount,
    duplicatedCount: duplicatedCount,
    realNumbers: realNumbers,
  }
}

/**
 * this is the function that converts the numbers to xxx-yyy-zzzz.
 * @param numString
 * @returns {string[]}
 */
export function retrieveNumListWithHyphen(numString) {
  numString = numString.trim().replaceAll('-', '');

  while (numString.includes("  ")) {
    numString = numString.replace("  ", " ")
  }
  while (numString.includes("\n\n")) {
    numString = numString.replace("\n\n", "\n")
  }
  numString = numString.replace(/\, /g, ",")
  numString = numString.replace(/\ /g, "\n")
  numString = numString.replace(/\n/g, ",")

  let numberReg = RegExp('\\d{10}|\\d{3}\\-\\d{3}\\-\\d{4}$')
  let numStrWithHyphen = ""
  let numList = numString.split(",")

  for (let num of numList) {
    if (numStrWithHyphen !== '')
      numStrWithHyphen += ','

    if (numberReg.test(num) && !num.includes("-")) {
      numStrWithHyphen += num.substring(0, 3) + "-" + num.substring(3, 6) + "-" + num.substring(6, Math.max(6, num.length))
    } else {
      numStrWithHyphen += num
    }
  }

  return numStrWithHyphen.split(",")
}

/**
 * this is the function that converts the numbers from numbers string to array list.
 * @param numString
 * @returns {*}
 */
export function retrieveNumList(numString) {
  numString = numString.replace(/\-/g, "")

  while (numString.includes("  ")) {
    numString = numString.replace("  ", " ")
  }
  numString = numString.replace(/\, /g, ",")
  numString = numString.replace(/\ /g, "\n")
  numString = numString.replace(/\n/g, ",")
  return numString.split(",")
}
