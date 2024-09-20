import { scanDataVCB } from "./function.js";
import { loopReadDir } from "../../checkPathSource.js";

await (async () => {
  await loopReadDir(import.meta.url, async (path) => {
    await scanDataVCB(path);
  });
})();
