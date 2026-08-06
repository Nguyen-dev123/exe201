import { io } from "socket.io-client";
import { SOCKET_BASE } from "./config";

let socket = null;
let currentToken = null;

export const initSocket = (token) => {
  // Nếu socket đang kết nối VÀ vẫn đúng token (cùng tài khoản) -> tái sử dụng
  // Reuse cả socket đang kết nối hoặc đang tự reconnect. React StrictMode có
  // thể chạy effect hai lần trong development; tạo socket mới ở lần thứ hai
  // sẽ đóng kết nối WebSocket đầu tiên trước khi handshake hoàn tất.
  if (socket && currentToken === token) {
    return socket;
  }

  // Socket cũ tồn tại nhưng token đã đổi (đổi tài khoản) hoặc đã ngắt -> dọn sạch
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  currentToken = token;

  // Create new socket
  socket = io(SOCKET_BASE, {
    auth: { token },
    transports: ["websocket", "polling"], // Prefer websocket first
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 10000,
    randomizationFactor: 0.5,
    reconnectionAttempts: Infinity,
    timeout: 20000,
  });
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("hoca:socket-ready", { detail: socket }));

  socket.on("connect", () => {
    console.log("✅ Socket connected:", socket.id);
  });

  socket.on("disconnect", (reason) => {
    console.log("❌ Socket disconnected:", reason);
  });

  socket.on("connect_error", (error) => {
    console.error("🔴 Socket connection error:", error.message);
  });

  // Expose socket to window for debugging
  if (import.meta.env.DEV && typeof window !== "undefined") {
    window.__socket = socket;
  }

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  currentToken = null;
};
