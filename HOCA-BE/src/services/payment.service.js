const { PayOS } = require("@payos/node");
const moment = require("moment");
const {
  PAYOS_CLIENT_ID,
  PAYOS_API_KEY,
  PAYOS_CHECKSUM_KEY,
  CLIENT_URL,
  NODE_ENV,
} = require("../config/env");

// Outside of production we don't want a transient PayOS outage / blocked
// network to break local testing. When the gateway is unreachable we fall
// back to the DEV success flow (instant activation). In production we never
// auto-activate — the error is surfaced so no one gets a free subscription.
const IS_PRODUCTION = NODE_ENV === "production";

// A connection error means the request never reached PayOS (DNS/firewall/ISP
// block, timeout, offline). It is safe to fall back in dev for these.
const isConnectionError = (error) =>
  error?.name === "ConnectionError" ||
  error?.code === "ECONNREFUSED" ||
  error?.code === "ETIMEDOUT" ||
  error?.code === "ENOTFOUND" ||
  /connection|network|timeout|ECONN|ENOTFOUND/i.test(error?.message || "");
const Transaction = require("../models/Transaction");
const PricingPlan = require("../models/PricingPlan");
const User = require("../models/User");
const vnpayService = require("./vnpay.service");
const crypto = require("crypto");
const subscriptionService = require("./subscription.service");

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
    payOS = new PayOS({
      clientId: PAYOS_CLIENT_ID,
      apiKey: PAYOS_API_KEY,
      checksumKey: PAYOS_CHECKSUM_KEY,
      // Fail fast instead of hanging when the gateway is unreachable.
      timeout: 15000,
      maxRetries: IS_PRODUCTION ? 2 : 0,
    });
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

const createUniqueOrderCode = async () => {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderCode = crypto.randomInt(100000000, 999999999);
    if (!(await Transaction.exists({ txnRef: String(orderCode) }))) return orderCode;
  }
  throw new Error("Could not allocate a unique payment reference");
};

const assertCanPurchase = async (userId, plan) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  if (subscriptionService.getEffectiveTier(user) === plan.tier) {
    const error = new Error("Gói này của bạn vẫn còn hiệu lực.");
    error.code = "ACTIVE_PLAN_DUPLICATE";
    throw error;
  }
  const pending = await Transaction.exists({
    user: userId,
    plan: plan._id,
    type: "PREMIUM_SUBSCRIPTION",
    status: "PENDING",
    createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) },
  });
  if (pending) {
    const error = new Error("Bạn đã có một giao dịch cho gói này đang chờ xử lý.");
    error.code = "PAYMENT_ALREADY_PENDING";
    throw error;
  }
};

const createPaymentUrl = async (req, userId, planId) => {
  // 1. Get Plan Details
  const plan = await PricingPlan.findById(planId);
  if (!plan) throw new Error("Invalid Pricing Plan");
  if (IS_PRODUCTION && !payOS) {
    throw new Error("PayOS chưa được cấu hình cho môi trường production");
  }
  await assertCanPurchase(userId, plan);

  const amount = plan.price;
  // PayOS requires an integer orderCode below MAX_SAFE_INTEGER
  const safeOrderCode = await createUniqueOrderCode();

  // 2. Create Transaction Pending
  await Transaction.create({
    user: userId,
    plan: planId,
    type: "PREMIUM_SUBSCRIPTION",
    amount: amount,
    txnRef: String(safeOrderCode), // We store the PayOS orderCode as txnRef
    status: "PENDING",
    paymentMethod: "PAYOS",
  });

  // DEV mode: no real gateway -> redirect straight to success page.
  // The frontend will then call /verify which completes the transaction.
  if (!payOS) {
    if (IS_PRODUCTION) {
      throw new Error("PayOS chưa được cấu hình cho môi trường production");
    }
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
    // Outside production, a connection failure (gateway unreachable / blocked
    // network) should not break local testing. Fall back to the DEV success
    // flow so the pending transaction created above can still be verified.
    if (!IS_PRODUCTION && isConnectionError(error)) {
      console.warn(
        "⚠️  PayOS unreachable — falling back to DEV success flow for orderCode",
        safeOrderCode,
      );
      return `${CLIENT_URL}/payment/success?orderCode=${safeOrderCode}&dev=1`;
    }
    throw new Error("Failed to create PayOS link");
  }
};

/**
 * Create a PayOS order and return the full QR payload so we can render the
 * payment screen inside our own UI (no redirect to pay.payos.vn).
 * Returns { qrCode, bin, accountNumber, accountName, amount, orderCode, planName, checkoutUrl }.
 */
const createPayosOrder = async (userId, planId) => {
  const plan = await PricingPlan.findById(planId);
  if (!plan) throw new Error("Invalid Pricing Plan");
  if (IS_PRODUCTION && !payOS) {
    throw new Error("PayOS chưa được cấu hình cho môi trường production");
  }
  await assertCanPurchase(userId, plan);

  const amount = plan.price;
  const safeOrderCode = await createUniqueOrderCode();

  await Transaction.create({
    user: userId,
    plan: planId,
    type: "PREMIUM_SUBSCRIPTION",
    amount,
    txnRef: String(safeOrderCode),
    status: "PENDING",
    paymentMethod: "PAYOS",
  });

  // DEV mode: no gateway configured -> let the caller fall back to success page.
  if (!payOS) {
    if (IS_PRODUCTION) {
      throw new Error("PayOS chưa được cấu hình cho môi trường production");
    }
    return {
      dev: true,
      orderCode: safeOrderCode,
      amount,
      planName: plan.name,
      successUrl: `${CLIENT_URL}/payment/success?orderCode=${safeOrderCode}&dev=1`,
    };
  }

  const body = {
    orderCode: safeOrderCode,
    amount,
    description: `HOCA ${safeOrderCode}`.slice(0, 25),
    items: [{ name: plan.name, quantity: 1, price: amount }],
    returnUrl: `${CLIENT_URL}/payment/success`,
    cancelUrl: `${CLIENT_URL}/payment/failed`,
  };

  try {
    const res = await payOS.paymentRequests.create(body);
    return {
      orderCode: res.orderCode,
      amount: res.amount,
      qrCode: res.qrCode,
      bin: res.bin,
      accountNumber: res.accountNumber,
      accountName: res.accountName,
      description: res.description,
      checkoutUrl: res.checkoutUrl,
      planName: plan.name,
    };
  } catch (error) {
    console.error("PayOS Create Error:", error);
    // Dev fallback when the gateway is unreachable (see createPaymentUrl).
    if (!IS_PRODUCTION && isConnectionError(error)) {
      console.warn(
        "⚠️  PayOS unreachable — falling back to DEV success flow for orderCode",
        safeOrderCode,
      );
      return {
        dev: true,
        orderCode: safeOrderCode,
        amount,
        planName: plan.name,
        successUrl: `${CLIENT_URL}/payment/success?orderCode=${safeOrderCode}&dev=1`,
      };
    }
    throw new Error("Không tạo được mã thanh toán PayOS");
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
const activateSubscriptionForTransaction = async (transaction) => {
  if (transaction.type !== "PREMIUM_SUBSCRIPTION" || !transaction.plan) {
    return null;
  }

  const user = await User.findById(transaction.user);
  if (!user) throw new Error("User not found");

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
  return user;
};

const completeTransaction = async (
  txnRef,
  providerTransactionNo,
  { skipProviderVerify = false } = {},
) => {
  const transaction = await Transaction.findOne({ txnRef }).populate("plan");
  if (!transaction) return false;

  if (transaction.status === "COMPLETED") return true;

  // In DEV mode (no PayOS configured) we skip the gateway verification.
  // With PayOS configured, verify the payment was actually PAID before activating.
  if (payOS && !skipProviderVerify) {
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
  if (!payOS && IS_PRODUCTION && !skipProviderVerify) return false;

  transaction.status = "COMPLETED";
  transaction.vnpayTransactionNo =
    providerTransactionNo || (payOS ? "PAYOS" : "DEV"); // Reuse field or add new
  transaction.completedAt = new Date();
  await transaction.save();

  await activateSubscriptionForTransaction(transaction);

  return true;
};

const listPendingAdminPayments = async () => {
  return Transaction.find({
    type: "PREMIUM_SUBSCRIPTION",
    status: "PENDING",
  })
    .sort({ createdAt: -1 })
    .limit(100)
    .populate("user", "displayName email avatar subscriptionTier")
    .populate("plan", "name price tier durationDays")
    .lean();
};

const confirmAdminPayment = async (txnRef) => {
  const pendingTransaction = await Transaction.findOne({
    txnRef: String(txnRef),
    status: "PENDING",
  });
  if (!pendingTransaction) throw new Error("Không tìm thấy đơn chờ xác nhận");

  const success = await completeTransaction(String(txnRef), "ADMIN_CONFIRM", {
    skipProviderVerify: true,
  });
  if (!success) throw new Error("Không tìm thấy đơn chờ xác nhận");

  return Transaction.findOne({ txnRef: String(txnRef) })
    .populate("user", "displayName email subscriptionTier subscriptionExpiry")
    .populate("plan", "name price tier durationDays");
};

const deletePendingAdminPayment = async (txnRef) => {
  const transaction = await Transaction.findOne({
    txnRef: String(txnRef),
    status: "PENDING",
  });

  if (!transaction) throw new Error("Khong tim thay don cho xac nhan");

  await Transaction.deleteOne({ _id: transaction._id });
  return true;
};

const grantPlanByAdmin = async ({ userId, planId, adminId, note }) => {
  const [user, plan] = await Promise.all([
    User.findById(userId),
    PricingPlan.findById(planId),
  ]);

  if (!user) throw new Error("Không tìm thấy người dùng");
  if (!plan) throw new Error("Không tìm thấy gói");

  const txnRef = `ADMIN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const transaction = await Transaction.create({
    user: user._id,
    plan: plan._id,
    type: "PREMIUM_SUBSCRIPTION",
    amount: plan.price,
    txnRef,
    status: "COMPLETED",
    paymentMethod: "ADMIN",
    vnpayTransactionNo: "ADMIN_GRANT",
    description:
      note ||
      `Admin ${adminId ? adminId.toString() : ""} cấp gói ${plan.name}`.trim(),
    completedAt: new Date(),
  });

  await transaction.populate("plan");
  await activateSubscriptionForTransaction(transaction);

  return Transaction.findById(transaction._id)
    .populate("user", "displayName email subscriptionTier subscriptionExpiry")
    .populate("plan", "name price tier durationDays");
};

const getUserTransactions = async (userId, page = 1, limit = 10) => {
  page = Math.max(1, Number(page) || 1);
  limit = Math.min(50, Math.max(1, Number(limit) || 10));
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    Transaction.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("plan", "name price currency durationDays")
      .lean(),
    Transaction.countDocuments({ user: userId }),
  ]);

  return {
    transactions,
    total,
    page: Number(page),
    totalPages: Math.ceil(total / limit),
  };
};

const getUserTransaction = async (userId, transactionId) => {
  const transaction = await Transaction.findOne({ _id: transactionId, user: userId })
    .populate('plan', 'name price currency tier durationDays features')
    .populate('user', 'displayName email')
    .lean();
  if (!transaction) {
    const error = new Error('Không tìm thấy giao dịch');
    error.statusCode = 404;
    throw error;
  }
  return transaction;
};

const retryUserTransaction = async (userId, transactionId, ipAddr) => {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    user: userId,
    status: 'FAILED',
    type: 'PREMIUM_SUBSCRIPTION',
  });
  if (!transaction?.plan) {
    const error = new Error('Giao dịch này không thể thanh toán lại');
    error.statusCode = 400;
    throw error;
  }

  if (transaction.paymentMethod === 'VNPAY') {
    const result = await createVnpayUrl(userId, transaction.plan, ipAddr);
    return { provider: 'VNPAY', ...result };
  }
  const result = await createPayosOrder(userId, transaction.plan);
  return { provider: 'PAYOS', ...result };
};

const requestRefund = async (userId, transactionId, reason) => {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    user: userId,
    status: 'COMPLETED',
  });
  if (!transaction) {
    const error = new Error('Chỉ giao dịch thành công mới có thể yêu cầu hoàn tiền');
    error.statusCode = 400;
    throw error;
  }
  if (transaction.refundStatus && transaction.refundStatus !== 'NONE') {
    const error = new Error('Giao dịch này đã có yêu cầu hoàn tiền');
    error.statusCode = 409;
    throw error;
  }
  const completedAt = transaction.completedAt || transaction.createdAt;
  if (Date.now() - new Date(completedAt).getTime() > 7 * 24 * 60 * 60 * 1000) {
    const error = new Error('Thời hạn yêu cầu hoàn tiền là 7 ngày');
    error.statusCode = 400;
    throw error;
  }
  const cleanReason = String(reason || '').trim();
  if (cleanReason.length < 10) {
    const error = new Error('Vui lòng mô tả lý do ít nhất 10 ký tự');
    error.statusCode = 400;
    throw error;
  }
  transaction.refundStatus = 'REQUESTED';
  transaction.refundReason = cleanReason.slice(0, 1000);
  transaction.refundRequestedAt = new Date();
  await transaction.save();
  return { success: true, refundStatus: transaction.refundStatus };
};

/**
 * Poll a PayOS order's status. If PayOS reports PAID, complete the transaction
 * (activate subscription) and return COMPLETED so the UI can refresh.
 */
const getPayosStatus = async (userId, orderCode) => {
  const txn = await Transaction.findOne({
    txnRef: String(orderCode),
    user: userId,
  });
  if (!txn) throw new Error("Transaction not found");

  if (txn.status === "COMPLETED") {
    return { status: "COMPLETED", completedAt: txn.completedAt };
  }

  // Ask PayOS whether the order is paid yet.
  if (payOS) {
    try {
      const info = await payOS.paymentRequests.get(Number(orderCode));
      if (info.status === "PAID") {
        await completeTransaction(String(orderCode), "PAYOS");
        return { status: "COMPLETED" };
      }
      if (info.status === "CANCELLED" || info.status === "EXPIRED") {
        txn.status = "FAILED";
        await txn.save();
        return { status: "FAILED" };
      }
    } catch (e) {
      console.error("PayOS status check error:", e.message);
    }
  }

  return { status: txn.status };
};

const getPublicPaymentStatus = async (orderCode) => {
  const txnRef = String(orderCode || "").trim();
  if (!/^\d{6,18}$/.test(txnRef)) throw new Error("Invalid order code");

  const transaction = await Transaction.findOne({
    txnRef,
    paymentMethod: "PAYOS",
  }).select("status completedAt");
  if (!transaction) throw new Error("Transaction not found");

  // If still pending, try to complete it now (idempotent — completeTransaction checks status first).
  if (transaction.status === "PENDING") {
    try {
      await completeTransaction(txnRef, 'PAYOS_PUBLIC_STATUS');
    } catch (e) {
      console.warn(`getPublicPaymentStatus: completeTransaction failed for ${txnRef}:`, e.message);
    }
    const refreshed = await Transaction.findById(transaction._id).select(
      "status completedAt",
    );
    return { status: refreshed.status, completedAt: refreshed.completedAt };
  }

  return { status: transaction.status, completedAt: transaction.completedAt };
};

const handlePayosWebhook = async (payload) => {
  if (!payOS) throw new Error("PayOS is not configured");

  let data;
  try {
    data = await payOS.webhooks.verify(payload);
  } catch (err) {
    console.error("PayOS webhook signature verification failed:", err.message);
    throw new Error("Invalid webhook signature");
  }

  const txnRef = String(data.orderCode);
  console.log(`PayOS webhook received: orderCode=${txnRef}, code=${data.code}`);

  if (data.code === "00") {
    // Webhook already verified the signature, skip provider double-check
    const completed = await completeTransaction(txnRef, data.reference || "PAYOS_WEBHOOK", {
      skipProviderVerify: true,
    });
    if (!completed) {
      console.warn(`PayOS webhook: transaction ${txnRef} not found or already completed`);
      // PayOS sends a signed test payload while registering the webhook.
      // A valid but unknown order must still be acknowledged.
    } else {
      console.log(`PayOS webhook: transaction ${txnRef} completed successfully`);
    }
  } else {
    console.warn(`PayOS webhook: non-success code for ${txnRef}: ${data.code} — ${data.desc || ''}`);
  }

  return { orderCode: data.orderCode, code: data.code };
};

// ============ VNPay online payment gateway ============

const VNPAY_ENABLED = vnpayService.VNPAY_CONFIGURED;

/**
 * Create a VNPay checkout URL for a plan. Creates a PENDING transaction and
 * returns the hosted-checkout URL the buyer should be redirected to.
 */
const createVnpayUrl = async (userId, planId, ipAddr) => {
  const plan = await PricingPlan.findById(planId);
  if (!plan) throw new Error("Invalid Pricing Plan");

  if (!VNPAY_ENABLED) {
    throw new Error(
      "Cổng thanh toán VNPay chưa được cấu hình. Vui lòng liên hệ quản trị viên.",
    );
  }

  // VNPay requires vnp_TxnRef to be unique per merchant. Use a numeric ref.
  const orderId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  await Transaction.create({
    user: userId,
    plan: planId,
    type: "PREMIUM_SUBSCRIPTION",
    amount: plan.price,
    txnRef: orderId,
    status: "PENDING",
    paymentMethod: "VNPAY",
  });

  const url = vnpayService.createPaymentUrl({
    orderId,
    amount: plan.price,
    orderInfo: `Mua goi ${plan.name}`,
    ipAddr,
  });

  return { url, orderId };
};

/**
 * Handle a verified VNPay result (from the return URL or the IPN webhook).
 * Validates the signature, then completes the transaction on success.
 * @returns {{ isValid, isSuccess, orderId, responseCode }}
 */
const handleVnpayResult = async (query) => {
  const result = vnpayService.verifyResponse(query);
  if (!result.isValid) return { isValid: false, isSuccess: false };

  if (result.isSuccess && result.orderId) {
    await completeTransaction(String(result.orderId), result.transactionNo);
  } else if (result.orderId) {
    // Mark the order as failed so the user can retry cleanly.
    await Transaction.updateOne(
      { txnRef: String(result.orderId), status: "PENDING" },
      { $set: { status: "FAILED" } },
    );
  }

  return result;
};

module.exports = {
  PAYOS_CONFIGURED,
  createPaymentUrl,
  createPayosOrder,
  getPayosStatus,
  getPublicPaymentStatus,
  handlePayosWebhook,
  verifyReturnUrl,
  completeTransaction,
  getUserTransactions,
  getUserTransaction,
  retryUserTransaction,
  requestRefund,
  listPendingAdminPayments,
  confirmAdminPayment,
  deletePendingAdminPayment,
  grantPlanByAdmin,
  // VNPay
  VNPAY_ENABLED,
  createVnpayUrl,
  handleVnpayResult,
};
