import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../lib/api";
import { initSocket, getSocket } from "../lib/socket";
import { useAuthStore } from "../store/authStore";
import { Send, Users } from "lucide-react";

export default function RoomDetailPage() {
  const { id } = useParams();
  const { token, user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
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

    socket.emit("join-room", id);

    socket.on("new-message", (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on("user-joined", (data) => {
      toast.success(`${data.userName} đã tham gia phòng`);
    });

    socket.on("user-left", (data) => {
      toast(`${data.userName} đã rời phòng`);
    });

    return () => {
      socket.emit("leave-room", id);
      socket.off("new-message");
      socket.off("user-joined");
      socket.off("user-left");
    };
  }, [id, token]);

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
          <h1 className="text-2xl font-bold">{room?.name}</h1>
          <p className="mt-2 opacity-90">{room?.description}</p>
          <div className="mt-4 flex items-center space-x-2">
            <Users size={20} />
            <span>{room?.members?.length || 0} thành viên</span>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 p-6">
          {/* Chat Area */}
          <div className="md:col-span-3">
            <div className="border rounded-lg flex flex-col h-[600px]">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    <p>Chưa có tin nhắn nào</p>
                    <p className="text-sm mt-2">Hãy bắt đầu cuộc trò chuyện!</p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex ${msg.userId === user?._id ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.userId === user?._id
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-900"
                        }`}
                      >
                        {msg.userId !== user?._id && (
                          <p className="text-xs font-semibold mb-1">
                            {msg.userName}
                          </p>
                        )}
                        <p>{msg.message}</p>
                        <p className="text-xs mt-1 opacity-75">
                          {new Date(msg.timestamp).toLocaleTimeString("vi-VN")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="border-t p-4">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Send size={20} />
                    <span>Gửi</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Members Sidebar */}
          <div className="md:col-span-1">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-4">Thành viên</h3>
              <div className="space-y-3">
                {room?.members?.map((member) => (
                  <div key={member._id} className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                      {member.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <p className="font-medium">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
