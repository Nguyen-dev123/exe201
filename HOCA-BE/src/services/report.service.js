const Report = require("../models/Report");
const User = require("../models/User");
const { escalateViolation } = require("./moderation.service");

const createReport = async (submitterId, data) => {
  return await Report.create({
    submitter: submitterId,
    ...data,
  });
};

const getReports = async (query = {}) => {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 30));
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.reason) filter.reason = query.reason;
  if (query.room) filter.room = query.room;
  if (query.targetUser) filter.targetUser = query.targetUser;

  const [reports, total] = await Promise.all([
    Report.find(filter)
      .populate("submitter", "displayName email")
      .populate("targetUser", "displayName email avatar")
      .populate("room", "name")
      .sort("-createdAt")
      .skip((page - 1) * limit)
      .limit(limit),
    Report.countDocuments(filter),
  ]);

  return {
    reports,
    total,
    page,
    pages: Math.ceil(total / limit),
  };
};

const resolveReport = async (
  reportId,
  adminId,
  { status, resolutionNotes, action },
) => {
  const report = await Report.findById(reportId);
  if (!report) throw new Error("Report not found");

  report.status = status;
  report.resolutionNotes = resolutionNotes;
  report.resolvedBy = adminId;
  report.resolvedAt = new Date();
  await report.save();

  let escalation = null;

  if (action === "BLOCK_USER") {
    // Immediate permanent block (admin override)
    await User.findByIdAndUpdate(report.targetUser, {
      isLocked: true,
      isBlocked: true,
      lockReason: resolutionNotes || "Vi phạm nghiêm trọng quy tắc cộng đồng",
    });
  } else if (action === "WARN_USER") {
    // Auto-escalating punishment based on total violations
    escalation = await escalateViolation(
      report.targetUser,
      resolutionNotes || "Vi phạm quy tắc cộng đồng",
    );
  }

  return { report, escalation };
};

module.exports = {
  createReport,
  getReports,
  resolveReport,
};
