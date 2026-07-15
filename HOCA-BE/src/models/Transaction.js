const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  plan: { type: mongoose.Schema.Types.ObjectId, ref: 'PricingPlan' },
  
  type: { 
    type: String, 
    enum: ['PREMIUM_SUBSCRIPTION', 'STREAK_RECOVERY'],
    required: true 
  },
  
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'COMPLETED', 'FAILED'], 
    default: 'PENDING' 
  },
  
  paymentMethod: { type: String, default: 'VNPAY' },
  txnRef: { type: String, unique: true }, // Order ID sent to VNPay
  vnpayTransactionNo: String, // Transaction No from VNPay
  description: String,
  
  completedAt: Date,
  refundStatus: {
    type: String,
    enum: ['NONE', 'REQUESTED', 'APPROVED', 'REJECTED', 'REFUNDED'],
    default: 'NONE'
  },
  refundReason: { type: String, maxlength: 1000 },
  refundRequestedAt: Date,
  accountDeleted: { type: Boolean, default: false },
  anonymizedUserHash: { type: String, select: false }
}, { timestamps: true });

transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ status: 1, type: 1, createdAt: -1 });
transactionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);
