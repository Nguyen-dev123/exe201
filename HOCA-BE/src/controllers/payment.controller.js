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
      reply
        .code(400)
        .send({
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

// Create a bank-transfer QR for a plan
const createQR = async (req, reply) => {
  try {
    const { planId } = req.body;
    const data = await paymentService.createBankQR(req.user.id, planId);
    reply.send(data);
  } catch (error) {
    console.error(error);
    reply.code(400).send({ message: error.message });
  }
};

// Poll the status of a bank-transfer order (by memo)
const qrStatus = async (req, reply) => {
  try {
    const { memo } = req.params;
    const data = await paymentService.getTransactionStatus(req.user.id, memo);
    reply.send(data);
  } catch (error) {
    reply.code(404).send({ message: error.message });
  }
};

// Admin: list pending bank-transfer orders
const listPending = async (req, reply) => {
  try {
    const data = await paymentService.getPendingTransactions();
    reply.send(data);
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

// Admin: confirm a received bank transfer
const confirmPayment = async (req, reply) => {
  try {
    const { txnRef } = req.body;
    if (!txnRef) return reply.code(400).send({ message: "Missing txnRef" });
    await paymentService.confirmTransaction(txnRef);
    reply.send({
      success: true,
      message: "Đã xác nhận thanh toán và kích hoạt gói.",
    });
  } catch (error) {
    reply.code(400).send({ success: false, message: error.message });
  }
};

module.exports = {
  createPayment,
  verifyPayment,
  vnpayReturn,
  getMyTransactions,
  createQR,
  qrStatus,
  listPending,
  confirmPayment,
};
