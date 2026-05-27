import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../lib/api";
import { initSocket, getSocket } from "../lib/socket";
import { useAuthStore } from "../store/authStore";
import { Send, Users, LogOut, MessageCircle, XCircle } from "lucide-react";

export default function RoomDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const messagesEndRef = useRef(null);

  const { data: room, isLoading } = useQuery({
    queryKey: ["room", id],
    queryFn: async () => {
      const response = await api.get(`/api/rooms/${id}`);
      return response.data;
    },
  });

  useEffect(() => {
    if (!token) return;

    const socket = initSocket(token);

    // Emit join-room with correct format
    socket.emit("join-room", { roomId: id });

    socket.on("new-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("user-joined", (data) => {
      toast.success(`${data.userName} đã tham gia phòng`);
      // Update online users
      setOnlineUsers((prev) => {
        if (!prev.find((u) => u.userId === data.userId)) {
          return [...prev, { userId: data.userId, userName: data.userName }];
        }
        return prev;
      });
    });

    socket.on("user-left", (data) => {
      toast(`${data.userName} đã rời phòng`);
      // Remove from online users
      setOnlineUsers((prev) => prev.filter((u) => u.userId !== data.userId));
    });

    socket.on("room-users", (users) => {
      // Update online users list
      setOnlineUsers(users);
    });

    socket.on("room-closed", (data) => {
      toast.error(data.message || "Phòng đã bị đóng");
      setTimeout(() => {
        navigate("/rooms");
      }, 2000);
    });

    socket.on("error", (error) => {
      toast.error(error.message || "Có lỗi xảy ra");
    });

    return () => {
      socket.emit("leave-room", { roomId: id });
      socket.off("new-message");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("room-users");
      socket.off("room-closed");
      socket.off("error");
    };
  }, [id, token, navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const socket = getSocket();
    if (socket) {
      socket.emit("send-message", {
        roomId: id,
        message: newMessage,
      });
      setNewMessage("");
    }
  };

  const handleLeaveRoom = async () => {
    if (!confirm("Bạn có chắc muốn rời khỏi phòng học này?")) {
      return;
    }

    setLeaving(true);
    try {
      await api.post(`/api/rooms/${id}/leave`);
      toast.success("Đã rời phòng thành công!");
      navigate("/rooms");
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể rời phòng");
    } finally {
      setLeaving(false);
    }
  };

  const handleCloseRoom = async () => {
    if (
      !confirm(
        "Bạn có chắc muốn đóng phòng này? Tất cả người dùng sẽ bị đá ra.",
      )
    ) {
      return;
    }

    try {
      await api.post(`/api/rooms/${id}/close`);
      toast.success("Đã đóng phòng thành công!");
      navigate("/rooms");
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể đóng phòng");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Room Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{room?.name}</h1>
              <p className="mt-2 opacity-90">{room?.description}</p>
              <div className="mt-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <Users size={20} />
                  <span>{onlineUsers.length} người đang online</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm">Đang hoạt động</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {/* Close Room button - only for owner or admin */}
              {(room?.owner?._id === user?._id ||
                room?.owner === user?._id ||
                user?.role === "ADMIN") && (
                <button
                  onClick={handleCloseRoom}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500/80 hover:bg-red-600 rounded-lg transition"
                  title="Đóng phòng"
                >
                  <XCircle size={20} />
                  <span>Đóng phòng</span>
                </button>
              )}
              <button
                onClick={handleLeaveRoom}
                disabled={leaving}
                className="flex items-center space-x-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition disabled:opacity-50"
                title="Rời phòng"
              >
                <LogOut size={20} />
                <span>{leaving ? "Đang rời..." : "Rời phòng"}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 p-6">
          {/* Chat Area */}
          <div className="md:col-span-3">
            <div className="border rounded-lg flex flex-col h-[600px] bg-white shadow-sm">
              {/* Chat Header */}
              <div className="border-b px-4 py-3 bg-gray-50">
                <h3 className="font-semibold text-gray-900 flex items-center">
                  <MessageCircle size={20} className="mr-2 text-blue-600" />
                  Chat phòng học
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Trò chuyện với {onlineUsers.length} người đang online
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-400 mt-20">
                    <MessageCircle className="mx-auto h-16 w-16 mb-3 opacity-30" />
                    <p className="text-lg font-medium">Chưa có tin nhắn nào</p>
                    <p className="text-sm mt-2">Hãy bắt đầu cuộc trò chuyện!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const isMyMessage = msg.userId === user?._id;
                    return (
                      <div
                        key={index}
                        className={`flex ${isMyMessage ? "justify-end" : "justify-start"} animate-fadeIn`}
                      >
                        <div
                          className={`flex ${isMyMessage ? "flex-row-reverse" : "flex-row"} items-end space-x-2 max-w-[70%]`}
                        >
                          {/* Avatar */}
                          {!isMyMessage && (
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                              {msg.userName?.[0]?.toUpperCase() || "U"}
                            </div>
                          )}

                          {/* Message Bubble */}
                          <div
                            className={`flex flex-col ${isMyMessage ? "items-end" : "items-start"}`}
                          >
                            {!isMyMessage && (
                              <p className="text-xs font-semibold text-gray-700 mb-1 px-1">
                                {msg.userName}
                              </p>
                            )}
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                isMyMessage
                                  ? "bg-blue-600 text-white rounded-br-sm"
                                  : "bg-white text-gray-900 border border-gray-200 rounded-bl-sm"
                              } shadow-sm`}
                            >
                              <p className="break-words">{msg.message}</p>
                            </div>
                            <p
                              className={`text-xs mt-1 px-1 ${isMyMessage ? "text-gray-500" : "text-gray-400"}`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString(
                                "vi-VN",
                                {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form
                onSubmit={handleSendMessage}
                className="border-t p-4 bg-white"
              >
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition"
                  >
                    <Send size={20} />
                    <span className="hidden sm:inline">Gửi</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Members Sidebar */}
          <div className="md:col-span-1">
            <div className="border rounded-lg p-4 bg-white">
              <h3 className="font-semibold text-lg mb-4 flex items-center justify-between">
                <span>Thành viên</span>
                <span className="text-sm font-normal text-gray-500">
                  {onlineUsers.length} online
                </span>
              </h3>
              <div className="space-y-3 max-h-[540px] overflow-y-auto">
                {onlineUsers.length === 0 ? (
                  <div className="text-center text-gray-400 py-8">
                    <Users className="mx-auto h-12 w-12 mb-2 opacity-50" />
                    <p className="text-sm">Chưa có ai online</p>
                  </div>
                ) : (
                  onlineUsers.map((member) => (
                    <div
                      key={member.userId}
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition"
                    >
                      <div className="relative">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {member.userName?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {member.userName}
                          {member.userId === user?._id && (
                            <span className="ml-1 text-xs text-blue-600">
                              (Bạn)
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-green-600 flex items-center">
                          <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse"></span>
                          Đang online
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
