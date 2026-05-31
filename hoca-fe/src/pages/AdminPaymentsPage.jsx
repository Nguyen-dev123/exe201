import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { CheckCircle, RefreshCw, Receipt, Loader2 } from "lucide-react";
import { paymentApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";
import { formatVND, timeAgo } from "../lib/format";

export default function AdminPaymentsPage() {
  const { user } = useAuthStore();
  const [confirming, setConfirming] = useState(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["admin-pending-payments"],
    queryFn: paymentApi.listPending,
    refetchInterval: 10000,
  });

  if (user && user.role !== "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  const handleConfirm = async (txnRef, name) => {
    if (!window.confirm(`Xác nhận đã nhận tiền cho đơn "${name}" (${txnRef})?`))
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

  const pending = data || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Receipt className="text-primary" /> Xác nhận thanh toán
          </h1>
          <p className="text-white/50 mt-1">
            Các đơn chuyển khoản đang chờ xác nhận
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="p-2.5 rounded-lg bg-dark-lighter hover:bg-dark-card transition"
          title="Làm mới"
        >
          <RefreshCw size={18} className={isFetching ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="stat-card">
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
                    {t.user?.displayName || "—"}{" "}
                    <span className="text-white/40 text-sm">
                      ({t.user?.email})
                    </span>
                  </p>
                  <p className="text-sm text-white/50">
                    {t.plan?.name} · {formatVND(t.amount)}
                  </p>
                  <p className="text-xs text-white/40 mt-0.5">
                    Nội dung CK:{" "}
                    <span className="text-primary font-mono">{t.txnRef}</span> ·{" "}
                    {timeAgo(t.createdAt)}
                  </p>
                </div>
                <button
                  onClick={() => handleConfirm(t.txnRef, t.plan?.name)}
                  disabled={confirming === t.txnRef}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500/15 text-green-400 hover:bg-green-500/25 rounded-lg transition disabled:opacity-50 flex-shrink-0"
                >
                  {confirming === t.txnRef ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <CheckCircle size={16} />
                  )}
                  Xác nhận
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-white/40 text-sm mt-4">
        Mẹo: Mở app ngân hàng để đối chiếu nội dung chuyển khoản (CK) và số tiền
        trước khi xác nhận.
      </p>
    </div>
  );
}
