const mongoose = require("mongoose");

const boardItemSchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      enum: ["IDEA", "QUESTION", "CONCLUSION"],
      required: true,
    },
    text: { type: String, required: true, maxlength: 800 },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    authorName: String,
    votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, maxlength: 500 },
    type: { type: String, enum: ["POLL", "QUIZ"], default: "POLL" },
    options: [
      {
        text: { type: String, required: true, maxlength: 240 },
        voters: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      },
    ],
    correctOption: Number,
    explanation: { type: String, maxlength: 1000 },
    active: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

const discussionSessionSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      unique: true,
      index: true,
    },
    template: {
      type: String,
      enum: [
        "GENERAL",
        "EXAM_REVIEW",
        "PROBLEM_SOLVING",
        "QNA",
        "DEBATE",
        "BRAINSTORM",
        "PRESENTATION",
        "READING",
        "LANGUAGE",
      ],
      default: "GENERAL",
    },
    topic: { type: String, default: "", maxlength: 500 },
    agenda: [
      {
        title: { type: String, required: true, maxlength: 160 },
        minutes: { type: Number, min: 1, max: 180, default: 10 },
        completed: { type: Boolean, default: false },
      },
    ],
    activeAgendaIndex: { type: Number, default: 0 },
    agendaStartedAt: Date,
    coHosts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    speakerQueue: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        userName: String,
        requestedAt: { type: Date, default: Date.now },
      },
    ],
    activeSpeaker: {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      userName: String,
      endsAt: Date,
    },
    boardItems: [boardItemSchema],
    resources: [
      {
        title: { type: String, required: true, maxlength: 240 },
        url: { type: String, required: true, maxlength: 1500 },
        note: { type: String, maxlength: 500 },
        addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        addedByName: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    tasks: [
      {
        text: { type: String, required: true, maxlength: 500 },
        assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        assigneeName: String,
        completed: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    polls: [pollSchema],
    aiEnabled: { type: Boolean, default: false },
    aiSummary: { type: String, default: "" },
    flashcards: [
      {
        question: String,
        answer: String,
      },
    ],
    completedAt: Date,
  },
  { timestamps: true },
);

module.exports = mongoose.model("DiscussionSession", discussionSessionSchema);
