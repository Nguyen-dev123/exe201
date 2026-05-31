import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { paymentApi, userApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";

export default function PaymentResultPage({ status }) {
  const [params] = useSearchParams();
  const { setUser } = useAuthStore();
  const [state, setState] = useState(
    status === "success" ? "verifying" : "failed",
  );

  useEffect(() => {
    if (status !== "success") return;
    // PayOS appends orderCode to the return URL
    const orderCode = params.get("orderCode");
    if (!orderCode) {
      setState("failed");
      return;
    }
    paymentApi
      .verify(orderCode)
      .then(async () => {
        setState("success");
        // refresh user so the new tier shows up everywhere
        try {
          const fresh = await userApi.getMe();
          setUser(fresh);
        } catch {
          /* ignore */
        }
      })
      .catch(() => setState("failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 text-white">
      <div className="stat-card max-w-md w-full text-center py-10">
        {state === "verifying" && (
          <>
            <Loader2
              size={56}
              className="text-primary mx-auto mb-4 animate-spin"
            />
            <h1 className="text-2xl font-bold mb-2">
              Đang xác nhận thanh toán
            </h1>
            <p className="text-white/50">Vui lòng đợi trong giây lát...</p>
          </>
        )}

        {state === "success" && (
          <>
            <CheckCircle size={56} className="text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">Thanh toán thành công!</h1>
            <p className="text-white/60 mb-6">
              Chúc mừng bạn đã nâng cấp HOCA+. Tận hưởng học tập không giới hạn
              nhé!
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/dashboard" className="btn-primary">
                Về tổng quan
              </Link>
              <Link to="/rooms" className="btn-secondary">
                Vào phòng học
              </Link>
            </div>
          </>
        )}

        {state === "failed" && (
          <>
            <XCircle size={56} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold mb-2">
              Thanh toán chưa hoàn tất
            </h1>
            <p className="text-white/60 mb-6">
              Giao dịch đã bị hủy hoặc chưa được xác nhận. Bạn có thể thử lại.
            </p>
            <div className="flex gap-3 justify-center">
              <Link to="/pricing" className="btn-primary">
                Thử lại
              </Link>
              <Link to="/dashboard" className="btn-secondary">
                Về tổng quan
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
