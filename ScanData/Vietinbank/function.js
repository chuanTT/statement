import { writeFilePath } from "../../checkPathSource.js";
import {
  convertNumber,
  loopSliceValue,
  readDataPDFParser,
  sliceDetailBank,
} from "../../functions.js";
import { config, initObjBank } from "../../initConfig.js";

/**
 * Hàm quét dữ liệu từ Vietinbank và chuyển đổi nó thành đối tượng JSON.
 * @function scanDataVietinbank
 * @param {string} path - Đường dẫn của file PDF cần quét.
 * @returns {Promise<{ data: Array<Object>, objInit: import("../../initConfig.js").BankObject }>} - Trả về một promise chứa danh sách dữ liệu đã được xử lý và đối tượng khởi tạo.
 */

export const scanDataVietinbank = async (path) => {
  let { data, newFilename } = await readDataPDFParser(path);
  const objBank = initObjBank();
  objBank.bankName = data?.[1]?.[0];
  let rawAccountNumber = sliceDetailBank(data?.[8]?.[0]);
  rawAccountNumber = loopSliceValue(rawAccountNumber, 2, " ");
  const lengthDate = loopSliceValue(data?.[5]?.[0], 3, " ")?.length;
  data = data?.slice(12);
  data = data?.filter((item) => item?.length > 1);
  const saveDataTranform = data.map((item) => {
    let newDate = item?.[0]?.split(" ")?.[0];
    newDate = newDate.slice(-lengthDate);
    return {
      ...objBank,
      transactionDate: newDate,
      amount: convertNumber(item?.[2]),
      transferContent: item?.[1] ?? "",
      transactionNumber: "",
    };
  });

  writeFilePath(import.meta.url, newFilename, saveDataTranform);
  writeFilePath(import.meta.url, config.nameFileConfig, objBank, config.config);

  return {
    data: saveDataTranform,
    objInit: objBank,
  };
};
