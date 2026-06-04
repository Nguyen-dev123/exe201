import { useState, useEffect } from "react";
import { useAuthStore } from "../store/authStore";
import { initSocket, getSocket } from "../lib/socket";
import { Check, X, Users, MessageCircle } from "lucide-react";

export default function SocketDebugPage() {
  const { token, user } = useAuthStore();
  const [socketStatus, setSocketStatus] = useState({
    connected: false,
    socketId: null,
    error: null,
  });
  const [roomTest, setRoomTest] = useState({
    roomId: "",
    joined: false,
    onlineUsers: [],
    messages: [],
  });
  const [testMessage, setTestMessage] = useState("");

  useEffect(() => {
    if (!token) return;

    const socket = initSocket(token);

    const updateStatus = () => {
      setSocketStatus({
        connected: socket.connected,
        socketId: socket.id,
        error: null,
      });
    };

    socket.on("connect", updateStatus);
    socket.on("disconnect", updateStatus);
    socket.on("connect_error", (error) => {
      setSocketStatus((prev) => ({ ...prev, error: error.message }));
    });

    // Room events
    socket.on("room-users", (users) => {
      console.log("📥 Received room-users:", users);
      setRoomTest((prev) => ({ ...prev, onlineUsers: users }));
    });

    socket.on("user-joined", (data) => {
      console.log("📥 User joined:", data);
    });

    socket.on("chat-message", (msg) => {
      console.log("📥 Chat message:", msg);
      setRoomTest((prev) => ({
        ...prev,
        messages: [...prev.messages, msg],
      }));
    });

    updateStatus();

    return () => {
      socket.off("connect", updateStatus);
      socket.off("disconnect", updateStatus);
      socket.off("connect_error");
      socket.off("room-users");
      socket.off("user-joined");
      socket.off("chat-message");
    };
  }, [token]);

  const handleJoinRoom = () => {
    const socket = getSocket();
    if (!socket || !roomTest.roomId) return;

    console.log("🔄 Attempting to join room:", roomTest.roomId);
    socket.emit("join-room", { roomId: roomTest.roomId });
    setRoomTest((prev) => ({ ...prev, joined: true }));
  };

  const handleLeaveRoom = () => {
    const socket = getSocket();
    if (!socket || !roomTest.roomId) return;

    console.log("🔄 Leaving room:", roomTest.roomId);
    socket.emit("leave-room", { roomId: roomTest.roomId });
    setRoomTest({
      roomId: roomTest.roomId,
      joined: false,
      onlineUsers: [],
      messages: [],
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const socket = getSocket();
    if (!socket || !testMessage.trim() || !roomTest.roomId) return;

    console.log("📤 Sending message:", testMessage);
    socket.emit("chat-message", {
      roomId: roomTest.roomId,
      message: testMessage,
    });
    setTestMessage("");
  };

  const handlePing = () => {
    const socket = getSocket();
    if (!socket) return;

    const start = Date.now();
    socket.emit("ping");
    socket.once("pong", (data) => {
      const latency = Date.now() - start;
      console.log(`🏓 Pong received! Latency: ${latency}ms`, data);
      alert(`Pong! Latency: ${latency}ms`);
    });
  };

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 text-white">
        <div className="stat-card text-center">
          <p>Vui lòng đăng nhập để test socket</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-bold mb-6">🔌 Socket Debug Tool</h1>

      {/* Socket Status */}
      <div className="stat-card mb-6">
        <h2 className="text-xl font-semibold mb-4">Socket Status</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-dark-lighter rounded-lg">
            <span>Connection Status:</span>
            <div className="flex items-center gap-2">
              {socketStatus.connected ? (
                <>
                  <Check className="text-green-500" size={20} />
                  <span className="text-green-500">Connected</span>
                </>
              ) : (
                <>
                  <X className="text-red-500" size={20} />
                  <span className="text-red-500">Disconnected</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-dark-lighter rounded-lg">
            <span>Socket ID:</span>
            <code className="text-sm text-primary">
              {socketStatus.socketId || "N/A"}
            </code>
          </div>

          <div className="flex items-center justify-between p-3 bg-dark-lighter rounded-lg">
            <span>User ID:</span>
            <code className="text-sm text-primary">{user._id}</code>
          </div>

          <div className="flex items-center justify-between p-3 bg-dark-lighter rounded-lg">
            <span>Display Name:</span>
            <span className="font-medium">{user.displayName}</span>
          </div>

          {socketStatus.error && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400">
              <strong>Error:</strong> {socketStatus.error}
            </div>
          )}

          <button
            onClick={handlePing}
            disabled={!socketStatus.connected}
            className="w-full btn-primary disabled:opacity-50"
          >
            🏓 Send Ping Test
          </button>
        </div>
      </div>

      {/* Room Test */}
      <div className="stat-card mb-6">
        <h2 className="text-xl font-semibold mb-4">Room Connection Test</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm mb-2">Room ID:</label>
            <input
              type="text"
              value={roomTest.roomId}
              onChange={(e) =>
                setRoomTest((prev) => ({ ...prev, roomId: e.target.value }))
              }
              placeholder="Paste Room ID here"
              className="app-input w-full"
              disabled={roomTest.joined}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleJoinRoom}
              disabled={
                !socketStatus.connected || !roomTest.roomId || roomTest.joined
              }
              className="btn-primary flex-1 disabled:opacity-50"
            >
              Join Room
            </button>
            <button
              onClick={handleLeaveRoom}
              disabled={!roomTest.joined}
              className="btn-secondary flex-1 disabled:opacity-50"
            >
              Leave Room
            </button>
          </div>

          {roomTest.joined && (
            <div className="space-y-4 mt-6">
              {/* Online Users */}
              <div className="p-4 bg-dark-lighter rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Users size={18} className="text-primary" />
                  <h3 className="font-semibold">
                    Online Users ({roomTest.onlineUsers.length})
                  </h3>
                </div>
                {roomTest.onlineUsers.length === 0 ? (
                  <p className="text-sm text-white/50">No users online</p>
                ) : (
                  <div className="space-y-2">
                    {roomTest.onlineUsers.map((u, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-dark rounded"
                      >
                        <span className="text-sm">{u.userName}</span>
                        <code className="text-xs text-white/50">
                          {u.socketId}
                        </code>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Chat Test */}
              <div className="p-4 bg-dark-lighter rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <MessageCircle size={18} className="text-primary" />
                  <h3 className="font-semibold">Chat Test</h3>
                </div>

                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {roomTest.messages.length === 0 ? (
                    <p className="text-sm text-white/50 text-center py-4">
                      No messages yet
                    </p>
                  ) : (
                    roomTest.messages.map((msg, idx) => (
                      <div key={idx} className="p-2 bg-dark rounded text-sm">
                        <div className="font-medium text-primary">
                          {msg.displayName}
                        </div>
                        <div>{msg.message || msg.content}</div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Type test message..."
                    className="app-input flex-1"
                  />
                  <button
                    type="submit"
                    disabled={!testMessage.trim()}
                    className="btn-primary px-6 disabled:opacity-50"
                  >
                    Send
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Console Logs */}
      <div className="stat-card">
        <h2 className="text-xl font-semibold mb-4">Instructions</h2>
        <div className="space-y-2 text-sm text-white/70">
          <p>1. Open browser console (F12) to see detailed socket logs</p>
          <p>2. Copy a Room ID from /rooms page</p>
          <p>3. Paste it here and click "Join Room"</p>
          <p>4. Open another browser/incognito tab with different account</p>
          <p>5. Both should see each other in "Online Users"</p>
          <p>6. Test sending messages between browsers</p>
        </div>
      </div>
    </div>
  );
}
