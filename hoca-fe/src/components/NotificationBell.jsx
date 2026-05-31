import { useState, useEffect, useRef } from "react";
import { Bell, Check, Award, TrendingUp, Info } from "lucide-react";
import { notificationApi } from "../lib/services";
import { timeAgo } from "../lib/format";

const typeIcon = {
  BADGE_UNLOCK: Award,
  RANK_UP: TrendingUp,
  STREAK_MILESTONE: TrendingUp,
  SYSTEM: Info,
};

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef(null);

  const loadCount = async () => {
    try {
      const data = await notificationApi.getUnreadCount();
      setUnread(data.unreadCount || 0);
    } catch {
      /* ignore */
    }
  };

  const loadList = async () => {
    try {
      const data = await notificationApi.getAll(1, 15);
      setItems(data.notifications || []);
      setUnread(data.unreadCount || 0);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadCount();
    const interval = setInterval(loadCount, 60000);
    return () => clearInterval(interval);
  }, []);

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
            {unread > 0 && (
              <button
                onClick={markAll}
                className="text-xs text-primary hover:text-primary-light flex items-center gap-1"
              >
                <Check size={14} /> Đọc tất cả
              </button>
            )}
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
                  <div
                    key={n._id}
                    className={`flex gap-3 px-4 py-3 border-b border-white/5 hover:bg-dark-lighter transition ${
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
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
