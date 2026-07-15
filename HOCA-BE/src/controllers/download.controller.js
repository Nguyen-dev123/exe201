const path = require("path");
const fs = require("fs");
const ApkDownload = require("../models/ApkDownload");

const createDownloadRecord = async (req, sourceFallback = "direct") => {
  const { source } = req.query || {};
  const userId = req.user?.id || null;
  const ipAddress =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
  const userAgent = req.headers["user-agent"] || "";

  let platform = "Unknown";
  if (/android/i.test(userAgent)) platform = "Android";
  else if (/windows/i.test(userAgent)) platform = "Windows";
  else if (/iphone|ipad/i.test(userAgent)) platform = "iOS";
  else if (/mac/i.test(userAgent)) platform = "MacOS";
  else if (/linux/i.test(userAgent)) platform = "Linux";

  return ApkDownload.create({
    downloadedBy: userId,
    ipAddress,
    userAgent,
    platform,
    source: source || sourceFallback,
  });
};

/**
 * Download APK and track analytics
 */
const downloadApk = async (req, reply) => {
  try {
    await createDownloadRecord(req, "direct");

    // Path to APK file (apk-share folder is at project root, not in src)
    const apkPath = path.join(__dirname, "../../../apk-share/HOCA.apk");

    if (!fs.existsSync(apkPath)) {
      return reply.code(404).send({ message: "APK file not found" });
    }

    // Send file
    reply
      .header("Content-Type", "application/vnd.android.package-archive")
      .header("Content-Disposition", 'attachment; filename="HOCA.apk"')
      .send(fs.createReadStream(apkPath));
  } catch (error) {
    console.error("Download APK error:", error);
    reply.code(500).send({ message: error.message });
  }
};

/**
 * Track a download served outside the API (for temporary tunnel/share pages).
 */
const trackExternalDownload = async (req, reply) => {
  try {
    await createDownloadRecord(req, "external");
    reply.send({ success: true });
  } catch (error) {
    console.error("Track APK download error:", error);
    reply.code(500).send({ message: error.message });
  }
};

/**
 * Get download statistics (Admin only)
 */
const getDownloadStats = async (req, reply) => {
  try {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [
      totalDownloads,
      uniqueIPs,
      byPlatform,
      bySource,
      recentDownloads,
      downloadsByDay,
    ] = await Promise.all([
      ApkDownload.countDocuments(query),
      ApkDownload.distinct("ipAddress", query),
      ApkDownload.aggregate([
        { $match: query },
        { $group: { _id: "$platform", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ApkDownload.aggregate([
        { $match: query },
        { $group: { _id: "$source", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      ApkDownload.find(query)
        .sort({ createdAt: -1 })
        .limit(50)
        .populate("downloadedBy", "displayName email")
        .select("-userAgent")
        .lean(),
      ApkDownload.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: "Asia/Ho_Chi_Minh",
              },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    reply.send({
      totalDownloads,
      uniqueUsers: uniqueIPs.length,
      byPlatform,
      bySource,
      downloadsByDay,
      recentDownloads,
    });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

/**
 * Get simple download count (Public - no auth required)
 */
const getDownloadCount = async (req, reply) => {
  try {
    const totalDownloads = await ApkDownload.countDocuments();
    const uniqueIPs = await ApkDownload.distinct("ipAddress");

    reply.send({
      totalDownloads,
      uniqueUsers: uniqueIPs.length,
    });
  } catch (error) {
    reply.code(500).send({ message: error.message });
  }
};

module.exports = {
  downloadApk,
  trackExternalDownload,
  getDownloadStats,
  getDownloadCount,
};
