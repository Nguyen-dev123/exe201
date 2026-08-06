export const FREE_PLAN_CONTENT = {
  name: "HOCA Free",
  description: "Đủ công cụ để bắt đầu học mỗi ngày",
  features: [
    "Học tối đa 3 giờ mỗi ngày",
    "Tạo không giới hạn phòng Im lặng hoặc Camera mỗi ngày",
    "Phòng tự động đóng sau 60 phút (cảnh báo trước 5 phút)",
    "Camera, mic & chat trong Phòng Camera",
    "Pomodoro, Streak, XP & Huy hiệu cơ bản",
    "Bảng xếp hạng & cộng đồng HOCA",
    "Dùng thử HOCA AI 15 lượt mỗi ngày",
  ],
};

export const PAID_PLAN_CONTENT = {
  MONTHLY: {
    name: "HOCA+ Tháng",
    description: "Trọn bộ công cụ học nhóm trong 30 ngày",
    eyebrow: "Linh hoạt",
    price: 79000,
    durationDays: 30,
    features: [
      "Toàn bộ quyền lợi gói Free",
      "Học không giới hạn thời gian, không quảng cáo",
      "Tạo phòng không giới hạn mỗi ngày, không giới hạn thời lượng",
      "Tạo HOCA Smart Discussion & dùng mic thảo luận",
      "Giơ tay, điều phối phát biểu & đồng chủ phòng",
      "Bảng cộng tác, tài liệu, nhiệm vụ & quiz trực tiếp",
      "AI Thư ký, tổng kết buổi học & tạo flashcard",
      "Nền ảo có sẵn, tải nền riêng & mật khẩu bảo vệ phòng",
    ],
  },
  YEARLY: {
    name: "HOCA+ Năm",
    description: "Học lâu dài, tiết kiệm 37% và không giới hạn phòng",
    eyebrow: "Đáng chọn nhất",
    price: 599000,
    durationDays: 365,
    features: [
      "Toàn bộ quyền lợi của HOCA+ Tháng",
      "Tạo phòng không giới hạn mỗi ngày",
      "Phòng học & Smart Discussion không giới hạn thời lượng",
      "Lưu bảng chung, quiz, tài liệu & nhiệm vụ",
      "AI tổng kết & flashcard cho mọi buổi thảo luận",
      "Hiệu lực liên tục trong 365 ngày",
    ],
  },
  LIFETIME: {
    name: "HOCA+ Vĩnh viễn",
    description: "Thanh toán một lần, sử dụng HOCA+ trọn đời",
    eyebrow: "Trọn đời",
    price: 1499000,
    durationDays: -1,
    features: [
      "Toàn bộ quyền lợi của HOCA+ Năm",
      "Học & tạo phòng không giới hạn trọn đời",
      "Smart Discussion, quiz & AI Thư ký trọn đời",
      "Tải tài liệu & nền ảo cá nhân",
      "Không gia hạn, không phát sinh phí hằng năm",
      "Nhận các nâng cấp mới của HOCA+ trong tương lai",
      "Gói không bao giờ hết hạn",
    ],
  },
};

export const getPlanContent = (tier) => PAID_PLAN_CONTENT[tier] || null;
