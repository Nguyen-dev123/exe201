const mongoose = require("mongoose");

const supportTicketSchema = new mongoose.Schema(
  {
    code: { type: String, unique: true, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    category: { type: String, enum: ["ACCOUNT", "PAYMENT", "TECHNICAL", "REPORT", "OTHER"], default: "OTHER" },
    subject: { type: String, required: true, maxlength: 160 },
    status: { type: String, enum: ["OPEN", "IN_PROGRESS", "WAITING_USER", "RESOLVED", "CLOSED"], default: "OPEN", index: true },
    attachments: [{ type: String }],
    messages: [{
      author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["USER", "ADMIN"], required: true },
      content: { type: String, required: true, maxlength: 5000 },
      attachments: [{ type: String }],
      createdAt: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true },
);
supportTicketSchema.index({ user: 1, createdAt: -1 });
module.exports = mongoose.model("SupportTicket", supportTicketSchema);
