import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Bot,
  Brain,
  Check,
  CheckCircle2,
  ClipboardList,
  Crown,
  ExternalLink,
  FileText,
  Hand,
  Heart,
  Lightbulb,
  Link2,
  ListChecks,
  MessageSquareText,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
  Timer,
  Users,
  Upload,
  Vote,
  X,
  Send,
  UserRound,
  Share2,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { aiApi, discussionApi, uploadApi } from "../lib/services";
import { confirmDialog } from "../lib/dialog";

const TABS = [
  { id: "session", label: "Điều phối", icon: Timer },
  { id: "board", label: "Bảng chung", icon: MessageSquareText },
  { id: "resources", label: "Tài liệu", icon: FileText },
  { id: "polls", label: "Quiz", icon: Vote },
  { id: "ask-ai", label: "Hỏi AI", icon: Bot },
  { id: "ai", label: "AI & Kết quả", icon: Sparkles },
];

const TEMPLATES = [
  ["GENERAL", "Thảo luận chung"],
  ["EXAM_REVIEW", "Ôn thi"],
  ["PROBLEM_SOLVING", "Giải bài tập"],
  ["QNA", "Hỏi đáp"],
  ["DEBATE", "Tranh biện"],
  ["BRAINSTORM", "Brainstorm"],
  ["PRESENTATION", "Thuyết trình"],
  ["READING", "Đọc tài liệu"],
  ["LANGUAGE", "Học ngoại ngữ"],
];

const BOARD_COLUMNS = [
  ["IDEA", "Ý tưởng", Lightbulb],
  ["QUESTION", "Câu hỏi", MessageSquareText],
  ["CONCLUSION", "Kết luận", CheckCircle2],
];

function Panel({ children, className = "" }) {
  return (
    <section
      className={`rounded-2xl border border-white/10 bg-[#171B2E] ${className}`}
    >
      {children}
    </section>
  );
}

function Empty({ children }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-white/35">
      {children}
    </div>
  );
}

export default function SmartDiscussionRoom({
  roomId,
  user,
  onlineUsers,
  socket,
}) {
  const [session, setSession] = useState(null);
  const [activeTab, setActiveTab] = useState("session");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await discussionApi.get(roomId);
      setSession(data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể tải Smart Room");
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    load();
    const refresh = ({ roomId: changedRoom }) => {
      if (String(changedRoom) === String(roomId)) load();
    };
    socket?.on("discussion-session-refresh", refresh);
    return () => socket?.off("discussion-session-refresh", refresh);
  }, [load, roomId, socket]);

  const action = async (type, payload = {}, successMessage) => {
    setBusy(true);
    try {
      const data = await discussionApi.action(roomId, type, payload);
      setSession(data);
      socket?.emit("discussion-session-updated", { roomId });
      if (successMessage) toast.success(successMessage);
      return data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể cập nhật phòng");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const meInQueue = session?.speakerQueue?.some(
    (item) => String(item.user) === String(user?._id),
  );
  const hasUnlimitedRoomAI =
    user?.role === "ADMIN" ||
    (user?.subscriptionTier &&
      user.subscriptionTier !== "FREE" &&
      (user.subscriptionTier === "LIFETIME" ||
        !user.subscriptionExpiry ||
        new Date(user.subscriptionExpiry) > new Date()));

  if (loading) {
    return (
      <div className="mb-6 grid gap-3 rounded-2xl border border-white/10 bg-[#171B2E] p-6">
        <div className="skeleton h-6 w-52" />
        <div className="skeleton h-28 w-full" />
      </div>
    );
  }
  if (!session) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-primary/25 bg-[#111527] shadow-[0_22px_70px_rgba(5,7,18,0.28)]">
      <div className="flex flex-col gap-4 border-b border-white/10 bg-gradient-to-r from-primary/[0.09] to-transparent px-5 py-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Crown size={16} /> HOCA+ SMART DISCUSSION
          </div>
          <h2 className="mt-1 text-xl font-bold">
            {session.topic || "Không gian thảo luận thông minh"}
          </h2>
          <p className="mt-1 text-sm text-white/45">
            Điều phối phát biểu, bảng cộng tác, quiz, tài liệu và tổng kết AI.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => action("RAISE_HAND")}
            className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${meInQueue ? "bg-primary text-[#18100A]" : "border border-primary/35 text-primary hover:bg-primary/10"}`}
          >
            <Hand size={17} /> {meInQueue ? "Hạ tay" : "Giơ tay"}
          </button>
          <span className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white/[0.045] px-4 text-sm text-white/60">
            <Users size={16} className="text-primary" /> {onlineUsers.length}{" "}
            thành viên
          </span>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b border-white/10 px-3 sm:px-5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setActiveTab(id)}
            className={`inline-flex min-h-14 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-medium transition ${activeTab === id ? "border-primary text-primary" : "border-transparent text-white/45 hover:text-white"}`}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      <div className="p-4 sm:p-6">
        {activeTab === "session" && (
          <SessionTab
            session={session}
            onlineUsers={onlineUsers}
            action={action}
            busy={busy}
          />
        )}
        {activeTab === "board" && (
          <BoardTab session={session} action={action} busy={busy} user={user} />
        )}
        {activeTab === "resources" && (
          <ResourcesTab
            session={session}
            onlineUsers={onlineUsers}
            action={action}
            busy={busy}
            user={user}
          />
        )}
        {activeTab === "polls" && (
          <PollsTab session={session} action={action} busy={busy} user={user} />
        )}
        {activeTab === "ask-ai" && hasUnlimitedRoomAI && (
          <RoomAiChat session={session} roomId={roomId} socket={socket} />
        )}
        {activeTab === "ai" && hasUnlimitedRoomAI && (
          <AiTab
            session={session}
            roomId={roomId}
            setSession={setSession}
            socket={socket}
            action={action}
            busy={busy}
          />
        )}
        {(activeTab === "ask-ai" || activeTab === "ai") && !hasUnlimitedRoomAI && (
          <RoomAiUpgrade />
        )}
      </div>
    </div>
  );
}

function RoomAiUpgrade() {
  return (
    <Panel className="mx-auto max-w-2xl p-6 text-center sm:p-8">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Crown size={23} aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg font-bold">AI không giới hạn trong phòng thảo luận</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/50">
        Nâng cấp HOCA+ để hỏi AI theo nội dung của phòng, tạo tổng kết và flashcard không giới hạn.
      </p>
      <Link
        to="/pricing"
        className="mt-5 inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 text-sm font-semibold text-[#18100A] transition hover:bg-primary-light active:translate-y-px"
      >
        <Crown size={16} aria-hidden="true" /> Xem các gói HOCA+
      </Link>
    </Panel>
  );
}

function SessionTab({ session, onlineUsers, action, busy }) {
  const [topic, setTopic] = useState(session.topic || "");
  const [template, setTemplate] = useState(session.template || "GENERAL");
  const activeStage = session.agenda?.[session.activeAgendaIndex];
  const lastAgendaIndex = Math.max(0, (session.agenda?.length || 1) - 1);
  const isLastAgenda = session.activeAgendaIndex >= lastAgendaIndex;
  const agendaCompleted = Boolean(
    session.agenda?.length && session.agenda.every((item) => item.completed),
  );
  const resetAgenda = async () => {
    if (!(await confirmDialog("Bắt đầu lại tiến trình từ giai đoạn đầu tiên?", { confirmText: "Bắt đầu lại" }))) return;
    action("RESET_AGENDA", {}, "Đã bắt đầu lại tiến trình buổi học");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
      <Panel className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">
              Tiến trình buổi học
            </p>
            <h3 className="mt-2 text-2xl font-bold">
              {activeStage?.title || "Sẵn sàng bắt đầu"}
            </h3>
            <p className="mt-1 text-sm text-white/45">
              Giai đoạn{" "}
              {Math.min(
                session.activeAgendaIndex + 1,
                session.agenda?.length || 1,
              )}{" "}
              / {session.agenda?.length || 1}
            </p>
          </div>
          <span className="rounded-xl bg-primary/10 px-3 py-2 text-sm font-bold text-primary">
            {activeStage?.minutes || 0} phút
          </span>
        </div>
        <div className="mt-6 grid gap-2">
          {session.agenda?.map((item, index) => (
            <div
              key={item._id || index}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${index === session.activeAgendaIndex ? "border-primary/40 bg-primary/[0.07]" : "border-white/8 bg-white/[0.02]"}`}
            >
              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${item.completed ? "bg-emerald-500/15 text-emerald-400" : index === session.activeAgendaIndex ? "bg-primary text-[#18100A]" : "bg-white/[0.06] text-white/40"}`}
              >
                {item.completed ? <Check size={14} /> : index + 1}
              </span>
              <span className="flex-1 text-sm font-medium">{item.title}</span>
              <span className="text-xs text-white/35">{item.minutes}p</span>
            </div>
          ))}
        </div>
        {session.permissions?.canManage && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy || agendaCompleted}
              onClick={() =>
                action(
                  "NEXT_AGENDA",
                  {},
                  isLastAgenda
                    ? "Đã hoàn tất tiến trình buổi học"
                    : "Đã chuyển sang giai đoạn tiếp theo",
                )
              }
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-[#18100A] hover:bg-primary-light disabled:cursor-not-allowed disabled:bg-emerald-500/15 disabled:text-emerald-400 disabled:opacity-100"
            >
              {agendaCompleted
                ? "Đã hoàn tất tiến trình"
                : isLastAgenda
                  ? "Hoàn tất tiến trình"
                  : "Giai đoạn tiếp theo"}
              {agendaCompleted ? <Check size={17} /> : <ArrowRight size={17} />}
            </button>
            {agendaCompleted && (
              <button
                type="button"
                disabled={busy}
                onClick={resetAgenda}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary/35 px-5 text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-40"
              >
                <RotateCcw size={17} /> Làm lại tiến trình
              </button>
            )}
          </div>
        )}
      </Panel>

      <div className="space-y-5">
        <Panel className="p-5">
          <h3 className="font-bold">Sân khấu phát biểu</h3>
          {session.activeSpeaker?.userName ? (
            <div className="mt-4 rounded-xl border border-primary/30 bg-primary/[0.07] p-4">
              <p className="text-xs text-primary">ĐANG PHÁT BIỂU</p>
              <p className="mt-1 font-bold">{session.activeSpeaker.userName}</p>
              {session.permissions?.canManage && (
                <button
                  type="button"
                  onClick={() => action("STOP_SPEAKER")}
                  className="mt-3 inline-flex items-center gap-2 text-xs text-white/50 hover:text-white"
                >
                  <Square size={13} /> Kết thúc lượt
                </button>
              )}
            </div>
          ) : (
            <Empty>Chưa có người đang phát biểu</Empty>
          )}
          <div className="mt-4 space-y-2">
            {session.speakerQueue?.map((item, index) => (
              <div
                key={item._id}
                className="flex items-center gap-3 rounded-xl bg-white/[0.035] px-3 py-2.5"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm">{item.userName}</span>
                <Hand size={15} className="text-primary" />
              </div>
            ))}
          </div>
          {session.permissions?.canManage && (
            <button
              type="button"
              disabled={!session.speakerQueue?.length || busy}
              onClick={() => action("NEXT_SPEAKER", { minutes: 2 })}
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-primary/35 text-sm font-semibold text-primary disabled:opacity-30"
            >
              <Timer size={16} /> Mời người tiếp theo, 2 phút
            </button>
          )}
        </Panel>

        {session.permissions?.canManage && (
          <Panel className="p-5">
            <h3 className="font-bold">Thiết lập phiên</h3>
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Chủ đề thảo luận"
              className="app-input mt-4 w-full"
            />
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="mt-3 w-full rounded-xl border border-white/10 bg-dark-lighter px-3 py-3 text-sm"
            >
              {TEMPLATES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                action(
                  "CONFIGURE",
                  { topic, template },
                  "Đã áp dụng mẫu buổi học",
                )
              }
              className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-white/[0.06] text-sm font-semibold hover:bg-white/[0.1]"
            >
              Áp dụng mẫu
            </button>
          </Panel>
        )}

        {session.permissions?.isOwner && (
          <CoHostPicker
            onlineUsers={onlineUsers}
            session={session}
            action={action}
          />
        )}
      </div>
    </div>
  );
}

function CoHostPicker({ onlineUsers, session, action }) {
  return (
    <Panel className="p-5">
      <h3 className="font-bold">Đồng chủ phòng</h3>
      <div className="mt-3 space-y-2">
        {onlineUsers.map((member) => {
          const active = session.coHosts?.some(
            (id) => String(id) === String(member.userId),
          );
          return (
            <button
              key={member.userId}
              type="button"
              onClick={() => action("TOGGLE_COHOST", { userId: member.userId })}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm ${active ? "bg-primary/10 text-primary" : "bg-white/[0.03] text-white/60"}`}
            >
              <Users size={15} />
              <span className="flex-1 truncate">{member.userName}</span>
              {active && <Check size={15} />}
            </button>
          );
        })}
      </div>
    </Panel>
  );
}

function BoardTab({ session, action, busy, user }) {
  const [kind, setKind] = useState("IDEA");
  const [text, setText] = useState("");
  const [deletingItemId, setDeletingItemId] = useState(null);
  const submit = async (event) => {
    event.preventDefault();
    if (!text.trim()) return;
    const result = await action("ADD_BOARD", { kind, text });
    if (result) setText("");
  };
  const removeItem = async (item) => {
    if (deletingItemId) return;
    if (!(await confirmDialog(`Xóa nội dung “${item.text}”?`, { destructive: true, confirmText: "Xóa nội dung" }))) return;
    setDeletingItemId(String(item._id));
    try {
      await action(
        "DELETE_BOARD",
        { itemId: item._id },
        "Đã xóa nội dung khỏi Bảng chung",
      );
    } finally {
      setDeletingItemId(null);
    }
  };
  return (
    <div>
      <form
        onSubmit={submit}
        className="mb-5 grid gap-3 rounded-2xl border border-white/10 bg-[#171B2E] p-4 sm:grid-cols-[160px_1fr_auto]"
      >
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value)}
          className="rounded-xl border border-white/10 bg-dark-lighter px-3 text-sm"
        >
          {BOARD_COLUMNS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Thêm ý tưởng, câu hỏi hoặc kết luận..."
          className="app-input w-full"
        />
        <button
          disabled={busy || !text.trim()}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-semibold text-[#18100A] disabled:opacity-40"
        >
          <Plus size={17} /> Thêm
        </button>
      </form>
      <div className="grid gap-4 lg:grid-cols-3">
        {BOARD_COLUMNS.map(([columnKind, label, Icon]) => {
          const items =
            session.boardItems?.filter((item) => item.kind === columnKind) ||
            [];
          return (
            <Panel key={columnKind} className="p-4">
              <h3 className="flex items-center gap-2 font-bold">
                <Icon size={18} className="text-primary" />
                {label}
                <span className="ml-auto text-xs text-white/30">
                  {items.length}
                </span>
              </h3>
              <div className="mt-4 space-y-3">
                {items.length ? (
                  items.map((item) => {
                    const authorId = item.author?._id || item.author;
                    const canDelete =
                      session.permissions?.canManage ||
                      String(authorId) === String(user?._id);
                    const isDeleting = deletingItemId === String(item._id);
                    return (
                      <article
                        key={item._id}
                        className={`rounded-xl border p-3 ${item.resolved ? "border-emerald-500/20 bg-emerald-500/[0.05]" : "border-white/10 bg-white/[0.025]"}`}
                      >
                        <p
                          className={`text-sm leading-6 ${item.resolved ? "text-white/45 line-through" : "text-white/80"}`}
                        >
                          {item.text}
                        </p>
                        <div className="mt-3 flex items-center gap-2 text-xs text-white/35">
                          <span className="min-w-0 flex-1 truncate">
                            {item.authorName}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              action("VOTE_BOARD", { itemId: item._id })
                            }
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-primary/10 hover:text-primary"
                          >
                            <Heart size={13} /> {item.votes?.length || 0}
                          </button>
                          {session.permissions?.canManage && (
                            <button
                              type="button"
                              onClick={() =>
                                action("RESOLVE_BOARD", { itemId: item._id })
                              }
                              className="rounded-lg p-1 hover:bg-emerald-500/10 hover:text-emerald-400"
                              aria-label="Đánh dấu đã giải quyết"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              disabled={busy || Boolean(deletingItemId)}
                              onClick={() => removeItem(item)}
                              className="rounded-lg p-1 text-white/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                              aria-label={
                                isDeleting
                                  ? "Đang xóa nội dung"
                                  : "Xóa nội dung"
                              }
                              title={isDeleting ? "Đang xóa..." : "Xóa"}
                            >
                              {isDeleting ? (
                                <RotateCcw size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          )}
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <Empty>Chưa có nội dung</Empty>
                )}
              </div>
            </Panel>
          );
        })}
      </div>
    </div>
  );
}

function ResourceItem({ item, canDelete, deleting, deleteDisabled, onDelete }) {
  return (
    <article className="group rounded-xl border border-white/10 bg-white/[0.025] p-4 hover:border-primary/35">
      <div className="flex gap-3">
        <FileText size={19} className="mt-0.5 shrink-0 text-primary" />
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 flex-1"
        >
          <p className="truncate font-semibold group-hover:text-primary">
            {item.title}
          </p>
          <p className="mt-1 text-sm text-white/45">
            {item.note || `Được thêm bởi ${item.addedByName}`}
          </p>
        </a>
        <div className="flex shrink-0 items-center gap-1 self-start">
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/25 hover:bg-primary/10 hover:text-primary"
            aria-label={`Mở tài liệu ${item.title}`}
            title="Mở tài liệu"
          >
            <ExternalLink size={15} />
          </a>
          {canDelete && (
            <button
              type="button"
              disabled={deleteDisabled}
              onClick={() => onDelete(item)}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-white/30 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
              aria-label={
                deleting ? `Đang xóa ${item.title}` : `Xóa ${item.title}`
              }
              title={deleting ? "Đang xóa..." : "Xóa tài liệu"}
            >
              {deleting ? (
                <RotateCcw size={15} className="animate-spin" />
              ) : (
                <Trash2 size={15} />
              )}
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function ResourcesTab({ session, onlineUsers, action, busy, user }) {
  const [resource, setResource] = useState({ title: "", url: "", note: "" });
  const [task, setTask] = useState({
    text: "",
    assignee: "",
    assigneeName: "Cả nhóm",
  });
  const [uploading, setUploading] = useState(false);
  const [deletingResourceId, setDeletingResourceId] = useState(null);
  const uploadFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const uploaded = await uploadApi.discussionDocument(file);
      setResource({
        title: uploaded.name || file.name,
        url: uploaded.url,
        note: "",
      });
      toast.success("Đã tải tài liệu, hãy thêm ghi chú rồi lưu vào phòng");
    } catch (error) {
      toast.error(error.response?.data?.error || "Không thể tải tài liệu");
    } finally {
      setUploading(false);
    }
  };
  const removeResource = async (item) => {
    if (deletingResourceId) return;
    if (!(await confirmDialog(`Xóa tài liệu “${item.title}”?`, { destructive: true, confirmText: "Xóa tài liệu" }))) return;
    setDeletingResourceId(String(item._id));
    try {
      await action(
        "DELETE_RESOURCE",
        { resourceId: item._id },
        "Đã xóa tài liệu khỏi phòng",
      );
    } finally {
      setDeletingResourceId(null);
    }
  };
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Panel className="p-5">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <Link2 size={18} className="text-primary" /> Tài liệu chung
        </h3>
        <label className="mt-4 flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-primary/35 bg-primary/[0.04] text-sm font-semibold text-primary hover:bg-primary/[0.08]">
          <Upload size={17} />{" "}
          {uploading ? "Đang tải lên..." : "Tải PDF, Word, PowerPoint hoặc ảnh"}
          <input
            type="file"
            className="hidden"
            disabled={uploading}
            accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,image/*"
            onChange={uploadFile}
          />
        </label>
        <div className="mt-3 grid gap-3">
          <input
            className="app-input"
            placeholder="Tên tài liệu"
            value={resource.title}
            onChange={(e) =>
              setResource({ ...resource, title: e.target.value })
            }
          />
          <input
            className="app-input"
            type="url"
            placeholder="Hoặc dán liên kết https://..."
            value={resource.url}
            onChange={(e) => setResource({ ...resource, url: e.target.value })}
          />
          <input
            className="app-input"
            placeholder="Ghi chú hoặc trang cần xem"
            value={resource.note}
            onChange={(e) => setResource({ ...resource, note: e.target.value })}
          />
          <button
            type="button"
            disabled={busy || !resource.url}
            onClick={async () => {
              const data = await action("ADD_RESOURCE", resource);
              if (data) setResource({ title: "", url: "", note: "" });
            }}
            className="min-h-11 rounded-xl bg-primary font-semibold text-[#18100A] disabled:opacity-40"
          >
            Thêm tài liệu
          </button>
        </div>
        <div className="mt-5 space-y-3">
          {session.resources?.length ? (
            session.resources.map((item) => (
              <ResourceItem
                key={item._id}
                item={item}
                canDelete={
                  session.permissions?.canManage ||
                  String(item.addedBy?._id || item.addedBy) ===
                    String(user?._id)
                }
                deleting={deletingResourceId === String(item._id)}
                deleteDisabled={busy || Boolean(deletingResourceId)}
                onDelete={removeResource}
              />
            ))
          ) : (
            <Empty>Chưa có tài liệu</Empty>
          )}
        </div>
      </Panel>
      <Panel className="p-5">
        <h3 className="flex items-center gap-2 text-lg font-bold">
          <ListChecks size={18} className="text-primary" /> Nhiệm vụ sau buổi
          học
        </h3>
        <input
          className="app-input mt-4 w-full"
          placeholder="Nội dung nhiệm vụ"
          value={task.text}
          onChange={(e) => setTask({ ...task, text: e.target.value })}
        />
        <select
          className="mt-3 w-full rounded-xl border border-white/10 bg-dark-lighter px-3 py-3 text-sm"
          value={task.assignee}
          onChange={(e) => {
            const member = onlineUsers.find(
              (item) => String(item.userId) === e.target.value,
            );
            setTask({
              ...task,
              assignee: e.target.value,
              assigneeName: member?.userName || "Cả nhóm",
            });
          }}
        >
          <option value="">Cả nhóm</option>
          {onlineUsers.map((member) => (
            <option key={member.userId} value={member.userId}>
              {member.userName}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={busy || !task.text.trim()}
          onClick={async () => {
            const data = await action("ADD_TASK", task);
            if (data)
              setTask({ text: "", assignee: "", assigneeName: "Cả nhóm" });
          }}
          className="mt-3 min-h-11 w-full rounded-xl bg-primary font-semibold text-[#18100A] disabled:opacity-40"
        >
          Giao nhiệm vụ
        </button>
        <div className="mt-5 space-y-3">
          {session.tasks?.length ? (
            session.tasks.map((item) => (
              <button
                key={item._id}
                type="button"
                onClick={() => action("TOGGLE_TASK", { taskId: item._id })}
                className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-left"
              >
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${item.completed ? "border-emerald-400 bg-emerald-400 text-[#111527]" : "border-white/20"}`}
                >
                  {item.completed && <Check size={13} />}
                </span>
                <span className="min-w-0">
                  <span
                    className={`block text-sm ${item.completed ? "text-white/35 line-through" : "text-white/80"}`}
                  >
                    {item.text}
                  </span>
                  <span className="mt-1 block text-xs text-primary">
                    {item.assigneeName || "Cả nhóm"}
                  </span>
                </span>
              </button>
            ))
          ) : (
            <Empty>Chưa có nhiệm vụ</Empty>
          )}
        </div>
      </Panel>
    </div>
  );
}

function PollsTab({ session, action, busy, user }) {
  const [form, setForm] = useState({
    question: "",
    pollType: "POLL",
    options: ["", ""],
    correctOption: 0,
    explanation: "",
  });
  const activePolls = useMemo(
    () => [...(session.polls || [])].reverse(),
    [session.polls],
  );
  const removePoll = async (poll) => {
    if (!(await confirmDialog(`Xóa câu hỏi “${poll.question}”?`, { destructive: true, confirmText: "Xóa câu hỏi" }))) return;
    await action(
      "DELETE_POLL",
      { pollId: poll._id },
      "Đã xóa quiz hoặc bình chọn",
    );
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
      {session.permissions?.canManage && (
        <Panel className="p-5">
          <h3 className="text-lg font-bold">Tạo quiz hoặc bình chọn</h3>
          <select
            value={form.pollType}
            onChange={(e) => setForm({ ...form, pollType: e.target.value })}
            className="mt-4 w-full rounded-xl border border-white/10 bg-dark-lighter px-3 py-3 text-sm"
          >
            <option value="POLL">Bình chọn</option>
            <option value="QUIZ">Câu hỏi kiến thức</option>
          </select>
          <input
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            className="app-input mt-3 w-full"
            placeholder="Nhập câu hỏi"
          />
          {form.options.map((option, index) => (
            <div key={index} className="mt-3 flex gap-2">
              <input
                value={option}
                onChange={(e) => {
                  const options = [...form.options];
                  options[index] = e.target.value;
                  setForm({ ...form, options });
                }}
                className="app-input min-w-0 flex-1"
                placeholder={`Lựa chọn ${index + 1}`}
              />
              {form.pollType === "QUIZ" && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, correctOption: index })}
                  className={`w-11 rounded-xl border ${form.correctOption === index ? "border-emerald-400 bg-emerald-400/10 text-emerald-400" : "border-white/10 text-white/30"}`}
                >
                  <Check size={16} className="mx-auto" />
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setForm({ ...form, options: [...form.options, ""] })}
            className="mt-3 text-sm text-primary"
          >
            + Thêm lựa chọn
          </button>
          {form.pollType === "QUIZ" && (
            <textarea
              value={form.explanation}
              onChange={(e) =>
                setForm({ ...form, explanation: e.target.value })
              }
              className="mt-3 min-h-20 w-full"
              placeholder="Giải thích đáp án"
            />
          )}
          <button
            type="button"
            disabled={
              busy || !form.question || form.options.filter(Boolean).length < 2
            }
            onClick={async () => {
              const data = await action(
                "CREATE_POLL",
                form,
                "Đã mở câu hỏi mới",
              );
              if (data)
                setForm({
                  question: "",
                  pollType: "POLL",
                  options: ["", ""],
                  correctOption: 0,
                  explanation: "",
                });
            }}
            className="mt-4 min-h-11 w-full rounded-xl bg-primary font-semibold text-[#18100A] disabled:opacity-40"
          >
            Mở câu hỏi
          </button>
        </Panel>
      )}
      <div className={session.permissions?.canManage ? "" : "lg:col-span-2"}>
        {activePolls.length ? (
          <div className="space-y-4">
            {activePolls.map((poll) => {
              const total = poll.options.reduce(
                (sum, option) => sum + option.voters.length,
                0,
              );
              const myVote = poll.options.findIndex((option) =>
                option.voters.some((id) => String(id) === String(user?._id)),
              );
              return (
                <Panel key={poll._id} className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs font-semibold text-primary">
                        <Vote size={14} />{" "}
                        {poll.type === "QUIZ" ? "QUIZ KIẾN THỨC" : "BÌNH CHỌN"}
                      </div>
                      <h3 className="mt-2 text-lg font-bold">
                        {poll.question}
                      </h3>
                    </div>
                    <span
                      className={`rounded-lg px-2.5 py-1 text-xs ${poll.active ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.05] text-white/35"}`}
                    >
                      {poll.active ? "Đang mở" : "Đã đóng"}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {poll.options.map((option, index) => {
                      const percent = total
                        ? Math.round((option.voters.length / total) * 100)
                        : 0;
                      const showQuizResult =
                        poll.type === "QUIZ" &&
                        (myVote !== -1 || !poll.active);
                      const correct =
                        showQuizResult &&
                        poll.correctOption === index;
                      const wrongSelected =
                        showQuizResult &&
                        myVote === index &&
                        poll.correctOption !== index;
                      return (
                        <button
                          key={option._id}
                          type="button"
                          disabled={
                            !poll.active ||
                            busy ||
                            (poll.type === "QUIZ" && myVote !== -1)
                          }
                          onClick={() =>
                            action("VOTE_POLL", {
                              pollId: poll._id,
                              optionIndex: index,
                            })
                          }
                          className={`relative flex min-h-12 w-full items-center overflow-hidden rounded-xl border px-4 text-left text-sm ${correct ? "border-emerald-400/60 text-emerald-200" : wrongSelected ? "border-red-400/60 text-red-200" : myVote === index ? "border-primary/50" : "border-white/10"}`}
                        >
                          <span
                            className={`absolute inset-y-0 left-0 ${correct ? "bg-emerald-500/15" : wrongSelected ? "bg-red-500/15" : "bg-primary/[0.08]"}`}
                            style={{ width: `${percent}%` }}
                          />
                          <span className="relative flex-1">{option.text}</span>
                          {correct && (
                            <span className="relative mr-3 inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                              <Check size={14} /> Đúng
                            </span>
                          )}
                          {wrongSelected && (
                            <span className="relative mr-3 inline-flex items-center gap-1 text-xs font-semibold text-red-400">
                              <X size={14} /> Sai
                            </span>
                          )}
                          <span className="relative text-xs text-white/40">
                            {option.voters.length} · {percent}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {poll.type === "QUIZ" &&
                    (myVote !== -1 || !poll.active) &&
                    poll.explanation && (
                    <p className="mt-4 rounded-xl bg-emerald-500/[0.06] p-3 text-sm leading-6 text-emerald-200/75">
                      <span className="font-semibold">Giải thích: </span>
                      {poll.explanation}
                    </p>
                  )}
                  {session.permissions?.canManage && (
                    <div className="mt-4 flex flex-wrap items-center gap-4">
                      {poll.active && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() =>
                            action("CLOSE_POLL", { pollId: poll._id })
                          }
                          className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white disabled:opacity-40"
                        >
                          <X size={15} /> Đóng bình chọn
                        </button>
                      )}
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => removePoll(poll)}
                        className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-red-400 disabled:opacity-40"
                      >
                        <Trash2 size={15} /> Xóa
                      </button>
                    </div>
                  )}
                </Panel>
              );
            })}
          </div>
        ) : (
          <Empty>Chưa có quiz hoặc bình chọn</Empty>
        )}
      </div>
    </div>
  );
}

const AI_QUESTION_SUGGESTIONS = [
  "Giải thích chủ đề này theo cách dễ hiểu hơn",
  "Cho tôi một ví dụ thực tế",
  "Tóm tắt những ý chính cần nhớ",
  "Tạo 3 câu hỏi để tôi tự kiểm tra",
];

function RoomAiChat({ session, roomId, socket }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    messagesRef.current?.scrollTo({
      top: messagesRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  const roomContext = () => {
    const notes = (session.boardItems || [])
      .slice(-12)
      .map((item) => `${item.kind}: ${item.text}`)
      .join("\n");
    const tasks = (session.tasks || [])
      .slice(-8)
      .map((item) => `${item.completed ? "Đã xong" : "Cần làm"}: ${item.text}`)
      .join("\n");
    return [
      "Bạn đang hỗ trợ người học trong một phòng thảo luận HOCA.",
      `Chủ đề phòng: ${session.topic || "Chưa đặt chủ đề"}.`,
      notes ? `Ghi chú trên Bảng chung:\n${notes}` : "",
      tasks ? `Nhiệm vụ của nhóm:\n${tasks}` : "",
      "Nếu câu hỏi không liên quan đến phòng, vẫn trả lời như một trợ lý học tập thông thường.",
    ]
      .filter(Boolean)
      .join("\n\n");
  };

  const sendQuestion = async (suggested) => {
    const question = String(suggested ?? input).trim();
    if (!question || sending) return;
    const history = messages.slice(-8).map((message) => ({
      role: message.role === "ai" ? "assistant" : "user",
      content: message.content,
    }));
    setMessages((current) => [...current, { role: "user", content: question }]);
    setInput("");
    setSending(true);
    try {
      const context = roomContext().slice(0, 1200);
      const prompt = `${context}\n\nCâu hỏi của người học: ${question}`;
      const result = await aiApi.ask(prompt.slice(0, 2000), history, {
        scope: "ROOM",
        roomId,
      });
      setMessages((current) => [
        ...current,
        { role: "ai", content: result.response },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "ai",
          content:
            error.response?.data?.message ||
            "AI đang bận hoặc mất kết nối. Vui lòng thử lại sau.",
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const shareAnswer = (content) => {
    if (!socket?.connected) {
      toast.error("Chưa kết nối được với chat phòng.");
      return;
    }
    socket.emit("chat-message", {
      roomId,
      message: `Chia sẻ từ HOCA AI:\n${content}`.slice(0, 2000),
    });
    toast.success("Đã chia sẻ câu trả lời vào chat phòng");
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[0.72fr_1.28fr]">
      <Panel className="p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Bot size={22} />
          </span>
          <div>
            <h3 className="font-bold">HOCA AI trong phòng</h3>
            <p className="text-sm text-white/40">
              Hỏi riêng, không làm gián đoạn nhóm
            </p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-white/50">
          AI sử dụng chủ đề, Bảng chung và nhiệm vụ để trả lời sát nội dung đang
          học.
        </p>
        <div className="mt-5 space-y-2">
          {AI_QUESTION_SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              disabled={sending}
              onClick={() => sendQuestion(suggestion)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.025] px-3 py-3 text-left text-sm leading-5 text-white/60 transition hover:border-primary/35 hover:bg-primary/[0.04] hover:text-white disabled:opacity-40"
            >
              {suggestion}
            </button>
          ))}
        </div>
        <p className="mt-5 border-t border-white/10 pt-4 text-xs leading-5 text-white/35">
          Cuộc hỏi đáp chỉ hiển thị với bạn. Chỉ chia sẻ sang chat chung khi bạn
          chủ động chọn.
        </p>
      </Panel>

      <Panel className="flex min-h-[560px] flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <h3 className="font-bold">Hỏi bất kỳ điều gì về học tập</h3>
            <p className="mt-0.5 text-xs text-white/35">
              AI có thể mắc lỗi, hãy kiểm tra thông tin quan trọng.
            </p>
          </div>
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/45 hover:border-primary/35 hover:text-primary"
              aria-label="Cuộc trò chuyện mới"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>

        <div ref={messagesRef} className="flex-1 space-y-5 overflow-y-auto p-5">
          {messages.length === 0 && !sending && (
            <div className="flex h-full min-h-72 flex-col items-center justify-center px-6 text-center">
              <Bot size={42} className="text-primary/45" />
              <p className="mt-4 font-semibold text-white/70">
                Bạn đang thắc mắc điều gì?
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/40">
                Hỏi khái niệm, bài tập, công thức, ví dụ hoặc nội dung đang được
                thảo luận.
              </p>
            </div>
          )}
          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${message.role === "user" ? "bg-white/[0.06] text-white/55" : "bg-primary/10 text-primary"}`}
              >
                {message.role === "user" ? (
                  <UserRound size={16} />
                ) : (
                  <Bot size={16} />
                )}
              </span>
              <div className="max-w-[84%]">
                <div
                  className={`whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-7 ${message.role === "user" ? "rounded-tr-sm bg-primary text-[#18100A]" : message.error ? "rounded-tl-sm border border-red-500/20 bg-red-500/10 text-red-300" : "rounded-tl-sm bg-white/[0.055] text-white/80"}`}
                >
                  {message.content}
                </div>
                {message.role === "ai" && !message.error && (
                  <button
                    type="button"
                    onClick={() => shareAnswer(message.content)}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-primary"
                  >
                    <Share2 size={13} /> Chia sẻ vào chat phòng
                  </button>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Bot size={16} />
              </span>
              <span className="rounded-2xl bg-white/[0.055] px-4 py-3 text-sm text-white/45">
                AI đang suy nghĩ...
              </span>
            </div>
          )}
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            sendQuestion();
          }}
          className="border-t border-white/10 p-4"
        >
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  sendQuestion();
                }
              }}
              rows={2}
              maxLength={1500}
              placeholder="Nhập câu hỏi, Enter để gửi..."
              className="app-input min-h-[52px] flex-1 resize-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-xl bg-primary text-[#18100A] hover:bg-primary-light disabled:opacity-40"
              aria-label="Gửi câu hỏi"
            >
              <Send size={18} />
            </button>
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-white/30">
            <span>Shift + Enter để xuống dòng</span>
            <span>{input.length}/1500</span>
          </div>
        </form>
      </Panel>
    </div>
  );
}

function AiTab({ session, roomId, setSession, socket, action, busy }) {
  const [aiBusy, setAiBusy] = useState(false);
  const generate = async () => {
    setAiBusy(true);
    try {
      const data = await discussionApi.generateSummary(roomId);
      setSession(data);
      socket?.emit("discussion-session-updated", { roomId });
      toast.success("AI đã hoàn thành báo cáo buổi học");
    } catch (error) {
      toast.error(error.response?.data?.message || "AI chưa thể tổng kết");
    } finally {
      setAiBusy(false);
    }
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-5">
        <Panel className="p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Bot size={22} />
            </span>
            <div>
              <h3 className="font-bold">AI Thư ký học tập</h3>
              <p className="text-sm text-white/40">
                Tổng hợp chat và bảng chung
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={!session.permissions?.canManage || busy}
            onClick={() =>
              action(
                "TOGGLE_AI",
                {},
                session.aiEnabled ? "Đã tắt AI Thư ký" : "Đã bật AI Thư ký",
              )
            }
            className={`mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl font-semibold ${session.aiEnabled ? "bg-emerald-500/15 text-emerald-400" : "border border-primary/35 text-primary"}`}
          >
            <Brain size={18} />{" "}
            {session.aiEnabled ? "AI đang ghi chú" : "Bật AI Thư ký"}
          </button>
          <p className="mt-3 text-xs leading-5 text-white/35">
            Khi bật, thành viên cần được thông báo rằng nội dung chat sẽ được
            dùng để tạo bản tổng kết.
          </p>
        </Panel>
        <Panel className="p-5">
          <h3 className="flex items-center gap-2 font-bold">
            <ClipboardList size={18} className="text-primary" /> Hoàn tất phiên
          </h3>
          <p className="mt-2 text-sm leading-6 text-white/45">
            Chốt thời gian kết thúc và lưu toàn bộ bảng chung, quiz, tài liệu và
            nhiệm vụ.
          </p>
          <button
            type="button"
            disabled={!session.permissions?.canManage || busy}
            onClick={() =>
              action("COMPLETE_SESSION", {}, "Đã lưu kết quả buổi học")
            }
            className="mt-4 min-h-11 w-full rounded-xl bg-white/[0.06] text-sm font-semibold disabled:opacity-40"
          >
            {session.completedAt ? "Đã hoàn tất" : "Hoàn tất buổi học"}
          </button>
        </Panel>
      </div>
      <div className="space-y-5">
        <Panel className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Báo cáo buổi học
              </p>
              <h3 className="mt-2 text-xl font-bold">Tổng kết thông minh</h3>
            </div>
            {session.permissions?.canManage && (
              <button
                type="button"
                disabled={aiBusy || !session.aiEnabled}
                onClick={generate}
                className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-[#18100A] disabled:opacity-40"
              >
                {aiBusy ? (
                  <RotateCcw size={16} className="animate-spin" />
                ) : (
                  <Sparkles size={16} />
                )}{" "}
                {session.aiSummary ? "Tạo lại" : "Tạo báo cáo"}
              </button>
            )}
          </div>
          {session.aiSummary ? (
            <div className="mt-5 whitespace-pre-wrap rounded-xl bg-white/[0.025] p-4 text-sm leading-7 text-white/70">
              {session.aiSummary}
            </div>
          ) : (
            <Empty>
              Bật AI Thư ký và tạo báo cáo khi buổi thảo luận kết thúc
            </Empty>
          )}
        </Panel>
        {session.flashcards?.length > 0 && (
          <Panel className="p-5">
            <h3 className="font-bold">Flashcard từ buổi học</h3>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {session.flashcards.map((card, index) => (
                <div
                  key={card._id || index}
                  className="rounded-xl border border-white/10 bg-white/[0.025] p-4"
                >
                  <p className="text-sm font-semibold text-primary">
                    {card.question}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-white/55">
                    {card.answer}
                  </p>
                </div>
              ))}
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
