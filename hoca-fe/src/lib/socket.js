import { io } from "socket.io-client";
import { API_BASE } from "./config";

let socket = null;

export const initSocket = (token) => {
  // If socket exists and is connected, return it
  if (socket && socket.connected) {
    return socket;
  }

  // If socket exists but disconnected, clean it up
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  // Create new socket
  socket = io(API_BASE, {
    auth: { token },
    transports: ["websocket", "polling"], // Prefer websocket first
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

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
  if (typeof window !== "undefined") {
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
};
