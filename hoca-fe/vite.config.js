import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prevent stale/linked dependency copies from creating a second Router context.
    dedupe: ["react", "react-dom", "react-router", "react-router-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-dom") || id.includes("react-router") || /node_modules[\\/]react[\\/]/.test(id)) return "vendor-react";
          if (id.includes("@tanstack/react-query") || id.includes("zustand")) return "vendor-state";
          if (id.includes("axios") || id.includes("socket.io-client")) return "vendor-network";
          if (id.includes("lucide-react")) return "vendor-icons";
          return undefined;
        },
      },
    },
  },
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
