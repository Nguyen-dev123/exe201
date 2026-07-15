const mongoose = require("mongoose");

const aiMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant"], required: true },
    content: { type: String, required: true, maxlength: 20000 },
    feedback: { type: String, enum: ["UP", "DOWN", null], default: null },
    sources: [{ title: String, url: String }],
  },
  { timestamps: true },
);

const aiConversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120, default: "Cuộc trò chuyện mới" },
    subject: { type: String, trim: true, maxlength: 80, default: "Chung" },
    explanationLevel: { type: String, enum: ["SIMPLE", "STANDARD", "ADVANCED"], default: "STANDARD" },
    messages: [aiMessageSchema],
  },
  { timestamps: true },
);

aiConversationSchema.index({ user: 1, updatedAt: -1 });
module.exports = mongoose.model("AIConversation", aiConversationSchema);
