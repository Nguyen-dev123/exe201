import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Home,
  Play,
} from "lucide-react";
import { paymentApi, userApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";

export default function PaymentResultPage({ status }) {
  const [params] = useSearchParams();
  const { setUser } = useAuthStore();
  const [state, setState] = useState(
    status === "success" ? "verifying" : "failed",
  );
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (status !== "success") return;

    // PayOS redirects back with orderCode (+ status/cancel) on the return URL.
    const orderCode = params.get("orderCode");
    const cancelled =
      params.get("cancel") === "true" || params.get("status") === "CANCELLED";

    if (!orderCode || cancelled) {
      setState("failed");
      return;
    }

    // Retry up to 5 times with increasing delay (webhook may still be processing)
    let retries = 0;
    const maxRetries = 5;
    const attemptVerify = async () => {
      try {
        const payment = await paymentApi.publicPayosStatus(orderCode);
        if (payment.status === "COMPLETED") {
          setState("success");
          setShowConfetti(true);
          // refresh user so the new tier shows up everywhere
          try {
            const fresh = await userApi.getMe();
            setUser(fresh);
          } catch { /* ignore */ }
          return;
        }
        if (payment.status === "PENDING" && retries < maxRetries) {
          retries++;
          const delay = 2000 * retries; // 2s, 4s, 6s, 8s, 10s
          setTimeout(attemptVerify, delay);
          return;
        }
        setState("failed");
      } catch {
        if (retries < maxRetries) {
          retries++;
          setTimeout(attemptVerify, 2000 * retries);
        } else {
          setState("failed");
        }
      }
    };
    attemptVerify();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 text-white relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#14182a] via-[#1a1d2e] to-[#14182a] animate-gradientShift bg-[length:200%_200%]"></div>

      {/* Confetti effect for success */}
      {showConfetti && <ConfettiEffect />}

      {/* Content card */}
      <div className="relative max-w-lg w-full">
        {/* Glow background */}
        <div className="absolute -inset-1 bg-gradient-to-r from-primary via-purple-500 to-primary rounded-3xl blur-2xl opacity-20 animate-pulse-slow"></div>

        {/* Main card */}
        <div className="relative bg-gradient-to-br from-[#1e2139] to-[#252837] border border-white/10 rounded-3xl p-10 text-center shadow-2xl backdrop-blur-xl animate-scaleIn">
          {state === "verifying" && (
            <>
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse-slow"></div>
                <Loader2
                  size={64}
                  className="relative text-primary mx-auto animate-spin"
                />
              </div>
              <h1 className="text-3xl font-bold mb-3">
                Đang xác nhận thanh toán
              </h1>
              <p className="text-white/60 leading-relaxed">
                Vui lòng đợi trong giây lát...
              </p>
              <div className="flex justify-center gap-1.5 mt-6">
                <div className="w-2.5 h-2.5 rounded-full bg-primary typing-dot"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-primary typing-dot"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-primary typing-dot"></div>
              </div>
            </>
          )}

          {state === "success" && (
            <>
              {/* Success icon with glow */}
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-green-500/30 blur-3xl rounded-full animate-pulse-slow"></div>
                <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center mx-auto shadow-2xl animate-scaleIn">
                  <CheckCircle size={64} className="text-white" />
                </div>
              </div>

              <div className="mb-8">
                <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-300 via-green-400 to-green-500 bg-clip-text text-transparent animate-fadeIn">
                  Thanh toán thành công! 🎉
                </h1>
                <p className="text-white/70 text-lg leading-relaxed max-w-md mx-auto">
                  Chúc mừng bạn đã nâng cấp{" "}
                  <span className="font-bold text-primary">HOCA+</span>. Tận
                  hưởng học tập không giới hạn nhé!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/dashboard"
                  className="group relative overflow-hidden rounded-xl px-8 py-4 font-semibold transition-all hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-orange-600 transition-transform group-hover:scale-110"></div>
                  <div className="relative flex items-center justify-center gap-2 text-white">
                    <Home size={20} />
                    Về tổng quan
                  </div>
                </Link>
                <Link
                  to="/rooms"
                  className="group px-8 py-4 rounded-xl font-semibold border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-primary/50 transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                >
                  <Play
                    size={20}
                    className="group-hover:text-primary transition-colors"
                  />
                  Vào phòng học
                </Link>
              </div>
            </>
          )}

          {state === "failed" && (
            <>
              {/* Error icon with glow */}
              <div className="relative inline-block mb-6">
                <div className="absolute inset-0 bg-red-500/20 blur-3xl rounded-full"></div>
                <div className="relative w-28 h-28 rounded-full bg-red-500/10 border-4 border-red-500/30 flex items-center justify-center mx-auto">
                  <XCircle size={64} className="text-red-400" />
                </div>
              </div>

              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">
                  Thanh toán chưa hoàn tất
                </h1>
                <p className="text-white/60 leading-relaxed max-w-md mx-auto">
                  Giao dịch đã bị hủy hoặc chưa được xác nhận. Bạn có thể thử
                  lại.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/pricing"
                  className="group relative overflow-hidden rounded-xl px-8 py-4 font-semibold transition-all hover:scale-105 active:scale-95"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-primary to-orange-600 transition-transform group-hover:scale-110"></div>
                  <div className="relative flex items-center justify-center gap-2 text-white">
                    Thử lại
                  </div>
                </Link>
                <Link
                  to="/dashboard"
                  className="px-8 py-4 rounded-xl font-semibold border-2 border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                >
                  <Home size={20} />
                  Về tổng quan
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* Confetti animation effect */
function ConfettiEffect() {
  const colors = [
    "#ff8c00",
    "#ffa733",
    "#4a90e2",
    "#9b59b6",
    "#2ecc71",
    "#e74c3c",
  ];
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 2,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 opacity-0 animate-fadeIn"
          style={{
            left: `${piece.left}%`,
            top: "-20px",
            backgroundColor: piece.color,
            animation: `confettiFall ${piece.duration}s ease-in forwards`,
            animationDelay: `${piece.delay}s`,
            borderRadius: Math.random() > 0.5 ? "50%" : "0",
          }}
        />
      ))}
      <style>
        {`
          @keyframes confettiFall {
            0% {
              transform: translateY(0) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(${Math.random() * 720}deg);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
}
