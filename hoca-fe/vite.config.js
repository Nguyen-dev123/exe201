import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    host: true, // expose on LAN so phones on the same WiFi can access
    // Allow access through tunnel domains (Cloudflare / ngrok) and any host
    allowedHosts: true,
    proxy: {
      // REST API -> backend
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
      // Socket.io (WebSocket) -> backend
      "/socket.io": {
        target: "http://localhost:3000",
        changeOrigin: true,
        ws: true,
      },
    },
  },
});
