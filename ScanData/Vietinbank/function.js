import { writeFilePath } from "../../checkPathSource.js";
import {
  convertNumber,
  loopSliceValue,
  readDataPDFParser,
  sliceAmount,
  sliceDate,
  sliceDetailBank,
  sliceFind,
  sliceMBVCB,
} from "../../functions.js";
import { config, initObjBank } from "../../initConfig.js";

/**
 * @function fillDataObjInit
 * @param {Array<Array<string>>} data - Dữ liệu đầu vào để điền vào đối tượng ngân hàng
 * @param {boolean} isMethod2
 * @returns {import("../../initConfig.js").BankObject} - Đối tượng ngân hàng đã được điền dữ liệu
 */
export const fillDataObjInit = (data, isMethod2) => {
  const objBank = initObjBank();
  objBank.bankName = data?.[isMethod2 ? 0 : 1]?.[0];
  let rawAccountNumber = sliceDetailBank(data?.[isMethod2 ? 6 : 8]?.[0]);
  rawAccountNumber = isMethod2
    ? rawAccountNumber
    : loopSliceValue(rawAccountNumber, 1, " ");
  objBank.accountNumber = rawAccountNumber;
  return objBank;
};

/**
 * @typedef {Object} LoopBankItem
 * @property {string | undefined} keyBank
 * @property {number | undefined} [loop]
 * @property {string | undefined} [character]
 * @property {string | undefined} [loopTransfer]
 * @property {function(string, import("../../initConfig.js").BankObject): import("../BIDV/function.js").TObjTransaction} [func]
 */

/**
 * @typedef {Object.<string, LoopBankItem>} IObjLoopBank
 */

/** @type {IObjLoopBank} */
export const objLoopBank = {
  CT: {
    keyBank: "CT nhanh 247 den:",
    func: (str, objBank) => {
      const key = "ct1111;";
      const indexValue = str?.toLocaleLowerCase()?.indexOf(key);
      const indexObjBank = objBank ? str.indexOf(objBank?.accountNumber) : -1;
      if (indexValue != -1) {
        return {
          transactionNumber: "",
          transferContent: str?.slice(indexValue + key?.length)?.trim(),
        };
      } else if (indexObjBank !== -1) {
        return {
          transactionNumber: "",
          transferContent: str
            ?.slice(indexObjBank + objBank?.accountNumber?.length + 1)
            ?.trim(),
        };
      }

      return sliceMBVCB(str);
    },
  },
  NASA: {
    keyBank: "Chuyen tien den tu NAPAS Noi dung:",
    func: (str) => {
      return { transferContent: sliceFind(str, config.IBFT, 1) };
    },
  },
};

/**
 * @function
 * @param {string | undefined} transfer
 * @param {import("../../initConfig.js").BankObject | undefined} objBank
 * @returns {import("../BIDV/function.js").TObjTransaction}
 */
export const transactionFunc = (transfer, objBank) => {
  if (!transfer) return "";

  for (const key in objLoopBank) {
    const { keyBank, func } = objLoopBank[key];
    const indexStart = keyBank ? transfer?.indexOf(keyBank) : 0;
    if (indexStart === -1) {
      continue;
    }
    const newStr = (
      keyBank ? transfer?.slice(indexStart + keyBank?.length) : transfer
    )?.trim();

    if (func) {
      return func(newStr, objBank);
    }
    return {
      transferContent: newStr,
      transactionNumber: "",
    };
  }
};

/**
 * Hàm quét dữ liệu từ Vietinbank và chuyển đổi nó thành đối tượng JSON.
 * @function scanDataVietinbank
 * @param {string} path - Đường dẫn của file PDF cần quét.
 * @param {boolean} isMethod2
 * @returns {Promise<{ data: Array<Object>, objInit: import("../../initConfig.js").BankObject }>} - Trả về một promise chứa danh sách dữ liệu đã được xử lý và đối tượng khởi tạo.
 */

export const scanDataVietinbankMethod1 = async (path, isMethod2 = false) => {
  let { data, newFilename } = await readDataPDFParser(path);
  const objBank = fillDataObjInit(data, isMethod2);
  const lengthDate = isMethod2
    ? ""
    : loopSliceValue(data?.[5]?.[0], 3, " ")?.length;
  data = data?.slice(isMethod2 ? 10 : 12);

  data = data?.filter((item) => item?.length > 1);
  const saveDataTranform = data.map((item) => {
    let newDate = sliceDate(item?.[isMethod2 ? 1 : 0]);
    newDate = isMethod2 ? newDate : newDate.slice(-lengthDate);
    const amount = sliceAmount(item?.[isMethod2 ? 3 : 2]);
    const transferContent = item?.[isMethod2 ? 2 : 1];
    return {
      ...objBank,
      transactionDate: newDate,
      amount: convertNumber(amount),
      transferContent,
      ...transactionFunc(transferContent, objBank),
    };
  });

  writeFilePath(import.meta.url, newFilename, saveDataTranform);
  writeFilePath(import.meta.url, config.nameFileConfig, objBank, config.config);

  return {
    data: saveDataTranform,
    objInit: objBank,
  };
};
