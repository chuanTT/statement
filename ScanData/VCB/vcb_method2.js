import { loopReadDir, pathConfigVCB, readFileConfig } from "../../checkPathSource.js";
import { scanDataVCBMethod2 } from "./function.js";

(async () => {
  const objInit = readFileConfig(pathConfigVCB)
  await loopReadDir(import.meta.url, async (path) => {
    await scanDataVCBMethod2(objInit, path);
  });
})();

