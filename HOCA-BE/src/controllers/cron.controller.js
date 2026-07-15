const crypto = require("crypto");
const { cleanupInactiveAccounts } = require("../jobs/cleanup.job");
const {
  performStreakMaintenance,
  performRoomMaintenance,
  performPayosReconciliation,
} = require("../jobs/streak.job");

const authorizeCron = (req, reply) => {
  const configured = process.env.CRON_SECRET;
  const provided = req.headers["x-cron-secret"];
  if (!configured || configured.length < 32 || !provided) {
    reply.code(503).send({ message: "Cron endpoint is not configured" });
    return false;
  }
  const expectedBuffer = Buffer.from(configured);
  const providedBuffer = Buffer.from(String(provided));
  const valid = expectedBuffer.length === providedBuffer.length &&
    crypto.timingSafeEqual(expectedBuffer, providedBuffer);
  if (!valid) {
    reply.code(401).send({ message: "Unauthorized" });
    return false;
  }
  return true;
};

const execute = (job, successMessage, logLabel) => async (req, reply) => {
  if (!authorizeCron(req, reply)) return;
  try {
    const result = await job();
    return reply.send({ message: successMessage, result });
  } catch (error) {
    req.log.error({ err: error }, `${logLabel} failed`);
    return reply.code(500).send({ message: "Cron job failed" });
  }
};

module.exports = {
  runCleanup: execute(cleanupInactiveAccounts, "Cleanup job executed successfully", "cleanup"),
  runStreakMaintenance: execute(
    performStreakMaintenance,
    "Streak maintenance executed successfully",
    "streak maintenance",
  ),
  runRoomMaintenance: execute(
    performRoomMaintenance,
    "Room maintenance executed successfully",
    "room maintenance",
  ),
  runPayosReconciliation: execute(
    performPayosReconciliation,
    "PayOS reconciliation executed successfully",
    "payos reconciliation",
  ),
};
