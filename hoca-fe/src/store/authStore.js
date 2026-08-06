import { create } from "zustand";
import { persist } from "zustand/middleware";
import { disconnectSocket } from "../lib/socket";

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      setAuth: (user, token, refreshToken) =>
        set({ user, token, refreshToken }),
      setUser: (user) => set({ user }),
      updateTokens: (token, refreshToken) => set({ token, refreshToken }),
      logout: () => {
        // Ngắt socket cũ để không giữ lại danh tính tài khoản trước
        disconnectSocket();
        // Fire-and-forget: thu hồi phiên phía backend nếu có thể
        set({ user: null, token: null, refreshToken: null });
      },
    }),
    {
      name: "hoca-auth",
    },
  ),
);
