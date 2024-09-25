// pdfWorker.js
import { PdfDataParser } from "pdf-data-parser";
import { parentPort } from "worker_threads";
import { fileNameFunc } from "./checkPathSource.js";

export const readDataPDFParser = async (path, pageStart = 1, limit = 10) => {
  const { newFilename } = fileNameFunc(path);
  const arrPage = Array(limit)
    .fill("")
    .map((_, index) => index + pageStart);

  const DataParser = new PdfDataParser({
    url: path,
    pages: arrPage,
  });
  const data = await DataParser.parse();
  console.log(arrPage?.join(" - "), "----> Done");
  return {
    data,
    newFilename,
    pageStart,
    limit,
  };
};

// Lắng nghe tin nhắn từ main thread
parentPort.on("message", async ({ path, pageStart }) => {
  try {
    let {
      newFilename,
      data,
      limit,
      pageStart: newPageStart,
    } = await readDataPDFParser(path, pageStart);

    parentPort.postMessage({
      data,
      newFilename,
      pageStart: newPageStart,
      limit,
    }); // Gửi kết quả trở lại main thread
  } catch (err) {
    console.log(err);
    parentPort.postMessage([]);
  }
});
