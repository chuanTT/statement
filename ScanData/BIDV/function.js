import { writeFilePath } from "../../checkPathSource.js";
import {
  checkNumber,
  convertNumber,
  loopSliceValue,
  loopSliceValueTransfer,
  readDataPDFParser,
  sliceDetailBank,
  sliceFind,
  sliceMBVCB,
  transactionNumberFunc,
} from "../../functions.js";
import { config, initObjBank } from "../../initConfig.js";

export const arrMathRuleBank = ["TKThe", "REM Tfr Ac"];

/**
 * @function checkAmount
 * @param {string} str
 * @returns {{amount: string | undefined, newStr: str}}
 */
const checkAmount = (str) => {
  let amount = "";
  let count = 0;
  const strCurrentValue = str?.split("")?.reverse();
  const isNumber = checkNumber(strCurrentValue?.[0]);
  if (!isNumber) return { amount: undefined, newStr: "" };
  for (const value of strCurrentValue) {
    const isNumber = checkNumber(value);
    if ((count < 3 && isNumber) || (count == 3 && value === ".")) {
      amount = `${value}${amount}`;
    } else if (!isNumber) {
      break;
    }
    count === 3 ? (count = 0) : (count += 1);
  }

  return {
    amount,
    newStr: str?.slice(0, str?.length - amount?.length),
  };
};

/**
 * @function checkAmount
 * @param {string[]} arr
 * @param {number} index
 * @returns {string | undefined}
 */
const findAmount = (arr, index) => {
  let isLoop = true;
  let newIndex = index;
  let amount;
  while (isLoop) {
    let currentArr = arr?.[newIndex];
    if (currentArr === undefined) {
      isLoop = false;
    }
    let isCustom = checkCustomBIDV(currentArr?.[0]);
    if (isCustom) {
      amount = currentArr?.[1] ?? 0;
      isLoop = false;
    }
    newIndex += 1;
  }
  return amount;
};

/**
 * @function findSpreadValue
 * @param {string[]} arr
 * @param {number} index
 * @returns {string[]}
 */
const findSpreadValue = (arr, index) => {
  let loop = true;
  let newArr = [];
  while (loop) {
    const currentArr = arr?.[index];
    if (currentArr === undefined) {
      loop = false;
    }
    const isNumber = convertNumber(currentArr?.[0] ?? "");
    if (!isNaN(isNumber)) {
      loop = false;
      newArr = currentArr;
    }
    index++;
  }

  return newArr;
};

/**
 * @function arrStartRuleBank
 * @param {string} str
 * @param {string[]} arrStr
 * @returns {boolean}
 */
const arrStartRuleBank = (str, arrStr) => {
  return [...(arrStr ?? []), ...arrMathRuleBank]?.some((item) =>
    str?.startsWith(item)
  );
};

/**
 * @typedef {Object} returnRules
 * @property {string} transferContent - Tên ngân hàng
 * @property {string} transactionNumber - Ngày giao dịch
 * @property {boolean} isLoop
 */

/**
 * @typedef {Object} TObjTransaction
 * @property {string} transferContent
 * @property {string} transactionNumber
 */

/**
 * @typedef {import("../../initConfig.js").BankObject} objNewBank
 * @property {string | undefined} accountNumberOld
 */

/**
 * @typedef {function(objNewBank, TObjTransaction): returnRules} ruleBank
 */

/**
 * @type {ruleBank}
 * */
const ruleAccountNumber = (objBank, objTransaction) => {
  let isLoop = true;
  const { transferContent } = objTransaction;
  if (transferContent?.startsWith(objBank?.accountNumber)) {
    const indexAccountNumber = objBank?.accountNumber?.length;
    objTransaction.transferContent = transferContent
      ?.slice(indexAccountNumber)
      ?.trim();
    isLoop = false;
  }
  return { ...objTransaction, isLoop };
};

/**
 * @type {ruleBank}
 * */
const ruleTKThe = (objNewBank, objTransaction) => {
  let isLoop = true;
  const { accountNumberOld, accountNumber } = objNewBank;
  if (objTransaction.transferContent?.startsWith("TKThe")) {
    objTransaction.transferContent = loopSliceValueTransfer(
      objTransaction.transferContent,
      4,
      " "
    );
    if (objTransaction.transferContent?.startsWith(config.IBFT)) {
      objTransaction.transferContent = sliceFind(objTransaction.transferContent, config.IBFT, 1);
    } else {
      const {transactionNumber, transferContent} = sliceMBVCB(objTransaction.transferContent)
      objTransaction.transactionNumber = transactionNumber;
      objTransaction.transferContent = transferContent;
    }
    objTransaction.transferContent = sliceFind(objTransaction.transferContent, accountNumberOld, 1)
    objTransaction.transferContent = sliceFind(objTransaction.transferContent, accountNumber, 1)
    isLoop = false;
  }
  return { ...objTransaction, isLoop };
};

/**
 * @type {ruleBank}
 * */
const ruleRem = (_, objTransaction) => {
  let isLoop = true;
  const { transferContent } = objTransaction;
  if (transferContent?.startsWith("REM Tfr Ac")) {
    let newTransfer = loopSliceValueTransfer(transferContent, 4, " ");
    objTransaction.transactionNumber = loopSliceValue(newTransfer, 1, " ");
    objTransaction.transferContent = loopSliceValueTransfer(
      newTransfer,
      2,
      " "
    );
    isLoop = false;
  }
  return { ...objTransaction, isLoop };
};

const objBankBIDV = [ruleAccountNumber, ruleTKThe, ruleRem];

/**
 * @function checkCustomBIDV
 * @param {string} str
 * @returns {boolean}
 */
const checkCustomBIDV = (str) => str?.indexOf("khách hàng của BIDV.") !== -1;

/**
 * Hàm quét dữ liệu từ BIDV và chuyển đổi nó thành đối tượng JSON.
 * @function scanDataBIDV
 * @param {string} path - Đường dẫn của file PDF cần quét.
 * @returns {Promise<{ data: Array<Object>, objInit: import("../../initConfig.js").BankObject }>} - Trả về một promise chứa danh sách dữ liệu đã được xử lý và đối tượng khởi tạo.
 */
export const scanDataBIDV = async (path) => {
  const { newFilename, data } = await readDataPDFParser(path);
  // obj bank
  const objBank = initObjBank();
  objBank.bankName = data?.[0]?.[0];
  objBank.accountNumber = sliceDetailBank(data?.[8]?.[0]);
  let accountNumberOld = data?.[9]?.[0]?.replace(/[()]/g, "");
  accountNumberOld = sliceDetailBank(accountNumberOld);
  // bỏ những dữ liệu ko cần thiết
  let newData = data?.slice(12);

  const newDataReduce = newData.reduce((total, currentValue, index) => {
    const length = currentValue?.length;
    const isCustomBIDV =
      length <= 2 ? checkCustomBIDV(currentValue?.[0]) : false;
    const currenStrLast = arrStartRuleBank(currentValue?.[1], [
      objBank.accountNumber,
    ]);
    if (length <= 1 || isCustomBIDV || currenStrLast) return total;
    let newItem = currentValue;
    if (length === 5) {
      newItem = currentValue?.slice(1);
    } else {
      const amount = convertNumber(currentValue?.[length - 1]);
      if (!isNaN(amount)) {
        const nextIndex = index + 1;
        const currentNext = newData?.[nextIndex];
        newItem = [...currentValue, currentNext?.[1]];
      } else if (length === 3) {
        const transferStr = currentValue?.[2];
        const { amount, newStr } = checkAmount(transferStr);
        if (amount !== undefined) {
          newItem.splice(newItem?.length - 1, 1, amount, newStr);
        } else {
          const amount = findAmount(newData, index + 1);
          newItem.splice(newItem?.length - 1, 0, amount);
        }
      } else if (length !== 4) {
        newItem = [...newItem, ...findSpreadValue(newData, index + 1)];
      }
    }
    return [...total, newItem];
  }, []);

  const saveDataTranform = newDataReduce?.map((item) => {
    const newDate = item?.[1]?.split(" ")[0];
    let objTransaction = {
      transferContent: item?.[3] ?? "",
      transactionNumber: "",
    };

    for (let func of objBankBIDV) {
      const { isLoop, ...spread } = func(
        { ...objBank, accountNumberOld },
        objTransaction
      );
      if (!isLoop) {
        objTransaction = spread;
        break;
      }
    }
    return {
      ...objBank,
      transactionDate: newDate,
      amount: convertNumber(item?.[2]),
      ...objTransaction,
    };
  });

  writeFilePath(import.meta.url, newFilename, saveDataTranform);
  writeFilePath(import.meta.url, config.nameFileConfig, objBank, config.config);

  return {
    data: saveDataTranform,
    objInit: objBank,
  };
};
