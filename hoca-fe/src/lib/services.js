import api from "./api";

// ============ AUTH ============
export const authApi = {
  login: (data) => api.post("/api/auth/login", data).then((r) => r.data),
  register: (data) => api.post("/api/auth/register", data).then((r) => r.data),
  google: (token) =>
    api.post("/api/auth/google", { token }).then((r) => r.data),
  forgotPassword: (email) =>
    api.post("/api/auth/forgot-password", { email }).then((r) => r.data),
  resetPassword: (token, password) =>
    api
      .post(`/api/auth/reset-password/${token}`, { password })
      .then((r) => r.data),
  changePassword: (oldPassword, newPassword) =>
    api
      .post("/api/auth/change-password", { oldPassword, newPassword })
      .then((r) => r.data),
};

// ============ USER ============
export const userApi = {
  getMe: () => api.get("/api/users/me").then((r) => r.data),
  updateMe: (data) => api.patch("/api/users/me", data).then((r) => r.data),
  deleteMe: () => api.delete("/api/users/me").then((r) => r.data),
  getDashboard: () => api.get("/api/users/me/dashboard").then((r) => r.data),
  getWeeklyActivity: () =>
    api.get("/api/users/me/weekly-activity").then((r) => r.data),
  getLeaderboard: () => api.get("/api/users/leaderboard").then((r) => r.data),
  recoverStreak: () =>
    api.post("/api/users/recover-streak").then((r) => r.data),
  trackStudyTime: (minutes) =>
    api.post("/api/users/study-time", { minutes }).then((r) => r.data),
};

// ============ ROOMS ============
export const roomApi = {
  getRooms: (search) =>
    api
      .get("/api/rooms", { params: search ? { search } : {} })
      .then((r) => r.data),
  getRoom: (id) => api.get(`/api/rooms/${id}`).then((r) => r.data),
  getMyRooms: () => api.get("/api/rooms/my").then((r) => r.data),
  getCategories: () => api.get("/api/rooms/categories").then((r) => r.data),
  getRoomTypes: () => api.get("/api/rooms/room-types").then((r) => r.data),
  checkCreateEligibility: () =>
    api.get("/api/rooms/check-create-eligibility").then((r) => r.data),
  checkJoinEligibility: () =>
    api.get("/api/rooms/check-eligibility").then((r) => r.data),
  createRoom: (data) => api.post("/api/rooms", data).then((r) => r.data),
  closeRoom: (id) => api.post(`/api/rooms/${id}/close`).then((r) => r.data),
  deleteRoom: (id) => api.delete(`/api/rooms/${id}`).then((r) => r.data),
  leaveRoom: (id) => api.post(`/api/rooms/${id}/leave`).then((r) => r.data),
};

// ============ BADGES ============
export const badgeApi = {
  getAll: () => api.get("/api/badges").then((r) => r.data),
  getMine: () => api.get("/api/badges/me").then((r) => r.data),
  check: () => api.post("/api/badges/check").then((r) => r.data),
};

// ============ RANKS ============
export const rankApi = {
  getAll: () => api.get("/api/ranks").then((r) => r.data),
};

// ============ NOTIFICATIONS ============
export const notificationApi = {
  getAll: (page = 1, limit = 20) =>
    api
      .get("/api/notifications", { params: { page, limit } })
      .then((r) => r.data),
  getUnreadCount: () =>
    api.get("/api/notifications/unread-count").then((r) => r.data),
  markRead: (notificationIds) =>
    api
      .post("/api/notifications/mark-read", { notificationIds })
      .then((r) => r.data),
};

// ============ QUOTES ============
export const quoteApi = {
  getRandom: () => api.get("/api/quotes/random").then((r) => r.data),
};

// ============ AI ============
export const aiApi = {
  getStatus: () => api.get("/api/ai/status").then((r) => r.data),
  getUsage: () => api.get("/api/ai/usage").then((r) => r.data),
  ask: (question, history = []) =>
    api.post("/api/ai/ask", { question, history }).then((r) => r.data),
};

// ============ PRICING / PAYMENT ============
export const pricingApi = {
  getPlans: () => api.get("/api/pricing").then((r) => r.data),
};

export const paymentApi = {
  createPayment: (planId) =>
    api.post("/api/payment/create_payment_url", { planId }).then((r) => r.data),
  verify: (orderCode) =>
    api.post("/api/payment/verify", { orderCode }).then((r) => r.data),
  getTransactions: (page = 1, limit = 10) =>
    api
      .get("/api/payment/transactions", { params: { page, limit } })
      .then((r) => r.data),
  // Bank QR flow
  createQR: (planId) =>
    api.post("/api/payment/qr/create", { planId }).then((r) => r.data),
  qrStatus: (memo) =>
    api.get(`/api/payment/qr/status/${memo}`).then((r) => r.data),
  // Admin
  listPending: () => api.get("/api/payment/admin/pending").then((r) => r.data),
  confirm: (txnRef) =>
    api.post("/api/payment/admin/confirm", { txnRef }).then((r) => r.data),
};

// ============ FEEDBACK ============
export const feedbackApi = {
  create: (data) => api.post("/api/feedback", data).then((r) => r.data),
};

// ============ CHAT ============
export const chatApi = {
  getMessages: (roomId, limit = 50) =>
    api.get(`/api/chat/${roomId}`, { params: { limit } }).then((r) => r.data),
};

// ============ STICKERS ============
export const stickerApi = {
  getAll: () => api.get("/api/stickers").then((r) => r.data),
};

// ============ UPLOAD ============
export const uploadApi = {
  avatar: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post("/api/upload/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};

// ============ ADMIN ============
export const adminApi = {
  getStats: () => api.get("/api/admin/stats").then((r) => r.data),
  getUsers: (params = {}) =>
    api.get("/api/admin/users", { params }).then((r) => r.data),
  blockUser: (id) =>
    api.put(`/api/admin/users/${id}/block`).then((r) => r.data),
  lockUser: (id, reason) =>
    api.put(`/api/admin/users/${id}/lock`, { reason }).then((r) => r.data),
  getRevenue: (params = {}) =>
    api.get("/api/admin/revenue/stats", { params }).then((r) => r.data),
  getRooms: (params = {}) =>
    api.get("/api/admin/rooms", { params }).then((r) => r.data),
  closeRoom: (id) =>
    api.post(`/api/admin/rooms/${id}/close`).then((r) => r.data),
  // Reports
  getReports: (params = {}) =>
    api.get("/api/reports", { params }).then((r) => r.data),
  resolveReport: (id, data) =>
    api.put(`/api/reports/${id}`, data).then((r) => r.data),
  // Feedback
  getFeedback: (params = {}) =>
    api.get("/api/admin/feedback", { params }).then((r) => r.data),
  getFeedbackSummary: () =>
    api.get("/api/admin/feedback/summary").then((r) => r.data),
  // Pricing plan management
  createPlan: (data) => api.post("/api/pricing", data).then((r) => r.data),
  updatePlan: (id, data) =>
    api.put(`/api/pricing/${id}`, data).then((r) => r.data),
  deletePlan: (id) => api.delete(`/api/pricing/${id}`).then((r) => r.data),
  // Badge management
  createBadge: (data) => api.post("/api/badges", data).then((r) => r.data),
  updateBadge: (id, data) =>
    api.put(`/api/badges/${id}`, data).then((r) => r.data),
  deleteBadge: (id) => api.delete(`/api/badges/${id}`).then((r) => r.data),
  // Sticker management
  createSticker: (formData) =>
    api
      .post("/api/stickers", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data),
  deleteSticker: (id) => api.delete(`/api/stickers/${id}`).then((r) => r.data),
  // Room categories
  getCategories: () =>
    api.get("/api/admin/rooms/categories").then((r) => r.data),
  createCategory: (data) =>
    api.post("/api/admin/rooms/categories", data).then((r) => r.data),
  deleteCategory: (id) =>
    api.delete(`/api/admin/rooms/categories/${id}`).then((r) => r.data),
};

// ============ REPORT ============
export const reportApi = {
  submit: (data) => api.post("/api/reports", data).then((r) => r.data),
};
