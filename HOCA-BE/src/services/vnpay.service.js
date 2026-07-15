/**
 * VNPay online payment gateway integration.
 *
 * Follows the official VNPay spec (pay.vnpay.vn):
 *   1. Build the vnp_* parameters describing the order.
 *   2. Sort keys alphabetically, URL-encode values (spaces -> "+").
 *   3. Sign the joined query string with HMAC-SHA512 using vnp_HashSecret.
 *   4. Redirect the buyer to vnp_Url with vnp_SecureHash appended.
 *   5. VNPay redirects back to vnp_ReturnUrl and also calls the IPN URL with a
 *      signed result. vnp_ResponseCode === "00" means success.
 *
 * Docs: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 */
const crypto = require("crypto");
const {
  VNPAY_TMN_CODE,
  VNPAY_HASH_SECRET,
  VNPAY_URL,
  VNPAY_RETURN_URL,
  CLIENT_URL,
} = require("../config/env");

const isPlaceholder = (v) =>
  !v || typeof v !== "string" || v.startsWith("your-") || v.trim() === "";

const VNPAY_CONFIGURED =
  !isPlaceholder(VNPAY_TMN_CODE) &&
  !isPlaceholder(VNPAY_HASH_SECRET) &&
  !isPlaceholder(VNPAY_URL);

const PAY_URL =
  VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

const SUCCESS_CODE = "00";

/**
 * Sort an object's keys alphabetically and URL-encode the values the way VNPay
 * expects (encodeURIComponent + spaces as "+"). Returns the encoded object.
 */
const sortObject = (obj) => {
  const sorted = {};
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined && obj[k] !== null && obj[k] !== "")
    .map((k) => encodeURIComponent(k))
    .sort();
  for (const k of keys) {
    sorted[k] = encodeURIComponent(obj[k]).replace(/%20/g, "+");
  }
  return sorted;
};

/** Join an (already-encoded) param object into a query string. */
const toQueryString = (encodedObj) =>
  Object.keys(encodedObj)
    .map((k) => `${k}=${encodedObj[k]}`)
    .join("&");

const hmacSha512 = (data) =>
  crypto
    .createHmac("sha512", VNPAY_HASH_SECRET)
    .update(Buffer.from(data, "utf-8"))
    .digest("hex");

const formatCreateDate = (d = new Date()) => {
  const p = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
};

/**
 * Build the redirect URL to VNPay's hosted checkout.
 * @param {Object} opts
 * @param {string} opts.orderId   unique order reference (stored as txnRef)
 * @param {number} opts.amount    amount in VND (integer)
 * @param {string} opts.orderInfo human-readable description
 * @param {string} [opts.ipAddr]  buyer IP address
 * @param {string} [opts.locale]  "vn" | "en"
 */
const createPaymentUrl = ({
  orderId,
  amount,
  orderInfo,
  ipAddr,
  locale,
  bankCode,
}) => {
  if (!VNPAY_CONFIGURED) {
    throw new Error("VNPay chưa được cấu hình");
  }

  const returnUrl = !isPlaceholder(VNPAY_RETURN_URL)
    ? VNPAY_RETURN_URL
    : `${CLIENT_URL}/payment/success`;

  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: VNPAY_TMN_CODE,
    vnp_Locale: locale === "en" ? "en" : "vn",
    vnp_CurrCode: "VND",
    vnp_TxnRef: orderId,
    vnp_OrderInfo: orderInfo,
    vnp_OrderType: "other",
    // VNPay requires amount * 100 (no decimals).
    vnp_Amount: Math.round(amount) * 100,
    vnp_ReturnUrl: returnUrl,
    vnp_IpAddr: ipAddr || "127.0.0.1",
    vnp_CreateDate: formatCreateDate(),
  };

  // Pre-select a payment method on VNPay's side. "VNPAYQR" jumps straight to the
  // scan-to-pay QR screen so the buyer doesn't have to type card details.
  if (bankCode) {
    params.vnp_BankCode = bankCode;
  }

  const sorted = sortObject(params);
  const signData = toQueryString(sorted);
  const secureHash = hmacSha512(signData);
  sorted.vnp_SecureHash = secureHash;

  const sep = PAY_URL.includes("?") ? "&" : "?";
  return `${PAY_URL}${sep}${toQueryString(sorted)}`;
};

/**
 * Verify a signed response from VNPay (return URL query or IPN).
 * @param {Object} query raw params received from VNPay
 * @returns {{ isValid, isSuccess, orderId, transactionNo, amount, responseCode }}
 */
const verifyResponse = (query) => {
  const received = { ...query };
  const receivedHash = received.vnp_SecureHash;
  delete received.vnp_SecureHash;
  delete received.vnp_SecureHashType;

  const sorted = sortObject(received);
  const signData = toQueryString(sorted);
  const expectedHash = hmacSha512(signData);

  let isValid = false;
  if (receivedHash) {
    try {
      isValid = crypto.timingSafeEqual(
        Buffer.from(String(receivedHash).toLowerCase()),
        Buffer.from(expectedHash.toLowerCase()),
      );
    } catch {
      isValid = false;
    }
  }

  const code = String(received.vnp_ResponseCode ?? "");
  const rawAmount = Number(received.vnp_Amount ?? 0);

  return {
    isValid,
    isSuccess: isValid && code === SUCCESS_CODE,
    orderId: received.vnp_TxnRef,
    transactionNo: received.vnp_TransactionNo,
    amount: rawAmount ? rawAmount / 100 : 0,
    responseCode: code,
  };
};

module.exports = {
  VNPAY_CONFIGURED,
  createPaymentUrl,
  verifyResponse,
  SUCCESS_CODE,
};
