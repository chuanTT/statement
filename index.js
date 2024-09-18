import fs from "fs";
import { PdfDataReader } from "pdf-data-parser";
import {
  convertNumber,
  formatDate,
  sliceDetailBank,
  transactionNumberFunc,
  transferContentFunc,
} from "./functions.js";

(async () => {
  const reader = new PdfDataReader({
    url: "./statement-14-09-2024.pdf",
    format: "json",
    pages: [1],
    repeatingHeaders: true,
  });
  const rows = [];
  const obj = {
    bankName: "",
    transactionDate: "",
    accountNumber: "",
  };
  const arrKeys = Object.keys(obj);
  let i = 0;

  reader.on("data", (row) => {
    const length = row?.length;
    if (length === 1) {
      const key = arrKeys?.[i];
      if (key) {
        obj[key] = sliceDetailBank(row?.[0]);
      }
    } else if (length === 4 && !row?.includes("STT")) {
      const transferContent = row?.[3]?.replace(/"/g, "")?.trim();
      rows.push({
        ...obj,
        transactionDate: row?.[1] ?? formatDate(obj?.transactionDate),
        amount: convertNumber(row?.[2]),
        transferContent: transferContentFunc(transferContent),
        transactionNumber: transactionNumberFunc(transferContent),
      });
    }
    i++;
  });

  reader.on("end", () => {
    fs.writeFileSync(
      `${formatDate(obj.transactionDate)}.json`,
      JSON.stringify(rows)
    );
    // do something with the rows
  });

  reader.on("error", (err) => {
    // log error
  });
})();
