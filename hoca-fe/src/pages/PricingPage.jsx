import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Crown } from "lucide-react";
import { pricingApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";
import { formatVND, getTierInfo } from "../lib/format";
import QRPaymentModal from "../components/QRPaymentModal";

const FREE_FEATURES = [
  "Tham gia phòng học công khai",
  "Học tối đa 3 giờ/ngày",
  "Hệ thống Streak & Badges cơ bản",
  "Bảng xếp hạng cộng đồng",
  "AI Assistant không giới hạn",
];

const POPULAR_TIER = "YEARLY";

export default function PricingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [qrPlan, setQrPlan] = useState(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["pricing-plans"],
    queryFn: pricingApi.getPlans,
  });

  const activePlans = (plans || []).filter((p) => p.isActive !== false);

  const handleBuy = (plan) => {
    if (!user) {
      navigate("/login");
      return;
    }
    setQrPlan(plan);
  };

  const currentTier = user?.subscriptionTier || "FREE";

  return (
    <div className="bg-dark text-white min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Nâng cấp <span className="gradient-text">HOCA+</span>
          </h1>
          <p className="text-white/60 text-lg">
            Mở khóa toàn bộ tiềm năng học tập của bạn
          </p>
          {user && (
            <p className="mt-3 text-sm text-white/50">
              Gói hiện tại:{" "}
              <span className={getTierInfo(currentTier).color}>
                {getTierInfo(currentTier).label}
              </span>
            </p>
          )}
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
          {/* Free plan */}
          <div className="bg-dark-card border border-white/10 rounded-2xl p-6">
            <h3 className="text-xl font-bold mb-1">Miễn phí</h3>
            <p className="text-white/50 text-sm mb-4">Bắt đầu hành trình</p>
            <div className="mb-6">
              <span className="text-4xl font-bold">0đ</span>
            </div>
            <ul className="space-y-3 mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check
                    size={16}
                    className="text-green-500 flex-shrink-0 mt-0.5"
                  />
                  <span className="text-white/70">{f}</span>
                </li>
              ))}
            </ul>
            <div className="w-full py-2.5 text-center rounded-lg border border-white/15 text-white/50 text-sm">
              {currentTier === "FREE" ? "Gói hiện tại" : "Cơ bản"}
            </div>
          </div>

          {/* Dynamic paid plans */}
          {isLoading ? (
            <div className="col-span-3 text-center py-12 text-white/50">
              Đang tải các gói...
            </div>
          ) : activePlans.length === 0 ? (
            <div className="col-span-3 bg-dark-card border border-white/10 rounded-2xl p-8 text-center text-white/50">
              Chưa có gói trả phí nào. Vui lòng quay lại sau.
            </div>
          ) : (
            activePlans.map((plan) => {
              const popular = plan.tier === POPULAR_TIER;
              const isCurrent = currentTier === plan.tier;
              return (
                <div
                  key={plan._id}
                  className={`relative rounded-2xl p-6 ${
                    popular
                      ? "bg-gradient-to-br from-orange-900/30 to-yellow-900/20 border-2 border-primary"
                      : "bg-dark-card border border-white/10"
                  }`}
                >
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-bold uppercase">
                        Phổ biến
                      </span>
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-1 flex items-center gap-2">
                    <Crown size={18} className="text-primary" />
                    {plan.name}
                  </h3>
                  <p className="text-white/50 text-sm mb-4 line-clamp-2">
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <span className="text-3xl font-bold gradient-text">
                      {formatVND(plan.price)}
                    </span>
                    {plan.durationDays > 0 && (
                      <span className="text-white/50 text-sm">
                        {" "}
                        / {plan.durationDays} ngày
                      </span>
                    )}
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {(plan.features || []).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check
                          size={16}
                          className="text-primary flex-shrink-0 mt-0.5"
                        />
                        <span className="text-white/80">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    disabled={isCurrent}
                    onClick={() => handleBuy(plan)}
                    className={`w-full py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                      isCurrent
                        ? "bg-white/10 text-white/40 cursor-not-allowed"
                        : "bg-primary hover:bg-primary-dark text-white"
                    }`}
                  >
                    {isCurrent ? "Đang sử dụng" : "Nâng cấp ngay"}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <p className="text-center text-white/40 text-sm mt-10">
          Thanh toán bằng cách quét mã QR và chuyển khoản ngân hàng. Gói được
          kích hoạt sau khi xác nhận thanh toán.
        </p>
      </div>

      {qrPlan && (
        <QRPaymentModal plan={qrPlan} onClose={() => setQrPlan(null)} />
      )}
    </div>
  );
}
