import { PdfDataParser } from "pdf-data-parser";
import { pathVCB, writeFilePath } from "../../checkPathSource.js";
import { join } from "path";
import { initObjBank } from "../../initConfig.js";
import {
  checkIngore,
  convertNumber,
  formatDate,
  mergeTransfer,
  sliceDetailBank,
  transactionNumberFunc,
  transferContentFunc,
} from "../../functions.js";

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

export const scanDataVCB = async () => {
  const DataParser = new PdfDataParser({
    url: join(pathVCB, "11.09.2024.pdf"),
    pages: [1],
  });
  let data = await DataParser.parse();
  const sliceHeader = data.slice(0, 3);
  const objInit = fillDataObjInit(sliceHeader);
  const newData = data.slice(4);
  const saveDataTranform = newData.map((item) => {
    const transferContent = item?.[3]?.replace(/"/g, "")?.trim();
    return {
      ...objInit,
      transactionDate: item?.[1],
      amount: convertNumber(item?.[2]),
      transferContent: transferContentFunc(transferContent),
      transactionNumber: transactionNumberFunc(transferContent),
    };
  });

  writeFilePath(
    import.meta.url,
    `${formatDate(objInit?.transactionDate)}.json`,
    saveDataTranform
  );

  return {
    data: saveDataTranform,
    objInit,
  };
};

export const scanDataVCBMethod2 = async (objInit) => {
  const DataParser = new PdfDataParser({
    url: join(pathVCB, "01.09-10.09.2024.pdf"),
    pages: [1, 2],
  });
  let data = await DataParser.parse();
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

  writeFilePath(import.meta.url, `01.09-10.09.2024.json`, saveDataTranform);

  return {
    data: saveDataTranform,
    objInit,
  };
};
