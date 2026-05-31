import { io } from "socket.io-client";
import { API_BASE } from "./config";

let socket = null;

export const initSocket = (token) => {
  if (socket) return socket;

  socket = io(API_BASE, {
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
