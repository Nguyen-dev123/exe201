import { useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  CheckCircle,
  Crown,
  Gift,
  Loader2,
  Receipt,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
} from "lucide-react";
import { adminApi, paymentApi, pricingApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";
import { formatVND, timeAgo } from "../lib/format";
import Avatar from "../components/Avatar";
import { confirmDialog } from "../lib/dialog";

export default function AdminPaymentsPage({ embedded = false }) {
  const { user } = useAuthStore();
  const [confirming, setConfirming] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [granting, setGranting] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [note, setNote] = useState("");

  const {
    data: pendingData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["admin-pending-payments"],
    queryFn: paymentApi.listPending,
    refetchInterval: 10000,
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["pricing-plans"],
    queryFn: pricingApi.getPlans,
  });

  const {
    data: usersData,
    isFetching: usersFetching,
  } = useQuery({
    queryKey: ["admin-payment-users", userSearch],
    queryFn: () => adminApi.getUsers({ search: userSearch.trim(), limit: 8 }),
    enabled: userSearch.trim().length >= 2,
  });

  const activePlans = useMemo(
    () => plans.filter((plan) => plan.isActive !== false),
    [plans],
  );

  const selectedPlan = activePlans.find((plan) => plan._id === selectedPlanId);

  if (user && user.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleConfirm = async (txnRef, name) => {
    if (!(await confirmDialog(`Xác nhận đã nhận tiền cho đơn "${name}" (${txnRef})?`, { confirmText: "Xác nhận thanh toán" })))
      return;

    setConfirming(txnRef);
    try {
      await paymentApi.confirm(txnRef);
      toast.success("Đã xác nhận và kích hoạt gói!");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Xác nhận thất bại");
    } finally {
      setConfirming(null);
    }
  };

  const handleDelete = async (txnRef, name) => {
    if (!(await confirmDialog(`Xóa đơn chờ xác nhận "${name}" (${txnRef})?`, { destructive: true, confirmText: "Xóa đơn" }))) return;

    setDeleting(txnRef);
    try {
      await paymentApi.deletePending(txnRef);
      toast.success("Đã xóa đơn chờ xác nhận");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa đơn thất bại");
    } finally {
      setDeleting(null);
    }
  };

  const handleGrantPlan = async (e) => {
    e.preventDefault();

    if (!selectedUser || !selectedPlanId) {
      toast.error("Chọn người dùng và gói cần cấp");
      return;
    }

    setGranting(true);
    try {
      await paymentApi.grantPlan({
        userId: selectedUser._id,
        planId: selectedPlanId,
        note: note.trim(),
      });
      toast.success(`Đã cấp ${selectedPlan?.name || "gói"} cho ${selectedUser.displayName}`);
      setSelectedUser(null);
      setSelectedPlanId("");
      setUserSearch("");
      setNote("");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Cấp gói thất bại");
    } finally {
      setGranting(false);
    }
  };

  const pending = pendingData || [];
  const users = usersData?.users || [];

  return (
    <div className={embedded ? "text-white" : "max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white"}>
      <div className={`flex items-center justify-between ${embedded ? "mb-4" : "mb-6"}`}>
        {embedded ? (
          <p className="text-sm text-white/45">Danh sách đơn tự cập nhật mỗi 10 giây</p>
        ) : (
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Receipt className="text-primary" /> Xác nhận thanh toán
            </h1>
            <p className="text-white/50 mt-1">
              Duyệt chuyển khoản hoặc cấp gói thủ công cho học viên
            </p>
          </div>
        )}
        <button
          onClick={() => refetch()}
          className="p-2.5 rounded-lg bg-dark-lighter hover:bg-dark-card transition"
          title="Làm mới"
        >
          <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
        </button>
      </div>

      <form onSubmit={handleGrantPlan} className="stat-card mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Gift className="text-primary" size={22} /> Cấp gói thủ công
            </h2>
            <p className="text-sm text-white/45 mt-1">
              Admin chọn học viên và gói, hệ thống tự ghi nhận giao dịch hoàn tất.
            </p>
          </div>
          {selectedPlan && (
            <div className="pill bg-primary/15 text-primary self-start">
              {selectedPlan.name} · {formatVND(selectedPlan.price)}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-[1.25fr_1fr] gap-4">
          <div>
            <label className="block text-sm text-white/60 mb-2">
              Tìm học viên
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                size={18}
              />
              <input
                value={userSearch}
                onChange={(e) => {
                  setUserSearch(e.target.value);
                  setSelectedUser(null);
                }}
                placeholder="Nhập tên hoặc email..."
                className="app-input pl-10"
              />
            </div>

            <div className="mt-3 rounded-lg border border-white/10 bg-dark/35 overflow-hidden min-h-[88px]">
              {selectedUser ? (
                <div className="flex items-center gap-3 p-3">
                  <Avatar user={selectedUser} size={40} ring={false} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {selectedUser.displayName}
                    </p>
                    <p className="text-xs text-white/45 truncate">
                      {selectedUser.email || "Chưa có email"} ·{" "}
                      {selectedUser.subscriptionTier || "FREE"}
                    </p>
                  </div>
                  <span className="pill bg-green-500/15 text-green-400">
                    <UserCheck size={13} /> Đã chọn
                  </span>
                </div>
              ) : userSearch.trim().length < 2 ? (
                <div className="p-4 text-sm text-white/40">
                  Nhập ít nhất 2 ký tự để tìm học viên.
                </div>
              ) : usersFetching ? (
                <div className="p-4 text-sm text-white/45 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" /> Đang tìm...
                </div>
              ) : users.length === 0 ? (
                <div className="p-4 text-sm text-white/40">
                  Không tìm thấy học viên phù hợp.
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {users.map((u) => (
                    <button
                      key={u._id}
                      type="button"
                      onClick={() => {
                        setSelectedUser(u);
                        setUserSearch(u.email || u.displayName);
                      }}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition"
                    >
                      <Avatar user={u} size={36} ring={false} />
                      <span className="flex-1 min-w-0">
                        <span className="block font-medium truncate">
                          {u.displayName}
                        </span>
                        <span className="block text-xs text-white/45 truncate">
                          {u.email || "Chưa có email"} · {u.subscriptionTier}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm text-white/60 mb-2">
                Chọn gói
              </label>
              <select
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="app-input"
                disabled={plansLoading}
              >
                <option value="">Chọn gói cần cấp</option>
                {activePlans.map((plan) => (
                  <option key={plan._id} value={plan._id}>
                    {plan.name} - {formatVND(plan.price)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">
                Ghi chú
              </label>
              <textarea
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="VD: Đã nhận chuyển khoản riêng, tặng gói..."
                className="app-input resize-none"
              />
            </div>
            <button
              type="submit"
              disabled={granting || !selectedUser || !selectedPlanId}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-primary hover:bg-primary-dark font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {granting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Crown size={18} />
              )}
              Cấp gói cho học viên
            </button>
          </div>
        </div>
      </form>

      <div className="stat-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold">Đơn đang chờ xác nhận</h2>
            <p className="text-sm text-white/45 mt-1">
              Đối chiếu nội dung chuyển khoản và số tiền trước khi duyệt.
            </p>
          </div>
          <span className="pill bg-white/10 text-white/60">
            {pending.length} đơn
          </span>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-white/50">Đang tải...</div>
        ) : pending.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            <CheckCircle className="mx-auto mb-2 opacity-40" size={32} />
            Không có đơn nào đang chờ xác nhận
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {pending.map((t) => (
              <div
                key={t._id}
                className="flex items-center justify-between py-4 gap-4"
              >
                <div className="min-w-0">
                  <p className="font-medium truncate">
                    {t.user?.displayName || "-"}{" "}
                    <span className="text-white/40 text-sm">
                      ({t.user?.email || "không có email"})
                    </span>
                  </p>
                  <p className="text-sm text-white/50">
                    {t.plan?.name || "Gói HOCA+"} · {formatVND(t.amount)}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Nội dung CK:{" "}
                    <span className="text-primary font-mono">{t.txnRef}</span>{" "}
                    · {timeAgo(t.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() =>
                      handleConfirm(t.txnRef, t.plan?.name || "Gói HOCA+")
                    }
                    disabled={confirming === t.txnRef || deleting === t.txnRef}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500/15 text-green-400 hover:bg-green-500/25 rounded-lg transition disabled:opacity-50"
                  >
                    {confirming === t.txnRef ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <CheckCircle size={16} />
                    )}
                    Xác nhận
                  </button>
                  <button
                    onClick={() =>
                      handleDelete(t.txnRef, t.plan?.name || "Gói HOCA+")
                    }
                    disabled={confirming === t.txnRef || deleting === t.txnRef}
                    className="flex items-center gap-2 px-3 py-2 bg-red-500/15 text-red-400 hover:bg-red-500/25 rounded-lg transition disabled:opacity-50"
                    title="Xóa đơn chờ xác nhận"
                  >
                    {deleting === t.txnRef ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                    Xóa
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
