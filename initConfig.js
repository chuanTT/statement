/**
 * @typedef {Object} BankObject
 * @property {string} bankName - Tên ngân hàng
 * @property {string} transactionDate - Ngày giao dịch
 * @property {string} accountNumber - Số tài khoản
 */
export const objBank = {
  bankName: "",
  transactionDate: "",
  accountNumber: "",
};

/**
 * Khởi tạo đối tượng ngân hàng mới
 * @returns {BankObject}
 */
export const initObjBank = () => ({ ...objBank });

export const config = {
  store: "Store",
  source: "Source",
  vcb: "VCB",
  vietinbank: "VietinBank",
  bidv: "BIDV",
  config: "Config",
  nameFileConfig: "index.json",

  IBFT: "IBFT",
};
