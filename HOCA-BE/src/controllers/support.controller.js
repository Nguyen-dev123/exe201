const crypto = require("crypto");
const SupportTicket = require("../models/SupportTicket");

const create = async (req, reply) => {
  const subject = String(req.body?.subject || "").trim();
  const content = String(req.body?.message || "").trim();
  if (!subject || !content) return reply.code(400).send({ message: "Vui lòng nhập tiêu đề và nội dung." });
  const code = `HOCA-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
  const ticket = await SupportTicket.create({
    code, user: req.user._id, subject,
    category: req.body?.category,
    attachments: Array.isArray(req.body?.attachments) ? req.body.attachments.slice(0, 5) : [],
    messages: [{ author: req.user._id, role: "USER", content, attachments: Array.isArray(req.body?.attachments) ? req.body.attachments.slice(0, 5) : [] }],
  });
  reply.code(201).send(ticket);
};
const mine = async (req, reply) => {
  const page = Math.max(1, Number(req.query.page) || 1); const limit = 20;
  const [tickets, total] = await Promise.all([
    SupportTicket.find({ user: req.user._id }).sort('-updatedAt').skip((page-1)*limit).limit(limit),
    SupportTicket.countDocuments({ user: req.user._id }),
  ]);
  reply.send({ tickets, pagination: { page, pages: Math.ceil(total/limit), total } });
};
const getOne = async (req, reply) => {
  const query = req.user.role === 'ADMIN' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
  const ticket = await SupportTicket.findOne(query).populate('messages.author', 'displayName avatar');
  if (!ticket) return reply.code(404).send({ message: 'Không tìm thấy ticket' });
  reply.send(ticket);
};
const replyTicket = async (req, reply) => {
  const content = String(req.body?.message || '').trim();
  if (!content) return reply.code(400).send({ message: 'Nội dung không được để trống' });
  const query = req.user.role === 'ADMIN' ? { _id: req.params.id } : { _id: req.params.id, user: req.user._id };
  const ticket = await SupportTicket.findOne(query);
  if (!ticket) return reply.code(404).send({ message: 'Không tìm thấy ticket' });
  ticket.messages.push({ author: req.user._id, role: req.user.role === 'ADMIN' ? 'ADMIN' : 'USER', content, attachments: Array.isArray(req.body?.attachments) ? req.body.attachments.slice(0, 5) : [] });
  ticket.status = req.user.role === 'ADMIN' ? 'WAITING_USER' : 'OPEN';
  await ticket.save(); reply.send(ticket);
};
const adminList = async (req, reply) => {
  const query = req.query.status ? { status: req.query.status } : {};
  reply.send(await SupportTicket.find(query).sort('-updatedAt').limit(200).populate('user', 'displayName email avatar'));
};
const setStatus = async (req, reply) => {
  const allowed = ['OPEN','IN_PROGRESS','WAITING_USER','RESOLVED','CLOSED'];
  if (!allowed.includes(req.body?.status)) return reply.code(400).send({ message: 'Trạng thái không hợp lệ' });
  const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  if (!ticket) return reply.code(404).send({ message: 'Không tìm thấy ticket' });
  reply.send(ticket);
};
module.exports = { create, mine, getOne, replyTicket, adminList, setStatus };
