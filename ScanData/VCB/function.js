import { writeFilePath } from "../../checkPathSource.js";
import { config, initObjBank } from "../../initConfig.js";
import {
  checkIngore,
  convertNumber,
  mergeTransfer,
  readDataPDFParser,
  sliceAmount,
  sliceDate,
  sliceDetailBank,
  sliceFind,
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
      const newDate = sliceDate(item?.[0])
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

/**
 * Hàm quét dữ liệu từ VCB và chuyển đổi nó thành đối tượng JSON.
 * @function scanDataVCBMethod3
 * @param {import("../../initConfig.js").BankObject | undefined} objInit
 * @param {string} path - Đường dẫn của file PDF cần quét.
 * @returns {Promise<{ data: Array<Object>, objInit: import("../../initConfig.js").BankObject }>} - Trả về một promise chứa danh sách dữ liệu đã được xử lý và đối tượng khởi tạo.
 */
export const scanDataVCBMethod3 = async (objInit, path) => {
  let { newFilename, data } = await readDataPDFParser(path);
  const objInitBank = initObjBank();
  data = data?.slice(4);
  objInitBank.accountNumber = sliceDetailBank(data?.[0][0] ?? "0");
  objInitBank.bankName = objInit.bankName ?? "";
  data = data?.slice(4);
  const dataFilter = data?.reduce((total, current) => {
    const length = current?.length;
    const newDate = sliceDate(current[1])
    const amount = sliceAmount(current[2]);
    current[1] = newDate;
    current[2] = amount;
    if (length === 5) {
      current?.splice(3, 1);
    }
    return [...total, current];
  }, []);
  const saveDataTranform = dataFilter.map((item) => {
    let transferContent = item?.[3];
    transferContent = transferContent?.replace(/"/g, "")?.trim();    
    let newContent = transferContentFunc(transferContent)
    newContent = sliceFind(newContent, `${objInitBank?.accountNumber}:`, 0)
    newContent = sliceFind(newContent, config.IBFT)

    return {
      ...objInit,
      transactionDate: item?.[1],
      amount: convertNumber(item?.[2]),
      transferContent: newContent,
      transactionNumber: transactionNumberFunc(transferContent),
    };
  });

  writeFilePath(import.meta.url, newFilename, saveDataTranform);

  return {
    data: saveDataTranform,
    objInit,
  };
};
