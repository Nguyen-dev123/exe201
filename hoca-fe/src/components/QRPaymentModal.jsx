import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { paymentApi } from "../lib/services";
import { formatVND } from "../lib/format";

export default function QRPaymentModal({ plan, onClose }) {
  // Auto-redirect to PayOS immediately (no method choosing)
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    paymentApi
      .createPayment(plan._id)
      .then((d) => {
        if (!active) return;
        if (d?.url) {
          // Redirect to PayOS hosted checkout
          window.location.href = d.url;
        } else {
          setError("Không tạo được liên kết thanh toán.");
        }
      })
      .catch((err) => {
        if (!active) return;
        setError(
          err.response?.data?.message ||
            "Cổng thanh toán PayOS hiện chưa sẵn sàng.",
        );
      });
    return () => {
      active = false;
    };
  }, [plan._id]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Glow effect background */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-3xl blur-xl opacity-20 animate-pulse-slow pointer-events-none"></div>

        {/* Main card */}
        <div className="relative bg-gradient-to-br from-[#1e2139] to-[#252837] border border-white/10 rounded-2xl p-8 text-white animate-scaleIn overflow-hidden">
          {/* Decorative gradient overlay */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none z-0"></div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-30 text-white/70 hover:text-white bg-black/40 hover:bg-white/15 rounded-full p-2 transition-all duration-300 backdrop-blur-sm"
            aria-label="Đóng"
          >
            <X size={20} />
          </button>

          {/* Content */}
          <div className="relative z-10">
            {error ? (
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-red-500/20 blur-2xl rounded-full"></div>
                  <div className="relative w-20 h-20 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center mx-auto">
                    <X size={40} className="text-red-400" />
                  </div>
                </div>
                <h2 className="text-xl font-bold mb-3">Không thể thanh toán</h2>
                <p className="text-white/60 mb-8 max-w-xs mx-auto leading-relaxed">
                  {error}
                </p>
                <button onClick={onClose} className="btn-secondary w-full">
                  Đóng
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-pulse-slow"></div>
                  <Loader2
                    size={48}
                    className="relative text-primary mx-auto animate-spin"
                  />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  Đang kết nối PayOS...
                </h3>
                <p className="text-white/50 text-sm mb-1">{plan.name}</p>
                <p className="text-xl font-bold gradient-text mb-4">
                  {formatVND(plan.price)}
                </p>
                <div className="flex justify-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary/60 typing-dot"></div>
                  <div className="w-2 h-2 rounded-full bg-primary/60 typing-dot"></div>
                  <div className="w-2 h-2 rounded-full bg-primary/60 typing-dot"></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
