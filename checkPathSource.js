import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { config } from "./initConfig.js";
import { existsSync, mkdirSync, writeFileSync } from "fs";

/**
 * @function
 * @param {string} url
 * @returns {string}
 */
export const baseDir = (url) => {
  const __filename = fileURLToPath(url);
  const __dirname = dirname(__filename);
  return __dirname;
};

export const __dirname = baseDir(import.meta.url);
export const pathSource = join(__dirname, config.source);
export const joinPathName = (...paths) => join(pathSource, ...paths);
export const pathVCB = joinPathName(config.vcb);
export const pathVietinBank = joinPathName(config.vietinbank);
export const pathBIDV = joinPathName(config.bidv);

/**
 * @function
 * @param {string} path
 * @returns {string}
 */

export const checkPathCreateFolder = (path) => {
  let error = false;
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
    error = true;
  }

  return error;
};

/**
 * @function
 * @param {string} path
 * @param {string} filename
 * @param {any[]} data
 * @param {boolean} isJson [isJson=true]
 * @returns {string}
 */
export const writeFilePath = (path, filename, data, isJson = true) => {
  const baseDirStr = baseDir(path);
  let arrPath = baseDirStr?.split("\\");
  const dirname = arrPath?.[arrPath?.length - 1];
  arrPath = arrPath.slice(0, arrPath?.length - 2);
  const baseUrl = join(...arrPath, config.store, dirname);
  checkPathCreateFolder(baseUrl);
  writeFileSync(join(baseUrl, filename), isJson ? JSON.stringify(data) : data);
};
