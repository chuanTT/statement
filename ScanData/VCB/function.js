import { writeFilePath } from "../../checkPathSource.js";
import { config, initObjBank } from "../../initConfig.js";
import {
  checkIngore,
  convertNumber,
  mergeTransfer,
  readDataPDFParser,
  sliceDetailBank,
  transactionNumberFunc,
  transferContentFunc,
} from "../../functions.js";

/**
 * @function
 * @param {Array<Array<string>>} data - Dữ liệu đầu vào để điền vào đối tượng ngân hàng
 * @returns {import("../../initConfig.js").BankObject} - Đối tượng ngân hàng đã được điền dữ liệu
 */
const fillDataObjInit = (data) => {
  const objInit = initObjBank();
  let i = 0;
  for (const key in objInit) {
    const currentData = data?.[i];
    if (currentData) {
      objInit[key] = sliceDetailBank(currentData?.[0]);
    }
    i++;
  }

  return objInit;
};

/**
 * Hàm quét dữ liệu từ VCB và chuyển đổi nó thành đối tượng JSON.
 * @function scanDataVCB
 * @param {string} path - Đường dẫn của file PDF cần quét.
 * @returns {Promise<{ data: Array<Object>, objInit: import("../../initConfig.js").BankObject }>} - Trả về một promise chứa danh sách dữ liệu đã được xử lý và đối tượng khởi tạo.
 */
export const scanDataVCB = async (path) => {
  const { newFilename, data } = await readDataPDFParser(path);
  const sliceHeader = data.slice(0, 3);
  const objInit = fillDataObjInit(sliceHeader);
  const newData = data.slice(4);
  const saveDataTranform = newData.map((item) => {
    const length = item?.length;
    let rawAmount = item?.[2];
    let transferContent = item?.[3];
    if (length < 4) {
      const index = rawAmount?.indexOf('"');
      if (index !== -1) {
        transferContent = rawAmount?.slice(index + 1);
        rawAmount = rawAmount?.slice(0, index);
      }
    }
    transferContent = transferContent?.replace(/"/g, "")?.trim();

    return {
      ...objInit,
      transactionDate: item?.[1],
      amount: convertNumber(rawAmount),
      transferContent: transferContentFunc(transferContent),
      transactionNumber: transactionNumberFunc(transferContent),
    };
  });
  
  writeFilePath(import.meta.url, newFilename, saveDataTranform);
  writeFilePath(import.meta.url, config.nameFileConfig, objInit, config.config);

  return {
    data: saveDataTranform,
    objInit,
  };
};

/**
 * Hàm quét dữ liệu từ VCB và chuyển đổi nó thành đối tượng JSON.
 * @function scanDataVCBMethod2
 * @param {import("../../initConfig.js").BankObject | undefined} objInit
 * @param {string} path - Đường dẫn của file PDF cần quét.
 * @returns {Promise<{ data: Array<Object>, objInit: import("../../initConfig.js").BankObject }>} - Trả về một promise chứa danh sách dữ liệu đã được xử lý và đối tượng khởi tạo.
 */
export const scanDataVCBMethod2 = async (objInit, path) => {
  let { newFilename, data } = await readDataPDFParser(path);
  const objInitBank = initObjBank();
  data = data.slice(5);
  objInitBank.accountNumber = data?.[0]?.[1];
  objInitBank.bankName = objInit.bankName ?? "";
  data = data.slice(7);
  const saveDataTranform = [];
  const dataIngore = data.filter((item) => !checkIngore(item?.[0]));
  dataIngore.map((item, index, arrayBase) => {
    const length = item?.length;
    if (length > 2) {
      const newDate = item?.[0]?.split(" ")[0];
      const missingContent = item?.[length - 1];
      let transferContent = mergeTransfer(missingContent, arrayBase, index + 1);
      transferContent = transferContent?.replace(" .", ".");
      transferContent = transferContent?.replace("ZP6R ", "ZP6R");
      saveDataTranform.push({
        ...objInitBank,
        transactionDate: newDate,
        amount: convertNumber(item?.[1]),
        transferContent: transferContentFunc(transferContent),
        transactionNumber: transactionNumberFunc(transferContent),
      });
    }
  });

  writeFilePath(import.meta.url, newFilename, saveDataTranform);

  return {
    data: saveDataTranform,
    objInit,
  };
};
