import { loopReadDir } from "../../checkPathSource.js";
import { scanDataVietinbankMethod1 } from "./function.js";

(async () => {
  await loopReadDir(import.meta.url, async (path) => {
    await scanDataVietinbankMethod1(path, true);
  });
})();
