const mongoose = require("mongoose");

const studyGoalSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    text: { type: String, required: true, trim: true, maxlength: 160 },
    status: {
      type: String,
      enum: ["ACTIVE", "COMPLETED", "REPLACED"],
      default: "ACTIVE",
      index: true,
    },
    room: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
    completedAt: { type: Date, default: null },
    subject: { type: String, trim: true, maxlength: 80, default: "" },
    recurrence: { type: String, enum: ["NONE", "DAILY", "WEEKLY"], default: "NONE" },
    reminderAt: { type: Date, default: null },
    notes: { type: String, maxlength: 1000, default: "" },
  },
  { timestamps: true },
);

studyGoalSchema.index({ user: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("StudyGoal", studyGoalSchema);
