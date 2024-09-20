import { loopReadDir } from "../../checkPathSource.js";
import { scanDataBIDV } from "./function.js";

(async () => {
  await loopReadDir(import.meta.url, async (path) => {
    await scanDataBIDV(path);
  });
})();
