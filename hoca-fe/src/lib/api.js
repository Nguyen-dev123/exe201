import axios from "axios";
import { useAuthStore } from "../store/authStore";
import { API_BASE } from "./config";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

function redirectToLogin() {
  useAuthStore.getState().logout();
  if (typeof window === "undefined") return;
  const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (returnTo && !returnTo.startsWith("/login")) {
    window.sessionStorage.setItem("hoca-return-to", returnTo);
  }
  window.location.assign("/login");
}

// Request interceptor
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;

        if (!refreshToken) {
          redirectToLogin();
          return Promise.reject(error);
        }

        // Try to refresh token
        if (!refreshPromise) {
          refreshPromise = axios
            .post(`${API_BASE}/api/auth/refresh-token`, { refreshToken })
            .finally(() => {
              refreshPromise = null;
            });
        }
        const response = await refreshPromise;

        const { token: newToken, refreshToken: newRefreshToken } =
          response.data;

        // Update tokens in store
        useAuthStore.getState().updateTokens(newToken, newRefreshToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout
        redirectToLogin();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default api;
