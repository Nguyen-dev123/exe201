import api from "./api";

// ============ AUTH ============
export const authApi = {
  login: (data) => api.post("/api/auth/login", data).then((r) => r.data),
  register: (data) => api.post("/api/auth/register", data).then((r) => r.data),
  verifyOtp: (email, code) =>
    api.post("/api/auth/verify-otp", { email, code }).then((r) => r.data),
  resendOtp: (email) =>
    api.post("/api/auth/resend-otp", { email }).then((r) => r.data),
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
  getSessions: () => api.get("/api/auth/sessions").then((r) => r.data),
  revokeSession: (sessionId) =>
    api.delete(`/api/auth/sessions/${sessionId}`).then((r) => r.data),
  logout: () => api.post("/api/auth/logout").then((r) => r.data),
  logoutAll: () => api.post("/api/auth/logout-all").then((r) => r.data),
  begin2fa: () => api.post("/api/auth/2fa/setup").then((r) => r.data),
  confirm2fa: (code) =>
    api.post("/api/auth/2fa/confirm", { code }).then((r) => r.data),
  disable2fa: (password, code) =>
    api.post("/api/auth/2fa/disable", { password, code }).then((r) => r.data),
};

// ============ USER ============
export const userApi = {
  getMe: () => api.get("/api/users/me").then((r) => r.data),
  updateMe: (data) => api.patch("/api/users/me", data).then((r) => r.data),
  requestDelete: (password) =>
    api.post("/api/users/me/delete-request", { password }).then((r) => r.data),
  deleteMe: (password, code) =>
    api
      .delete("/api/users/me", { data: { password, code } })
      .then((r) => r.data),
  requestEmailChange: (password, newEmail) =>
    api
      .post("/api/users/me/email-change-request", { password, newEmail })
      .then((r) => r.data),
  confirmEmailChange: (code) =>
    api
      .post("/api/users/me/email-change-confirm", { code })
      .then((r) => r.data),
  getDashboard: () => api.get("/api/users/me/dashboard").then((r) => r.data),
  getWeeklyActivity: () =>
    api.get("/api/users/me/weekly-activity").then((r) => r.data),
  getLeaderboard: () => api.get("/api/users/leaderboard").then((r) => r.data),
  exportData: () =>
    api
      .get("/api/users/me/export", { responseType: "blob" })
      .then((r) => r.data),
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
  getInvitations: () => api.get("/api/rooms/invitations").then((r) => r.data),
  respondInvitation: (id, status) =>
    api.patch(`/api/rooms/invitations/${id}`, { status }).then((r) => r.data),
  invite: (roomId, userId) =>
    api.post(`/api/rooms/${roomId}/invites`, { userId }).then((r) => r.data),
  inviteEmail: (roomId, email) =>
    api.post(`/api/rooms/${roomId}/invites`, { email }).then((r) => r.data),
  recent: () => api.get("/api/rooms/recent").then((r) => r.data),
  history: () => api.get("/api/rooms/history").then((r) => r.data),
  favorites: () => api.get("/api/rooms/favorites").then((r) => r.data),
  favorite: (id) => api.post(`/api/rooms/${id}/favorite`).then((r) => r.data),
  unfavorite: (id) =>
    api.delete(`/api/rooms/${id}/favorite`).then((r) => r.data),
  export: (id) =>
    api
      .get(`/api/rooms/${id}/export`, { responseType: "blob" })
      .then((r) => r.data),
  rate: (id, rating, comment) =>
    api
      .post(`/api/rooms/${id}/rating`, { rating, comment })
      .then((r) => r.data),
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
  getAll: (page = 1, limit = 20, archived = false) =>
    api
      .get("/api/notifications", { params: { page, limit, archived } })
      .then((r) => r.data),
  getUnreadCount: () =>
    api.get("/api/notifications/unread-count").then((r) => r.data),
  markRead: (notificationIds) =>
    api
      .post("/api/notifications/mark-read", { notificationIds })
      .then((r) => r.data),
  archive: (id) =>
    api.patch(`/api/notifications/${id}/archive`).then((r) => r.data),
  remove: (id) => api.delete(`/api/notifications/${id}`).then((r) => r.data),
};

// ============ QUOTES ============
export const quoteApi = {
  getRandom: () => api.get("/api/quotes/random").then((r) => r.data),
};

// ============ AI ============
export const aiApi = {
  getStatus: (scope = "MAIN") =>
    api.get("/api/ai/status", { params: { scope } }).then((r) => r.data),
  getUsage: () => api.get("/api/ai/usage").then((r) => r.data),
  ask: (question, history = [], options = {}) =>
    api
      .post("/api/ai/ask", { question, history, ...options })
      .then((r) => r.data),
  listConversations: () => api.get("/api/ai/conversations").then((r) => r.data),
  getConversation: (id) =>
    api.get(`/api/ai/conversations/${id}`).then((r) => r.data),
  updateConversation: (id, data) =>
    api.patch(`/api/ai/conversations/${id}`, data).then((r) => r.data),
  deleteConversation: (id) =>
    api.delete(`/api/ai/conversations/${id}`).then((r) => r.data),
  rateMessage: (id, messageId, feedback) =>
    api
      .patch(`/api/ai/conversations/${id}/messages/${messageId}/feedback`, {
        feedback,
      })
      .then((r) => r.data),
};

// ============ PRICING / PAYMENT ============
export const pricingApi = {
  getPlans: () => api.get(`/api/pricing?_t=${Date.now()}`).then((r) => r.data),
};

// ============ STUDY GOALS ============
export const studyGoalApi = {
  getAll: () => api.get("/api/study-goals").then((r) => r.data),
  getActive: () => api.get("/api/study-goals/active").then((r) => r.data),
  create: (goal) =>
    api
      .post(
        "/api/study-goals",
        typeof goal === "string" ? { text: goal } : goal,
      )
      .then((r) => r.data),
  complete: (id) =>
    api.patch(`/api/study-goals/${id}/complete`).then((r) => r.data),
  update: (id, data) =>
    api.patch(`/api/study-goals/${id}`, data).then((r) => r.data),
  remove: (id) => api.delete(`/api/study-goals/${id}`).then((r) => r.data),
};

// ============ REACTIONS ============
export const reactionApi = {
  getHearts: () =>
    api.get("/api/reactions/community-hearts").then((r) => r.data),
  addHeart: () =>
    api.post("/api/reactions/community-hearts").then((r) => r.data),
  removeHeart: () =>
    api.delete("/api/reactions/community-hearts").then((r) => r.data),
};

// ============ PUBLIC (no auth) ============
export const publicApi = {
  getLeaderboard: () => api.get("/api/public/leaderboard").then((r) => r.data),
  getSystemHealth: () =>
    api
      .get("/health")
      .then((r) => r.data)
      .catch((error) => {
        if (error.response?.data?.services) return error.response.data;
        throw error;
      }),
  getFeaturedStudents: (limit = 6) =>
    api.get("/api/public/students", { params: { limit } }).then((r) => r.data),
  getProfile: (id) => api.get(`/api/public/students/${id}`).then((r) => r.data),
  getPlatformStats: () =>
    api.get("/api/public/platform-stats").then((r) => r.data),
  subscribeNewsletter: (data) =>
    api.post("/api/public/newsletter/subscribe", data).then((r) => r.data),
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
  downloadReceipt: (transactionId) =>
    api
      .get(`/api/payment/transactions/${transactionId}/receipt`, {
        responseType: "blob",
      })
      .then((r) => r.data),
  retryTransaction: (transactionId) =>
    api
      .post(`/api/payment/transactions/${transactionId}/retry`)
      .then((r) => r.data),
  requestRefund: (transactionId, reason) =>
    api
      .post(`/api/payment/transactions/${transactionId}/refund`, { reason })
      .then((r) => r.data),
  // VNPay online payment
  createVnpay: (planId) =>
    api.post("/api/payment/vnpay/create", { planId }).then((r) => r.data),
  verifyVnpay: (params) =>
    api.post("/api/payment/vnpay/verify", params).then((r) => r.data),
  // PayOS in-app QR
  createPayosQR: (planId) =>
    api.post("/api/payment/payos/create", { planId }).then((r) => r.data),
  payosStatus: (orderCode) =>
    api.get(`/api/payment/payos/status/${orderCode}`).then((r) => r.data),
  publicPayosStatus: (orderCode) =>
    api
      .get(`/api/payment/payos/public-status/${orderCode}`)
      .then((r) => r.data),
  listPending: () => api.get("/api/payment/admin/pending").then((r) => r.data),
  confirm: (txnRef) =>
    api.post(`/api/payment/admin/confirm/${txnRef}`).then((r) => r.data),
  deletePending: (txnRef) =>
    api
      .delete(`/api/payment/admin/pending/${encodeURIComponent(txnRef)}`)
      .then((r) => r.data),
  grantPlan: (data) =>
    api.post("/api/payment/admin/grant-plan", data).then((r) => r.data),
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

export const supportApi = {
  create: (data) => api.post("/api/support", data).then((r) => r.data),
  mine: (page = 1) =>
    api.get("/api/support/mine", { params: { page } }).then((r) => r.data),
  get: (id) => api.get(`/api/support/${id}`).then((r) => r.data),
  reply: (id, message, attachments = []) =>
    api
      .post(`/api/support/${id}/reply`, { message, attachments })
      .then((r) => r.data),
  adminList: (status) =>
    api
      .get("/api/support/admin", { params: status ? { status } : {} })
      .then((r) => r.data),
  setStatus: (id, status) =>
    api.patch(`/api/support/${id}/status`, { status }).then((r) => r.data),
};

// ============ SMART DISCUSSION ============
export const discussionApi = {
  get: (roomId) => api.get(`/api/discussions/${roomId}`).then((r) => r.data),
  action: (roomId, type, payload = {}) =>
    api
      .post(`/api/discussions/${roomId}/action`, { type, payload })
      .then((r) => r.data),
  generateSummary: (roomId) =>
    api.post(`/api/discussions/${roomId}/ai-summary`).then((r) => r.data),
};

// ============ STICKERS ============
export const stickerApi = {
  getAll: () => api.get("/api/stickers").then((r) => r.data),
};

// ============ UPLOAD ============
export const uploadApi = {
  supportAttachment: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post("/api/upload/support-attachment", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  avatar: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post("/api/upload/avatar", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  discussionDocument: (file) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post("/api/upload/discussion-document", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
  adMedia: (file, onUploadProgress) => {
    const fd = new FormData();
    fd.append("file", file);
    return api
      .post("/api/upload/ad-media", fd, {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress,
      })
      .then((r) => r.data);
  },
};

// ============ ADMIN ============
export const adminApi = {
  getStats: () => api.get("/api/admin/stats").then((r) => r.data),
  getAuditLogs: (params = {}) =>
    api.get("/api/admin/audit-logs", { params }).then((r) => r.data),
  broadcastNotification: (data) =>
    api.post("/api/admin/notifications/broadcast", data).then((r) => r.data),
  getUsers: (params = {}) =>
    api.get("/api/admin/users", { params }).then((r) => r.data),
  getUserDetails: (id) => api.get(`/api/admin/users/${id}`).then((r) => r.data),
  warnUser: (id, data) =>
    api.post(`/api/admin/users/${id}/warn`, data).then((r) => r.data),
  blockUser: (id) =>
    api.put(`/api/admin/users/${id}/block`).then((r) => r.data),
  lockUser: (id, reason) =>
    api.put(`/api/admin/users/${id}/lock`, { reason }).then((r) => r.data),
  updateUserSubscription: (id, data) =>
    api.put(`/api/admin/users/${id}/subscription`, data).then((r) => r.data),
  forceLeaveUserRooms: (id) =>
    api.post(`/api/admin/users/${id}/force-leave`).then((r) => r.data),
  resetUserAIUsage: (id) =>
    api.post(`/api/admin/users/${id}/ai-usage/reset`).then((r) => r.data),
  getRevenue: (params = {}) =>
    api.get("/api/admin/revenue/stats", { params }).then((r) => r.data),
  getTransactions: (params = {}) =>
    api.get("/api/admin/revenue/transactions", { params }).then((r) => r.data),
  getAnalytics: (params = {}) =>
    api.get("/api/admin/analytics", { params }).then((r) => r.data),
  getSystemConfig: () => api.get("/api/admin/config").then((r) => r.data),
  updateSystemConfig: (data) =>
    api.put("/api/admin/config", data).then((r) => r.data),
  getNotifications: (params = {}) =>
    api.get("/api/admin/notifications", { params }).then((r) => r.data),
  markNotificationsRead: (notificationIds) =>
    api
      .post("/api/admin/notifications/mark-read", { notificationIds })
      .then((r) => r.data),
  archiveNotification: (id) =>
    api.patch(`/api/admin/notifications/${id}/archive`).then((r) => r.data),
  deleteNotification: (id) =>
    api.delete(`/api/admin/notifications/${id}`).then((r) => r.data),
  getAdViews: (params = {}) =>
    api.get("/api/admin/ads/views", { params }).then((r) => r.data),
  getDownloadStats: () => api.get("/api/download/stats").then((r) => r.data),
  getRooms: (params = {}) =>
    api.get("/api/admin/rooms", { params }).then((r) => r.data),
  createRoom: (data) => api.post("/api/admin/rooms", data).then((r) => r.data),
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
  // Advertising operations
  getAdConfig: () => api.get("/api/admin/ads/config").then((r) => r.data),
  updateAdConfig: (data) =>
    api.put("/api/admin/ads/config", data).then((r) => r.data),
  getAdStats: () => api.get("/api/admin/ads/stats").then((r) => r.data),
  getAdPlacements: () =>
    api.get("/api/admin/ads/placements").then((r) => r.data),
  createAdPlacement: (data) =>
    api.post("/api/admin/ads/placements", data).then((r) => r.data),
  updateAdPlacement: (id, data) =>
    api.put(`/api/admin/ads/placements/${id}`, data).then((r) => r.data),
  deleteAdPlacement: (id) =>
    api.delete(`/api/admin/ads/placements/${id}`).then((r) => r.data),
  toggleAdPlacement: (id) =>
    api.post(`/api/admin/ads/placements/${id}/toggle`).then((r) => r.data),
  toggleAdPlacementEnabled: (id) =>
    api
      .post(`/api/admin/ads/placements/${id}/toggle-enabled`)
      .then((r) => r.data),
};

// ============ REPORT ============
export const reportApi = {
  submit: (data) => api.post("/api/reports", data).then((r) => r.data),
};
