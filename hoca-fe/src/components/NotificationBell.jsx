import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, Check, Award, TrendingUp, Info, CalendarClock } from "lucide-react";
import { notificationApi } from "../lib/services";
import { timeAgo } from "../lib/format";
import CloseButton from "./CloseButton";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { getSocket } from "../lib/socket";
import { useAuthStore } from "../store/authStore";

const typeIcon = {
  BADGE_UNLOCK: Award,
  RANK_UP: TrendingUp,
  STREAK_MILESTONE: TrendingUp,
  SYSTEM: Info,
  ROOM_REMINDER: CalendarClock,
  GOAL_REMINDER: CalendarClock,
  SUBSCRIPTION_EXPIRY: CalendarClock,
};

export default function NotificationBell() {
  const notificationsEnabled = useAuthStore((state) => state.user?.notificationEnabled !== false);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);
  const navigate = useNavigate();

  const loadCount = useCallback(async () => {
    if (!notificationsEnabled) return;
    try {
      const data = await notificationApi.getUnreadCount();
      setUnread(data.unreadCount || 0);
    } catch {
      // Background polling is intentionally quiet; opening the list shows errors.
    }
  }, [notificationsEnabled]);

  const loadList = async () => {
    if (!notificationsEnabled) return;
    try {
      const data = await notificationApi.getAll(1, 15);
      setItems(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {
      toast.error("Không thể tải thông báo");
    }
  };

  // loadCount is intentionally recreated with the current notification preference.
   
  useEffect(() => {
    if (!notificationsEnabled) return undefined;
    loadCount();
    const interval = setInterval(loadCount, 60000);
    return () => clearInterval(interval);
  }, [notificationsEnabled, loadCount]);

  useEffect(() => {
    if (!notificationsEnabled) return undefined;
    const onNotification = (notification) => {
      setItems((current) => [notification, ...current.filter((item) => item._id !== notification._id)].slice(0, 15));
      if (!notification.isRead) setUnread((current) => current + 1);
      toast(`${notification.title}: ${notification.message}`, { icon: "🔔", duration: 7000 });
    };
    let activeSocket = null;
    const attach = (socket) => {
      if (!socket || socket === activeSocket) return;
      activeSocket?.off("notification", onNotification);
      activeSocket = socket;
      activeSocket.on("notification", onNotification);
    };
    attach(getSocket());
    const onReady = (event) => attach(event.detail);
    window.addEventListener("hoca:socket-ready", onReady);
    return () => { activeSocket?.off("notification", onNotification); window.removeEventListener("hoca:socket-ready", onReady); };
  }, [notificationsEnabled]);

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  };

  const markAll = async () => {
    try {
      await notificationApi.markRead("all");
      setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch {
      /* ignore */
    }
  };

  const openNotification = async (notification) => {
    if (!notification.isRead) {
      try {
        await notificationApi.markRead([notification._id]);
        setItems((current) => current.map((item) => item._id === notification._id ? { ...item, isRead: true } : item));
        setUnread((current) => Math.max(0, current - 1));
      } catch {
        toast.error("Không thể đánh dấu thông báo đã đọc");
      }
    }
    setOpen(false);
    if (notification.data?.url) navigate(notification.data.url);
  };

  if (!notificationsEnabled) return null;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="relative p-2 rounded-lg hover:bg-dark-lighter transition text-white/70 hover:text-white"
        title="Thông báo"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-dark-card border border-white/10 rounded-xl shadow-2xl z-50 animate-scaleIn overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <span className="font-semibold text-white">Thông báo</span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={markAll}
                  className="text-xs text-primary hover:text-primary-light flex items-center gap-1"
                >
                  <Check size={14} /> Đọc tất cả
                </button>
              )}
              <CloseButton
                onClick={() => setOpen(false)}
                label="Đóng thông báo"
              />
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <div className="py-10 text-center text-white/40 text-sm">
                <Bell className="mx-auto mb-2 opacity-30" size={28} />
                Chưa có thông báo
              </div>
            ) : (
              items.map((n) => {
                const Icon = typeIcon[n.type] || Info;
                return (
                  <button
                    type="button"
                    onClick={() => openNotification(n)}
                    key={n._id}
                    className={`flex w-full gap-3 px-4 py-3 text-left border-b border-white/5 hover:bg-dark-lighter transition ${
                      !n.isRead ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Icon size={18} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {n.title}
                      </p>
                      <p className="text-xs text-white/60 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-white/30 mt-1">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                    {!n.isRead && (
                      <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0"></span>
                    )}
                  </button>
                );
              })
            )}
          </div>
          <Link to="/notifications" onClick={() => setOpen(false)} className="block border-t border-white/10 px-4 py-3 text-center text-sm font-semibold text-primary hover:bg-white/5">
            Xem tất cả thông báo
          </Link>
        </div>
      )}
    </div>
  );
}
