import {
  loopReadDir,
  pathConfigBIDV,
  readFileConfig,
} from "../../checkPathSource.js";
import { scanDataBIDV2 } from "./function.js";

(async () => {
  const objInit = readFileConfig(pathConfigBIDV);
  await loopReadDir(import.meta.url, async (path) => {
    await scanDataBIDV2(objInit, path);
  });
})();
