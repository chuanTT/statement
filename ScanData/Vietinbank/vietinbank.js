import { loopReadDir } from "../../checkPathSource.js";
import { scanDataVietinbank } from "./function.js";

(async () => {
  await loopReadDir(import.meta.url, async (path) => {
    await scanDataVietinbank(path);
  });
})();
