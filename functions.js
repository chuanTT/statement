import moment from "moment";

/**
 * @function
 * @param {string} str
 * @param {number} s
 * @param {number | undefined} e
 * @returns {string}
 */
export const sliceTrimValue = (str, s, e) => str.slice(s, e)?.trim();

/**
 * @function
 * @param {string | undefined} value
 * @param {string[]} arrCheck
 * @returns {string}
 */
export const sliceDetailBank = (
  value,
  arrCheck = ["GIAO DỊCH NGÀY", "tài khoản:", "tài khoản"]
) => {
  if (!value) return;
  const upperValue = value.toLocaleUpperCase();
  const lowerValue = value.toLocaleLowerCase();
  for (const key of arrCheck) {
    const indexUpper = upperValue.indexOf(key);
    const indexLower = lowerValue.indexOf(key);

    if (indexUpper !== -1) {
      return sliceTrimValue(value, indexUpper + key.length);
    } else if (indexLower !== -1) {
      return sliceTrimValue(value, indexLower + key.length);
    }
  }
  return value;
};

/**
 * @function
 * @param {string | number} number
 * @returns {number}
 */
export const convertNumber = (number) => {
  if (!number || typeof number === "number") {
    return number || 0;
  }
  number = number.replace(/[.]/g, "");
  number = number.trim();
  return +number;
};

/**
 * @function
 * @param {string | Date} date
 * @param {string } format
 * @returns {number}
 */
export const formatDate = (date, format = "YYYY-MM-DD") =>
  moment(date, "DD/M/YYYY").format(format);

/**
 * @function
 * @param {string | undefined} str
 * @param {number} loop
 * @param {string} character
 * @returns {string}
 */
export const loopSliceValue = (str, loop, character = ".") => {
  for (let i = 0; i < loop; i++) {
    const indexNew = str.indexOf(character);
    const isEnd = i === loop - 1;
    str = str.slice(
      isEnd ? 0 : indexNew + character?.length,
      isEnd ? indexNew : undefined
    );
  }
  return str;
};

/**
 * @function
 * @param {string} value - Chuỗi đầu vào
 * @returns {string} - Chuỗi đầu ra
 */
export const sliceValueContentFunc = (value) => {
  const index = value.indexOf("_", 0);
  if (index !== -1) {
    return value.slice(index + 1);
  }
  return value;
};

/**
 * @typedef {Object} BankDetails
 * @property {string | undefined} keyBank
 * @property {number | undefined} [loop]
 * @property {string | undefined} [character]
 * @property {string | undefined} [loopTransfer]
 * @property {function(string): string} [func]
 */

/**
 * @typedef {Object.<string, BankDetails>} TransactionBank
 */

/** @type {TransactionBank} */
const objTransactionBank = {
  VCB: {
    keyBank: "MBVCB.",
    loop: 1,
  },
  PARTNER_MSE: {
    keyBank: "PARTNER.DIRECT_DEBITS_VCB.MSE.",
    loop: 1,
    loopTransfer: 2,
    func: sliceValueContentFunc,
  },
  PARTNER: {
    keyBank: "PARTNER.DIRECT_DEBITS_VCB.",
    loop: 2,
    loopTransfer: 3,
  },
  VCB_CTDK: {
    keyBank: "VCB.",
    loop: 1,
    loopTransfer: 2,
  },
  OTHER: {
    loop: 1,
    loopTransfer: 3,
  },
};

/**
 * @function
 * @param {string | undefined} transfer
 * @returns {string}
 */
export const transactionNumberFunc = (transfer) => {
  if (!transfer) return "";

  for (const key in objTransactionBank) {
    const { keyBank, loop, character } = objTransactionBank[key];
    const indexStart = keyBank ? transfer?.indexOf(keyBank) : 0;
    if (indexStart === -1) {
      continue;
    }
    const newStr = keyBank
      ? transfer?.slice(indexStart + keyBank?.length)
      : transfer;

    return loop === 0 || loop === undefined
      ? newStr
      : loopSliceValue(newStr, loop, character);
  }
};

/**
 * @function
 * @param {string | undefined} str
 * @param {number} loop
 * @param {string} character
 * @returns {string}
 */
export const loopSliceValueTransfer = (str, loop, character = ".") => {
  for (let i = 0; i < loop; i++) {
    const indexNew = str.indexOf(character);
    str = str.slice(indexNew + 1);
  }
  return str;
};

/**
 * @function
 * @param {string | undefined} transfer
 * @returns {string}
 */

export const transferContentFunc = (transfer) => {
  if (!transfer) return "";
  for (const key in objTransactionBank) {
    const { keyBank, loop, loopTransfer, character, func } =
      objTransactionBank[key];
    const indexStart = keyBank ? transfer?.indexOf(keyBank) : 0;
    if (indexStart === -1) {
      continue;
    }
    const newLoop = loopTransfer ?? loop;
    const newStr = keyBank
      ? transfer?.slice(indexStart + keyBank?.length)
      : transfer;
    const newTransfer = loopSliceValueTransfer(newStr, newLoop, character);
    if (func) {
      return func(newTransfer);
    }
    return newTransfer;
  }
  return transfer;
};


const initIngore = [
  "Swift",
  "Page",
  "Website",
  "TNX Date",
  "Ngày GD",
  "Postal address",
  "Số CT",
];
/**
 * @function
 * @param {string} str
 * @returns {boolean}
 */
export const checkIngore = (str) => {
  return initIngore.some((ingore) => str.startsWith(ingore));
};

/**
 * @function
 * @param {string} str
 * @param {any[]} arrayBase
 * @param {number} nextIndex
 * @returns {string}
 */
export const mergeTransfer = (str, arrayBase, nextIndex) => {
  let isLoop = true;
  while (isLoop) {
    const currentNext = arrayBase?.[nextIndex];
    if (!currentNext || (currentNext && currentNext?.length > 1)) {
      isLoop = false;
      break;
    }
    const text = currentNext?.[0];
    str += ` ${text}`;
    nextIndex += 1;
  }
  return str;
};