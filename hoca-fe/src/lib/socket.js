import { io } from "socket.io-client";

let socket = null;

export const initSocket = (token) => {
  if (socket) return socket;

  socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:3000", {
    auth: { token },
    transports: ["polling", "websocket"],
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
