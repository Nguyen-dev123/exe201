// Format minutes into "Xh Ym" or "Ym"
export const formatMinutes = (mins = 0) => {
  const m = Math.max(0, Math.round(mins));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  if (h > 0) return `${h}h ${rem}m`;
  return `${rem}m`;
};

// Format hours from minutes (1 decimal)
export const minutesToHours = (mins = 0) => Math.round((mins / 60) * 10) / 10;

// Format VND currency
export const formatVND = (amount = 0) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);

// Relative time (vi)
export const timeAgo = (date) => {
  if (!date) return "";
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ngày trước`;
  return new Date(date).toLocaleDateString("vi-VN");
};

export const formatDate = (date) =>
  date ? new Date(date).toLocaleDateString("vi-VN") : "N/A";

// Tier display info
export const TIER_INFO = {
  FREE: { label: "Free", color: "text-white/60", bg: "bg-white/10" },
  MONTHLY: {
    label: "HOCA+ Tháng",
    color: "text-blue-400",
    bg: "bg-blue-500/15",
  },
  YEARLY: {
    label: "HOCA+ Năm",
    color: "text-purple-400",
    bg: "bg-purple-500/15",
  },
  LIFETIME: {
    label: "HOCA+ Vĩnh viễn",
    color: "text-amber-400",
    bg: "bg-amber-500/15",
  },
};

export const getTierInfo = (tier) => TIER_INFO[tier] || TIER_INFO.FREE;
