const mongoose = require("mongoose");

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    status: {
      type: String,
      enum: ["ACTIVE", "UNSUBSCRIBED"],
      default: "ACTIVE",
    },
    source: { type: String, default: "footer", trim: true, maxlength: 50 },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

module.exports = mongoose.model(
  "NewsletterSubscriber",
  newsletterSubscriberSchema,
);
