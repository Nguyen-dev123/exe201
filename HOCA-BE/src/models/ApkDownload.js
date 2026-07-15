const mongoose = require("mongoose");

const apkDownloadSchema = new mongoose.Schema(
  {
    version: { type: String, default: "1.0.0" },
    downloadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // null if anonymous
    ipAddress: String,
    userAgent: String,
    platform: String, // Android, Windows, etc
    source: String, // where they clicked: website, QR, direct link
  },
  { timestamps: true },
);

// Index for analytics
apkDownloadSchema.index({ createdAt: -1 });
apkDownloadSchema.index({ downloadedBy: 1 });

module.exports = mongoose.model("ApkDownload", apkDownloadSchema);
