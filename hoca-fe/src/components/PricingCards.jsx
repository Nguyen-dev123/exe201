import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Crown } from "lucide-react";
import { pricingApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";
import { formatVND } from "../lib/format";

const FREE_FEATURES = [
  "Tham gia phòng học công khai",
  "Học tối đa 3 giờ/ngày",
  "Hệ thống Streak & Badges cơ bản",
  "Bảng xếp hạng cộng đồng",
  "AI Assistant không giới hạn",
];

const POPULAR_TIER = "YEARLY";

export default function PricingCards() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const { data: plans, isLoading } = useQuery({
    queryKey: ["pricing-plans"],
    queryFn: pricingApi.getPlans,
  });

  const activePlans = (plans || []).filter((p) => p.isActive !== false);
  const currentTier = user?.subscriptionTier || "FREE";

  return (
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
        <button
          onClick={() => navigate(user ? "/rooms" : "/register")}
          className="w-full py-2.5 text-center rounded-lg border border-white/15 hover:bg-white/5 transition text-sm"
        >
          {currentTier === "FREE"
            ? "Gói hiện tại"
            : user
              ? "Vào học ngay"
              : "Bắt đầu miễn phí"}
        </button>
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
                onClick={() => navigate("/pricing")}
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
  );
}
