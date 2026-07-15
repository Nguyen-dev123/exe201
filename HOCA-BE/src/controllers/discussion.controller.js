const Room = require("../models/Room");
const Message = require("../models/Message");
const DiscussionSession = require("../models/DiscussionSession");
const aiService = require("../services/ai.service");

const DEFAULT_AGENDAS = {
  GENERAL: [
    { title: "Đặt vấn đề", minutes: 5 },
    { title: "Thảo luận", minutes: 20 },
    { title: "Kết luận", minutes: 5 },
  ],
  EXAM_REVIEW: [
    { title: "Xác định phần cần ôn", minutes: 5 },
    { title: "Ôn kiến thức trọng tâm", minutes: 20 },
    { title: "Làm quiz", minutes: 10 },
    { title: "Chốt phần còn yếu", minutes: 5 },
  ],
  PROBLEM_SOLVING: [
    { title: "Đọc và phân tích đề", minutes: 5 },
    { title: "Tự giải", minutes: 10 },
    { title: "So sánh cách giải", minutes: 15 },
    { title: "Chốt đáp án", minutes: 5 },
  ],
  QNA: [
    { title: "Thu thập câu hỏi", minutes: 5 },
    { title: "Hỏi đáp", minutes: 25 },
    { title: "Tổng kết", minutes: 5 },
  ],
  DEBATE: [
    { title: "Nêu quan điểm", minutes: 5 },
    { title: "Tranh biện", minutes: 20 },
    { title: "Phản biện", minutes: 10 },
    { title: "Bình chọn", minutes: 5 },
  ],
  BRAINSTORM: [
    { title: "Nêu vấn đề", minutes: 5 },
    { title: "Đề xuất ý tưởng", minutes: 15 },
    { title: "Bình chọn", minutes: 5 },
    { title: "Lập kế hoạch", minutes: 10 },
  ],
  PRESENTATION: [
    { title: "Chuẩn bị", minutes: 5 },
    { title: "Trình bày", minutes: 20 },
    { title: "Hỏi đáp", minutes: 10 },
    { title: "Phản hồi", minutes: 5 },
  ],
  READING: [
    { title: "Đọc tài liệu", minutes: 15 },
    { title: "Ghi câu hỏi", minutes: 5 },
    { title: "Thảo luận", minutes: 15 },
    { title: "Tóm tắt", minutes: 5 },
  ],
  LANGUAGE: [
    { title: "Khởi động", minutes: 5 },
    { title: "Luyện nói", minutes: 20 },
    { title: "Sửa lỗi", minutes: 10 },
    { title: "Từ vựng mới", minutes: 5 },
  ],
};

const getContext = async (roomId, user) => {
  const room = await Room.findById(roomId);
  if (!room) throw Object.assign(new Error("Không tìm thấy phòng."), { status: 404 });
  if (room.roomType !== "DISCUSSION") {
    throw Object.assign(new Error("Tính năng này chỉ dành cho Phòng Thảo luận."), { status: 400 });
  }

  let session = await DiscussionSession.findOne({ room: roomId });
  if (!session) {
    session = await DiscussionSession.create({
      room: roomId,
      agenda: DEFAULT_AGENDAS.GENERAL,
      agendaStartedAt: new Date(),
    });
  }

  const userId = String(user._id);
  const isOwner = String(room.owner || "") === userId;
  const isAdmin = user.role === "ADMIN";
  const isCoHost = session.coHosts.some((id) => String(id) === userId);
  return { room, session, userId, canManage: isOwner || isAdmin || isCoHost, isOwner: isOwner || isAdmin };
};

const publicSession = (session, permissions) => ({
  ...session.toObject(),
  permissions,
});

const getSession = async (req, reply) => {
  try {
    const ctx = await getContext(req.params.roomId, req.user);
    return reply.send(
      publicSession(ctx.session, {
        canManage: ctx.canManage,
        isOwner: ctx.isOwner,
      }),
    );
  } catch (error) {
    return reply.code(error.status || 500).send({ message: error.message });
  }
};

const requireManage = (ctx) => {
  if (!ctx.canManage) throw Object.assign(new Error("Chỉ chủ phòng hoặc đồng chủ phòng được thực hiện thao tác này."), { status: 403 });
};

const performAction = async (req, reply) => {
  try {
    const ctx = await getContext(req.params.roomId, req.user);
    const { session, userId } = ctx;
    const { type, payload = {} } = req.body || {};

    switch (type) {
      case "CONFIGURE": {
        requireManage(ctx);
        const template = DEFAULT_AGENDAS[payload.template] ? payload.template : "GENERAL";
        session.template = template;
        session.topic = String(payload.topic || "").trim().slice(0, 500);
        session.agenda = Array.isArray(payload.agenda) && payload.agenda.length
          ? payload.agenda.slice(0, 12).map((item) => ({
              title: String(item.title || "Giai đoạn").slice(0, 160),
              minutes: Math.min(180, Math.max(1, Number(item.minutes) || 10)),
            }))
          : DEFAULT_AGENDAS[template];
        session.activeAgendaIndex = 0;
        session.agendaStartedAt = new Date();
        session.completedAt = undefined;
        break;
      }
      case "NEXT_AGENDA": {
        requireManage(ctx);
        const lastIndex = Math.max(0, session.agenda.length - 1);
        const currentStage = session.agenda[session.activeAgendaIndex];
        if (currentStage) currentStage.completed = true;
        if (session.activeAgendaIndex < lastIndex) {
          session.activeAgendaIndex += 1;
        } else {
          session.completedAt = session.completedAt || new Date();
        }
        session.agendaStartedAt = new Date();
        break;
      }
      case "RESET_AGENDA": {
        requireManage(ctx);
        session.agenda.forEach((item) => {
          item.completed = false;
        });
        session.activeAgendaIndex = 0;
        session.agendaStartedAt = new Date();
        session.completedAt = undefined;
        break;
      }
      case "TOGGLE_COHOST": {
        if (!ctx.isOwner) throw Object.assign(new Error("Chỉ chủ phòng được chọn đồng chủ phòng."), { status: 403 });
        const target = String(payload.userId || "");
        const exists = session.coHosts.some((id) => String(id) === target);
        session.coHosts = exists ? session.coHosts.filter((id) => String(id) !== target) : [...session.coHosts, target];
        break;
      }
      case "RAISE_HAND": {
        const exists = session.speakerQueue.some((item) => String(item.user) === userId);
        session.speakerQueue = exists
          ? session.speakerQueue.filter((item) => String(item.user) !== userId)
          : [...session.speakerQueue, { user: userId, userName: req.user.displayName }];
        break;
      }
      case "NEXT_SPEAKER": {
        requireManage(ctx);
        const next = session.speakerQueue.shift();
        session.activeSpeaker = next
          ? { user: next.user, userName: next.userName, endsAt: new Date(Date.now() + (Number(payload.minutes) || 2) * 60000) }
          : undefined;
        break;
      }
      case "STOP_SPEAKER":
        requireManage(ctx);
        session.activeSpeaker = undefined;
        break;
      case "ADD_BOARD":
        session.boardItems.push({
          kind: ["IDEA", "QUESTION", "CONCLUSION"].includes(payload.kind) ? payload.kind : "IDEA",
          text: String(payload.text || "").trim().slice(0, 800),
          author: userId,
          authorName: req.user.displayName,
        });
        break;
      case "VOTE_BOARD": {
        const item = session.boardItems.id(payload.itemId);
        if (!item) throw Object.assign(new Error("Không tìm thấy ghi chú."), { status: 404 });
        const voted = item.votes.some((id) => String(id) === userId);
        item.votes = voted ? item.votes.filter((id) => String(id) !== userId) : [...item.votes, userId];
        break;
      }
      case "RESOLVE_BOARD": {
        requireManage(ctx);
        const item = session.boardItems.id(payload.itemId);
        if (item) item.resolved = !item.resolved;
        break;
      }
      case "DELETE_BOARD": {
        const item = session.boardItems.id(payload.itemId);
        if (!item) {
          throw Object.assign(new Error("Không tìm thấy nội dung cần xóa."), { status: 404 });
        }
        const isAuthor = String(item.author || "") === userId;
        if (!isAuthor && !ctx.canManage) {
          throw Object.assign(
            new Error("Bạn chỉ có thể xóa nội dung do mình tạo."),
            { status: 403 },
          );
        }
        session.boardItems.pull(item._id);
        break;
      }
      case "ADD_RESOURCE":
        if (!/^https?:\/\//i.test(String(payload.url || "").trim())) {
          throw Object.assign(new Error("Liên kết tài liệu không hợp lệ."), { status: 400 });
        }
        session.resources.push({
          title: String(payload.title || "Tài liệu").trim().slice(0, 240),
          url: String(payload.url || "").trim().slice(0, 1500),
          note: String(payload.note || "").trim().slice(0, 500),
          addedBy: userId,
          addedByName: req.user.displayName,
        });
        break;
      case "DELETE_RESOURCE": {
        const resource = session.resources.id(payload.resourceId);
        if (!resource) {
          throw Object.assign(new Error("Không tìm thấy tài liệu cần xóa."), { status: 404 });
        }
        const isUploader = String(resource.addedBy || "") === userId;
        if (!isUploader && !ctx.canManage) {
          throw Object.assign(
            new Error("Bạn chỉ có thể xóa tài liệu do mình thêm."),
            { status: 403 },
          );
        }
        session.resources.pull(resource._id);
        break;
      }
      case "ADD_TASK":
        session.tasks.push({
          text: String(payload.text || "").trim().slice(0, 500),
          assignee: payload.assignee || undefined,
          assigneeName: String(payload.assigneeName || "Cả nhóm").slice(0, 160),
        });
        break;
      case "TOGGLE_TASK": {
        const task = session.tasks.id(payload.taskId);
        if (task) task.completed = !task.completed;
        break;
      }
      case "CREATE_POLL": {
        requireManage(ctx);
        const options = (payload.options || []).map((text) => ({ text: String(text).trim() })).filter((option) => option.text).slice(0, 8);
        if (options.length < 2) throw Object.assign(new Error("Cần ít nhất hai lựa chọn."), { status: 400 });
        session.polls.push({
          question: String(payload.question || "").trim().slice(0, 500),
          type: payload.pollType === "QUIZ" ? "QUIZ" : "POLL",
          options,
          correctOption: payload.pollType === "QUIZ" ? Number(payload.correctOption) : undefined,
          explanation: String(payload.explanation || "").slice(0, 1000),
          createdBy: userId,
        });
        break;
      }
      case "VOTE_POLL": {
        const poll = session.polls.id(payload.pollId);
        if (!poll || !poll.active) throw Object.assign(new Error("Bình chọn đã kết thúc."), { status: 400 });
        const option = poll.options[payload.optionIndex];
        if (!option) {
          throw Object.assign(new Error("Lựa chọn không hợp lệ."), { status: 400 });
        }

        const activePollQuery = {
          _id: session._id,
          polls: { $elemMatch: { _id: poll._id, active: true } },
        };
        const updateOptions = { arrayFilters: [{ "poll._id": poll._id }] };

        const removeOldVote = await DiscussionSession.updateOne(
          activePollQuery,
          { $pull: { "polls.$[poll].options.$[].voters": userId } },
          updateOptions,
        );
        if (!removeOldVote.matchedCount) {
          throw Object.assign(new Error("Bình chọn đã kết thúc."), { status: 400 });
        }

        await DiscussionSession.updateOne(
          activePollQuery,
          { $addToSet: { "polls.$[poll].options.$[option].voters": userId } },
          {
            arrayFilters: [
              { "poll._id": poll._id },
              { "option._id": option._id },
            ],
          },
        );

        const updatedSession = await DiscussionSession.findById(session._id);
        return reply.send(
          publicSession(updatedSession, {
            canManage: ctx.canManage,
            isOwner: ctx.isOwner,
          }),
        );
      }
      case "CLOSE_POLL": {
        requireManage(ctx);
        const poll = session.polls.id(payload.pollId);
        if (poll) poll.active = false;
        break;
      }
      case "DELETE_POLL": {
        requireManage(ctx);
        const poll = session.polls.id(payload.pollId);
        if (!poll) {
          throw Object.assign(new Error("Không tìm thấy quiz hoặc bình chọn cần xóa."), { status: 404 });
        }
        await DiscussionSession.updateOne(
          { _id: session._id },
          { $pull: { polls: { _id: poll._id } } },
        );
        const updatedSession = await DiscussionSession.findById(session._id);
        return reply.send(
          publicSession(updatedSession, {
            canManage: ctx.canManage,
            isOwner: ctx.isOwner,
          }),
        );
      }
      case "TOGGLE_AI":
        requireManage(ctx);
        session.aiEnabled = !session.aiEnabled;
        break;
      case "COMPLETE_SESSION":
        requireManage(ctx);
        session.completedAt = new Date();
        break;
      default:
        throw Object.assign(new Error("Thao tác không hợp lệ."), { status: 400 });
    }

    await session.save();
    return reply.send(publicSession(session, { canManage: ctx.canManage, isOwner: ctx.isOwner }));
  } catch (error) {
    return reply.code(error.status || 500).send({ message: error.message });
  }
};

const generateAiSummary = async (req, reply) => {
  try {
    const ctx = await getContext(req.params.roomId, req.user);
    requireManage(ctx);
    const messages = await Message.find({ room: ctx.room._id }).sort({ createdAt: -1 }).limit(80).populate("sender", "displayName");
    const board = ctx.session.boardItems.map((item) => `${item.kind}: ${item.text}`).join("\n");
    const chat = messages.reverse().map((item) => `${item.sender?.displayName || "Thành viên"}: ${item.content}`).join("\n");
    const prompt = `Bạn là thư ký học tập HOCA. Hãy viết báo cáo tiếng Việt ngắn gọn cho buổi thảo luận chủ đề "${ctx.session.topic || ctx.room.name}". Báo cáo bắt buộc có các mục: Tóm tắt, Kiến thức chính, Câu hỏi còn mở, Kết luận, Việc cần làm, và 5 flashcard dạng "Hỏi: ... | Đáp: ...".\n\nBảng chung:\n${board || "Chưa có"}\n\nChat:\n${chat || "Chưa có"}`;
    const result = await aiService.askAI(prompt.slice(0, 12000), req.user, [], "ROOM");
    ctx.session.aiSummary = result.response;
    ctx.session.flashcards = result.response
      .split("\n")
      .filter((line) => /Hỏi\s*:/i.test(line) && /Đáp\s*:/i.test(line))
      .slice(0, 10)
      .map((line) => {
        const [question, answer] = line.split(/\|\s*Đáp\s*:/i);
        return { question: question.replace(/^[-*\d.\s]*Hỏi\s*:/i, "").trim(), answer: (answer || "").trim() };
      });
    await ctx.session.save();
    return reply.send(publicSession(ctx.session, { canManage: ctx.canManage, isOwner: ctx.isOwner }));
  } catch (error) {
    return reply.code(error.status || 500).send({ message: error.message });
  }
};

module.exports = { getSession, performAction, generateAiSummary };
