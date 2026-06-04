import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
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
} from "lucide-react";
import { adminApi, pricingApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";
import { formatVND, minutesToHours, formatDate } from "../lib/format";

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="stat-card">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${color}`}
      >
        <Icon size={22} />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-sm text-white/50">{label}</div>
    </div>
  );
}

function OverviewTab() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: adminApi.getStats,
  });
  const { data: revenue } = useQuery({
    queryKey: ["admin-revenue"],
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
        />
        <StatCard
          icon={DoorOpen}
          label="Tổng số phòng"
          value={stats?.totalRooms ?? 0}
          color="bg-green-500/15 text-green-400"
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
        />
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

function UsersTab() {
  const [search, setSearch] = useState("");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-users", search],
    queryFn: () => adminApi.getUsers({ search, limit: 20 }),
  });

  const act = async (fn, id, label) => {
    try {
      await fn(id);
      toast.success(label);
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Thao tác thất bại");
    }
  };

  return (
    <div>
      <div className="relative max-w-sm mb-4">
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

      <div className="stat-card p-0 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12 text-white/50">Đang tải...</div>
        ) : (
          <div className="divide-y divide-white/5">
            {(data?.users || []).map((u) => (
              <div key={u._id} className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white font-bold overflow-hidden">
                  {u.avatar ? (
                    <img
                      src={u.avatar}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    u.displayName?.[0]?.toUpperCase() || "U"
                  )}
                </div>
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
                  <p className="text-xs text-white/40">
                    {minutesToHours(u.totalStudyMinutes)}h học ·{" "}
                    {u.subscriptionTier}
                  </p>
                </div>
                {u.role !== "ADMIN" && (
                  <div className="flex gap-1">
                    <button
                      onClick={() =>
                        act(
                          adminApi.lockUser,
                          u._id,
                          u.isLocked ? "Đã mở khóa" : "Đã khóa user",
                        )
                      }
                      className="p-2 rounded-lg bg-dark-lighter hover:bg-dark text-white/70"
                      title={u.isLocked ? "Mở khóa" : "Khóa"}
                    >
                      {u.isLocked ? <Unlock size={16} /> : <Lock size={16} />}
                    </button>
                  </div>
                )}
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
    </div>
  );
}

function RoomsTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: () => adminApi.getRooms({ limit: 20 }),
  });

  const close = async (id) => {
    try {
      await adminApi.closeRoom(id);
      toast.success("Đã đóng phòng");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Thất bại");
    }
  };

  return (
    <div className="stat-card p-0 overflow-hidden">
      {isLoading ? (
        <div className="text-center py-12 text-white/50">Đang tải...</div>
      ) : (
        <div className="divide-y divide-white/5">
          {(data?.rooms || []).map((r) => (
            <div key={r._id} className="flex items-center gap-3 p-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{r.name}</p>
                <p className="text-xs text-white/40">
                  {r.owner?.displayName || "—"} ·{" "}
                  {r.activeParticipants?.length || 0} người · {r.roomType}
                </p>
              </div>
              {r.reportCount > 0 && (
                <span className="pill bg-red-500/15 text-red-400">
                  {r.reportCount} báo cáo
                </span>
              )}
              <button
                onClick={() => close(r._id)}
                className="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 text-sm"
              >
                Đóng
              </button>
            </div>
          ))}
          {data?.rooms?.length === 0 && (
            <div className="text-center py-12 text-white/40">
              Không có phòng hoạt động
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function RevenueTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-revenue-detail"],
    queryFn: () => adminApi.getRevenue({ timeframe: "all" }),
  });

  if (isLoading)
    return <div className="text-center py-12 text-white/50">Đang tải...</div>;

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

function ReportsTab() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-reports"],
    queryFn: () => adminApi.getReports(),
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

  return (
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
    if (!window.confirm("Xóa gói này?")) return;
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
      <div className="bg-dark-card border border-white/10 rounded-2xl p-6 w-full max-w-md text-white animate-scaleIn max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">
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

export default function AdminPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState("overview");

  if (user && user.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  const tabs = [
    { id: "overview", label: "Tổng quan", icon: LayoutDashboard },
    { id: "users", label: "Người dùng", icon: Users },
    { id: "rooms", label: "Phòng học", icon: DoorOpen },
    { id: "revenue", label: "Doanh thu", icon: DollarSign },
    { id: "plans", label: "Gói giá", icon: Crown },
    { id: "reports", label: "Báo cáo", icon: Flag },
    { id: "feedback", label: "Đánh giá", icon: Star },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Quản trị HOCA</h1>
        <Link
          to="/admin/payments"
          className="px-4 py-2 rounded-lg bg-dark-lighter hover:bg-dark-card text-sm flex items-center gap-2"
        >
          <Receipt size={16} /> Duyệt thanh toán
        </Link>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
              tab === t.id
                ? "bg-primary text-white"
                : "text-white/60 hover:text-white hover:bg-dark-lighter"
            }`}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab />}
      {tab === "rooms" && <RoomsTab />}
      {tab === "revenue" && <RevenueTab />}
      {tab === "plans" && <PlansTab />}
      {tab === "reports" && <ReportsTab />}
      {tab === "feedback" && <FeedbackTab />}
    </div>
  );
}
