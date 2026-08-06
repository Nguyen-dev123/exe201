import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Navigate, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Users,
  DoorOpen,
  DollarSign,
  LayoutDashboard,
  Lock,
  Unlock,
  Search,
  Receipt,
  TrendingUp,
  Flag,
  Star,
  MessageSquare,
  Crown,
  Download,
  Bot,
  LogOut,
  Settings2,
  Tags,
  Award,
  ImagePlus,
  Plus,
  ClipboardList,
  Megaphone,
  Radio,
  UploadCloud,
  X,
  Pencil,
  CalendarDays,
  Image as ImageIcon,
} from "lucide-react";
import { adminApi, badgeApi, pricingApi, stickerApi, supportApi, uploadApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";
import { formatVND, minutesToHours, formatDate } from "../lib/format";
import Avatar from "../components/Avatar";
import CloseButton from "../components/CloseButton";
import AdminPaymentsPage from "./AdminPaymentsPage";
import DateTimeField from "../components/DateTimeField";
import { confirmDialog } from "../lib/dialog";

const AdminSystemTools = lazy(() => import("../components/AdminSystemTools"));

function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

const TICKET_STATUS = {
  OPEN: "Mới",
  IN_PROGRESS: "Đang xử lý",
  WAITING_USER: "Chờ người dùng",
  RESOLVED: "Đã giải quyết",
  CLOSED: "Đã đóng",
};

function SupportTicketsTab() {
  const [status, setStatus] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState("");
  const ticketsQuery = useQuery({
    queryKey: ["admin-support", status],
    queryFn: () => supportApi.adminList(status),
  });
  const ticketQuery = useQuery({
    queryKey: ["admin-support-ticket", selectedId],
    queryFn: () => supportApi.get(selectedId),
    enabled: Boolean(selectedId),
  });

  const updateStatus = async (nextStatus) => {
    setBusy("status");
    try {
      await supportApi.setStatus(selectedId, nextStatus);
      toast.success("Đã cập nhật trạng thái ticket");
      await Promise.all([ticketsQuery.refetch(), ticketQuery.refetch()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Không cập nhật được trạng thái");
    } finally {
      setBusy("");
    }
  };

  const sendReply = async (event) => {
    event.preventDefault();
    if (!reply.trim()) return;
    setBusy("reply");
    try {
      await supportApi.reply(selectedId, reply.trim());
      setReply("");
      toast.success("Đã gửi phản hồi");
      await Promise.all([ticketsQuery.refetch(), ticketQuery.refetch()]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Không gửi được phản hồi");
    } finally {
      setBusy("");
    }
  };

  const tickets = ticketsQuery.data || [];
  const ticket = ticketQuery.data;
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.5fr)]">
      <section className="stat-card p-0 overflow-hidden">
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-semibold">Ticket hỗ trợ</h3>
            <span className="text-sm text-white/45">{tickets.length}</span>
          </div>
          <select aria-label="Lọc trạng thái ticket" value={status} onChange={(event) => setStatus(event.target.value)} className="app-input mt-3">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(TICKET_STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        {ticketsQuery.isLoading ? (
          <div className="space-y-3 p-4">{[0,1,2].map((item) => <div key={item} className="skeleton h-20 rounded-xl" />)}</div>
        ) : ticketsQuery.isError ? (
          <div className="p-6 text-center text-sm text-red-300">Không tải được ticket.<button type="button" onClick={() => ticketsQuery.refetch()} className="ml-2 font-semibold underline">Thử lại</button></div>
        ) : tickets.length ? (
          <div className="max-h-[680px] divide-y divide-white/5 overflow-y-auto">
            {tickets.map((item) => (
              <button key={item._id} type="button" onClick={() => setSelectedId(item._id)} className={`w-full p-4 text-left transition hover:bg-white/[0.04] ${selectedId === item._id ? "bg-primary/[0.08]" : ""}`}>
                <div className="flex items-center justify-between gap-3"><strong className="truncate text-sm">{item.code}</strong><span className="shrink-0 text-xs text-primary">{TICKET_STATUS[item.status] || item.status}</span></div>
                <p className="mt-1 truncate text-sm text-white/70">{item.subject}</p>
                <p className="mt-2 truncate text-xs text-white/40">{item.user?.displayName || item.user?.email || "Người dùng"} · {formatDate(item.updatedAt)}</p>
              </button>
            ))}
          </div>
        ) : <div className="p-10 text-center text-sm text-white/40">Không có ticket phù hợp.</div>}
      </section>

      <section className="stat-card min-h-[420px]">
        {!selectedId ? <div className="flex min-h-80 items-center justify-center text-sm text-white/40">Chọn một ticket để xem và phản hồi.</div> : ticketQuery.isLoading ? <div className="space-y-3"><div className="skeleton h-8 w-48 rounded-lg"/><div className="skeleton h-24 rounded-xl"/></div> : ticketQuery.isError ? <div className="py-12 text-center text-red-300">Không tải được nội dung ticket.</div> : ticket && <>
          <div className="flex flex-col gap-4 border-b border-white/10 pb-4 sm:flex-row sm:items-start sm:justify-between">
            <div><p className="text-xs font-semibold text-primary">{ticket.code}</p><h3 className="mt-1 text-xl font-bold">{ticket.subject}</h3><p className="mt-1 text-sm text-white/45">{ticket.user?.displayName || ticket.user?.email || "Người dùng"}</p></div>
            <select aria-label="Trạng thái ticket" value={ticket.status} disabled={busy !== ""} onChange={(event) => updateStatus(event.target.value)} className="app-input sm:max-w-48 disabled:opacity-50">{Object.entries(TICKET_STATUS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>
          <div className="my-5 max-h-96 space-y-3 overflow-y-auto pr-1">
            {ticket.messages?.map((message, index) => <div key={message._id || index} className={`rounded-xl p-4 ${message.role === "ADMIN" ? "ml-4 bg-primary/10" : "mr-4 bg-white/[0.045]"}`}><p className="text-xs font-semibold text-white/45">{message.role === "ADMIN" ? "HOCA hỗ trợ" : "Người dùng"} · {formatDate(message.createdAt)}</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-white/75">{message.content}</p>{message.attachments?.map((url) => <a key={url} href={url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-primary underline">Tệp đính kèm</a>)}</div>)}
          </div>
          {!['RESOLVED','CLOSED'].includes(ticket.status) && <form onSubmit={sendReply} className="border-t border-white/10 pt-4"><label className="text-sm font-medium">Phản hồi<textarea value={reply} onChange={(event) => setReply(event.target.value)} rows={4} maxLength={3000} className="app-input mt-2 resize-y" placeholder="Nhập nội dung hỗ trợ..." /></label><button disabled={busy !== "" || !reply.trim()} className="btn-primary mt-3 inline-flex min-h-10 items-center gap-2 px-5 disabled:opacity-40"><MessageSquare size={16}/>{busy === "reply" ? "Đang gửi..." : "Gửi phản hồi"}</button></form>}
        </>}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, onClick }) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`stat-card w-full text-left ${onClick ? "group cursor-pointer transition hover:-translate-y-0.5 hover:border-primary/45 hover:bg-white/[0.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 active:translate-y-0" : ""}`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${color}`}
      >
        <Icon size={22} />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className={`text-sm text-white/50 ${onClick ? "transition group-hover:text-white/70" : ""}`}>{label}</div>
    </Component>
  );
}

function OverviewTab({ onSelectTab }) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminApi.getStats,
  });
  const { data: revenue } = useQuery({
    queryKey: ["admin-revenue", "all"],
    queryFn: () => adminApi.getRevenue({ timeframe: "all" }),
  });

  if (isLoading)
    return <div className="text-center py-12 text-white/50">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Tổng người dùng"
          value={stats?.totalUsers ?? 0}
          color="bg-blue-500/15 text-blue-400"
          onClick={() => onSelectTab("users")}
        />
        <StatCard
          icon={DoorOpen}
          label="Tổng số phòng"
          value={stats?.totalRooms ?? 0}
          color="bg-green-500/15 text-green-400"
          onClick={() => onSelectTab("rooms")}
        />
        <StatCard
          icon={DollarSign}
          label="Doanh thu"
          value={formatVND(stats?.revenue ?? 0)}
          color="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          icon={TrendingUp}
          label="User mới (7 ngày)"
          value={stats?.newUsersLast7Days ?? 0}
          color="bg-purple-500/15 text-purple-400"
          onClick={() => onSelectTab("users", { userFilter: "recent7" })}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Bot size={16} className="text-primary" /> Lượt AI trang chính
          </div>
          <p className="mt-2 text-xl font-bold">{stats?.aiToday?.questions ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
          <p className="text-sm text-white/50">Người dùng AI hôm nay</p>
          <p className="mt-2 text-xl font-bold">{stats?.aiToday?.activeUsers ?? 0}</p>
        </div>
        <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-3">
          <p className="text-sm text-white/50">Đã dùng hết 15 lượt</p>
          <p className="mt-2 text-xl font-bold text-amber-300">{stats?.aiToday?.usersAtLimit ?? 0}</p>
        </div>
      </div>

      {/* Revenue by tier */}
      {revenue?.tierRevenue && (
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Doanh thu theo gói</h3>
          <div className="grid grid-cols-3 gap-4">
            {["MONTHLY", "YEARLY", "LIFETIME"].map((tier) => (
              <div
                key={tier}
                className="text-center p-4 rounded-xl bg-dark-lighter"
              >
                <div className="text-lg font-bold text-primary">
                  {formatVND(revenue.tierRevenue[tier]?.total || 0)}
                </div>
                <div className="text-xs text-white/50 mt-1">
                  {tier} · {revenue.tierRevenue[tier]?.count || 0} đơn
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function UsersTab({ userFilter, onSelectTab }) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [selectedUser, setSelectedUser] = useState(null);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", debouncedSearch, userFilter],
    queryFn: () => adminApi.getUsers({
      search: debouncedSearch,
      limit: 20,
      createdWithinDays: userFilter === "recent7" ? 7 : undefined,
    }),
  });

  return (
    <div>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:max-w-xl sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              size={18}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên hoặc email..."
              className="app-input pl-10"
            />
          </div>
          {userFilter === "recent7" && (
            <button type="button" onClick={() => onSelectTab("users")} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-purple-400/25 bg-purple-500/10 px-3 text-sm font-medium text-purple-200 hover:bg-purple-500/15">
              Mới trong 7 ngày <X size={14} />
            </button>
          )}
        </div>
        <p className="text-sm text-white/45">
          {data?.total ?? 0} tài khoản
        </p>
      </div>

      <div className="stat-card p-0 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-white/50">Đang tải...</div>
        ) : (
          <div className="divide-y divide-white/5">
            {(data?.users || []).map((u) => (
              <div key={u._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <Avatar
                  user={u}
                  size={40}
                  ring={false}
                  className="flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {u.displayName}
                    {u.role === "ADMIN" && (
                      <span className="ml-2 pill bg-primary/15 text-primary">
                        Admin
                      </span>
                    )}
                    {(u.isLocked || u.isBlocked) && (
                      <span className="ml-2 pill bg-red-500/15 text-red-400">
                        Đã khóa
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-white/40 truncate">{u.email}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/45">
                    {userFilter === "recent7" && u.createdAt && (
                      <span className="font-medium text-purple-300">
                        Tạo lúc {new Date(u.createdAt).toLocaleString("vi-VN")}
                      </span>
                    )}
                    <span>{minutesToHours(u.totalStudyMinutes)}h học</span>
                    <span>Gói {u.effectiveSubscriptionTier || u.subscriptionTier}</span>
                    <span>
                      AI {u.aiUsageToday?.used || 0}/{u.aiUsageToday?.limit || 15}
                    </span>
                    {u.currentRoomId && (
                      <span className="text-amber-300">
                        Đang ở: {u.currentRoomId.name || "Phòng học"}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedUser(u)}
                  className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/[0.035] px-3 text-sm font-medium text-white/70 transition hover:border-primary/30 hover:text-white active:translate-y-px"
                >
                  <Settings2 size={15} /> Quản lý
                </button>
              </div>
            ))}
            {data?.users?.length === 0 && (
              <div className="text-center py-12 text-white/40">
                Không có người dùng
              </div>
            )}
          </div>
        )}
      </div>

      {selectedUser && (
        <UserOperationsModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onChanged={async () => {
            const result = await refetch();
            const freshUser = result.data?.users?.find((item) => item._id === selectedUser._id);
            if (freshUser) setSelectedUser(freshUser);
          }}
        />
      )}
    </div>
  );
}

function UserOperationsModal({ user, onClose, onChanged }) {
  const [tier, setTier] = useState(user.subscriptionTier || "FREE");
  const [expiry, setExpiry] = useState(
    user.subscriptionExpiry
      ? new Date(user.subscriptionExpiry).toISOString().slice(0, 10)
      : "",
  );
  const [busyAction, setBusyAction] = useState("");
  const [warningReason, setWarningReason] = useState("");
  const detailsQuery = useQuery({
    queryKey: ["admin-user-details", user._id],
    queryFn: () => adminApi.getUserDetails(user._id),
  });

  const runAction = async (key, action, successMessage) => {
    setBusyAction(key);
    try {
      const result = await action();
      toast.success(result?.message || successMessage);
      await onChanged();
    } catch (error) {
      toast.error(error.response?.data?.message || "Thao tác thất bại");
    } finally {
      setBusyAction("");
    }
  };

  const saveSubscription = () =>
    runAction(
      "subscription",
      () => adminApi.updateUserSubscription(user._id, { tier, expiry: expiry || undefined }),
      "Đã cập nhật gói thành viên",
    );

  const resetAI = async () => {
    if (!(await confirmDialog(`Khôi phục đủ 15 lượt AI hôm nay cho ${user.displayName}?`))) return;
    runAction(
      "ai",
      () => adminApi.resetUserAIUsage(user._id),
      "Đã khôi phục lượt AI",
    );
  };

  const forceLeave = async () => {
    if (!(await confirmDialog(`Kết thúc toàn bộ trạng thái phòng của ${user.displayName}?`, { destructive: true }))) return;
    runAction(
      "room",
      () => adminApi.forceLeaveUserRooms(user._id),
      "Đã giải phóng trạng thái phòng",
    );
  };

  const toggleLock = async () => {
    const verb = user.isLocked ? "mở khóa" : "khóa";
    if (!(await confirmDialog(`Xác nhận ${verb} tài khoản ${user.displayName}?`, { destructive: !user.isLocked }))) return;
    runAction(
      "lock",
      () => adminApi.lockUser(user._id),
      user.isLocked ? "Đã mở khóa tài khoản" : "Đã khóa tài khoản",
    );
  };

  const warnUser = async () => {
    if (!warningReason.trim()) return;
    await runAction(
      "warning",
      () => adminApi.warnUser(user._id, { reason: warningReason.trim() }),
      "Đã gửi cảnh báo cho người dùng",
    );
    setWarningReason("");
    detailsQuery.refetch();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#171a2d] shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#171a2d]/95 px-5 py-4 backdrop-blur">
          <div className="flex min-w-0 items-center gap-3">
            <Avatar user={user} size={42} ring={false} />
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold">{user.displayName}</h2>
              <p className="truncate text-xs text-white/45">{user.email}</p>
            </div>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="space-y-5 p-5">
          <section className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
            <h3 className="font-semibold">Chi tiết tài khoản</h3>
            {detailsQuery.isLoading ? <div className="skeleton mt-3 h-16 rounded-xl" /> : detailsQuery.isError ? <p className="mt-3 text-sm text-red-300">Không tải được chi tiết tài khoản.</p> : <div className="mt-3 grid gap-2 text-sm text-white/60 sm:grid-cols-2"><p>Ngày tạo: <span className="text-white/85">{formatDate(detailsQuery.data?.createdAt)}</span></p><p>Hoạt động gần nhất: <span className="text-white/85">{formatDate(detailsQuery.data?.lastLoginAt || detailsQuery.data?.updatedAt)}</span></p><p>Tổng thời gian học: <span className="text-white/85">{minutesToHours(detailsQuery.data?.totalStudyMinutes)} giờ</span></p><p>Số cảnh báo: <span className="text-white/85">{detailsQuery.data?.warnings?.length || 0}</span></p></div>}
          </section>
          <section className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="mb-4 flex items-center gap-2">
              <Crown size={17} className="text-primary" />
              <h3 className="font-semibold">Gói thành viên</h3>
            </div>
            {user.role === "ADMIN" ? (
              <p className="text-sm text-white/50">Tài khoản Admin có toàn quyền hệ thống và không cần gán gói.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                <label className="text-xs text-white/55">
                  Gói
                  <select value={tier} onChange={(event) => setTier(event.target.value)} className="app-input mt-1">
                    <option value="FREE">HOCA Free</option>
                    <option value="MONTHLY">HOCA+ Tháng</option>
                    <option value="YEARLY">HOCA+ Năm</option>
                    <option value="LIFETIME">HOCA+ Vĩnh viễn</option>
                  </select>
                </label>
                <label className="text-xs text-white/55">
                  Ngày hết hạn
                  <input
                    type="date"
                    value={expiry}
                    onChange={(event) => setExpiry(event.target.value)}
                    disabled={tier === "FREE" || tier === "LIFETIME"}
                    className="app-input mt-1 disabled:opacity-40"
                  />
                </label>
                <button
                  type="button"
                  onClick={saveSubscription}
                  disabled={busyAction !== ""}
                  className="btn-primary min-h-10 px-4 disabled:opacity-50"
                >
                  {busyAction === "subscription" ? "Đang lưu..." : "Lưu gói"}
                </button>
              </div>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
              <div className="flex items-center gap-2">
                <Bot size={17} className="text-primary" />
                <h3 className="font-semibold">AI ngoài trang chính</h3>
              </div>
              <p className="mt-3 text-2xl font-bold">
                {user.aiUsageToday?.used || 0}
                <span className="text-sm font-medium text-white/40"> / 15 lượt hôm nay</span>
              </p>
              <button
                type="button"
                onClick={resetAI}
                disabled={busyAction !== "" || !user.aiUsageToday?.used}
                className="mt-4 min-h-9 rounded-lg border border-primary/30 px-3 text-sm font-semibold text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                {busyAction === "ai" ? "Đang khôi phục..." : "Khôi phục 15 lượt"}
              </button>
            </section>

            <section className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
              <div className="flex items-center gap-2">
                <DoorOpen size={17} className="text-primary" />
                <h3 className="font-semibold">Trạng thái phòng</h3>
              </div>
              <p className="mt-3 truncate text-sm text-white/65">
                {user.currentRoomId?.name || "Không ở trong phòng nào"}
              </p>
              <button
                type="button"
                onClick={forceLeave}
                disabled={busyAction !== ""}
                className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-lg border border-red-400/25 px-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <LogOut size={15} />
                {busyAction === "room"
                  ? "Đang xử lý..."
                  : user.currentRoomId
                    ? "Buộc rời phòng"
                    : "Dọn trạng thái kẹt"}
              </button>
            </section>
          </div>

          {user.role !== "ADMIN" && (
            <section className="rounded-xl border border-amber-400/15 bg-amber-500/[0.035] p-4">
              <h3 className="font-semibold">Gửi cảnh báo</h3>
              <p className="mt-1 text-xs text-white/45">Cảnh báo mặc định có hiệu lực 7 ngày và được lưu trong hồ sơ người dùng.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input value={warningReason} onChange={(event) => setWarningReason(event.target.value)} maxLength={500} className="app-input flex-1" placeholder="Lý do cảnh báo" />
                <button type="button" onClick={warnUser} disabled={busyAction !== "" || !warningReason.trim()} className="min-h-10 rounded-lg bg-amber-500/15 px-4 text-sm font-semibold text-amber-200 hover:bg-amber-500/25 disabled:opacity-40">{busyAction === "warning" ? "Đang gửi..." : "Gửi cảnh báo"}</button>
              </div>
            </section>
          )}

          {user.role !== "ADMIN" && (
            <section className="flex flex-col gap-3 rounded-xl border border-red-400/15 bg-red-500/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="font-semibold">Quyền truy cập tài khoản</h3>
                <p className="mt-1 text-xs text-white/45">
                  {user.isLocked ? "Tài khoản đang bị khóa đăng nhập." : "Khóa khi người dùng vi phạm hoặc có rủi ro bảo mật."}
                </p>
              </div>
              <button
                type="button"
                onClick={toggleLock}
                disabled={busyAction !== ""}
                className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-red-500/15 px-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
              >
                {user.isLocked ? <Unlock size={15} /> : <Lock size={15} />}
                {busyAction === "lock" ? "Đang xử lý..." : user.isLocked ? "Mở khóa" : "Khóa tài khoản"}
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

function RoomsTab() {
  const [status, setStatus] = useState("active");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [closingId, setClosingId] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [roomForm, setRoomForm] = useState({
    name: "",
    categoryId: "",
    roomType: "DISCUSSION",
    timerMode: "POMODORO_25_5",
    maxParticipants: 50,
  });
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-rooms", status, debouncedSearch],
    queryFn: () => adminApi.getRooms({ limit: 50, status, search: debouncedSearch }),
  });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: adminApi.getCategories,
  });

  const createRoom = async (event) => {
    event.preventDefault();
    if (!roomForm.name.trim()) return;
    setCreating(true);
    try {
      await adminApi.createRoom({
        ...roomForm,
        categoryId: roomForm.categoryId || undefined,
        maxParticipants: Number(roomForm.maxParticipants),
      });
      toast.success("Đã tạo phòng hệ thống");
      setRoomForm({
        name: "",
        categoryId: "",
        roomType: "DISCUSSION",
        timerMode: "POMODORO_25_5",
        maxParticipants: 50,
      });
      setShowCreate(false);
      setStatus("active");
      await refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể tạo phòng");
    } finally {
      setCreating(false);
    }
  };

  const close = async (room) => {
    if (!(await confirmDialog(`Đóng phòng “${room.name}” và kết thúc phiên của tất cả người tham gia?`, { destructive: true, confirmText: "Đóng phòng" }))) return;
    setClosingId(room._id);
    try {
      await adminApi.closeRoom(room._id);
      toast.success("Đã đóng phòng");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Thất bại");
    } finally {
      setClosingId("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" size={18} />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Tìm tên phòng..."
            className="app-input pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowCreate((current) => !current)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-[#18100A] transition hover:bg-primary-light active:translate-y-px"
          >
            <Plus size={16} /> Tạo phòng hệ thống
          </button>
          <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.025] p-1">
          {[
            ["active", "Đang mở"],
            ["closed", "Đã đóng"],
            ["all", "Tất cả"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatus(value)}
              className={`min-h-8 rounded-lg px-3 text-xs font-semibold transition ${
                status === value ? "bg-primary text-[#18100A]" : "text-white/50 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
          </div>
        </div>
      </div>

      {showCreate && (
        <form onSubmit={createRoom} className="stat-card grid gap-3 md:grid-cols-2 lg:grid-cols-5 lg:items-end">
          <label className="text-xs text-white/55 lg:col-span-2">
            Tên phòng
            <input
              value={roomForm.name}
              onChange={(event) => setRoomForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Ví dụ: Thảo luận Toán tối nay"
              maxLength={120}
              className="app-input mt-1"
            />
          </label>
          <label className="text-xs text-white/55">
            Loại phòng
            <select value={roomForm.roomType} onChange={(event) => setRoomForm((current) => ({ ...current, roomType: event.target.value }))} className="app-input mt-1">
              <option value="SILENT">Im lặng</option>
              <option value="VIDEO">Camera</option>
              <option value="DISCUSSION">Thảo luận</option>
            </select>
          </label>
          <label className="text-xs text-white/55">
            Pomodoro
            <select value={roomForm.timerMode} onChange={(event) => setRoomForm((current) => ({ ...current, timerMode: event.target.value }))} className="app-input mt-1">
              <option value="POMODORO_25_5">25 / 5 phút</option>
              <option value="POMODORO_50_10">50 / 10 phút</option>
              <option value="POMODORO_90_15">90 / 15 phút</option>
            </select>
          </label>
          <label className="text-xs text-white/55">
            Sức chứa
            <input type="number" min="2" max="999" value={roomForm.maxParticipants} onChange={(event) => setRoomForm((current) => ({ ...current, maxParticipants: event.target.value }))} className="app-input mt-1" />
          </label>
          <label className="text-xs text-white/55 lg:col-span-2">
            Danh mục
            <select value={roomForm.categoryId} onChange={(event) => setRoomForm((current) => ({ ...current, categoryId: event.target.value }))} className="app-input mt-1">
              <option value="">Không chọn danh mục</option>
              {categories.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </label>
          <div className="flex gap-2 lg:col-span-3 lg:justify-end">
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary min-h-10 px-4">Hủy</button>
            <button disabled={creating || !roomForm.name.trim()} className="btn-primary min-h-10 px-4 disabled:opacity-40">
              {creating ? "Đang tạo..." : "Tạo phòng"}
            </button>
          </div>
        </form>
      )}

      <div className="stat-card p-0 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-white/50">Đang tải...</div>
        ) : (
          <div className="divide-y divide-white/5">
            {(data?.rooms || []).map((room) => (
              <div key={room._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium truncate">{room.name}</p>
                    <span className={`pill ${room.isActive ? "bg-green-500/10 text-green-300" : "bg-white/[0.06] text-white/45"}`}>
                      {room.isActive ? "Đang mở" : "Đã đóng"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/40">
                    {room.owner?.displayName || "Phòng hệ thống"} · {room.activeParticipants?.length || 0} người · {room.roomType}
                  </p>
                </div>
                {room.reportCount > 0 && (
                  <span className="pill bg-red-500/15 text-red-400">
                    {room.reportCount} báo cáo
                  </span>
                )}
                {room.isActive && (
                  <button
                    type="button"
                    onClick={() => close(room)}
                    disabled={closingId === room._id}
                    className="min-h-9 rounded-lg bg-red-500/15 px-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
                  >
                    {closingId === room._id ? "Đang đóng..." : "Đóng phòng"}
                  </button>
                )}
              </div>
            ))}
            {data?.rooms?.length === 0 && (
              <div className="text-center py-12 text-white/40">
                Không tìm thấy phòng phù hợp
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function RevenueTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-revenue", "all"],
    queryFn: () => adminApi.getRevenue({ timeframe: "all" }),
  });

  if (isLoading)
    return (
      <div className="space-y-6" aria-label="Đang tải dữ liệu doanh thu">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="skeleton h-36 rounded-2xl" />
          ))}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={DollarSign}
          label="Tất cả"
          value={formatVND(data?.summary?.all || 0)}
          color="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          icon={DollarSign}
          label="Năm nay"
          value={formatVND(data?.summary?.year || 0)}
          color="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          icon={DollarSign}
          label="Tháng này"
          value={formatVND(data?.summary?.month || 0)}
          color="bg-green-500/15 text-green-400"
        />
        <StatCard
          icon={DollarSign}
          label="Tuần này"
          value={formatVND(data?.summary?.week || 0)}
          color="bg-purple-500/15 text-purple-400"
        />
      </div>

      <div className="stat-card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 font-semibold flex items-center gap-2">
          <Receipt size={18} className="text-primary" /> Giao dịch gần đây
        </div>
        <div className="divide-y divide-white/5">
          {(data?.transactions || []).map((t, i) => (
            <div key={i} className="flex items-center justify-between p-4">
              <div>
                <p className="font-medium">{t.user}</p>
                <p className="text-xs text-white/40">
                  {formatDate(t.date)} · {t.type}
                </p>
              </div>
              <span className="font-semibold text-primary">
                {formatVND(t.amount)}
              </span>
            </div>
          ))}
          {data?.transactions?.length === 0 && (
            <div className="text-center py-12 text-white/40">
              Chưa có giao dịch
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportsTab({ onSelectTab }) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => adminApi.getReports(),
  });
  const supportReportsQuery = useQuery({
    queryKey: ["admin-support-reports"],
    queryFn: () => supportApi.adminList(),
  });

  const reasonLabel = {
    INAPPROPRIATE_CONTENT: "Nội dung xấu",
    HARASSMENT: "Quấy rối",
    SPAM: "Spam",
    DISRUPTION: "Gây rối",
    OTHER: "Khác",
  };
  const statusStyle = {
    PENDING: "bg-yellow-500/15 text-yellow-400",
    REVIEWED: "bg-blue-500/15 text-blue-400",
    DISMISSED: "bg-white/10 text-white/50",
    ACTION_TAKEN: "bg-green-500/15 text-green-400",
  };

  const resolve = async (id, status, action) => {
    try {
      const res = await adminApi.resolveReport(id, { status, action });
      toast.success(res?.message || "Đã xử lý báo cáo");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Thất bại");
    }
  };

  const reports = Array.isArray(data) ? data : data?.reports || [];
  const supportReports = (supportReportsQuery.data || []).filter(
    (ticket) => !["RESOLVED", "CLOSED"].includes(ticket.status),
  );

  return (
    <div className="space-y-5">
      {supportReportsQuery.isLoading ? (
        <div className="stat-card text-sm text-white/50">Đang tải báo cáo từ Trung tâm trợ giúp...</div>
      ) : supportReports.length > 0 ? (
        <section className="stat-card border-primary/25 bg-primary/[0.035]">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">Yêu cầu mới từ Trung tâm trợ giúp</h3>
              <p className="mt-1 text-sm text-white/55">Có {supportReports.length} yêu cầu hoặc báo cáo của người dùng đang chờ admin xử lý.</p>
            </div>
            <button type="button" onClick={() => onSelectTab("support")} className="btn-primary shrink-0">Mở và xử lý báo cáo</button>
          </div>
          <div className="mt-4 divide-y divide-white/5 rounded-xl border border-white/10 bg-black/10">
            {supportReports.slice(0, 5).map((ticket) => (
              <button key={ticket._id} type="button" onClick={() => onSelectTab("support")} className="flex w-full items-center justify-between gap-4 p-3 text-left transition hover:bg-white/[0.04]">
                <span className="min-w-0">
                  <strong className="block truncate text-sm">{ticket.subject}</strong>
                  <span className="mt-1 block truncate text-xs text-white/45">{ticket.user?.displayName || ticket.user?.email || "Người dùng"} · {ticket.code}</span>
                </span>
                <span className="pill shrink-0 bg-yellow-500/15 text-yellow-300">{TICKET_STATUS[ticket.status] || ticket.status}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      <div className="stat-card p-0 overflow-hidden">
      {isLoading ? (
        <div className="text-center py-12 text-white/50">Đang tải...</div>
      ) : reports.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          <Flag className="mx-auto mb-2 opacity-40" size={32} />
          Không có báo cáo nào
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {reports.map((r) => (
            <div key={r._id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {r.targetUser?.displayName || "—"}{" "}
                    <span className="pill bg-red-500/15 text-red-400 ml-1">
                      {reasonLabel[r.reason] || r.reason}
                    </span>
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Người báo cáo: {r.submitter?.displayName || "—"}
                    {r.room?.name ? ` · Phòng: ${r.room.name}` : ""}
                  </p>
                  {r.description && (
                    <p className="text-sm text-white/60 mt-1">
                      {r.description}
                    </p>
                  )}
                </div>
                <span className={`pill ${statusStyle[r.status] || ""}`}>
                  {r.status}
                </span>
              </div>
              {r.status === "PENDING" && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => resolve(r._id, "ACTION_TAKEN", "WARN_USER")}
                    className="px-3 py-1.5 rounded-lg bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 text-sm"
                    title="Ghi nhận vi phạm — hệ thống tự phạt tăng dần (cảnh cáo → khóa chat → khóa vĩnh viễn)"
                  >
                    Phạt vi phạm
                  </button>
                  <button
                    onClick={() => resolve(r._id, "ACTION_TAKEN", "BLOCK_USER")}
                    className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-sm"
                    title="Khóa tài khoản vĩnh viễn ngay lập tức"
                  >
                    Khóa vĩnh viễn
                  </button>
                  <button
                    onClick={() => resolve(r._id, "DISMISSED")}
                    className="px-3 py-1.5 rounded-lg bg-dark-lighter hover:bg-dark text-white/70 text-sm"
                  >
                    Bỏ qua
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function DownloadsTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["download-stats"],
    queryFn: adminApi.getDownloadStats,
    refetchInterval: 30000,
  });
  if (isLoading) return <div className="text-center py-12">Loading...</div>;

  const stats = data || {};
  const platformColors = {
    Android: "bg-green-500/15 text-green-400",
    iOS: "bg-blue-500/15 text-blue-400",
    Windows: "bg-purple-500/15 text-purple-400",
    MacOS: "bg-gray-500/15 text-gray-400",
    Linux: "bg-orange-500/15 text-orange-400",
    Unknown: "bg-white/10 text-white/40",
  };

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm text-white/60">
            Tự động cập nhật mỗi 30 giây
          </span>
        </div>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 text-sm bg-primary hover:bg-primary-dark rounded-lg transition"
        >
          🔄 Làm mới ngay
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="stat-card bg-gradient-to-br from-orange-500/10 to-transparent border-orange-500/20">
          <div className="text-white/60 text-sm mb-1">Tổng lượt tải</div>
          <div className="text-3xl font-bold text-orange-400 transition-all duration-300">
            {stats.totalDownloads || 0}
          </div>
        </div>
        <div className="stat-card bg-gradient-to-br from-blue-500/10 to-transparent border-blue-500/20">
          <div className="text-white/60 text-sm mb-1">Người dùng unique</div>
          <div className="text-3xl font-bold text-blue-400 transition-all duration-300">
            {stats.uniqueUsers || 0}
          </div>
        </div>
      </div>

      {/* Platform Distribution */}
      {stats.byPlatform && stats.byPlatform.length > 0 && (
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Phân bổ theo Platform</h3>
          <div className="space-y-3">
            {stats.byPlatform.map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <span
                  className={`pill ${platformColors[item._id] || platformColors.Unknown}`}
                >
                  {item._id || "Unknown"}
                </span>
                <span className="font-semibold">{item.count} lượt</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Source Distribution */}
      {stats.bySource && stats.bySource.length > 0 && (
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Phân bổ theo Nguồn</h3>
          <div className="space-y-3">
            {stats.bySource.map((item) => (
              <div key={item._id} className="flex items-center justify-between">
                <span className="text-white/70">{item._id}</span>
                <span className="font-semibold">{item.count} lượt</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Downloads */}
      {stats.recentDownloads && stats.recentDownloads.length > 0 && (
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Lịch sử tải gần đây</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stats.recentDownloads.map((download) => (
              <div
                key={download._id}
                className="p-3 bg-dark-lighter rounded-lg text-sm"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium">
                    {download.downloadedBy?.displayName || "Anonymous"}
                  </span>
                  <span
                    className={`pill text-xs ${platformColors[download.platform] || platformColors.Unknown}`}
                  >
                    {download.platform}
                  </span>
                </div>
                <div className="text-white/40 text-xs flex items-center gap-3">
                  <span>IP: {download.ipAddress}</span>
                  <span>•</span>
                  <span>Source: {download.source}</span>
                  <span>•</span>
                  <span>
                    {new Date(download.createdAt).toLocaleString("vi-VN")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Downloads Chart (Last 30 days) */}
      {stats.downloadsByDay && stats.downloadsByDay.length > 0 && (
        <div className="stat-card">
          <h3 className="font-semibold mb-4">Biểu đồ tải (30 ngày)</h3>
          <div className="space-y-2">
            {stats.downloadsByDay.map((day) => {
              const maxCount = Math.max(
                ...stats.downloadsByDay.map((d) => d.count),
              );
              const percentage = (day.count / maxCount) * 100;
              return (
                <div key={day._id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-white/60">{day._id}</span>
                    <span className="font-semibold">{day.count}</span>
                  </div>
                  <div className="h-2 bg-dark-lighter rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-blue-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FeedbackTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-feedback"],
    queryFn: () => adminApi.getFeedback({ limit: 30 }),
  });
  const { data: summary } = useQuery({
    queryKey: ["admin-feedback-summary"],
    queryFn: adminApi.getFeedbackSummary,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatCard
          icon={Star}
          label="Điểm trung bình"
          value={`${summary?.averageRating ?? 0} / 5`}
          color="bg-yellow-500/15 text-yellow-400"
        />
        <StatCard
          icon={MessageSquare}
          label="Tổng lượt đánh giá"
          value={summary?.count ?? 0}
          color="bg-blue-500/15 text-blue-400"
        />
      </div>

      <div className="stat-card p-0 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-white/50">Đang tải...</div>
        ) : (data?.feedbacks || []).length === 0 ? (
          <div className="text-center py-12 text-white/40">
            Chưa có đánh giá
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {data.feedbacks.map((f) => (
              <div key={f._id} className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{f.user?.displayName || "—"}</p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={14}
                        className={
                          s <= f.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-white/20"
                        }
                      />
                    ))}
                  </div>
                </div>
                {f.room?.name && (
                  <p className="text-xs text-white/40">Phòng: {f.room.name}</p>
                )}
                {f.comment && (
                  <p className="text-sm text-white/60 mt-1">{f.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const EMPTY_AD_FORM = {
  name: "",
  description: "",
  type: "image",
  content: "",
  publicId: "",
  resourceType: "image",
  position: "banner",
  cpm: 0,
  priority: 5,
  duration: 5,
  startDate: "",
  endDate: "",
};

function OperationsTab() {
  const [notice, setNotice] = useState({ title: "", message: "" });
  const [adForm, setAdForm] = useState(EMPTY_AD_FORM);
  const [adSettings, setAdSettings] = useState(null);
  const [busy, setBusy] = useState("");
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [editingId, setEditingId] = useState("");
  const mediaInputRef = useRef(null);

  const configQuery = useQuery({
    queryKey: ["admin-ad-config"],
    queryFn: adminApi.getAdConfig,
  });
  const statsQuery = useQuery({
    queryKey: ["admin-ad-stats"],
    queryFn: adminApi.getAdStats,
    refetchInterval: 30000,
  });
  const placementsQuery = useQuery({
    queryKey: ["admin-ad-placements"],
    queryFn: adminApi.getAdPlacements,
  });

  useEffect(() => {
    if (!configQuery.data) return;
    setAdSettings({
      isActive: !!configQuery.data.isActive,
      vipExemption: !!configQuery.data.vipExemption,
      adFrequency: configQuery.data.adFrequency ?? 15,
      maxAdsPerUser: configQuery.data.maxAdsPerUser ?? 10,
    });
  }, [configQuery.data]);

  useEffect(() => () => {
    if (mediaPreview?.startsWith("blob:")) URL.revokeObjectURL(mediaPreview);
  }, [mediaPreview]);

  const resetCampaignForm = () => {
    setAdForm(EMPTY_AD_FORM);
    setMediaFile(null);
    setMediaPreview("");
    setUploadProgress(0);
    setEditingId("");
    if (mediaInputRef.current) mediaInputRef.current.value = "";
  };

  const selectMedia = (file) => {
    if (!file) return;
    const imageTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    const videoTypes = ["video/mp4", "video/webm"];
    const isImage = imageTypes.includes(file.type);
    const isVideo = videoTypes.includes(file.type);
    if (!isImage && !isVideo) {
      toast.error("Chỉ hỗ trợ JPG, PNG, WEBP, GIF, MP4 hoặc WEBM.");
      return;
    }
    const limit = isImage ? 5 * 1024 * 1024 : 25 * 1024 * 1024;
    if (file.size > limit) {
      toast.error(isImage ? "Ảnh không được vượt quá 5 MB." : "Video không được vượt quá 25 MB.");
      return;
    }
    setMediaFile(file);
    setMediaPreview(URL.createObjectURL(file));
    setUploadProgress(0);
    setAdForm((current) => ({ ...current, type: isImage ? "image" : "video" }));
  };

  const editCampaign = (placement) => {
    const content = placement.contents?.[0] || {};
    const position = placement.positions?.[0] || {};
    setEditingId(placement._id);
    setMediaFile(null);
    setMediaPreview(content.content || "");
    setAdForm({
      ...EMPTY_AD_FORM,
      name: placement.name || "",
      description: placement.description || "",
      type: content.type || "image",
      content: content.content || "",
      publicId: content.publicId || "",
      resourceType: content.resourceType || content.type || "image",
      position: position.position || "banner",
      cpm: placement.cpm || 0,
      priority: content.priority || position.priority || 5,
      duration: position.duration || (content.type === "video" ? 15 : 5),
      startDate: placement.startDate ? new Date(placement.startDate).toISOString().slice(0, 16) : "",
      endDate: placement.endDate ? new Date(placement.endDate).toISOString().slice(0, 16) : "",
    });
    window.scrollTo({ top: 540, behavior: "smooth" });
  };

  const run = async (key, action, successMessage, refresh) => {
    setBusy(key);
    try {
      const result = await action();
      toast.success(result?.message || successMessage);
      if (refresh) await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Thao tác thất bại");
    } finally {
      setBusy("");
    }
  };

  const sendBroadcast = async (event) => {
    event.preventDefault();
    if (!notice.title.trim() || !notice.message.trim()) return;
    if (!(await confirmDialog("Gửi thông báo này đến toàn bộ tài khoản đang hoạt động?", { confirmText: "Gửi thông báo" }))) return;
    run(
      "broadcast",
      () => adminApi.broadcastNotification(notice),
      "Đã gửi thông báo",
      async () => setNotice({ title: "", message: "" }),
    );
  };

  const saveAdSettings = () =>
    run(
      "ad-config",
      () => adminApi.updateAdConfig({
        ...adSettings,
        adFrequency: Number(adSettings.adFrequency),
        maxAdsPerUser: Number(adSettings.maxAdsPerUser),
      }),
      "Đã lưu cấu hình quảng cáo",
      async () => {
        await Promise.all([configQuery.refetch(), statsQuery.refetch()]);
      },
    );

  const createCampaign = (event) => {
    event.preventDefault();
    if (!adForm.name.trim() || (!mediaFile && !adForm.content)) return;
    if (adForm.startDate && adForm.endDate && new Date(adForm.endDate) <= new Date(adForm.startDate)) {
      toast.error("Thời gian kết thúc phải sau thời gian bắt đầu.");
      return;
    }
    run(
      editingId ? "ad-update" : "ad-create",
      async () => {
        let media = {
          url: adForm.content,
          publicId: adForm.publicId,
          resourceType: adForm.resourceType,
          type: adForm.type,
        };
        if (mediaFile) {
          media = await uploadApi.adMedia(mediaFile, (progressEvent) => {
            const total = progressEvent.total || mediaFile.size;
            setUploadProgress(Math.round((progressEvent.loaded * 100) / total));
          });
        }
        const payload = {
          name: adForm.name.trim(),
          description: adForm.description.trim() || undefined,
          isEnabled: true,
          cpm: Number(adForm.cpm) || 0,
          startDate: adForm.startDate ? new Date(adForm.startDate).toISOString() : null,
          endDate: adForm.endDate ? new Date(adForm.endDate).toISOString() : null,
          contents: [{
            type: media.type || adForm.type,
            content: media.url,
            publicId: media.publicId || undefined,
            resourceType: media.resourceType || media.type || adForm.type,
            priority: Number(adForm.priority) || 5,
          }],
          positions: [{
            position: adForm.position,
            isEnabled: true,
            priority: Number(adForm.priority) || 5,
            duration: Number(adForm.duration) || (adForm.type === "video" ? 15 : 5),
          }],
        };
        if (!editingId) payload.status = "Paused";
        return editingId
          ? adminApi.updateAdPlacement(editingId, payload)
          : adminApi.createAdPlacement(payload);
      },
      editingId ? "Đã cập nhật chiến dịch" : "Đã tạo chiến dịch ở trạng thái tạm dừng",
      async () => {
        resetCampaignForm();
        await Promise.all([placementsQuery.refetch(), statsQuery.refetch()]);
      },
    );
  };

  const toggleCampaign = (placement) =>
    run(
      `ad-toggle-${placement._id}`,
      () => adminApi.toggleAdPlacement(placement._id),
      placement.status === "Active" ? "Đã tạm dừng chiến dịch" : "Đã kích hoạt chiến dịch",
      async () => {
        await Promise.all([placementsQuery.refetch(), statsQuery.refetch()]);
      },
    );

  const toggleCampaignEnabled = (placement) =>
    run(
      `ad-enabled-${placement._id}`,
      () => adminApi.toggleAdPlacementEnabled(placement._id),
      placement.isEnabled ? "Đã khóa phân phối chiến dịch" : "Đã cho phép phân phối chiến dịch",
      async () => {
        await Promise.all([placementsQuery.refetch(), statsQuery.refetch()]);
      },
    );

  const deleteCampaign = async (placement) => {
    if (!(await confirmDialog(`Xóa chiến dịch “${placement.name}”? Dữ liệu lượt xem của chiến dịch cũng sẽ mất.`, { destructive: true, confirmText: "Xóa chiến dịch" }))) return;
    run(
      `ad-delete-${placement._id}`,
      () => adminApi.deleteAdPlacement(placement._id),
      "Đã xóa chiến dịch",
      async () => {
        await Promise.all([placementsQuery.refetch(), statsQuery.refetch()]);
      },
    );
  };

  return (
    <div className="space-y-5">
      {(configQuery.isError || statsQuery.isError || placementsQuery.isError) && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-400/20 bg-red-500/[0.05] px-4 py-3 text-sm text-red-200 sm:flex-row sm:items-center sm:justify-between">
          <span>Một phần dữ liệu vận hành chưa tải được.</span>
          <button
            type="button"
            onClick={() => {
              configQuery.refetch();
              statsQuery.refetch();
              placementsQuery.refetch();
            }}
            className="font-semibold text-white"
          >
            Thử lại
          </button>
        </div>
      )}
      <section className="stat-card">
        <div className="mb-4 flex items-center gap-2">
          <Megaphone size={18} className="text-primary" />
          <div>
            <h2 className="font-semibold">Thông báo toàn hệ thống</h2>
            <p className="text-xs text-white/40">Thông báo sẽ xuất hiện trong chuông của từng người dùng.</p>
          </div>
        </div>
        <form onSubmit={sendBroadcast} className="grid gap-3">
          <label className="grid gap-1.5 text-sm text-white/70">
            Tiêu đề <span className="sr-only">bắt buộc</span>
            <input
              value={notice.title}
              onChange={(event) => setNotice((current) => ({ ...current, title: event.target.value }))}
              placeholder="Nội dung chính người dùng cần chú ý"
              maxLength={120}
              className="app-input"
            />
          </label>
          <label className="grid gap-1.5 text-sm text-white/70">
            Nội dung thông báo
            <textarea
              value={notice.message}
              onChange={(event) => setNotice((current) => ({ ...current, message: event.target.value }))}
              placeholder="Viết ngắn gọn, nêu rõ thời gian và việc người dùng cần thực hiện"
              maxLength={1000}
              rows={3}
              className="app-input resize-none"
            />
          </label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-xs text-white/35">{notice.message.length}/1000 ký tự. Hệ thống sẽ yêu cầu xác nhận trước khi gửi.</span>
            <button disabled={busy !== "" || !notice.title.trim() || !notice.message.trim()} className="btn-primary min-h-10 px-5 disabled:opacity-40">
              {busy === "broadcast" ? "Đang gửi..." : "Gửi đến tất cả người dùng"}
            </button>
          </div>
        </form>
      </section>

      <section className="stat-card">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-primary" />
            <div>
              <h2 className="font-semibold">Vận hành quảng cáo</h2>
              <p className="text-xs text-white/40">Cấu hình chỉ áp dụng cho tài khoản thuộc diện hiển thị quảng cáo.</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-3 text-right text-xs text-white/45 sm:grid-cols-5">
            <div><strong className="block text-base text-white">{statsQuery.data?.activeCampaigns || 0}</strong>đang chạy</div>
            <div><strong className="block text-base text-white">{statsQuery.data?.views || 0}</strong>lượt xem</div>
            <div><strong className="block text-base text-white">{(placementsQuery.data || []).reduce((sum, item) => sum + (item.totalClicks || 0), 0)}</strong>lượt nhấp</div>
            <div><strong className="block text-base text-white">{statsQuery.data?.ctr || 0}%</strong>CTR</div>
            <div><strong className="block text-base text-white">{formatVND(statsQuery.data?.revenue || 0)}</strong>ước tính</div>
          </div>
        </div>

        {adSettings && (
          <div className="mt-5 grid gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" checked={adSettings.isActive} onChange={(event) => setAdSettings((current) => ({ ...current, isActive: event.target.checked }))} />
              Bật quảng cáo toàn hệ thống
            </label>
            <label className="flex items-center gap-2 text-sm text-white/70">
              <input type="checkbox" checked={adSettings.vipExemption} onChange={(event) => setAdSettings((current) => ({ ...current, vipExemption: event.target.checked }))} />
              Miễn quảng cáo cho HOCA+
            </label>
            <label className="text-xs text-white/50">
              Khoảng cách quảng cáo (phút)
              <input type="number" min="1" max="1440" value={adSettings.adFrequency} onChange={(event) => setAdSettings((current) => ({ ...current, adFrequency: event.target.value }))} className="app-input mt-1" />
            </label>
            <label className="text-xs text-white/50">
              Tối đa mỗi người/ngày
              <input type="number" min="0" max="100" value={adSettings.maxAdsPerUser} onChange={(event) => setAdSettings((current) => ({ ...current, maxAdsPerUser: event.target.value }))} className="app-input mt-1" />
            </label>
            <div className="sm:col-span-2 lg:col-span-4 lg:text-right">
              <button type="button" onClick={saveAdSettings} disabled={busy !== ""} className="btn-primary min-h-9 px-4 disabled:opacity-40">
                {busy === "ad-config" ? "Đang lưu..." : "Lưu cấu hình quảng cáo"}
              </button>
            </div>
          </div>
        )}

        <form onSubmit={createCampaign} className="mt-5 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 sm:p-5">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-semibold">{editingId ? "Chỉnh sửa chiến dịch" : "Tạo chiến dịch mới"}</h3>
              <p className="mt-1 text-xs text-white/45">Media được tải trực tiếp từ máy và chiến dịch mới luôn ở trạng thái tạm dừng để kiểm tra trước.</p>
            </div>
            {editingId && (
              <button type="button" onClick={resetCampaignForm} className="min-h-9 rounded-lg border border-white/10 px-3 text-sm text-white/65 hover:bg-white/[0.04]">
                Hủy chỉnh sửa
              </button>
            )}
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.8fr)]">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm text-white/70 sm:col-span-2">
                Tên chiến dịch <span className="text-primary">*</span>
                <input value={adForm.name} maxLength={120} onChange={(event) => setAdForm((current) => ({ ...current, name: event.target.value }))} placeholder="Nhập tên chiến dịch" className="app-input" />
              </label>
              <label className="grid gap-1.5 text-sm text-white/70 sm:col-span-2">
                Mô tả nội bộ
                <textarea value={adForm.description} maxLength={300} rows={2} onChange={(event) => setAdForm((current) => ({ ...current, description: event.target.value }))} placeholder="Mục tiêu hoặc ghi chú để quản trị viên dễ nhận biết" className="app-input resize-none" />
              </label>
              <label className="grid gap-1.5 text-sm text-white/70">
                Vị trí hiển thị
                <select value={adForm.position} onChange={(event) => setAdForm((current) => ({ ...current, position: event.target.value }))} className="app-input">
                  <option value="banner">Banner trong trang</option>
                  <option value="pre-room">Trước khi vào phòng</option>
                  <option value="popup">Cửa sổ bật lên</option>
                </select>
              </label>
              <DateTimeField value={adForm.startDate} onChange={(value) => setAdForm((current) => ({ ...current, startDate: value }))} dateLabel="Ngày bắt đầu" timeLabel="Giờ bắt đầu" />
              <DateTimeField min={adForm.startDate || undefined} value={adForm.endDate} onChange={(value) => setAdForm((current) => ({ ...current, endDate: value }))} dateLabel="Ngày kết thúc" timeLabel="Giờ kết thúc" />
              <label className="grid gap-1.5 text-sm text-white/70">
                Thời lượng hiển thị (giây)
                <input type="number" min="1" max="120" value={adForm.duration} onChange={(event) => setAdForm((current) => ({ ...current, duration: event.target.value }))} className="app-input" />
              </label>
              <label className="grid gap-1.5 text-sm text-white/70">
                Độ ưu tiên (1-10)
                <input type="number" min="1" max="10" value={adForm.priority} onChange={(event) => setAdForm((current) => ({ ...current, priority: event.target.value }))} className="app-input" />
              </label>
              <label className="grid gap-1.5 text-sm text-white/70 sm:col-span-2">
                CPM dự kiến (đồng/1.000 lượt xem)
                <input type="number" min="0" step="100" value={adForm.cpm} onChange={(event) => setAdForm((current) => ({ ...current, cpm: event.target.value }))} className="app-input" />
              </label>
            </div>

            <div className="grid content-start gap-3">
              <span className="text-sm text-white/70">Ảnh hoặc video <span className="text-primary">*</span></span>
              <input ref={mediaInputRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" onChange={(event) => selectMedia(event.target.files?.[0])} className="sr-only" />
              {mediaPreview ? (
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#101426]">
                  <div className="relative aspect-video bg-black/20">
                    {adForm.type === "video" ? (
                      <video src={mediaPreview} controls className="h-full w-full object-contain" />
                    ) : (
                      <img src={mediaPreview} alt="Xem trước media quảng cáo" className="h-full w-full object-contain" />
                    )}
                    <button type="button" onClick={() => { setMediaFile(null); setMediaPreview(""); setAdForm((current) => ({ ...current, content: "", publicId: "" })); if (mediaInputRef.current) mediaInputRef.current.value = ""; }} aria-label="Xóa media đã chọn" className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-lg bg-[#111525]/90 text-white shadow-lg hover:bg-red-500">
                      <X size={17} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3 px-3 py-2 text-xs text-white/50">
                    <span className="truncate">{mediaFile?.name || "Media hiện tại"}</span>
                    <button type="button" onClick={() => mediaInputRef.current?.click()} className="shrink-0 font-semibold text-primary">Thay tệp</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => mediaInputRef.current?.click()} onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectMedia(event.dataTransfer.files?.[0]); }} className="group grid min-h-56 place-items-center rounded-xl border border-dashed border-white/15 bg-[#101426]/60 px-6 text-center transition hover:border-primary/60 hover:bg-primary/[0.04] focus:outline-none focus:ring-2 focus:ring-primary/40">
                  <span>
                    <UploadCloud size={30} className="mx-auto mb-3 text-primary transition group-hover:-translate-y-0.5" />
                    <strong className="block text-sm text-white/80">Chọn tệp từ máy</strong>
                    <span className="mt-1 block text-xs leading-5 text-white/40">Kéo thả hoặc bấm để chọn. Ảnh tối đa 5 MB, video tối đa 25 MB.</span>
                  </span>
                </button>
              )}
              {uploadProgress > 0 && busy !== "" && (
                <div className="text-xs text-white/55">
                  <div className="mb-1 flex justify-between"><span>Đang tải media</span><span>{uploadProgress}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full bg-primary transition-[width]" style={{ width: `${uploadProgress}%` }} /></div>
                </div>
              )}
              <div className="rounded-lg bg-white/[0.035] px-3 py-2.5 text-xs leading-5 text-white/45">
                Banner nên dùng tỷ lệ 16:9. Không tải tệp chứa thông tin nhạy cảm hoặc nội dung chưa được phép sử dụng.
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 border-t border-white/[0.07] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-white/40">Bạn có thể xem trước và kích hoạt chiến dịch sau khi lưu.</p>
            <button disabled={busy !== "" || !adForm.name.trim() || (!mediaFile && !adForm.content)} className="btn-primary min-h-11 min-w-48 px-5 disabled:opacity-40">
              {busy === "ad-create" ? "Đang tải và tạo..." : busy === "ad-update" ? "Đang cập nhật..." : editingId ? "Lưu thay đổi" : "Tạo chiến dịch"}
            </button>
          </div>
        </form>

        <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.08]">
          <div className="flex items-center justify-between border-b border-white/[0.07] bg-white/[0.025] px-4 py-3">
            <div>
              <h3 className="text-sm font-semibold">Danh sách chiến dịch</h3>
              <p className="mt-0.5 text-xs text-white/40">Theo dõi, chỉnh sửa và kiểm soát trạng thái hiển thị.</p>
            </div>
            <span className="text-xs text-white/45">{placementsQuery.data?.length || 0} chiến dịch</span>
          </div>
          {placementsQuery.isLoading && (
            <div className="grid gap-3 p-4">
              {[1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-lg bg-white/[0.04]" />)}
            </div>
          )}
          {(placementsQuery.data || []).map((placement) => (
            <div key={placement._id} className="flex flex-col gap-3 border-b border-white/[0.06] p-4 last:border-b-0 lg:flex-row lg:items-center">
              <div className="grid h-16 w-full shrink-0 place-items-center overflow-hidden rounded-lg border border-white/[0.08] bg-[#101426] lg:w-28">
                {placement.contents?.[0]?.content ? (
                  placement.contents[0].type === "video" ? (
                    <video src={placement.contents[0].content} muted preload="metadata" className="h-full w-full object-cover" />
                  ) : (
                    <img src={placement.contents[0].content} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
                  )
                ) : <ImageIcon size={20} className="text-white/25" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold">{placement.name}</p>
                  <span className={`pill ${placement.status === "Active" ? "bg-green-500/10 text-green-300" : "bg-white/[0.06] text-white/45"}`}>
                    {placement.status === "Active" ? "Đang chạy" : "Tạm dừng"}
                  </span>
                </div>
                {placement.description && <p className="mt-1 truncate text-xs text-white/45">{placement.description}</p>}
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40">
                  <span>{placement.totalViews || 0} lượt xem</span>
                  <span>{placement.totalClicks || 0} lượt nhấp</span>
                  <span>CTR {placement.totalViews ? (((placement.totalClicks || 0) / placement.totalViews) * 100).toFixed(2) : 0}%</span>
                  <span>{placement.positions?.[0]?.position === "pre-room" ? "Trước phòng" : placement.positions?.[0]?.position === "popup" ? "Popup" : "Banner"}</span>
                  {(placement.startDate || placement.endDate) && (
                    <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{placement.startDate ? formatDate(placement.startDate) : "Ngay"} - {placement.endDate ? formatDate(placement.endDate) : "Không giới hạn"}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => editCampaign(placement)} disabled={busy !== ""} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-sm text-white/70 hover:bg-white/[0.04] disabled:opacity-40">
                  <Pencil size={14} /> Sửa
                </button>
                <button type="button" onClick={() => toggleCampaign(placement)} disabled={busy !== ""} className="min-h-9 rounded-lg border border-primary/30 px-3 text-sm font-medium text-primary hover:bg-primary/[0.06] disabled:opacity-40">
                  {busy === `ad-toggle-${placement._id}` ? "Đang xử lý..." : placement.status === "Active" ? "Tạm dừng" : "Kích hoạt"}
                </button>
                <button type="button" onClick={() => toggleCampaignEnabled(placement)} disabled={busy !== ""} className="min-h-9 rounded-lg border border-white/10 px-3 text-sm text-white/65 hover:bg-white/[0.04] disabled:opacity-40">
                  {busy === `ad-enabled-${placement._id}` ? "Đang xử lý..." : placement.isEnabled ? "Khóa phân phối" : "Cho phép phân phối"}
                </button>
                <button type="button" onClick={() => deleteCampaign(placement)} disabled={busy !== ""} className="min-h-9 rounded-lg bg-red-500/10 px-3 text-sm text-red-300 hover:bg-red-500/15 disabled:opacity-40">
                  {busy === `ad-delete-${placement._id}` ? "Đang xóa..." : "Xóa"}
                </button>
              </div>
            </div>
          ))}
          {!placementsQuery.isLoading && !placementsQuery.data?.length && (
            <p className="p-6 text-center text-sm text-white/40">Chưa có chiến dịch quảng cáo.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function AuditLogsTab() {
  const [action, setAction] = useState("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-audit-logs", action],
    queryFn: () => adminApi.getAuditLogs({ limit: 50, action: action || undefined }),
  });

  const labels = {
    LOCK_USER: "Khóa tài khoản",
    UNLOCK_USER: "Mở khóa tài khoản",
    UPDATE_SUBSCRIPTION: "Cập nhật gói",
    RESET_AI_USAGE: "Khôi phục lượt AI",
    FORCE_LEAVE_ROOMS: "Giải phóng phòng",
    CLOSE_ROOM: "Đóng phòng",
    CREATE_ADMIN_ROOM: "Tạo phòng hệ thống",
    CREATE_ROOM_CATEGORY: "Tạo danh mục",
    DELETE_ROOM_CATEGORY: "Xóa danh mục",
    BROADCAST_NOTIFICATION: "Gửi thông báo",
    UPDATE_AD_CONFIG: "Cập nhật quảng cáo",
    CREATE_AD_PLACEMENT: "Tạo chiến dịch",
    UPDATE_AD_PLACEMENT: "Cập nhật chiến dịch",
    TOGGLE_AD_PLACEMENT: "Đổi trạng thái chiến dịch",
    DELETE_AD_PLACEMENT: "Xóa chiến dịch",
    CREATE_BADGE: "Tạo huy hiệu",
    UPDATE_BADGE: "Cập nhật huy hiệu",
    DELETE_BADGE: "Xóa huy hiệu",
    CREATE_STICKER: "Tạo sticker",
    DELETE_STICKER: "Xóa sticker",
    CREATE_PRICING_PLAN: "Tạo gói giá",
    UPDATE_PRICING_PLAN: "Cập nhật gói giá",
    DELETE_PRICING_PLAN: "Xóa gói giá",
    QUICK_UPDATE_PRICING: "Cập nhật nhanh bảng giá",
    RESEED_PRICING_PLANS: "Tạo lại toàn bộ bảng giá",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Nhật ký thao tác quản trị</h2>
          <p className="mt-1 text-xs text-white/40">Lưu người thực hiện, thời gian và đối tượng bị tác động.</p>
        </div>
        <select value={action} onChange={(event) => setAction(event.target.value)} className="app-input max-w-xs">
          <option value="">Tất cả hành động</option>
          {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>

      <div className="stat-card p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-white/45">Đang tải nhật ký...</div>
        ) : isError ? (
          <div className="p-10 text-center">
            <p className="text-sm text-red-300">Không tải được nhật ký quản trị.</p>
            <button type="button" onClick={() => refetch()} className="mt-3 text-sm font-semibold text-primary">Thử lại</button>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.06]">
            {(data?.logs || []).map((log) => (
              <div key={log._id} className="grid gap-2 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{labels[log.action] || log.action}</p>
                  <p className="mt-1 truncate text-xs text-white/45">
                    {log.admin?.displayName || "Admin"}
                    {log.targetLabel ? ` · ${log.targetLabel}` : ""}
                    {log.targetType ? ` · ${log.targetType}` : ""}
                  </p>
                </div>
                <time className="text-xs text-white/35">{new Date(log.createdAt).toLocaleString("vi-VN")}</time>
              </div>
            ))}
            {!data?.logs?.length && <p className="p-10 text-center text-sm text-white/40">Chưa có thao tác nào được ghi nhận.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

function ContentTab() {
  const [categoryName, setCategoryName] = useState("");
  const [badgeForm, setBadgeForm] = useState({
    name: "",
    description: "",
    type: "STREAK",
    threshold: 1,
  });
  const [stickerName, setStickerName] = useState("");
  const [stickerFile, setStickerFile] = useState(null);
  const [busy, setBusy] = useState("");

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories"],
    queryFn: adminApi.getCategories,
  });
  const badgesQuery = useQuery({
    queryKey: ["admin-badges"],
    queryFn: badgeApi.getAll,
  });
  const stickersQuery = useQuery({
    queryKey: ["admin-stickers"],
    queryFn: stickerApi.getAll,
  });

  const perform = async (key, action, successMessage, refresh) => {
    setBusy(key);
    try {
      const result = await action();
      toast.success(result?.message || successMessage);
      await refresh();
    } catch (error) {
      toast.error(error.response?.data?.message || "Thao tác thất bại");
    } finally {
      setBusy("");
    }
  };

  const createCategory = (event) => {
    event.preventDefault();
    const name = categoryName.trim();
    if (!name) return;
    perform(
      "category-create",
      () => adminApi.createCategory({ name }),
      "Đã tạo danh mục",
      async () => {
        setCategoryName("");
        await categoriesQuery.refetch();
      },
    );
  };

  const deleteCategory = async (category) => {
    if (!(await confirmDialog(`Xóa danh mục “${category.name}”?`, { destructive: true }))) return;
    perform(
      `category-${category._id}`,
      () => adminApi.deleteCategory(category._id),
      "Đã xóa danh mục",
      categoriesQuery.refetch,
    );
  };

  const createBadge = (event) => {
    event.preventDefault();
    if (!badgeForm.name.trim() || Number(badgeForm.threshold) < 1) return;
    perform(
      "badge-create",
      () => adminApi.createBadge({ ...badgeForm, threshold: Number(badgeForm.threshold) }),
      "Đã tạo huy hiệu",
      async () => {
        setBadgeForm({ name: "", description: "", type: "STREAK", threshold: 1 });
        await badgesQuery.refetch();
      },
    );
  };

  const deleteBadge = async (badge) => {
    if (!(await confirmDialog(`Xóa huy hiệu “${badge.name}” khỏi hệ thống và các tài khoản đã nhận?`, { destructive: true }))) return;
    perform(
      `badge-${badge._id}`,
      () => adminApi.deleteBadge(badge._id),
      "Đã xóa huy hiệu",
      badgesQuery.refetch,
    );
  };

  const uploadSticker = (event) => {
    event.preventDefault();
    if (!stickerName.trim() || !stickerFile) return;
    const formData = new FormData();
    formData.append("name", stickerName.trim());
    formData.append("file", stickerFile);
    perform(
      "sticker-create",
      () => adminApi.createSticker(formData),
      "Đã tải sticker lên",
      async () => {
        setStickerName("");
        setStickerFile(null);
        event.target.reset();
        await stickersQuery.refetch();
      },
    );
  };

  const deleteSticker = async (sticker) => {
    if (!(await confirmDialog(`Xóa sticker “${sticker.name}”?`, { destructive: true }))) return;
    perform(
      `sticker-${sticker._id}`,
      () => adminApi.deleteSticker(sticker._id),
      "Đã xóa sticker",
      stickersQuery.refetch,
    );
  };

  return (
    <div className="space-y-5">
      <section className="stat-card">
        <div className="mb-4 flex items-center gap-2">
          <Tags size={18} className="text-primary" />
          <div>
            <h2 className="font-semibold">Danh mục phòng</h2>
            <p className="text-xs text-white/40">Dùng khi người dùng tạo và tìm phòng học.</p>
          </div>
        </div>
        <form onSubmit={createCategory} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={categoryName}
            onChange={(event) => setCategoryName(event.target.value)}
            placeholder="Tên danh mục mới"
            maxLength={80}
            className="app-input flex-1"
          />
          <button disabled={busy !== "" || !categoryName.trim()} className="btn-primary min-h-10 px-4 disabled:opacity-40">
            Thêm danh mục
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {(categoriesQuery.data || []).map((category) => (
            <div key={category._id} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm">
              <span>{category.name}</span>
              <button
                type="button"
                onClick={() => deleteCategory(category)}
                disabled={busy !== ""}
                className="text-xs font-semibold text-red-300 hover:text-red-200 disabled:opacity-40"
              >
                Xóa
              </button>
            </div>
          ))}
          {!categoriesQuery.isLoading && !categoriesQuery.data?.length && (
            <p className="text-sm text-white/40">Chưa có danh mục.</p>
          )}
        </div>
      </section>

      <section className="stat-card">
        <div className="mb-4 flex items-center gap-2">
          <Award size={18} className="text-primary" />
          <div>
            <h2 className="font-semibold">Huy hiệu thành tích</h2>
            <p className="text-xs text-white/40">Cấu hình điều kiện mở khóa cho người học.</p>
          </div>
        </div>
        <form onSubmit={createBadge} className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <input
            value={badgeForm.name}
            onChange={(event) => setBadgeForm((current) => ({ ...current, name: event.target.value }))}
            placeholder="Tên huy hiệu"
            className="app-input"
          />
          <select
            value={badgeForm.type}
            onChange={(event) => setBadgeForm((current) => ({ ...current, type: event.target.value }))}
            className="app-input"
          >
            <option value="STREAK">Chuỗi ngày học</option>
            <option value="STUDY_HOURS">Số giờ học</option>
            <option value="TOP_LEARNER">Top người học</option>
            <option value="TOP_STREAK">Top chuỗi ngày</option>
          </select>
          <input
            type="number"
            min="1"
            value={badgeForm.threshold}
            onChange={(event) => setBadgeForm((current) => ({ ...current, threshold: event.target.value }))}
            placeholder="Mốc đạt"
            className="app-input"
          />
          <button disabled={busy !== "" || !badgeForm.name.trim()} className="btn-primary min-h-10 px-4 disabled:opacity-40">
            Tạo huy hiệu
          </button>
          <input
            value={badgeForm.description}
            onChange={(event) => setBadgeForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Mô tả huy hiệu"
            className="app-input md:col-span-2 lg:col-span-4"
          />
        </form>
        <div className="mt-4 grid gap-2 md:grid-cols-2">
          {(badgesQuery.data || []).map((badge) => (
            <div key={badge._id} className="flex items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.025] p-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Award size={17} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{badge.name}</p>
                <p className="text-xs text-white/40">{badge.type} · mốc {badge.threshold}</p>
              </div>
              <button type="button" onClick={() => deleteBadge(badge)} disabled={busy !== ""} className="text-xs font-semibold text-red-300 disabled:opacity-40">
                Xóa
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="stat-card">
        <div className="mb-4 flex items-center gap-2">
          <ImagePlus size={18} className="text-primary" />
          <div>
            <h2 className="font-semibold">Sticker phòng học</h2>
            <p className="text-xs text-white/40">Hỗ trợ PNG, JPG, WebP hoặc GIF.</p>
          </div>
        </div>
        <form onSubmit={uploadSticker} className="grid gap-2 sm:grid-cols-[1fr_1.25fr_auto]">
          <input name="stickerName" value={stickerName} onChange={(event) => setStickerName(event.target.value)} placeholder="Tên sticker" className="app-input" />
          <input name="stickerFile" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(event) => setStickerFile(event.target.files?.[0] || null)} className="app-input file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-2 file:py-1 file:text-primary" />
          <button disabled={busy !== "" || !stickerName.trim() || !stickerFile} className="btn-primary min-h-10 px-4 disabled:opacity-40">
            Tải lên
          </button>
        </form>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {(stickersQuery.data || []).map((sticker) => (
            <div key={sticker._id} className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-2 text-center">
              <img src={sticker.url} alt={sticker.name} loading="lazy" decoding="async" className="mx-auto h-16 w-16 rounded-lg object-contain" />
              <p className="mt-2 truncate text-xs font-medium">{sticker.name}</p>
              <button type="button" onClick={() => deleteSticker(sticker)} disabled={busy !== ""} className="mt-1 text-xs font-semibold text-red-300 disabled:opacity-40">
                Xóa
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function PlansTab() {
  const {
    data: plans,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-plans"],
    queryFn: pricingApi.getPlans,
  });
  const [editing, setEditing] = useState(null); // plan object or "new"

  const empty = {
    name: "",
    description: "",
    price: 0,
    tier: "MONTHLY",
    durationDays: 30,
    isActive: true,
    features: "",
  };

  const save = async (form) => {
    const payload = {
      ...form,
      price: Number(form.price),
      durationDays: Number(form.durationDays),
      features: form.features
        ? form.features
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    };
    try {
      if (form._id) {
        await adminApi.updatePlan(form._id, payload);
      } else {
        await adminApi.createPlan(payload);
      }
      toast.success("Đã lưu gói");
      setEditing(null);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lưu thất bại");
    }
  };

  const remove = async (id) => {
    if (!(await confirmDialog("Xóa gói này?", { destructive: true, confirmText: "Xóa gói" }))) return;
    try {
      await adminApi.deletePlan(id);
      toast.success("Đã xóa gói");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setEditing({ ...empty })}
          className="btn-primary inline-flex items-center gap-2 text-sm"
        >
          <DollarSign size={16} /> Thêm gói mới
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-white/50">Đang tải...</div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {(plans || []).map((p) => (
            <div key={p._id} className="stat-card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-xs text-white/40">
                    {p.tier} · {p.durationDays} ngày
                  </p>
                </div>
                <span className="font-bold text-primary">
                  {formatVND(p.price)}
                </span>
              </div>
              <p className="text-sm text-white/50 mt-2">{p.description}</p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() =>
                    setEditing({
                      ...p,
                      features: (p.features || []).join("\n"),
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-dark-lighter hover:bg-dark text-sm"
                >
                  Sửa
                </button>
                <button
                  onClick={() => remove(p._id)}
                  className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-sm"
                >
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <PlanEditModal
          plan={editing}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}
    </div>
  );
}

function PlanEditModal({ plan, onClose, onSave }) {
  const [form, setForm] = useState(plan);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div
        className="relative bg-dark-card border border-white/10 rounded-2xl p-6 w-full max-w-md text-white animate-scaleIn max-h-[90vh] overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-editor-title"
      >
        <CloseButton
          onClick={onClose}
          label="Đóng cửa sổ chỉnh sửa gói"
          className="absolute right-4 top-4"
        />
        <h2 id="plan-editor-title" className="mb-4 pr-12 text-xl font-bold">
          {form._id ? "Sửa gói" : "Thêm gói mới"}
        </h2>
        <div className="space-y-3">
          <div>
            <label className="block text-sm text-white/60 mb-1">Tên gói</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="app-input"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Mô tả</label>
            <input
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              className="app-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Giá (VND)
              </label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => set("price", e.target.value)}
                className="app-input"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1">
                Số ngày
              </label>
              <input
                type="number"
                value={form.durationDays}
                onChange={(e) => set("durationDays", e.target.value)}
                className="app-input"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">Loại</label>
            <select
              value={form.tier}
              onChange={(e) => set("tier", e.target.value)}
              className="app-input"
            >
              <option value="MONTHLY">MONTHLY</option>
              <option value="YEARLY">YEARLY</option>
              <option value="LIFETIME">LIFETIME</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1">
              Tính năng (mỗi dòng 1 mục)
            </label>
            <textarea
              rows={4}
              value={form.features}
              onChange={(e) => set("features", e.target.value)}
              className="app-input"
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
            />
            Đang kích hoạt
          </label>
        </div>
        <div className="flex gap-3 mt-5">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-dark-lighter hover:bg-dark rounded-lg font-medium"
          >
            Hủy
          </button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 py-2.5 bg-primary hover:bg-primary-dark rounded-lg font-semibold"
          >
            Lưu
          </button>
        </div>
      </div>
    </div>
  );
}

const ADMIN_NAV_GROUPS = [
  {
    label: "Điều hành",
    items: [
      {
        id: "overview",
        label: "Tổng quan",
        description: "Tổng hợp hoạt động học tập và vận hành HOCA",
        icon: LayoutDashboard,
      },
      {
        id: "users",
        label: "Người dùng",
        description: "Tài khoản, gói và quyền truy cập",
        icon: Users,
      },
      {
        id: "rooms",
        label: "Phòng học",
        description: "Phòng đang mở và các phiên học",
        icon: DoorOpen,
      },
    ],
  },
  {
    label: "Kinh doanh",
    items: [
      {
        id: "revenue",
        label: "Doanh thu",
        description: "Doanh thu và giao dịch",
        icon: DollarSign,
      },
      {
        id: "payments",
        label: "Duyệt thanh toán",
        description: "Xác nhận chuyển khoản và cấp gói",
        icon: Receipt,
      },
      {
        id: "plans",
        label: "Gói giá",
        description: "Bảng giá và quyền lợi thành viên",
        icon: Crown,
      },
      {
        id: "operations",
        label: "Vận hành",
        description: "Thông báo và chiến dịch quảng cáo",
        icon: Megaphone,
      },
    ],
  },
  {
    label: "Nội dung & an toàn",
    items: [
      {
        id: "content",
        label: "Nội dung",
        description: "Danh mục, huy hiệu và sticker",
        icon: Tags,
      },
      {
        id: "reports",
        label: "Báo cáo",
        description: "Kiểm duyệt báo cáo vi phạm",
        icon: Flag,
      },
      {
        id: "feedback",
        label: "Đánh giá",
        description: "Phản hồi sau phiên học",
        icon: Star,
      },
      {
        id: "support",
        label: "Hỗ trợ",
        description: "Tiếp nhận và phản hồi ticket người dùng",
        icon: MessageSquare,
      },
    ],
  },
  {
    label: "Hệ thống",
    items: [
      {
        id: "downloads",
        label: "APK Downloads",
        description: "Phân phối và lượt tải ứng dụng",
        icon: Download,
      },
      {
        id: "audit",
        label: "Nhật ký",
        description: "Lịch sử thao tác quản trị",
        icon: ClipboardList,
      },
      {
        id: "system",
        label: "Hệ thống",
        description: "Analytics, cấu hình, giao dịch và cảnh báo",
        icon: Settings2,
      },
    ],
  },
];

const ADMIN_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap((group) => group.items);
const ADMIN_TAB_ITEMS = ADMIN_NAV_ITEMS.filter((item) => !item.path);

function AdminTabContent({ tab, onSelectTab, userFilter }) {
  const panels = {
    overview: <OverviewTab onSelectTab={onSelectTab} />,
    users: <UsersTab userFilter={userFilter} onSelectTab={onSelectTab} />,
    rooms: <RoomsTab />,
    content: <ContentTab />,
    operations: <OperationsTab />,
    revenue: <RevenueTab />,
    payments: <AdminPaymentsPage embedded />,
    plans: <PlansTab />,
    downloads: <DownloadsTab />,
    reports: <ReportsTab onSelectTab={onSelectTab} />,
    feedback: <FeedbackTab />,
    support: <SupportTicketsTab />,
    audit: <AuditLogsTab />,
    system: <Suspense fallback={<div className="space-y-3">{[0, 1, 2].map((item) => <div key={item} className="skeleton h-32 rounded-2xl" />)}</div>}><AdminSystemTools /></Suspense>,
  };

  return panels[tab] ?? panels.overview;
}

export default function AdminPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const requestedTab = searchParams.get("tab") || "overview";
  const tab = ADMIN_TAB_ITEMS.some((item) => item.id === requestedTab)
    ? requestedTab
    : "overview";
  const activeItem =
    ADMIN_TAB_ITEMS.find((item) => item.id === tab) ?? ADMIN_TAB_ITEMS[0];

  const selectTab = (nextTab, options = {}) => {
    const nextParams = new URLSearchParams(searchParams);
    if (nextTab === "overview") nextParams.delete("tab");
    else nextParams.set("tab", nextTab);
    if (nextTab === "users" && options.userFilter) nextParams.set("userFilter", options.userFilter);
    else nextParams.delete("userFilter");
    setSearchParams(nextParams);
  };

  if (user && user.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto w-full max-w-[1500px] px-4 py-6 text-white sm:px-6 lg:px-8 lg:py-8">
      <div className="lg:grid lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="hidden lg:block" aria-label="Điều hướng quản trị">
          <div className="sticky top-24 overflow-hidden rounded-2xl border border-white/10 bg-[#15192b]/95 shadow-2xl shadow-black/10 backdrop-blur">
            <div className="border-b border-white/10 px-5 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  <Crown size={20} />
                </div>
                <div>
                  <p className="font-bold leading-tight">HOCA Admin</p>
                  <p className="mt-1 text-xs text-white/45">
                    Trung tâm vận hành
                  </p>
                </div>
              </div>
            </div>

            <nav className="space-y-5 px-3 py-4">
              {ADMIN_NAV_GROUPS.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/35">
                    {group.label}
                  </p>
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = item.id === tab;
                      const itemClassName = `group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70 ${
                        isActive
                          ? "bg-primary/12 text-white shadow-[inset_3px_0_0_#ff8800]"
                          : "text-white/55 hover:bg-white/[0.045] hover:text-white"
                      }`;
                      const itemContent = (
                        <>
                          <Icon
                            size={17}
                            className={
                              isActive
                                ? "text-primary"
                                : "text-white/40 transition group-hover:text-white/70"
                            }
                          />
                          <span>{item.label}</span>
                        </>
                      );

                      return item.path ? (
                        <Link key={item.id} to={item.path} className={itemClassName}>
                          {itemContent}
                        </Link>
                      ) : (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectTab(item.id)}
                          aria-current={isActive ? "page" : undefined}
                          className={itemClassName}
                        >
                          {itemContent}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            <div className="border-t border-white/10 px-5 py-4">
              <div className="flex items-center gap-2 text-xs text-white/45">
                <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.55)]" />
                Quyền quản trị đang hoạt động
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-5 lg:hidden">
            <div className="min-w-0 flex-1">
              <label htmlFor="admin-section" className="sr-only">
                Chọn khu vực quản trị
              </label>
              <select
                id="admin-section"
                value={tab}
                onChange={(event) => {
                  const item = ADMIN_NAV_ITEMS.find((candidate) => candidate.id === event.target.value);
                  if (item?.path) navigate(item.path);
                  else selectTab(event.target.value);
                }}
                className="app-input h-11 font-medium"
              >
                {ADMIN_NAV_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          </div>

          <header className="mb-7 border-b border-white/10 pb-6">
            <div>
              <div className="min-w-0">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Admin Console / {activeItem.label}
                </p>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  {activeItem.label}
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-white/50">
                  {activeItem.description}
                </p>
              </div>
            </div>
          </header>

          <AdminTabContent tab={tab} onSelectTab={selectTab} userFilter={searchParams.get("userFilter") || ""} />
        </main>
      </div>
    </div>
  );
}
