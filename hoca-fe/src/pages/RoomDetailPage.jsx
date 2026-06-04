import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../lib/api";
import { initSocket, getSocket } from "../lib/socket";
import { chatApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";
import {
  Send,
  Users,
  LogOut,
  MessageCircle,
  XCircle,
  Lock,
  Clock,
  Crown,
  Flag,
  Smile,
} from "lucide-react";
import PomodoroTimer from "../components/PomodoroTimer";
import VideoRoom from "../components/VideoRoom";
import ReportModal from "../components/ReportModal";
import FeedbackModal from "../components/FeedbackModal";
import StickerPicker from "../components/StickerPicker";

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { token, user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [canChat, setCanChat] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null); // FREE tier remaining time
  const [reportTarget, setReportTarget] = useState(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", id],
    queryFn: async () => {
      const response = await api.get(`/api/rooms/${id}`);
      return response.data;
    },
  });

  const isPremium = user?.subscriptionTier && user.subscriptionTier !== "FREE";
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    // ✅ CHANGED: Allow ALL users to chat (FREE + PREMIUM + ADMIN)
    setCanChat(true); // Everyone can chat now!
  }, []);

  useEffect(() => {
    if (!token) return;

    // Load chat history first (so reload keeps messages)
    chatApi
      .getMessages(id, 50)
      .then((history) => {
        const mapped = (history || []).map((m) => ({
          _id: m._id,
          userId: m.sender?._id || m.sender,
          displayName: m.sender?.displayName || "User",
          avatar: m.sender?.avatar,
          message: m.content,
          content: m.content,
          type: m.type,
          timestamp: m.createdAt,
        }));
        setMessages(mapped);
      })
      .catch(() => {
        /* room may have no history yet */
      });

    const socket = initSocket(token);

    // Wait for socket to be connected before joining room
    const joinRoom = () => {
      if (socket.connected) {
        console.log("🔄 Joining room:", id);
        socket.emit("join-room", { roomId: id });
      } else {
        console.log("⏳ Waiting for socket connection...");
        socket.once("connect", () => {
          console.log("🔄 Socket connected, now joining room:", id);
          socket.emit("join-room", { roomId: id });
        });
      }
    };

    joinRoom();

    const onChat = (message) => {
      setMessages((prev) => [...prev, message]);
    };
    const onJoined = (data) => {
      const name = data.userName || data.userInfo?.displayName;
      if (name) toast.success(`${name} đã tham gia phòng`);
    };
    const onLeft = (data) => {
      if (data.userName) toast(`${data.userName} đã rời phòng`);
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    };
    const onUsers = (users) => setOnlineUsers(users);
    const onClosed = (data) => {
      toast.error(data.message || "Phòng đã bị đóng");
      setTimeout(() => navigate("/rooms"), 1500);
    };
    const onDeleted = (data) => {
      toast.error(data.message || "Phòng đã bị xóa");
      setTimeout(() => navigate("/rooms"), 1500);
    };
    const onSessionInfo = (info) => setSessionInfo(info);
    const onTimeStatus = (s) =>
      setSessionInfo((prev) => ({
        ...prev,
        remainingMinutes: s.remainingMinutes,
      }));
    const onSessionWarning = (w) =>
      toast(w.message, { icon: "⏰", duration: 6000 });
    const onSessionExpired = (e) => {
      toast.error(e.message, { duration: 6000 });
      setTimeout(() => navigate("/pricing"), 2000);
    };
    const onChatError = (e) => toast.error(e.message);
    const onError = (e) => toast.error(e.message || "Có lỗi xảy ra");
    const onAiThinking = (d) => setAiThinking(!!d.isThinking);

    socket.on("chat-message", onChat);
    socket.on("user-joined", onJoined);
    socket.on("user-left", onLeft);
    socket.on("room-users", onUsers);
    socket.on("room-closed", onClosed);
    socket.on("room-deleted", onDeleted);
    socket.on("session-info", onSessionInfo);
    socket.on("time-status", onTimeStatus);
    socket.on("session-warning", onSessionWarning);
    socket.on("session-expired", onSessionExpired);
    socket.on("chat-error", onChatError);
    socket.on("error", onError);
    socket.on("ai-thinking", onAiThinking);

    return () => {
      socket.emit("leave-room", { roomId: id });
      socket.off("chat-message", onChat);
      socket.off("user-joined", onJoined);
      socket.off("user-left", onLeft);
      socket.off("room-users", onUsers);
      socket.off("room-closed", onClosed);
      socket.off("room-deleted", onDeleted);
      socket.off("session-info", onSessionInfo);
      socket.off("time-status", onTimeStatus);
      socket.off("session-warning", onSessionWarning);
      socket.off("session-expired", onSessionExpired);
      socket.off("chat-error", onChatError);
      socket.off("error", onError);
      socket.off("ai-thinking", onAiThinking);
    };
  }, [id, token, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiThinking]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const socket = getSocket();
    if (socket) {
      socket.emit("chat-message", { roomId: id, message: newMessage });
      setNewMessage("");
    }
  };

  const sendSticker = ({ text, stickerUrl }) => {
    const socket = getSocket();
    if (!socket) return;
    // Send emoji as text, or sticker url as message content
    socket.emit("chat-message", {
      roomId: id,
      message: text || stickerUrl,
      type: stickerUrl ? "STICKER" : "TEXT",
    });
  };

  // Open the rating popup first; actual leave happens when it closes.
  const handleLeaveRoom = () => {
    setShowFeedback(true);
  };

  // Called by the feedback modal (after submit or skip)
  const finishLeave = async () => {
    setShowFeedback(false);
    setLeaving(true);

    // Emit leave-room and cleanup listeners immediately
    const socket = getSocket();
    if (socket) {
      console.log("🚪 Leaving room:", id);
      socket.emit("leave-room", { roomId: id });

      // Remove all room-specific listeners to prevent receiving stale updates
      socket.off("chat-message");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-users");
      socket.off("room-closed");
      socket.off("room-deleted");
      socket.off("session-info");
      socket.off("time-status");
      socket.off("session-warning");
      socket.off("session-expired");
      socket.off("chat-error");
      socket.off("error");
      socket.off("ai-thinking");
    }

    try {
      console.log("📡 Calling leave API...");
      await api.post(`/api/rooms/${id}/leave`);
      console.log("✅ Leave API success");

      // ✅ Invalidate and refetch room queries immediately
      console.log("🔄 Invalidating queries...");
      await queryClient.invalidateQueries({ queryKey: ["rooms"] });
      await queryClient.invalidateQueries({ queryKey: ["my-rooms"] });
      await queryClient.invalidateQueries({ queryKey: ["room", id] });

      // Force refetch immediately
      await queryClient.refetchQueries({ queryKey: ["rooms"] });
      await queryClient.refetchQueries({ queryKey: ["my-rooms"] });

      console.log("✅ Queries invalidated and refetched");
    } catch (err) {
      console.error("❌ Leave error:", err);
      /* ignore - still navigate away */
    } finally {
      console.log("🔀 Navigating to /rooms");
      navigate("/rooms");
    }
  };

  const handleCloseRoom = async () => {
    if (!confirm("Đóng phòng này? Tất cả người dùng sẽ bị đá ra.")) return;

    // Cleanup listeners before closing
    const socket = getSocket();
    if (socket) {
      socket.off("chat-message");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-users");
      socket.off("room-closed");
      socket.off("room-deleted");
      socket.off("session-info");
      socket.off("time-status");
      socket.off("session-warning");
      socket.off("session-expired");
      socket.off("chat-error");
      socket.off("error");
      socket.off("ai-thinking");
    }

    try {
      await api.post(`/api/rooms/${id}/close`);
      toast.success("Đã đóng phòng!");

      // ✅ Invalidate room queries
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
      queryClient.invalidateQueries({ queryKey: ["my-rooms"] });

      navigate("/rooms");
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể đóng phòng");
    }
  };

  const isOwnerOrAdmin =
    room?.owner?._id === user?._id || room?.owner === user?._id || isAdmin;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-white">
      {/* Room Header */}
      <div className="stat-card mb-6">
        <div className="flex flex-col md:flex-row justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold">{room?.name}</h1>
              <span className="pill bg-dark-lighter text-white/60">
                {room?.roomType === "VIDEO"
                  ? "📹 Camera"
                  : room?.roomType === "DISCUSSION"
                    ? "🎤 Thảo luận"
                    : "🔇 Im lặng"}
              </span>
            </div>
            <p className="text-white/50">
              {room?.description || "Không có mô tả"}
            </p>
            <div className="mt-3 flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1.5 text-white/60">
                <Users size={16} /> {onlineUsers.length} online
              </span>
              <span className="flex items-center gap-1.5 text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Đang hoạt động
              </span>
              {sessionInfo && !isPremium && (
                <span className="flex items-center gap-1.5 text-orange-400">
                  <Clock size={16} /> Còn {sessionInfo.remainingMinutes ?? "—"}{" "}
                  phút
                </span>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            {isOwnerOrAdmin && (
              <button
                onClick={handleCloseRoom}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-lg transition"
              >
                <XCircle size={18} /> Đóng phòng
              </button>
            )}
            <button
              onClick={handleLeaveRoom}
              disabled={leaving}
              className="flex items-center gap-2 px-4 py-2 bg-dark-lighter hover:bg-dark rounded-lg transition disabled:opacity-50"
            >
              <LogOut size={18} /> {leaving ? "Đang rời..." : "Rời phòng"}
            </button>
          </div>
        </div>
      </div>

      {/* Video grid for VIDEO rooms */}
      {room?.roomType === "VIDEO" && (
        <div className="mb-6">
          <VideoRoom
            socket={getSocket()}
            roomId={id}
            user={user}
            onlineUsers={onlineUsers}
          />
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Chat */}
        <div className="lg:col-span-3">
          <div className="stat-card flex flex-col h-[600px] p-0 overflow-hidden">
            <div className="border-b border-white/10 px-4 py-3">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageCircle size={18} className="text-primary" />
                Chat phòng học
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-white/30 mt-24">
                  <MessageCircle className="mx-auto h-14 w-14 mb-3 opacity-30" />
                  <p>Chưa có tin nhắn nào</p>
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isMine = msg.userId === user?._id;
                  const isSystem =
                    msg.userId === "system" || msg.type === "SYSTEM";
                  const isBot = msg.userId === "HOCA_AI_BOT";
                  if (isSystem) {
                    return (
                      <div key={index} className="text-center">
                        <span className="text-xs text-white/40 bg-dark-lighter px-3 py-1 rounded-full">
                          {msg.message}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={index}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`flex ${isMine ? "flex-row-reverse" : ""} items-end gap-2 max-w-[75%]`}
                      >
                        {!isMine && (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 ${
                              isBot
                                ? "bg-gradient-to-br from-primary to-orange-600"
                                : "bg-dark-lighter"
                            }`}
                          >
                            {isBot
                              ? "AI"
                              : msg.displayName?.[0]?.toUpperCase() || "U"}
                          </div>
                        )}
                        <div className={isMine ? "items-end" : ""}>
                          {!isMine && (
                            <p className="text-xs font-medium text-white/60 mb-1">
                              {msg.displayName}
                            </p>
                          )}
                          {msg.type === "STICKER" &&
                          /^https?:\/\//.test(
                            msg.message || msg.content || "",
                          ) ? (
                            <img
                              src={msg.message || msg.content}
                              alt="sticker"
                              className="w-28 h-28 object-contain"
                            />
                          ) : (
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                isMine
                                  ? "bg-primary text-white rounded-br-sm"
                                  : "bg-dark-lighter text-white/90 rounded-bl-sm"
                              }`}
                            >
                              <p className="break-words whitespace-pre-wrap">
                                {msg.message || msg.content}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              {aiThinking && (
                <div className="flex items-end gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white text-xs font-semibold">
                    AI
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-dark-lighter flex gap-1">
                    <span className="typing-dot w-2 h-2 bg-white/50 rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-white/50 rounded-full" />
                    <span className="typing-dot w-2 h-2 bg-white/50 rounded-full" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input / upgrade prompt */}
            {canChat ? (
              <form
                onSubmit={handleSendMessage}
                className="border-t border-white/10 p-4 relative"
              >
                {showStickers && (
                  <StickerPicker
                    onPick={sendSticker}
                    onClose={() => setShowStickers(false)}
                  />
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowStickers((s) => !s)}
                    className="px-3 bg-dark-lighter hover:bg-dark rounded-lg flex items-center transition text-white/70"
                    title="Sticker / Emoji"
                  >
                    <Smile size={20} />
                  </button>
                  <input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 app-input"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-5 bg-primary hover:bg-primary-dark rounded-lg disabled:opacity-50 flex items-center transition"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            ) : (
              <div className="border-t border-white/10 p-4">
                <Link
                  to="/pricing"
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition text-sm font-medium"
                >
                  <Lock size={16} /> Chat chỉ dành cho HOCA+ — Nâng cấp ngay
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pomodoro */}
          <div className="stat-card">
            <h3 className="font-semibold mb-2 text-center">⏱ Pomodoro</h3>
            <PomodoroTimer socket={getSocket()} />
          </div>

          {/* Members */}
          <div className="stat-card">
            <h3 className="font-semibold mb-4 flex items-center justify-between">
              <span>Thành viên</span>
              <span className="text-sm font-normal text-white/40">
                {onlineUsers.length} online
              </span>
            </h3>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {onlineUsers.length === 0 ? (
                <p className="text-center text-white/30 text-sm py-6">
                  Chưa có ai online
                </p>
              ) : (
                onlineUsers.map((member) => (
                  <div
                    key={member.userId}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-dark-lighter transition group"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white text-sm font-semibold">
                        {member.userName?.[0]?.toUpperCase() || "U"}
                      </div>
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-dark-card rounded-full" />
                    </div>
                    <span className="text-sm truncate flex-1">
                      {member.userName}
                      {member.userId === user?._id && (
                        <span className="text-primary text-xs ml-1">(Bạn)</span>
                      )}
                    </span>
                    {member.userId !== user?._id && (
                      <button
                        onClick={() => setReportTarget(member)}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition"
                        title="Báo cáo"
                      >
                        <Flag size={14} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {!isPremium && (
            <Link
              to="/pricing"
              className="block stat-card text-center hover:border-primary/40 transition"
            >
              <Crown className="mx-auto text-primary mb-2" size={24} />
              <p className="text-sm font-medium">Nâng cấp HOCA+</p>
              <p className="text-xs text-white/40 mt-1">
                Học không giới hạn, mic & chat
              </p>
            </Link>
          )}
        </div>
      </div>

      {reportTarget && (
        <ReportModal
          targetUser={reportTarget}
          roomId={id}
          onClose={() => setReportTarget(null)}
        />
      )}
      {showFeedback && (
        <FeedbackModal roomId={id} onClose={finishLeave} onDone={finishLeave} />
      )}
    </div>
  );
}
