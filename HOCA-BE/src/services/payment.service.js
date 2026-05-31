const { PayOS } = require("@payos/node");
const moment = require("moment");
const {
  PAYOS_CLIENT_ID,
  PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY,
  CLIENT_URL,
} = require("../config/env");
const Transaction = require("../models/Transaction");
const PricingPlan = require("../models/PricingPlan");
const User = require("../models/User");

// Detect whether real PayOS credentials are configured.
// When not configured (placeholder values), we run in DEV mode:
// the subscription is activated instantly without a real payment gateway.
const isPlaceholder = (v) =>
  !v || typeof v !== "string" || v.startsWith("your-") || v.trim() === "";

const PAYOS_CONFIGURED =
  !isPlaceholder(PAYOS_CLIENT_ID) &&
  !isPlaceholder(PAYOS_API_KEY) &&
  !isPlaceholder(PAYOS_CHECKSUM_KEY);

let payOS = null;
if (PAYOS_CONFIGURED) {
  try {
    payOS = new PayOS(PAYOS_CLIENT_ID, PAYOS_API_KEY, PAYOS_CHECKSUM_KEY);
  } catch (e) {
    console.error(
      "PayOS init failed, falling back to DEV payment mode:",
      e.message,
    );
  }
} else {
  console.log(
    "⚠️  PayOS not configured — using DEV payment mode (instant activation).",
  );
}

const createPaymentUrl = async (req, userId, planId) => {
  // 1. Get Plan Details
  const plan = await PricingPlan.findById(planId);
  if (!plan) throw new Error("Invalid Pricing Plan");

  const amount = plan.price;
  // PayOS requires an integer orderCode below MAX_SAFE_INTEGER
  const safeOrderCode = Math.floor(Math.random() * 1000000000);

  // 2. Create Transaction Pending
  await Transaction.create({
    user: userId,
    plan: planId,
    type: "PREMIUM_SUBSCRIPTION",
    amount: amount,
    txnRef: String(safeOrderCode), // We store the PayOS orderCode as txnRef
    status: "PENDING",
  });

  // DEV mode: no real gateway -> redirect straight to success page.
  // The frontend will then call /verify which completes the transaction.
  if (!payOS) {
    return `${CLIENT_URL}/payment/success?orderCode=${safeOrderCode}&dev=1`;
  }

  // 3. Create PayOS Payment Link
  const YOUR_DOMAIN = CLIENT_URL;
  const body = {
    orderCode: safeOrderCode,
    amount: amount,
    description: `Mua goi ${plan.name}`.slice(0, 25), // Description limited length
    items: [
      {
        name: plan.name,
        quantity: 1,
        price: amount,
      },
    ],
    returnUrl: `${YOUR_DOMAIN}/payment/success`, // PayOS redirects here on success
    cancelUrl: `${YOUR_DOMAIN}/payment/failed`, // PayOS redirects here on cancel
  };

  try {
    const paymentLinkRes = await payOS.paymentRequests.create(body);
    return paymentLinkRes.checkoutUrl;
  } catch (error) {
    console.error("PayOS Create Error:", error);
    throw new Error("Failed to create PayOS link");
  }
};

// Verify not strictly needed via URL params for PayOS if we trust their redirect or use Webhook.
// However, if we want to validte the return manually via an API call to PayOS (Double Check)
const verifyReturnUrl = async (query) => {
  // Basic implementation: We can just return true and let the frontend call completeTransaction
  // OR we can verify signatures if PayOS appends them to returnUrl (they usually do).
  // For simplicity with PayOS node SDK, we can getPaymentLinkInformation to verify status.
  return true;
};

// This function needs to be updated to check status against PayOS if via return URL
// OR just trust the call if we assume it comes from a secure flow (but better to verify).
const completeTransaction = async (txnRef, providerTransactionNo) => {
  const transaction = await Transaction.findOne({ txnRef }).populate("plan");
  if (!transaction) return false;

  if (transaction.status === "COMPLETED") return true;

  // Bank QR transfers are confirmed manually by an admin -> skip gateway check.
  // In DEV mode (no PayOS configured) we also skip the gateway verification.
  // With PayOS configured, verify the payment was actually PAID.
  if (payOS && transaction.paymentMethod !== "BANK_QR") {
    try {
      const paymentLinkInfo = await payOS.paymentRequests.get(Number(txnRef));
      if (paymentLinkInfo.status !== "PAID") {
        return false;
      }
    } catch (e) {
      console.error("PayOS Verify Error:", e);
      return false;
    }
  }

  transaction.status = "COMPLETED";
  transaction.vnpayTransactionNo =
    providerTransactionNo || (payOS ? "PAYOS" : "DEV"); // Reuse field or add new
  transaction.completedAt = new Date();
  await transaction.save();

  // Activate Subscription
  if (transaction.type === "PREMIUM_SUBSCRIPTION" && transaction.plan) {
    const user = await User.findById(transaction.user);

    const now = new Date();
    const plan = transaction.plan;

    user.subscriptionTier = plan.tier;
    user.subscriptionStartDate = now;

    if (plan.tier === "LIFETIME") {
      user.subscriptionExpiry = null;
    } else {
      const currentExpiry =
        user.subscriptionExpiry && user.subscriptionExpiry > now
          ? new Date(user.subscriptionExpiry)
          : now;
      currentExpiry.setDate(currentExpiry.getDate() + plan.durationDays);
      user.subscriptionExpiry = currentExpiry;
    }

    await user.save();
  }

  return true;
};

const getUserTransactions = async (userId, page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const transactions = await Transaction.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate("plan", "name price currency durationDays");

  const total = await Transaction.countDocuments({ user: userId });

  return {
    transactions,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};

// ============ Bank QR (VietQR) Payment ============
const {
  BANK_ID,
  BANK_ACCOUNT_NO,
  BANK_ACCOUNT_NAME,
  BANK_MEMO_PREFIX,
} = require("../config/env");

const BANK_CONFIGURED =
  !isPlaceholder(BANK_ID) &&
  !isPlaceholder(BANK_ACCOUNT_NO) &&
  BANK_ACCOUNT_NO !== "0000000000";

/**
 * Create a bank-transfer QR (VietQR) for a plan.
 * Returns a scannable QR image URL with the exact amount and a unique memo.
 * The order stays PENDING until the admin confirms the received transfer.
 */
const createBankQR = async (userId, planId) => {
  const plan = await PricingPlan.findById(planId);
  if (!plan) throw new Error("Invalid Pricing Plan");

  if (!BANK_CONFIGURED) {
    throw new Error(
      "Chưa cấu hình tài khoản ngân hàng nhận tiền. Vui lòng liên hệ quản trị viên.",
    );
  }

  // Unique short memo so the admin can match the transfer to this order.
  // Includes the required prefix (e.g. "HOCA KHOA HOC") + a unique code.
  const uniqueCode = String(Date.now()).slice(-6);
  const prefix = (BANK_MEMO_PREFIX && BANK_MEMO_PREFIX.trim()) || "HOCA";
  const memo = `${prefix} ${uniqueCode}`;

  await Transaction.create({
    user: userId,
    plan: planId,
    type: "PREMIUM_SUBSCRIPTION",
    amount: plan.price,
    txnRef: memo,
    status: "PENDING",
    paymentMethod: "BANK_QR",
  });

  // VietQR quick-link image (no API key required)
  const qrUrl =
    `https://img.vietqr.io/image/${encodeURIComponent(BANK_ID)}-${encodeURIComponent(BANK_ACCOUNT_NO)}-compact2.png` +
    `?amount=${plan.price}` +
    `&addInfo=${encodeURIComponent(memo)}` +
    `&accountName=${encodeURIComponent(BANK_ACCOUNT_NAME)}`;

  return {
    qrUrl,
    memo,
    amount: plan.price,
    bankId: BANK_ID,
    accountNo: BANK_ACCOUNT_NO,
    accountName: BANK_ACCOUNT_NAME,
    planName: plan.name,
  };
};

/** Get current status of an order by its memo (txnRef) for the polling UI. */
const getTransactionStatus = async (userId, memo) => {
  const txn = await Transaction.findOne({ txnRef: memo, user: userId });
  if (!txn) throw new Error("Transaction not found");
  return { status: txn.status, completedAt: txn.completedAt };
};

/** Admin confirms a received bank transfer -> activates the subscription. */
const confirmTransaction = async (txnRef) => {
  const ok = await completeTransaction(String(txnRef), "BANK_QR");
  if (!ok) throw new Error("Could not confirm transaction");
  return true;
};

/** Admin: list pending bank-transfer orders awaiting confirmation. */
const getPendingTransactions = async () => {
  return Transaction.find({ status: "PENDING", paymentMethod: "BANK_QR" })
    .sort({ createdAt: -1 })
    .populate("user", "displayName email")
    .populate("plan", "name price tier");
};

module.exports = {
  createPaymentUrl,
  verifyReturnUrl,
  completeTransaction,
  getUserTransactions,
  createBankQR,
  getTransactionStatus,
  confirmTransaction,
  getPendingTransactions,
};
