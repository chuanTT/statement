import { loopReadDir, pathConfigVCB, readFileConfig } from "../../checkPathSource.js";
import { scanDataVCBMethod3 } from "./function.js";

await (async () => {
  const objInit = readFileConfig(pathConfigVCB);
  await loopReadDir(import.meta.url, async (path) => {
    await scanDataVCBMethod3(objInit, path);
  });
})();
