const StudyGoal = require("../models/StudyGoal");

const getGoals = async (req, reply) => {
  const goals = await StudyGoal.find({ user: req.user.id })
    .sort({ createdAt: -1 })
    .limit(20)
    .populate("room", "name isActive");
  return reply.send(goals);
};

const getActiveGoal = async (req, reply) => {
  const goal = await StudyGoal.findOne({
    user: req.user.id,
    status: "ACTIVE",
  })
    .sort({ createdAt: -1 })
    .populate("room", "name isActive");
  return reply.send(goal);
};

const createGoal = async (req, reply) => {
  const text = String(req.body?.text || "").trim();
  if (!text) return reply.code(400).send({ message: "Vui lòng nhập mục tiêu học tập." });
  if (text.length > 160) {
    return reply.code(400).send({ message: "Mục tiêu không được dài quá 160 ký tự." });
  }

  await StudyGoal.updateMany(
    { user: req.user.id, status: "ACTIVE" },
    { $set: { status: "REPLACED" } },
  );
  const goal = await StudyGoal.create({
    user: req.user.id,
    text,
    subject: String(req.body?.subject || "").trim(),
    recurrence: ["NONE", "DAILY", "WEEKLY"].includes(req.body?.recurrence) ? req.body.recurrence : "NONE",
    reminderAt: req.body?.reminderAt || null,
  });
  return reply.code(201).send(goal);
};

const updateGoal = async (req, reply) => {
  const updates = {};
  if (req.body?.text !== undefined) {
    const text = String(req.body.text).trim();
    if (!text || text.length > 160) return reply.code(400).send({ message: "Mục tiêu không hợp lệ." });
    updates.text = text;
  }
  if (req.body?.subject !== undefined) updates.subject = String(req.body.subject).trim().slice(0, 80);
  if (["NONE", "DAILY", "WEEKLY"].includes(req.body?.recurrence)) updates.recurrence = req.body.recurrence;
  if (req.body?.reminderAt !== undefined) updates.reminderAt = req.body.reminderAt || null;
  if (req.body?.notes !== undefined) updates.notes = String(req.body.notes).slice(0, 1000);
  const goal = await StudyGoal.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, updates, { new: true, runValidators: true });
  if (!goal) return reply.code(404).send({ message: "Không tìm thấy mục tiêu." });
  return reply.send(goal);
};

const deleteGoal = async (req, reply) => {
  const result = await StudyGoal.deleteOne({ _id: req.params.id, user: req.user.id });
  if (!result.deletedCount) return reply.code(404).send({ message: "Không tìm thấy mục tiêu." });
  return reply.send({ success: true });
};

const completeGoal = async (req, reply) => {
  const goal = await StudyGoal.findOne({
    _id: req.params.id,
    user: req.user.id,
  });
  if (!goal) return reply.code(404).send({ message: "Không tìm thấy mục tiêu." });
  if (goal.status === "COMPLETED") return reply.send(goal);

  goal.status = "COMPLETED";
  goal.completedAt = new Date();
  await goal.save();
  let nextGoal = null;
  if (goal.recurrence === "DAILY" || goal.recurrence === "WEEKLY") {
    const interval = goal.recurrence === "WEEKLY" ? 7 * 86400000 : 86400000;
    let reminderAt = goal.reminderAt ? new Date(goal.reminderAt.getTime() + interval) : null;
    while (reminderAt && reminderAt <= new Date()) reminderAt = new Date(reminderAt.getTime() + interval);
    nextGoal = await StudyGoal.create({
      user: goal.user, text: goal.text, subject: goal.subject,
      recurrence: goal.recurrence, reminderAt, notes: goal.notes,
    });
  }
  return reply.send({ completed: goal, nextGoal });
};

module.exports = { getGoals, getActiveGoal, createGoal, completeGoal, updateGoal, deleteGoal };
