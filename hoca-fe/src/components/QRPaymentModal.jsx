import { useEffect, useState, useRef } from "react";
import { X, Copy, CheckCircle, Loader2, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { paymentApi, userApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";
import { formatVND } from "../lib/format";

export default function QRPaymentModal({ plan, onClose }) {
  const { setUser } = useAuthStore();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [paid, setPaid] = useState(false);
  const pollRef = useRef(null);

  // Create the QR order on open
  useEffect(() => {
    let active = true;
    paymentApi
      .createQR(plan._id)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((err) =>
        setError(err.response?.data?.message || "Không tạo được mã QR"),
      );
    return () => {
      active = false;
    };
  }, [plan._id]);

  // Poll payment status every 4s
  useEffect(() => {
    if (!data?.memo || paid) return;
    pollRef.current = setInterval(async () => {
      try {
        const res = await paymentApi.qrStatus(data.memo);
        if (res.status === "COMPLETED") {
          clearInterval(pollRef.current);
          setPaid(true);
          try {
            const fresh = await userApi.getMe();
            setUser(fresh);
          } catch {
            /* ignore */
          }
          toast.success("Thanh toán thành công! Đã nâng cấp gói.");
        }
      } catch {
        /* ignore */
      }
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [data, paid, setUser]);

  const copy = (text, label) => {
    navigator.clipboard.writeText(String(text));
    toast.success(`Đã copy ${label}`);
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card border border-white/10 rounded-2xl w-full max-w-md text-white animate-scaleIn relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
          <X size={20} />
        </button>

        {paid ? (
          <div className="p-8 text-center">
            <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Thanh toán thành công!</h2>
            <p className="text-white/60 mb-6">
              Gói {plan.name} đã được kích hoạt. Cảm ơn bạn!
            </p>
            <button onClick={onClose} className="btn-primary w-full">
              Hoàn tất
            </button>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <X size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Có lỗi xảy ra</h2>
            <p className="text-white/60 mb-6">{error}</p>
            <button onClick={onClose} className="btn-secondary w-full">
              Đóng
            </button>
          </div>
        ) : !data ? (
          <div className="p-12 text-center">
            <Loader2 size={40} className="text-primary mx-auto animate-spin" />
            <p className="text-white/50 mt-4">Đang tạo mã QR...</p>
          </div>
        ) : (
          <div className="p-6">
            <h2 className="text-xl font-bold text-center mb-1">
              Quét mã để thanh toán
            </h2>
            <p className="text-center text-white/50 text-sm mb-4">
              {plan.name} · {formatVND(data.amount)}
            </p>

            {/* QR */}
            <div className="bg-white rounded-xl p-3 w-56 mx-auto mb-4">
              <img
                src={data.qrUrl}
                alt="QR thanh toán"
                className="w-full h-full"
              />
            </div>

            {/* Bank info */}
            <div className="space-y-2 text-sm bg-dark-lighter rounded-xl p-4 mb-4">
              <Row label="Ngân hàng" value={data.bankId} />
              <Row
                label="Số tài khoản"
                value={data.accountNo}
                onCopy={() => copy(data.accountNo, "số tài khoản")}
              />
              <Row label="Chủ tài khoản" value={data.accountName} />
              <Row
                label="Số tiền"
                value={formatVND(data.amount)}
                onCopy={() => copy(data.amount, "số tiền")}
                highlight
              />
              <Row
                label="Nội dung CK"
                value={data.memo}
                onCopy={() => copy(data.memo, "nội dung")}
                highlight
              />
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-yellow-400 bg-yellow-500/10 rounded-lg py-2.5 mb-3">
              <Clock size={16} className="animate-pulse" />
              Đang chờ thanh toán... Tài khoản tự nâng cấp sau khi xác nhận.
            </div>

            <p className="text-xs text-white/40 text-center">
              Vui lòng chuyển <b className="text-white/70">đúng số tiền</b> và
              giữ nguyên <b className="text-white/70">nội dung chuyển khoản</b>{" "}
              để hệ thống xác nhận nhanh nhất.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, onCopy, highlight }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-white/50">{label}</span>
      <div className="flex items-center gap-2">
        <span className={highlight ? "font-bold text-primary" : "font-medium"}>
          {value}
        </span>
        {onCopy && (
          <button
            onClick={onCopy}
            className="text-white/40 hover:text-white"
            title="Copy"
          >
            <Copy size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
