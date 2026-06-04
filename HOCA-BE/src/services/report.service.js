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
  return await Report.find(query)
    .populate("submitter", "displayName email")
    .populate("targetUser", "displayName email avatar")
    .populate("room", "name")
    .sort("-createdAt");
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
