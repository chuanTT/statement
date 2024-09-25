import { basename, dirname, join, parse } from "path";
import { fileURLToPath } from "url";
import { config } from "./initConfig.js";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "fs";

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

export const pathConfigVCB = join(
  __dirname,
  config.config,
  config.vcb,
  config.nameFileConfig
);
export const pathConfigVietinBank = join(
  __dirname,
  config.config,
  config.vietinbank,
  config.nameFileConfig
);
export const pathConfigBIDV = join(
  __dirname,
  config.config,
  config.bidv,
  config.nameFileConfig
);

/**
 * @function
 * @param {string} path
 * @param {boolean} isParse [isParse=true]
 * @returns {import("./initConfig.js").BankObject | null}
 */
export const readFileConfig = (path, isParse = true) => {
  const data = readFileSync(path);
  return isParse ? JSON.parse(data) : data;
};

/**
 * @function
 * @param {number} number
 * @returns {string}
 */
export const pathMethodDynamic = (number) => `Method${number}`;

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
 * @param {string | undefined} middle
 * @returns {{dirname: string, arrPath: string[], baseUrl: string, middleJoinDirname: string}}
 */
export const tranformPath = (path, middle) => {
  const baseDirStr = baseDir(path);
  let arrPath = baseDirStr?.split("\\");
  const length = arrPath?.length;
  const dirname = arrPath?.[length - 1];
  arrPath = arrPath.slice(0, length - 2);
  const middleJoinDirname = join(middle ? middle : "", dirname);
  const baseUrl = join(...arrPath, middleJoinDirname);
  return {
    dirname,
    arrPath,
    baseUrl,
    middleJoinDirname,
  };
};

/**
 * @function
 * @param {string} path
 * @param {string} filename
 * @param {any[]} data
 * @param {string} datmiddlea
 * @param {boolean} isJson [isJson=true]
 * @returns {string}
 */
export const writeFilePath = (
  path,
  filename,
  data,
  middle = config.store,
  isJson = true
) => {
  const { baseUrl } = tranformPath(path, middle);
  checkPathCreateFolder(baseUrl);
  writeFileSync(join(baseUrl, filename), isJson ? JSON.stringify(data) : data);
};

/**
 * @function
 * @param {string} url
 * @param {string} ext
 * @returns {{filename: string, parseName: string, newFilename: string}}
 */
export const fileNameFunc = (url, ext = "json") => {
  const isImportMeta = url.startsWith("file:///");
  const newUrl = isImportMeta ? fileURLToPath(url) : url;
  let __filename = basename(newUrl);
  let parseName = parse(__filename).name;
  return {
    filename: __filename,
    parseName,
    newFilename: `${parseName}.${ext}`,
  };
};

/**
 * @function
 * @param {string} url
 * @returns {string}
 */
export const checkMethodPath = (url) => {
  const { parseName } = fileNameFunc(url);
  // tranform path bankpath
  let { baseUrl } = tranformPath(url, config.source);

  const _method = "_method";
  const index = parseName.indexOf(_method);
  if (index !== -1) {
    const number = parseName?.substring(index + _method?.length);
    baseUrl = join(baseUrl, pathMethodDynamic(number));
  }
  return baseUrl;
};

/**
 * @function
 * @param {string} url
 * @param {function(string): Promise<void>} asyncFunc
 * @returns {Promise<void>}
 */
export const loopReadDir = async (url, asyncFunc) => {
  const pathMethod = checkMethodPath(url);
  let dataStringFile = readdirSync(pathMethod);
  dataStringFile = dataStringFile?.filter((item) => {
    const ext = parse(item).ext;
    return config?.exts?.includes(ext);
  });

  for (const filename of dataStringFile) {
    const path = join(pathMethod, filename);
    asyncFunc && (await asyncFunc(path));
  }
};
