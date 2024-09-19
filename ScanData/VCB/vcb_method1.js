import { scanDataVCB } from "./function.js";

let objVcb;
await (async () => {
  const { objInit } = await scanDataVCB();
  objVcb = objInit;
})();

export const objInit = objVcb;
