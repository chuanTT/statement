import { cpus } from "os";
import path from "path";
import { Worker } from "worker_threads";
import { pathBIDV, pathVCB, writeFilePath } from "./checkPathSource.js";

const numCPUs = cpus().length;
const maxWorkers = Math.min(5, numCPUs);

const worker = new Worker(path.resolve("./worker_pdf.js"));

const pathStr = path.resolve(pathBIDV, "Method1", "01.09-12.09.2024.pdf");
// Gửi dữ liệu cho worker
worker.postMessage({
  path: pathStr,
});

let newData = [];

// Lắng nghe kết quả từ worker
worker.on("message", (result) => {
  const { data, newFilename, pageStart, limit } = result ?? {};
  const isStop = data?.[0];
  console.info(isStop?.[0]);
  if (isStop) {
    newData = [...newData, ...data];
    worker.postMessage({
      path: pathStr,
      pageStart: pageStart + limit,
    });
  } else {
    fs
    writeFilePath(import.meta.url, `./test/${newFilename}.json`, newData);
    console.log(newFilename)
    console.log(newData)
    // Sau khi hoàn thành, dừng worker
    worker.terminate();
  }
});
