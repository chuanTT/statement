import { writeFilePath } from "../../checkPathSource.js";
import {
  convertNumber,
  loopSliceValue,
  loopSliceValueTransfer,
  readDataPDFParser,
  sliceDetailBank,
  transactionNumberFunc,
} from "../../functions.js";
import { config, initObjBank } from "../../initConfig.js";

/**
 * Hàm quét dữ liệu từ BIDV và chuyển đổi nó thành đối tượng JSON.
 * @function scanDataBIDV
 * @param {string} path - Đường dẫn của file PDF cần quét.
 * @returns {Promise<{ data: Array<Object>, objInit: import("../../initConfig.js").BankObject }>} - Trả về một promise chứa danh sách dữ liệu đã được xử lý và đối tượng khởi tạo.
 */
export const scanDataBIDV = async (path) => {
  const { newFilename, data } = await readDataPDFParser(path);
  const objBank = initObjBank();
  objBank.bankName = data?.[0]?.[0];
  objBank.accountNumber = sliceDetailBank(data?.[8]?.[0]);
  let accountNumberOld = data?.[9]?.[0]?.replace(/[()]/g, "");
  accountNumberOld = sliceDetailBank(accountNumberOld);
  let newData = data?.slice(12);
  newData = newData?.filter((item) => item?.length > 2);
  const saveDataTranform = newData?.map((item) => {
    const newDate = (item?.length === 5 ? item?.[2] : item?.[1])?.split(" ")[0];
    let transferContent = item?.[3] ?? "";
    let transactionNumber = "";
    if (transferContent?.startsWith(objBank?.accountNumber)) {
      const indexAccountNumber = objBank?.accountNumber?.length;
      transferContent = transferContent?.slice(indexAccountNumber)?.trim();
    } else if (transferContent?.startsWith("TKThe")) {
      transferContent = loopSliceValueTransfer(transferContent, 4, " ");
      const indexOldNumber = transferContent?.indexOf(accountNumberOld);
      if (indexOldNumber !== -1) {
        transferContent = transferContent?.slice(
          indexOldNumber + accountNumberOld?.length + 1
        );
      } else if (transferContent?.startsWith("MBVCB.")) {
        const newTransfer = transferContent;
        transferContent = loopSliceValueTransfer(newTransfer, 3);
        transactionNumber = transactionNumberFunc(newTransfer);
      }
    } else if (transferContent?.startsWith("REM Tfr Ac")) {
      let newTransfer = loopSliceValueTransfer(transferContent, 4, " ");
      transactionNumber = loopSliceValue(newTransfer, 1, " ");
      transferContent = loopSliceValueTransfer(newTransfer, 2, " ");
    }
    
    return {
      ...objBank,
      transactionDate: newDate,
      amount: convertNumber(item?.[2]),
      transferContent: transferContent ?? "",
      transactionNumber,
    };
  });

  writeFilePath(import.meta.url, newFilename, saveDataTranform);
  writeFilePath(import.meta.url, config.nameFileConfig, objBank, config.config);

  return {
    data: saveDataTranform,
    objInit: objBank,
  };
};
