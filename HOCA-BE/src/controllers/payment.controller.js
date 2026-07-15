const paymentService = require("../services/payment.service");

const createPayment = async (req, reply) => {
  try {
    const { planId } = req.body;
    const url = await paymentService.createPaymentUrl(req, req.user.id, planId);
    reply.send({ url });
  } catch (error) {
    console.error(error);
    reply.code(500).send({ message: error.message });
  }
};

// New endpoint: Frontend calls this after returning from PayOS to confirm status
const verifyPayment = async (req, reply) => {
  try {
    const { orderCode } = req.body; // or req.query
    if (!orderCode) {
      return reply.code(400).send({ message: "Missing orderCode" });
    }

    const success = await paymentService.completeTransaction(String(orderCode));
    if (success) {
      reply.send({
        success: true,
        message: "Payment verified and subscription activated.",
      });
    } else {
      reply.code(400).send({
        success: false,
        message: "Payment verification failed or not paid.",
      });
    }
  } catch (error) {
    console.error(error);
    reply.code(500).send({ message: error.message });
  }
};

// Legacy/Unused for PayOS Direct-to-Frontend flow, but keeping if we switch strategy
const vnpayReturn = async (req, reply) => {
  // Not used in PayOS frontend-redirect flow
  reply.send({ message: "Legacy endpoint" });
};

const getMyTransactions = async (req, reply) => {
  try {
    const { page, limit } = req.query;
    const result = await paymentService.getUserTransactions(
      req.user.id,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
    reply.send(result);
  } catch (error) {
    console.error(error);
    reply.code(500).send({ message: error.message });
  }
};

// Create a PayOS order and return full QR data to render in our own UI
const createPayosQR = async (req, reply) => {
  try {
    const { planId } = req.body;
    if (!planId) return reply.code(400).send({ message: "Missing planId" });
    const data = await paymentService.createPayosOrder(req.user.id, planId);
    reply.send(data);
  } catch (error) {
    console.error("PayOS QR create error:", error);
    reply.code(400).send({ message: error.message });
  }
};

// Poll a PayOS order status (also completes the transaction when paid)
const payosStatus = async (req, reply) => {
  try {
    const { orderCode } = req.params;
    const data = await paymentService.getPayosStatus(req.user.id, orderCode);
    reply.send(data);
  } catch (error) {
    reply.code(404).send({ message: error.message });
  }
};

const publicPayosStatus = async (req, reply) => {
  try {
    reply.send(await paymentService.getPublicPaymentStatus(req.params.orderCode));
  } catch (error) {
    reply.code(404).send({ message: error.message });
  }
};

const payosWebhook = async (req, reply) => {
  try {
    await paymentService.handlePayosWebhook(req.body);
    reply.send({ success: true });
  } catch (error) {
    req.log.warn({ err: error }, "Rejected PayOS webhook");
    reply.code(400).send({ success: false, message: "Invalid webhook" });
  }
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

const downloadReceipt = async (req, reply) => {
  try {
    const transaction = await paymentService.getUserTransaction(req.user.id, req.params.transactionId);
    if (transaction.status !== 'COMPLETED') return reply.code(400).send({ message: 'Giao dịch chưa hoàn tất' });
    const amount = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(transaction.amount || 0);
    const html = `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>Biên nhận HOCA</title><style>body{font-family:Arial,sans-serif;color:#202020;max-width:720px;margin:40px auto;padding:24px}h1{color:#f47b20}.row{display:flex;justify-content:space-between;border-bottom:1px solid #ddd;padding:12px 0}.muted{color:#666;font-size:14px}</style></head><body><h1>HOCA - Biên nhận thanh toán</h1><p class="muted">Mã biên nhận: ${escapeHtml(transaction.txnRef)}</p><div class="row"><span>Khách hàng</span><strong>${escapeHtml(transaction.user?.displayName)}</strong></div><div class="row"><span>Email</span><strong>${escapeHtml(transaction.user?.email)}</strong></div><div class="row"><span>Gói</span><strong>${escapeHtml(transaction.plan?.name || 'HOCA+')}</strong></div><div class="row"><span>Ngày thanh toán</span><strong>${escapeHtml(new Date(transaction.completedAt || transaction.createdAt).toLocaleString('vi-VN'))}</strong></div><div class="row"><span>Phương thức</span><strong>${escapeHtml(transaction.paymentMethod)}</strong></div><div class="row"><span>Tổng tiền</span><strong>${escapeHtml(amount)}</strong></div><p class="muted">Biên nhận điện tử được tạo tự động bởi HOCA.</p></body></html>`;
    reply.header('Content-Disposition', `attachment; filename="hoca-receipt-${transaction.txnRef}.html"`);
    reply.type('text/html; charset=utf-8').send(html);
  } catch (error) {
    reply.code(error.statusCode || 400).send({ message: error.message });
  }
};

const retryTransaction = async (req, reply) => {
  try {
    const ipAddr = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip;
    reply.send(await paymentService.retryUserTransaction(req.user.id, req.params.transactionId, ipAddr));
  } catch (error) {
    reply.code(error.statusCode || 400).send({ message: error.message });
  }
};

const requestRefund = async (req, reply) => {
  try {
    reply.send(await paymentService.requestRefund(req.user.id, req.params.transactionId, req.body?.reason));
  } catch (error) {
    reply.code(error.statusCode || 400).send({ message: error.message });
  }
};

const listPendingAdminPayments = async (req, reply) => {
  try {
    const data = await paymentService.listPendingAdminPayments();
    reply.send(data);
  } catch (error) {
    console.error("Admin pending payments error:", error);
    reply.code(500).send({ message: error.message });
  }
};

const confirmAdminPayment = async (req, reply) => {
  try {
    const { txnRef } = req.params;
    if (!txnRef) return reply.code(400).send({ message: "Missing txnRef" });

    const transaction = await paymentService.confirmAdminPayment(txnRef);
    reply.send({
      success: true,
      message: "Đã xác nhận thanh toán và kích hoạt gói.",
      transaction,
    });
  } catch (error) {
    console.error("Admin confirm payment error:", error);
    reply.code(400).send({ message: error.message });
  }
};

const deletePendingAdminPayment = async (req, reply) => {
  try {
    const { txnRef } = req.params;
    if (!txnRef) return reply.code(400).send({ message: "Missing txnRef" });

    await paymentService.deletePendingAdminPayment(txnRef);
    reply.send({
      success: true,
      message: "Da xoa don cho xac nhan.",
    });
  } catch (error) {
    console.error("Admin delete pending payment error:", error);
    reply.code(400).send({ message: error.message });
  }
};

const grantPlanByAdmin = async (req, reply) => {
  try {
    const { userId, planId, note } = req.body || {};
    if (!userId || !planId) {
      return reply.code(400).send({ message: "Missing userId or planId" });
    }

    const transaction = await paymentService.grantPlanByAdmin({
      userId,
      planId,
      adminId: req.user?._id,
      note,
    });

    reply.code(201).send({
      success: true,
      message: "Đã cấp gói cho người dùng.",
      transaction,
    });
  } catch (error) {
    console.error("Admin grant plan error:", error);
    reply.code(400).send({ message: error.message });
  }
};

// ============ VNPay online payment ============

// Create a VNPay checkout URL and return it to the frontend to redirect.
const createVnpay = async (req, reply) => {
  try {
    const { planId } = req.body;
    if (!planId) return reply.code(400).send({ message: "Missing planId" });
    const ipAddr =
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const data = await paymentService.createVnpayUrl(
      req.user.id,
      planId,
      ipAddr,
    );
    reply.send(data);
  } catch (error) {
    console.error("VNPay create error:", error);
    reply.code(400).send({ message: error.message });
  }
};

// Frontend calls this after VNPay redirects back, passing the query params.
const verifyVnpay = async (req, reply) => {
  try {
    const params = { ...req.query, ...(req.body || {}) };
    const result = await paymentService.handleVnpayResult(params);
    if (result.isSuccess) {
      reply.send({ success: true, message: "Thanh toán VNPay thành công." });
    } else {
      reply.code(400).send({
        success: false,
        message: result.isValid
          ? "Giao dịch chưa hoàn tất hoặc đã bị hủy."
          : "Chữ ký không hợp lệ.",
      });
    }
  } catch (error) {
    console.error("VNPay verify error:", error);
    reply.code(500).send({ message: error.message });
  }
};

// Server-to-server IPN webhook called by VNPay. Must respond in VNPay's format.
const vnpayIpn = async (req, reply) => {
  try {
    const params = { ...req.query, ...(req.body || {}) };
    const result = await paymentService.handleVnpayResult(params);
    if (!result.isValid) {
      return reply.send({ RspCode: "97", Message: "Invalid signature" });
    }
    // Acknowledge receipt. VNPay expects RspCode "00" once recorded.
    reply.send({ RspCode: "00", Message: "Confirm Success" });
  } catch (error) {
    console.error("VNPay IPN error:", error);
    reply.send({ RspCode: "99", Message: "Unknown error" });
  }
};

module.exports = {
  createPayment,
  verifyPayment,
  vnpayReturn,
  getMyTransactions,
  downloadReceipt,
  retryTransaction,
  requestRefund,
  createPayosQR,
  payosStatus,
  publicPayosStatus,
  payosWebhook,
  listPendingAdminPayments,
  confirmAdminPayment,
  deletePendingAdminPayment,
  grantPlanByAdmin,
  createVnpay,
  verifyVnpay,
  vnpayIpn,
};
