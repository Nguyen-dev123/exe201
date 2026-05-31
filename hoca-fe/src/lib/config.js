// Resolve the backend base URL.
// Default: same origin as the page, so requests go through Vite's proxy
// (/api and /socket.io). This makes a SINGLE tunnel URL (Cloudflare/ngrok)
// work for both the web app and the API + websockets.
export function getApiBase() {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}

export const API_BASE = getApiBase();
