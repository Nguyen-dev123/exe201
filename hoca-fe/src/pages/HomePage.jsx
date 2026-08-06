import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/authStore";
import { publicApi, reactionApi } from "../lib/services";
import PricingCards from "../components/PricingCards";
import {
  Users,
  Target,
  TrendingUp,
  Award,
  Clock,
  Shield,
  FileText,
  CheckCircle,
  XCircle,
  Heart,
  ChevronDown,
  Flag,
  ArrowRight,
  Play,
  DoorOpen,
  Flame,
  Video,
} from "lucide-react";

const FOCUS_PRESETS = [25, 50, 90];

export default function HomePage() {
  const { user } = useAuthStore();
  const ctaTarget = user ? "/rooms" : "/register";
  const hasPremiumAccess =
    user?.role === "ADMIN" ||
    (user?.subscriptionTier && user.subscriptionTier !== "FREE");

  const {
    data: platform,
    isLoading: platformLoading,
    isError: platformError,
  } = useQuery({
    queryKey: ["public-platform-stats"],
    queryFn: publicApi.getPlatformStats,
    refetchInterval: 15000,
    staleTime: 10000,
    retry: 1,
  });
  return (
    <div className="text-white">
      <section className="home-hero relative flex min-h-[calc(100dvh-4rem)] items-center overflow-hidden border-b border-white/5">
        <div className="home-hero-light pointer-events-none absolute inset-0" />
        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-12 px-4 py-12 sm:px-6 md:py-16 lg:grid-cols-[0.94fr_1.06fr] lg:gap-14 lg:px-8 lg:py-20">
          <div className="home-hero-copy">
            <div className="home-hero-kicker flex items-center gap-2 text-sm font-bold uppercase tracking-[0.12em] text-primary">
              <Video size={17} aria-hidden="true" />
              Phòng học chung trực tuyến
            </div>
            <h1
              className="mt-7 max-w-2xl text-5xl font-black leading-[0.98] tracking-[-0.055em] sm:text-6xl lg:text-[3.55rem] xl:text-[4.15rem]"
              aria-label="Học một mình, nhưng không còn cô đơn."
            >
              <span className="home-hero-line block" aria-hidden="true">
                <span className="home-hero-word" style={{ "--word-index": 0 }}>Học</span>
                <span className="home-hero-word" style={{ "--word-index": 1 }}>một</span>
                <span className="home-hero-word" style={{ "--word-index": 2 }}>mình,</span>
              </span>
              <span className="home-hero-line mt-2 block text-primary" aria-hidden="true">
                <span className="home-hero-word" style={{ "--word-index": 3 }}>nhưng</span>
                <span className="home-hero-word" style={{ "--word-index": 4 }}>không</span>
                <span className="home-hero-word" style={{ "--word-index": 5 }}>còn</span>
                <span className="home-hero-word" style={{ "--word-index": 6 }}>cô</span>
                <span className="home-hero-word" style={{ "--word-index": 7 }}>đơn.</span>
              </span>
            </h1>
            <p className="home-hero-description mt-6 max-w-xl text-lg leading-8 text-white/65">
              Tham gia phòng học cùng bạn bè, bật Pomodoro và cùng nhau duy trì
              sự tập trung, dù mỗi người đang ở một nơi.
            </p>
            <div className="home-hero-actions mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Link
                to={ctaTarget}
                className="group inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-6 font-semibold text-[#18100A] transition hover:bg-primary-light active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
              >
                <Users size={19} className="transition-transform group-hover:scale-105" aria-hidden="true" />
                Tham gia phòng học
              </Link>
              <Link
                to={user ? "/rooms?create=1" : "/register"}
                className="group inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/15 px-6 font-semibold text-white/85 transition hover:border-primary/55 hover:text-primary active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                Tạo phòng riêng
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <LivePlatformStatus
            platform={platform}
            isLoading={platformLoading}
            isError={platformError}
            user={user}
          />
        </div>
      </section>

      <HowItWorksSection />

      <section id="features" className="scroll-mt-20 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="group/features relative overflow-hidden rounded-2xl border border-white/10 bg-[#171B2E]/65 px-5 py-10 shadow-[0_26px_80px_rgba(5,7,18,0.28),inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-500 hover:border-primary/25 hover:shadow-[0_30px_90px_rgba(5,7,18,0.36),0_0_50px_rgba(255,140,0,0.055),inset_0_1px_0_rgba(255,255,255,0.055)] sm:px-8 sm:py-12 lg:px-10">
            <div
              className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-primary/[0.07] blur-3xl transition duration-700 group-hover/features:bg-primary/[0.105]"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-40 -left-32 h-80 w-80 rounded-full bg-primary/[0.035] blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute bottom-10 right-0 top-10 w-px bg-gradient-to-b from-transparent via-primary/70 to-transparent"
              aria-hidden="true"
            />

          <div className="relative mx-auto mb-14 max-w-3xl text-center">
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Tại sao chọn HOCA?
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Tính năng nổi bật
            </h2>
            <p className="mt-4 text-base leading-7 text-white/55 sm:text-lg">
              Phòng học, công cụ tập trung và hệ thống thành tích được kết nối
              trong cùng một ứng dụng.
            </p>
          </div>

          <div className="relative grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;
              const target = feature.premium
                ? hasPremiumAccess
                  ? feature.to
                  : "/pricing"
                : feature.requiresAuth && !user
                  ? "/register"
                  : feature.to;

              return (
                <Link
                  key={feature.title}
                  to={target}
                  className="card-feature group block min-h-56 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  aria-label={`${feature.title}: ${feature.description}`}
                >
                  <div
                    className={`icon-container mb-5 ${feature.iconBackground} ${feature.iconColor}`}
                  >
                    <Icon size={24} strokeWidth={2} aria-hidden="true" />
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xl font-bold">{feature.title}</h3>
                      <p className="mt-2 leading-7 text-white/55">
                        {feature.description}
                      </p>
                    </div>
                    <ArrowRight
                      size={18}
                      className="mt-1 shrink-0 text-white/20 transition group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
          </div>
        </div>
      </section>

      {/* Pricing Section - 4 columns */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Gói Nâng Cấp HOCA+
            </h2>
            <p className="text-white/60 text-lg">
              Chọn gói phù hợp với nhu cầu học tập của bạn
            </p>
          </div>

          {/* Pricing cards component - reuse from PricingPage */}
          <PricingCards />
        </div>
      </section>

      <CommunityPromiseSection />

      <StudyStartSection user={user} platform={platform} />
    </div>
  );
}

function LivePlatformStatus({ platform, isLoading, isError, user }) {
  const [focusMinutes, setFocusMinutes] = useState(25);
  const [isFlameActive, setIsFlameActive] = useState(false);
  const activeRooms = platform?.activeRooms ?? 0;
  const onlineUsers = platform?.onlineUsers ?? 0;
  const totalStudyMinutes = platform?.totalStudyMinutes ?? 0;
  const totalStudyValue =
    totalStudyMinutes >= 60
      ? Math.floor(totalStudyMinutes / 60)
      : totalStudyMinutes;
  const totalStudyUnit = totalStudyMinutes >= 60 ? "giờ học" : "phút học";
  const hasActiveRooms = activeRooms > 0;
  const actionTarget = user
    ? `/rooms?create=1&timer=${focusMinutes}`
    : "/register";

  return (
    <div
      className="home-study-room overflow-hidden rounded-2xl border border-white/10 bg-[#111527]/95 shadow-[0_28px_90px_rgba(7,9,20,0.38)]"
      aria-label="Hoạt động thực tế trên HOCA"
    >
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => setIsFlameActive((current) => !current)}
            aria-pressed={isFlameActive}
            aria-label={
              isFlameActive
                ? "Bỏ yêu thích nhịp học tập"
                : "Yêu thích nhịp học tập"
            }
            title={isFlameActive ? "Bỏ yêu thích" : "Yêu thích"}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition active:scale-[0.96] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#111527] ${
              isFlameActive
                ? "bg-primary/15 text-primary"
                : "bg-white/[0.04] text-white/35 hover:bg-primary/[0.08] hover:text-primary/70"
            }`}
          >
            <Flame
              size={20}
              fill={isFlameActive ? "currentColor" : "none"}
              className={isFlameActive ? "scale-105" : ""}
              aria-hidden="true"
            />
          </button>
          <div className="min-w-0">
            <p className="font-bold">HOCA</p>
            <p className="mt-0.5 truncate text-xs text-white/40">
              Nhịp học tập đang diễn ra trên hệ thống
            </p>
          </div>
        </div>
        <div className={`flex shrink-0 items-center gap-2 text-xs font-semibold ${isError ? "text-white/45" : "text-primary"}`}>
          <span
            className={`h-2 w-2 rounded-full ${isError ? "bg-white/30" : "home-live-indicator bg-primary"}`}
            aria-hidden="true"
          />
          {isError ? "Mất kết nối" : "Đang hoạt động"}
        </div>
      </div>

      {isLoading ? (
        <div className="p-5 sm:p-6" aria-label="Đang tải hoạt động HOCA">
          <div className="grid items-center gap-6 sm:grid-cols-[0.8fr_1.2fr]">
            <div className="skeleton mx-auto h-44 w-44 rounded-full" />
            <div>
              <div className="skeleton h-7 w-4/5" />
              <div className="skeleton mt-4 h-16 w-full" />
              <div className="skeleton mt-5 h-11 w-40" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3 border-t border-white/10 pt-5">
            {[0, 1, 2].map((item) => <div key={item} className="skeleton h-14 w-full" />)}
          </div>
        </div>
      ) : (
        <>
          <div className="grid items-center gap-7 px-5 py-7 sm:grid-cols-[0.82fr_1.18fr] sm:px-7 sm:py-8">
            <div className="flex flex-col items-center justify-center">
              <div
                className="home-focus-orbit"
                aria-label={`Pomodoro ${focusMinutes} phút`}
              >
                <div className="home-focus-core">
                  <Clock size={21} className="text-primary" aria-hidden="true" />
                  <strong
                    key={focusMinutes}
                    className="home-focus-time mt-2 text-4xl font-black tracking-[-0.05em] text-white"
                    aria-live="polite"
                  >
                    {focusMinutes}:00
                  </strong>
                  <span className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/40">
                    Nhịp tập trung
                  </span>
                </div>
              </div>
              <div
                className="home-focus-presets mt-4"
                role="group"
                aria-label="Chọn thời lượng tập trung"
              >
                {FOCUS_PRESETS.map((minutes) => (
                  <button
                    key={minutes}
                    type="button"
                    className={focusMinutes === minutes ? "is-active" : ""}
                    aria-pressed={focusMinutes === minutes}
                    onClick={() => setFocusMinutes(minutes)}
                  >
                    {minutes} phút
                  </button>
                ))}
              </div>
            </div>

            <div className="text-center sm:text-left">
              <p className="text-xs font-semibold text-primary">
                {hasActiveRooms ? "Có phòng đang học" : "Sẵn sàng khi bạn bắt đầu"}
              </p>
              <h2 className="mt-2 text-2xl font-bold leading-tight tracking-[-0.025em] sm:text-3xl">
                {isError
                  ? "Kết nối lại với cộng đồng học tập"
                  : hasActiveRooms
                    ? `${activeRooms} phòng đang tập trung`
                    : "Bắt đầu một phiên học cùng nhau"}
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/50">
                {isError
                  ? "Bạn vẫn có thể mở danh sách phòng và tiếp tục học."
                  : hasActiveRooms
                    ? `Tham gia phòng đang mở hoặc tạo phiên ${focusMinutes} phút của riêng bạn.`
                    : `Mở Pomodoro ${focusMinutes} phút, mời bạn bè và hoàn thành mục tiêu hôm nay.`}
              </p>
              <Link
                to={actionTarget}
                className="group mt-5 inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 text-sm font-semibold text-[#18100A] transition hover:bg-primary-light active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
              >
                <Play size={16} fill="currentColor" aria-hidden="true" />
                Bắt đầu {focusMinutes} phút
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="home-live-metrics grid grid-cols-3 border-t border-white/10 bg-white/[0.018]">
            <LiveMetric icon={DoorOpen} value={activeRooms} label="phòng đang mở" isError={isError} />
            <LiveMetric icon={Users} value={onlineUsers} label="người trực tuyến" isError={isError} />
            <LiveMetric icon={Clock} value={totalStudyValue} label={`${totalStudyUnit} đã học`} isError={isError} />
          </div>
        </>
      )}
    </div>
  );
}

function LiveMetric({ icon: Icon, value, label, isError }) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-3 py-4 sm:px-5">
      <span className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/[0.08] text-primary sm:flex">
        <Icon size={17} aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <p className="text-xl font-bold tabular-nums text-white">
          <CountUp value={value} isError={isError} />
        </p>
        <p className="mt-0.5 truncate text-[11px] text-white/40">{label}</p>
      </div>
    </div>
  );
}

function CountUp({ value, isError = false }) {
  const elementRef = useRef(null);
  const previousValueRef = useRef(0);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return undefined;
    if (isError) {
      element.textContent = "--";
      return undefined;
    }

    const target = Math.max(0, Number(value) || 0);
    const start = previousValueRef.current;
    previousValueRef.current = target;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || start === target) {
      element.textContent = target.toLocaleString("vi-VN");
      return undefined;
    }

    const duration = 720;
    const startedAt = performance.now();
    let frameId;
    const update = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (target - start) * eased);
      element.textContent = current.toLocaleString("vi-VN");
      if (progress < 1) frameId = window.requestAnimationFrame(update);
    };
    frameId = window.requestAnimationFrame(update);
    return () => window.cancelAnimationFrame(frameId);
  }, [isError, value]);

  return (
    <span
      ref={elementRef}
      aria-label={isError ? "Không có dữ liệu" : Number(value || 0).toLocaleString("vi-VN")}
    />
  );
}

const howItWorksSteps = [
  {
    icon: Users,
    title: "Chọn hoặc tạo phòng",
    description: "Học công khai với cộng đồng hoặc tạo phòng riêng cùng bạn bè.",
  },
  {
    icon: Target,
    title: "Đặt mục tiêu phiên học",
    description: "Chọn 25 hoặc 50 phút và ghi rõ việc bạn muốn hoàn thành.",
  },
  {
    icon: Award,
    title: "Tập trung cùng nhau",
    description: "Hoàn thành phiên học, nhận XP và duy trì chuỗi học mỗi ngày.",
  },
];

function HowItWorksSection() {
  return (
    <section id="study-journey" className="scroll-mt-20 border-b border-white/5 bg-white/[0.018] py-14 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="group/how relative overflow-hidden rounded-2xl border border-white/10 bg-[#171B2E]/80 px-5 py-8 shadow-[0_24px_70px_rgba(5,7,18,0.26),inset_0_1px_0_rgba(255,255,255,0.035)] transition duration-500 hover:border-primary/25 hover:shadow-[0_28px_80px_rgba(5,7,18,0.34),0_0_45px_rgba(255,140,0,0.055),inset_0_1px_0_rgba(255,255,255,0.05)] sm:px-8 sm:py-10 lg:px-10">
          <div
            className="pointer-events-none absolute -left-28 -top-28 h-72 w-72 rounded-full bg-primary/[0.075] blur-3xl transition duration-700 group-hover/how:bg-primary/[0.11]"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/55 to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-8 left-0 top-8 w-px bg-gradient-to-b from-transparent via-primary/70 to-transparent"
            aria-hidden="true"
          />

          <div className="relative grid gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.12em] text-primary">Cách HOCA hoạt động</p>
              <h2 className="mt-4 max-w-md text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-4xl">
                Bắt đầu một phiên học chỉ trong 3 bước.
              </h2>
            </div>

            <div className="divide-y divide-white/10 border-y border-white/10">
              {howItWorksSteps.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="group/step grid gap-4 rounded-xl border border-transparent px-3 py-5 transition duration-300 hover:border-primary/15 hover:bg-primary/[0.035] sm:grid-cols-[auto_0.7fr_1.3fr] sm:items-center sm:gap-5"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-primary/10 bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition duration-300 group-hover/step:border-primary/30 group-hover/step:bg-primary/15 group-hover/step:shadow-[0_0_24px_rgba(255,140,0,0.12)]">
                    <Icon size={21} strokeWidth={2} aria-hidden="true" />
                  </span>
                  <h3 className="font-bold transition-colors group-hover/step:text-primary-light sm:text-lg">{title}</h3>
                  <p className="max-w-lg text-sm leading-6 text-white/55 transition-colors group-hover/step:text-white/70">{description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const features = [
  {
    icon: Users,
    title: "Phòng học ảo",
    description:
      "Học cùng bạn bè trong phòng video công khai hoặc riêng tư.",
    to: "/rooms",
    requiresAuth: true,
    iconBackground: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    icon: Target,
    title: "Chuỗi học tập",
    description: "Duy trì động lực với streak ghi nhận theo từng ngày học.",
    to: "/dashboard",
    requiresAuth: true,
    iconBackground: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
  {
    icon: TrendingUp,
    title: "Bảng xếp hạng",
    description: "Theo dõi thứ hạng và cùng cộng đồng duy trì nhịp học.",
    to: "/leaderboard",
    iconBackground: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    icon: Award,
    title: "Huy hiệu thành tích",
    description: "Mở khóa huy hiệu khi hoàn thành những cột mốc quan trọng.",
    to: "/badges",
    requiresAuth: true,
    iconBackground: "bg-violet-500/10",
    iconColor: "text-violet-400",
  },
  {
    icon: Video,
    title: "Phông nền ảo",
    description: "Làm mờ hoặc thay nền video để không gian học gọn gàng hơn.",
    to: "/rooms?feature=virtual-background",
    premium: true,
    iconBackground: "bg-blue-500/10",
    iconColor: "text-blue-400",
  },
  {
    icon: Clock,
    title: "Mục tiêu học tập",
    description: "Đặt mục tiêu hằng ngày và theo dõi thời gian đã hoàn thành.",
    to: "/dashboard",
    requiresAuth: true,
    iconBackground: "bg-emerald-500/10",
    iconColor: "text-emerald-400",
  },
];

// eslint-disable-next-line no-unused-vars
const missionSteps = [
  {
    icon: Users,
    title: "Chọn phòng học",
    description: "Vào phòng đang mở hoặc tạo một phòng phù hợp.",
  },
  {
    icon: Target,
    title: "Đặt Pomodoro",
    description: "Chọn nhịp 25, 50 hoặc 90 phút cho phiên học.",
  },
  {
    icon: Clock,
    title: "Bắt đầu học",
    description: "Bật bộ đếm và tập trung cùng những người trong phòng.",
  },
  {
    icon: Award,
    title: "Ghi nhận tiến bộ",
    description: "Nhận XP, duy trì streak và mở khóa thành tích.",
  },
];

const journeySteps = [
  {
    icon: FileText,
    title: "Chọn việc cần hoàn thành",
    description: "Viết một mục tiêu đủ rõ để biết khi nào bạn đã làm xong.",
  },
  {
    icon: Target,
    title: "Cam kết một phiên học",
    description: "Dành trọn một khoảng thời gian cho đúng mục tiêu đã chọn.",
  },
  {
    icon: Users,
    title: "Giữ nhịp cùng nhau",
    description: "Sự hiện diện của mọi người giúp bạn ít bỏ cuộc giữa chừng.",
  },
  {
    icon: CheckCircle,
    title: "Khép lại bằng kết quả",
    description: "Đánh dấu việc đã làm và lưu lại một bước tiến có thật.",
  },
];

function useSectionReveal(sectionRef) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    if (!("IntersectionObserver" in window)) {
      section.classList.add("is-visible");
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.12 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, [sectionRef]);
}

// eslint-disable-next-line no-unused-vars
function MissionPreview({ activeStep, user, platform }) {
  return (
    <div
      key={activeStep}
      className="mission-preview-content flex min-h-[250px] flex-col justify-between rounded-2xl border border-primary/25 bg-[#171B2E] p-6 sm:p-8"
      aria-live="polite"
    >
      {activeStep === 0 && (
        <>
          <div>
            <Users size={24} className="text-primary" aria-hidden="true" />
            <p className="mt-5 text-sm font-medium text-white/55">
              Không gian học phù hợp
            </p>
            <div className="mt-3 text-4xl font-bold tracking-tight">
              {platform?.activeRooms > 0
                ? `${platform.activeRooms} phòng đang mở`
                : "Chọn hoặc tạo phòng"}
            </div>
          </div>
          <p className="mt-6 text-sm text-white/60">
            Vào phòng công khai để học cùng mọi người hoặc tạo phòng riêng với
            bạn bè.
          </p>
        </>
      )}

      {activeStep === 1 && (
        <>
          <div>
            <Target size={24} className="text-primary" aria-hidden="true" />
            <p className="mt-5 text-sm font-medium text-white/55">
              Chọn thời lượng tập trung
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {[25, 50, 90].map((minutes) => (
                <div
                  key={minutes}
                  className={`rounded-xl border px-3 py-4 text-center ${
                    minutes === 25
                      ? "border-primary/50 bg-primary/[0.08] text-primary"
                      : "border-white/10 text-white/55"
                  }`}
                >
                  <span className="block text-2xl font-bold">{minutes}</span>
                  <span className="mt-1 block text-xs">phút</span>
                </div>
              ))}
            </div>
          </div>
          <p className="mt-6 text-sm text-white/60">
            Bạn có thể chọn nhịp ngắn hoặc dài theo việc cần hoàn thành.
          </p>
        </>
      )}

      {activeStep === 2 && (
        <>
          <div>
            <Clock size={24} className="text-primary" aria-hidden="true" />
            <p className="mt-5 text-sm font-medium text-white/55">
              Pomodoro tập trung
            </p>
            <div className="mt-2 font-mono text-6xl font-bold tracking-tight">
              25:00
            </div>
          </div>
          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="text-white/60">25 phút học</span>
            <span className="text-primary">5 phút nghỉ</span>
          </div>
        </>
      )}

      {activeStep === 3 && (
        <>
          <div>
            <Award size={24} className="text-primary" aria-hidden="true" />
            <p className="mt-5 text-sm font-medium text-white/55">
              Tiến bộ được ghi nhận
            </p>
            {user ? (
              <div className="mt-5 grid grid-cols-2 gap-5">
                <div>
                  <div className="text-4xl font-bold">{user.xp || 0}</div>
                  <div className="mt-2 text-sm text-white/55">XP hiện có</div>
                </div>
                <div className="border-l border-white/10 pl-5">
                  <div className="text-4xl font-bold">
                    {user.currentStreak || 0}
                  </div>
                  <div className="mt-2 text-sm text-white/55">ngày streak</div>
                </div>
              </div>
            ) : (
              <div className="mt-5 text-4xl font-bold tracking-tight">
                XP + Streak
              </div>
            )}
          </div>
          <p className="mt-6 text-sm text-white/60">
            Mỗi phiên học hoàn thành đều góp vào hành trình của bạn.
          </p>
        </>
      )}
    </div>
  );
}

function JourneyPreview({ activeStep }) {
  const previews = [
    {
      icon: FileText,
      label: "Mục tiêu của phiên này",
      title: "Hoàn thành chương 3 môn Giải tích",
      note: "Một mục tiêu cụ thể giúp phiên học có điểm kết thúc rõ ràng.",
    },
    {
      icon: Target,
      label: "Lời cam kết với bản thân",
      title: "Tập trung vào một việc",
      note: "Tạm gác thông báo và những việc chưa cần xử lý trong phiên này.",
    },
    {
      icon: Users,
      label: "Không học một mình",
      title: "Cùng giữ nhịp đến cuối phiên",
      note: "Mỗi người có một mục tiêu riêng, nhưng cùng chia sẻ một khoảng tập trung.",
    },
    {
      icon: CheckCircle,
      label: "Kết quả sau phiên học",
      title: "Chương 3 đã hoàn thành",
      note: "Tiến độ được lưu lại để bạn biết mình đang tiến gần mục tiêu hơn.",
    },
  ];
  const preview = previews[activeStep];
  const Icon = preview.icon;

  return (
    <div
      key={activeStep}
      className="mission-preview-content flex min-h-[300px] flex-col justify-between rounded-2xl border border-primary/25 bg-[#171B2E] p-6 sm:p-8"
      aria-live="polite"
    >
      <div>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={22} strokeWidth={2} aria-hidden="true" />
        </span>
        <p className="mt-7 text-sm font-medium text-white/55">{preview.label}</p>
        <p className="mt-3 text-3xl font-bold leading-tight tracking-tight">
          {preview.title}
        </p>
      </div>
      <div className="mt-8 border-t border-white/10 pt-5">
        <p className="text-sm leading-6 text-white/60">{preview.note}</p>
      </div>
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function MissionLoopSection({ user, platform }) {
  const sectionRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  useSectionReveal(sectionRef);

  const totalStudyHours = Math.round((platform?.totalStudyMinutes || 0) / 60);
  const formatNumber = (value) =>
    new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(value || 0);
  const communityStats = [
    [platform?.onlineUsers || 0, "người đang học"],
    [platform?.activeRooms || 0, "phòng hoạt động"],
    [totalStudyHours, "giờ học đã ghi nhận"],
  ];
  const personalStats = [
    [user?.todayStudyMinutes || 0, "phút học hôm nay"],
    [user?.currentStreak || 0, "ngày streak hiện tại"],
    [user?.xp || 0, "XP đã tích lũy"],
  ];
  const hasCompleteCommunityStats = communityStats.every(
    ([value]) => value > 0,
  );
  const hasPersonalProgress = Boolean(
    user && personalStats.some(([value]) => value > 0),
  );
  const visibleStats = hasCompleteCommunityStats
    ? communityStats
    : hasPersonalProgress
      ? personalStats
      : null;

  return (
    <section
      id="study-journey"
      ref={sectionRef}
      className="story-section scroll-mt-20 border-b border-white/5 bg-white/[0.018] py-20"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-14">
          <div data-story-reveal>
            <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Một phiên học trên HOCA diễn ra thế nào?
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/60">
              Chọn phòng, đặt Pomodoro, tập trung cùng bạn bè và nhận XP sau mỗi
              phiên học.
            </p>

            <div className="mt-9 overflow-hidden rounded-2xl border border-white/10 bg-[#111527]">
              <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <FileText size={18} strokeWidth={2} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-xs font-medium text-white/45">Mục tiêu mẫu</p>
                  <p className="mt-0.5 text-sm font-semibold">Phiên học có chủ đích</p>
                </div>
              </div>
              <div className="p-5">
                <p className="text-lg font-semibold leading-7">
                  “Hoàn thành chương 3 môn Giải tích”
                </p>
                <div className="mt-6 grid grid-cols-[auto_1fr_auto_1fr_auto] items-center gap-2 text-[11px] font-medium text-white/45 sm:text-xs">
                  <span className="text-primary">Đặt mục tiêu</span>
                  <span className="h-px bg-white/10" />
                  <span>Đang tập trung</span>
                  <span className="h-px bg-white/10" />
                  <span>Hoàn thành</span>
                </div>
              </div>
            </div>

            <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-white/45">
              <CheckCircle size={17} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
              Mỗi phiên kết thúc bằng một kết quả bạn có thể nhìn thấy.
            </p>
          </div>

          <div
            className="grid gap-5 rounded-2xl border border-white/10 bg-[#111527] p-4 sm:p-6 md:grid-cols-[0.9fr_1.1fr]"
            data-story-reveal
          >
            <div className="space-y-2">
              {journeySteps.map((step, index) => {
                const Icon = step.icon;
                const active = activeStep === index;
                return (
                  <button
                    key={step.title}
                    type="button"
                    onClick={() => setActiveStep(index)}
                    aria-pressed={active}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3.5 text-left transition active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      active
                        ? "border-primary/40 bg-primary/[0.08]"
                        : "border-transparent hover:border-white/10 hover:bg-white/[0.03]"
                    }`}
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        active
                          ? "bg-primary text-[#18100A]"
                          : "bg-white/[0.05] text-white/55"
                      }`}
                    >
                      <Icon size={18} strokeWidth={2} aria-hidden="true" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold">
                        {step.title}
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-white/50">
                        {step.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <JourneyPreview activeStep={activeStep} />
          </div>
        </div>

        {visibleStats && (
          <div
            className="mt-10 grid grid-cols-3 divide-x divide-white/10 border-y border-white/10 py-5"
            data-story-reveal
          >
            {visibleStats.map(([value, label]) => (
              <div key={label} className="min-w-0 px-2 text-center sm:px-5">
                <div className="text-xl font-bold text-primary sm:text-2xl">
                  {formatNumber(value)}
                </div>
                <div className="mt-1 text-[11px] leading-4 text-white/50 sm:text-xs">
                  {label}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function StudyStartSection({ user, platform }) {
  const sectionRef = useRef(null);
  const [duration, setDuration] = useState(25);
  useSectionReveal(sectionRef);

  const primaryTarget = user
    ? `/rooms?create=1&timer=${duration}`
    : "/register";
  const secondaryTarget = user ? "/rooms" : "/community";

  return (
    <section ref={sectionRef} className="story-section py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-2xl border border-primary/25 bg-[#15192B]"
          data-story-reveal
        >
          <div className="pointer-events-none absolute -left-24 -top-28 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative grid lg:grid-cols-[1.35fr_0.65fr]">
            <div className="p-7 sm:p-10 lg:p-12">
              <h2 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {user
                  ? "Tiếp tục nhịp học hôm nay."
                  : "Phiên học đầu tiên bắt đầu tại đây."}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-white/60">
                {user
                  ? "Chọn thời lượng phù hợp, tạo phòng và bắt đầu tập trung ngay."
                  : "Tạo tài khoản miễn phí để đặt mục tiêu, học cùng cộng đồng và theo dõi tiến bộ."}
              </p>

              {user && (
                <div className="mt-7">
                  <p className="text-sm font-medium text-white/55">
                    Chọn thời lượng tập trung
                  </p>
                  <div className="mt-3 grid max-w-md grid-cols-3 gap-2">
                    {[25, 50, 90].map((minutes) => (
                      <button
                        key={minutes}
                        type="button"
                        onClick={() => setDuration(minutes)}
                        aria-pressed={duration === minutes}
                        className={`min-h-11 rounded-xl border px-3 text-sm font-semibold transition active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                          duration === minutes
                            ? "border-primary bg-primary text-[#18100A]"
                            : "border-white/15 bg-white/[0.035] text-white/70 hover:border-primary/45 hover:text-white"
                        }`}
                      >
                        {minutes} phút
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {user && (
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/55">
                  <span className="inline-flex items-center gap-2">
                    <Clock size={16} className="text-primary" aria-hidden="true" />
                    {user.todayStudyMinutes || 0} phút hôm nay
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <Flame size={16} className="text-primary" aria-hidden="true" />
                    {user.currentStreak || 0} ngày streak
                  </span>
                </div>
              )}

              <div className="mt-8 grid gap-3 sm:w-fit sm:grid-cols-2">
                <Link
                  to={primaryTarget}
                  className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-6 font-semibold text-[#18100A] transition hover:bg-primary-light active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
                >
                  <Play size={18} fill="currentColor" aria-hidden="true" />
                  {user
                    ? `Tạo phòng ${duration} phút`
                    : "Tạo tài khoản miễn phí"}
                </Link>
                <Link
                  to={secondaryTarget}
                  className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.035] px-6 font-semibold transition hover:border-primary/55 hover:text-primary active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {user ? "Khám phá phòng" : "Xem cộng đồng"}
                  <ArrowRight size={18} aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="border-t border-white/10 bg-white/[0.025] p-7 sm:p-10 lg:border-l lg:border-t-0 lg:p-10">
              <div className="flex items-center gap-2 text-sm font-medium text-white/70">
                <span
                  className="live-dot h-2.5 w-2.5 rounded-full bg-emerald-400"
                  aria-hidden="true"
                />
                Cộng đồng đang hoạt động
              </div>
              <div className="mt-8 space-y-6">
                <div>
                  <DoorOpen size={20} className="text-primary" aria-hidden="true" />
                  <div className="mt-3 text-4xl font-bold">
                    {platform?.activeRooms ?? "--"}
                  </div>
                  <div className="mt-1 text-sm text-white/50">
                    phòng đang mở
                  </div>
                </div>
                <div className="border-t border-white/10 pt-6">
                  <Users size={20} className="text-primary" aria-hidden="true" />
                  <div className="mt-3 text-4xl font-bold">
                    {platform?.onlineUsers ?? "--"}
                  </div>
                  <div className="mt-1 text-sm text-white/50">
                    người đang học
                  </div>
                </div>
              </div>
              <p className="mt-8 text-xs leading-5 text-white/40">
                Dữ liệu trực tiếp, tự động cập nhật mỗi 15 giây.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const communityRules = [
  {
    icon: Shield,
    title: "Tôn trọng trước tiên",
    description: "Mọi cuộc trò chuyện đều bắt đầu bằng sự lịch sự và tôn trọng.",
    doText: "Giao tiếp lịch sự, lắng nghe và tôn trọng sự khác biệt.",
    dontText: "Công kích, bắt nạt hoặc phân biệt đối xử.",
    featured: true,
  },
  {
    icon: CheckCircle,
    title: "Giữ không gian tập trung",
    description: "Sử dụng phòng học đúng mục đích và hạn chế làm phiền.",
    doText: "Tắt mic khi không nói và giữ phòng học yên tĩnh.",
    dontText: "Gây ồn, spam tin nhắn hoặc gửi liên kết vô nghĩa.",
  },
  {
    icon: FileText,
    title: "Nội dung phù hợp",
    description: "Chia sẻ nội dung an toàn và phục vụ việc học tập.",
    doText: "Chia sẻ kiến thức, tài liệu và phản hồi có ích.",
    dontText: "Đăng nội dung phản cảm, bạo lực hoặc vi phạm pháp luật.",
  },
  {
    icon: Award,
    title: "Trung thực và công bằng",
    description: "Giữ thành tích học tập phản ánh đúng nỗ lực của bạn.",
    doText: "Báo lỗi cho HOCA và sử dụng hệ thống đúng mục đích.",
    dontText: "Mạo danh, gian lận hoặc lợi dụng lỗ hổng.",
  },
];

const COMMUNITY_HEART_KEY = "hoca_community_hearted";

function CommunityPromiseSection() {
  const sectionRef = useRef(null);
  const burstTimerRef = useRef(null);
  const [count, setCount] = useState(null);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(false);
  const [expandedRule, setExpandedRule] = useState(null);

  useEffect(() => {
    setLiked(localStorage.getItem(COMMUNITY_HEART_KEY) === "1");
    reactionApi
      .getHearts()
      .then((data) => setCount(data.count ?? 0))
      .catch(() => setCount(0));
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;

    if (!("IntersectionObserver" in window)) {
      section.classList.add("is-visible");
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          section.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.14 },
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(
    () => () => {
      if (burstTimerRef.current) window.clearTimeout(burstTimerRef.current);
    },
    [],
  );

  const handlePledge = async () => {
    if (busy) return;

    const nextLiked = !liked;
    if (nextLiked) {
      setBurst(true);
      burstTimerRef.current = window.setTimeout(() => setBurst(false), 650);
    }
    setBusy(true);
    setLiked(nextLiked);
    setCount((current) =>
      Math.max(0, (current ?? 0) + (nextLiked ? 1 : -1)),
    );
    if (nextLiked) localStorage.setItem(COMMUNITY_HEART_KEY, "1");
    else localStorage.removeItem(COMMUNITY_HEART_KEY);

    try {
      const data = nextLiked
        ? await reactionApi.addHeart()
        : await reactionApi.removeHeart();
      if (typeof data.count === "number") setCount(data.count);
      toast.success(
        nextLiked ? "Đã ghi nhận cam kết của bạn." : "Đã hủy cam kết.",
      );
    } catch {
      setLiked(liked);
      setCount((current) =>
        Math.max(0, (current ?? 0) + (nextLiked ? -1 : 1)),
      );
      if (liked) localStorage.setItem(COMMUNITY_HEART_KEY, "1");
      else localStorage.removeItem(COMMUNITY_HEART_KEY);
      toast.error("Chưa thể cập nhật cam kết. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  const toggleRule = (index) => {
    setExpandedRule((current) => (current === index ? null : index));
  };

  return (
    <section ref={sectionRef} className="community-promise py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#111527]">
          <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
            <div className="relative border-b border-white/10 p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-12">
              <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
              <div className="relative" data-community-reveal>
                <Link
                  to="/community"
                  className="group -mx-3 inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-sm font-semibold text-primary transition hover:bg-primary/[0.07] hover:text-primary-light active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  title="Mở quy tắc cộng đồng HOCA"
                >
                  <Heart size={17} aria-hidden="true" />
                  Cam kết cộng đồng HOCA
                  <ArrowRight
                    size={15}
                    className="opacity-55 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                    aria-hidden="true"
                  />
                </Link>
                <h2 className="mt-5 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                  Học hết mình. Tôn trọng nhau.
                </h2>
                <p className="mt-5 max-w-lg text-base leading-7 text-white/60">
                  Bốn nguyên tắc nhỏ giúp mọi phòng học luôn tập trung, tích
                  cực và an toàn cho tất cả thành viên.
                </p>

                <div
                  className="mt-8 flex items-center gap-2 text-sm text-white/65"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <Heart
                    size={16}
                    className="text-primary"
                    fill="currentColor"
                    aria-hidden="true"
                  />
                  <strong className="text-white">
                    {count === null ? "..." : count.toLocaleString("vi-VN")}
                  </strong>
                  <span>lượt cùng cam kết</span>
                </div>

                <button
                  type="button"
                  onClick={handlePledge}
                  disabled={busy}
                  aria-pressed={liked}
                  aria-label={
                    liked
                      ? "Hủy cam kết cộng đồng HOCA"
                      : "Đồng ý cam kết cộng đồng HOCA"
                  }
                  title={liked ? "Bấm để hủy cam kết" : "Bấm để cùng cam kết"}
                  className={`relative mt-5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 overflow-visible rounded-xl px-6 font-semibold transition active:translate-y-px disabled:cursor-wait disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light sm:w-auto ${
                    liked
                      ? "border border-primary/35 bg-primary/10 text-primary-light hover:border-primary/60 hover:bg-primary/15"
                      : "bg-primary text-[#18100A] hover:bg-primary-light"
                  }`}
                >
                  <Heart
                    size={19}
                    fill={liked ? "currentColor" : "none"}
                    className={burst ? "animate-heartPop" : ""}
                    aria-hidden="true"
                  />
                  {busy
                    ? "Đang cập nhật..."
                    : liked
                      ? "Đã cùng cam kết"
                      : "Tôi đồng ý"}
                  {burst && (
                    <>
                      <Heart
                        size={13}
                        fill="currentColor"
                        className="absolute -top-1 left-8 animate-floatUp text-primary"
                        aria-hidden="true"
                      />
                      <Heart
                        size={11}
                        fill="currentColor"
                        className="absolute -top-1 right-8 animate-floatUp text-primary-light"
                        style={{ animationDelay: "0.08s" }}
                        aria-hidden="true"
                      />
                    </>
                  )}
                </button>
                <p className="mt-2 text-xs text-white/40">
                  {liked
                    ? "Bấm lại nút nếu bạn muốn hủy cam kết."
                    : "Cam kết của bạn sẽ được ghi nhận ngay."}
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-6 lg:p-8">
              <div className="space-y-3">
                {communityRules.map((rule, index) => {
                  const isExpanded = expandedRule === index;
                  const Icon = rule.icon;

                  return (
                    <article
                      key={rule.title}
                      className={`community-rule rounded-2xl border bg-white/[0.025] transition duration-300 ${
                        rule.featured ? "community-rule-featured" : ""
                      } ${
                        rule.featured ? "p-5 sm:p-6" : "p-4 sm:p-5"
                      } ${
                        isExpanded
                          ? "border-primary/45 bg-primary/[0.055]"
                          : "border-white/10 hover:border-primary/30"
                      }`}
                      data-community-rule
                    >
                      <button
                        type="button"
                        onClick={() => toggleRule(index)}
                        aria-expanded={isExpanded}
                        className="flex w-full cursor-pointer items-center gap-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <span
                          className={`flex shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ${
                            rule.featured ? "h-12 w-12" : "h-10 w-10"
                          }`}
                        >
                          <Icon
                            size={rule.featured ? 23 : 20}
                            strokeWidth={2}
                            aria-hidden="true"
                          />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span
                            className={`block font-bold ${
                              rule.featured ? "text-xl" : "text-base"
                            }`}
                          >
                            {rule.title}
                          </span>
                          <span className="mt-1 block text-sm leading-5 text-white/55">
                            {rule.description}
                          </span>
                        </span>
                        <ChevronDown
                          size={19}
                          className={`shrink-0 text-white/45 transition-transform duration-200 ${
                            isExpanded ? "rotate-180 text-primary" : ""
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      <div
                        className={`community-rule-details grid transition-all duration-300 ${
                          isExpanded
                            ? "mt-4 grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div className="grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
                            <div className="flex items-start gap-2.5 rounded-xl bg-primary/[0.06] p-3.5">
                              <CheckCircle
                                size={17}
                                className="mt-0.5 shrink-0 text-primary"
                                aria-hidden="true"
                              />
                              <p className="text-xs leading-5 text-white/70">
                                <strong className="text-white">Nên làm:</strong>{" "}
                                {rule.doText}
                              </p>
                            </div>
                            <div className="flex items-start gap-2.5 rounded-xl bg-white/[0.035] p-3.5">
                              <XCircle
                                size={17}
                                className="mt-0.5 shrink-0 text-white/50"
                                aria-hidden="true"
                              />
                              <p className="text-xs leading-5 text-white/65">
                                <strong className="text-white">
                                  Không nên:
                                </strong>{" "}
                                {rule.dontText}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>
          </div>

          <div
            className="grid gap-4 border-t border-white/10 bg-white/[0.018] p-5 sm:p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:px-10"
            data-community-reveal
          >
            <Link
              to="/support#violation"
              className="group -m-2 flex min-h-12 items-center gap-3 rounded-xl p-2 text-sm text-white/55 transition hover:bg-primary/[0.055] hover:text-white/80 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              title="Mở mục báo cáo vi phạm"
            >
              <Flag size={18} className="shrink-0 text-primary" />
              <span className="flex-1">
                Báo cáo được gửi trực tiếp đến quản trị viên HOCA để kiểm tra
                và xử lý.
              </span>
              <ArrowRight
                size={17}
                className="shrink-0 text-primary opacity-60 transition group-hover:translate-x-0.5 group-hover:opacity-100"
                aria-hidden="true"
              />
            </Link>
            <div>
              <Link
                to="/community"
                className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 text-sm font-semibold text-[#18100A] transition hover:bg-primary-light active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
              >
                <FileText size={18} aria-hidden="true" />
                Đọc đầy đủ quy tắc
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
