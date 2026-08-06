import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Check, Crown, Zap, Shield, Star, Infinity } from "lucide-react";
import { pricingApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";
import { formatVND, getTierInfo } from "../lib/format";
import QRPaymentModal from "../components/QRPaymentModal";
import {
  FREE_PLAN_CONTENT,
  getPlanContent,
} from "../lib/pricingContent";

const POPULAR_TIER = "YEARLY";

// Thứ tự hiển thị các gói: Free -> Tháng -> Năm -> Vĩnh viễn
const TIER_ORDER = { MONTHLY: 1, YEARLY: 2, LIFETIME: 3 };

const PLAN_THEMES = {
  FREE: { icon: Zap, gradient: "from-gray-500 to-gray-600", accent: "text-gray-400", bg: "bg-gray-500/10", border: "border-gray-500/30" },
  MONTHLY: { icon: Shield, gradient: "from-blue-500 to-cyan-500", accent: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  YEARLY: { icon: Crown, gradient: "from-primary to-orange-500", accent: "text-primary", bg: "bg-primary/10", border: "border-primary/50" },
  LIFETIME: { icon: Infinity, gradient: "from-amber-500 to-yellow-500", accent: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30" },
};

export default function PricingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [qrPlan, setQrPlan] = useState(null);

  const { data: plans, isLoading } = useQuery({
    queryKey: ["pricing-plans"],
    queryFn: pricingApi.getPlans,
  });

  const activePlans = (plans || [])
    .filter((p) => p.isActive !== false)
    .sort((a, b) => (TIER_ORDER[a.tier] ?? 99) - (TIER_ORDER[b.tier] ?? 99));

  const handleBuy = (plan) => {
    if (!user) {
      navigate("/login");
      return;
    }
    const content = getPlanContent(plan.tier);
    setQrPlan(content ? { ...plan, ...content } : plan);
  };

  const currentTier = user?.subscriptionTier || "FREE";

  const calculateMonthly = (price, days) => {
    if (days <= 0) return null; // lifetime
    const perDay = price / days;
    return Math.round(perDay * 30);
  };

  return (
    <div className="bg-dark text-white min-h-screen py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Chọn gói{" "}
            <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
              HOCA+
            </span>{" "}
            phù hợp với bạn
          </h1>
          <p className="text-white/60 text-lg max-w-2xl mx-auto">
            Bắt đầu miễn phí, nâng cấp khi cần. Mở khóa Smart Discussion,
            AI Thư ký, nền ảo và không giới hạn thời gian học.
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          {/* ────── FREE PLAN ────── */}
          <div className="bg-dark-card border border-white/10 rounded-2xl p-6 flex flex-col hover:border-white/20 transition-colors">
            <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium mb-4 ${PLAN_THEMES.FREE.bg} ${PLAN_THEMES.FREE.accent}`}>
              <Zap size={12} /> Miễn phí
            </div>
            <h3 className="text-xl font-bold mb-1">{FREE_PLAN_CONTENT.name}</h3>
            <p className="text-white/50 text-sm mb-4 h-10">
              {FREE_PLAN_CONTENT.description}
            </p>
            <div className="mb-1">
              <span className="text-4xl font-bold">0đ</span>
              <span className="text-white/40 text-sm">/tháng</span>
            </div>
            <p className="text-xs text-white/30 mb-6">Miễn phí trọn đời</p>
            <ul className="space-y-2.5 mb-6 flex-grow">
              {FREE_PLAN_CONTENT.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check
                    size={15}
                    className="text-green-500 flex-shrink-0 mt-0.5"
                  />
                  <span className="text-white/70">{f}</span>
                </li>
              ))}
            </ul>
            <div className="w-full py-2.5 text-center rounded-lg border border-white/15 text-white/50 text-sm mt-auto">
              {currentTier === "FREE" ? "✓ Gói hiện tại" : "Bắt đầu miễn phí"}
            </div>
          </div>

          {/* ────── PAID PLANS ────── */}
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
              const content = getPlanContent(plan.tier);
              const theme = PLAN_THEMES[plan.tier] || PLAN_THEMES.MONTHLY;
              const popular = plan.tier === POPULAR_TIER;
              const isCurrent = currentTier === plan.tier;
              const Icon = theme.icon;
              const monthlyEquiv = calculateMonthly(plan.price, plan.durationDays);

              return (
                <div
                  key={plan._id}
                  className={`relative rounded-2xl p-6 flex flex-col transition-all ${
                    popular
                      ? "bg-gradient-to-b from-dark-card to-dark-card border-2 border-primary scale-[1.02] shadow-xl shadow-primary/10"
                      : "bg-dark-card border border-white/10 hover:border-white/20"
                  }`}
                >
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5">
                        <Star size={12} /> Đáng chọn nhất
                      </span>
                    </div>
                  )}

                  {/* Badge */}
                  <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium mb-4 ${theme.bg} ${theme.accent}`}>
                    <Icon size={12} /> {content?.eyebrow || plan.tier}
                  </div>

                  <h3 className="text-xl font-bold mb-1">{content?.name || plan.name}</h3>
                  <p className="text-white/50 text-sm mb-4 h-10 line-clamp-2">
                    {content?.description || plan.description}
                  </p>

                  {/* Price */}
                  <div className="mb-1">
                    <span className={`text-4xl font-bold bg-gradient-to-r ${theme.gradient} bg-clip-text text-transparent`}>
                      {formatVND(plan.price)}
                    </span>
                  </div>
                  {plan.durationDays > 0 ? (
                    <div className="mb-6">
                      <span className="text-white/40 text-sm">
                        / {plan.durationDays === 365 ? "năm" : `${plan.durationDays} ngày`}
                      </span>
                      {monthlyEquiv && (
                        <span className="ml-2 text-xs text-white/30">
                          ≈ {formatVND(monthlyEquiv)}/tháng
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="mb-6">
                      <span className="text-white/40 text-sm">/ trọn đời</span>
                      <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[11px] font-medium">
                        <Infinity size={10} /> Một lần duy nhất
                      </span>
                    </div>
                  )}

                  {/* Features */}
                  <ul className="space-y-2.5 mb-6 flex-grow">
                    {(content?.features || plan.features || []).map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check
                          size={15}
                          className={`flex-shrink-0 mt-0.5 ${popular ? "text-primary" : theme.accent}`}
                        />
                        <span className="text-white/80">{f}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    disabled={isCurrent}
                    onClick={() => handleBuy(plan)}
                    className={`w-full py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2 mt-auto ${
                      isCurrent
                        ? "bg-white/10 text-white/40 cursor-not-allowed"
                        : popular
                          ? "bg-gradient-to-r from-primary to-orange-500 hover:from-primary-dark hover:to-orange-600 text-white shadow-lg shadow-primary/25"
                          : `bg-white/5 hover:bg-white/10 text-white border ${theme.border}`
                    }`}
                  >
                    {isCurrent ? (
                      "✓ Gói hiện tại"
                    ) : plan.tier === "MONTHLY" ? (
                      <>
                        <Shield size={16} /> Nâng cấp HOCA+ 30 ngày
                      </>
                    ) : plan.tier === "YEARLY" ? (
                      <>
                        <Crown size={16} /> Chọn gói tiết kiệm
                      </>
                    ) : (
                      <>
                        <Infinity size={16} /> Sở hữu trọn đời
                      </>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-14 space-y-4">
          <div className="flex items-center justify-center gap-8 text-sm text-white/40">
            <span className="flex items-center gap-1.5">
              <Shield size={14} className="text-green-500" /> Bảo mật thanh toán
            </span>
            <span className="flex items-center gap-1.5">
              <Check size={14} className="text-green-500" /> Kích hoạt ngay lập tức
            </span>
            <span className="flex items-center gap-1.5">
              <Zap size={14} className="text-green-500" /> Hủy bất kỳ lúc nào
            </span>
          </div>
          <p className="text-white/30 text-sm">
            Thanh toán bằng cách quét mã QR và chuyển khoản ngân hàng.
            Gói được kích hoạt sau khi xác nhận thanh toán.
          </p>
        </div>
      </div>

      {qrPlan && (
        <QRPaymentModal plan={qrPlan} onClose={() => setQrPlan(null)} />
      )}
    </div>
  );
}
