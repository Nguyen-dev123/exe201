import { BookOpenCheck, Sparkles, TimerReset } from "lucide-react";
import { Link } from "react-router-dom";
import BrandLogo from "./BrandLogo";

const highlights = [
  {
    icon: BookOpenCheck,
    title: "Phòng học trực tuyến",
    description: "Học cùng bạn bè trong một không gian tập trung.",
  },
  {
    icon: TimerReset,
    title: "Pomodoro đồng bộ",
    description: "Giữ nhịp học rõ ràng cho từng phiên học.",
  },
  {
    icon: Sparkles,
    title: "Trợ lý học tập AI",
    description: "Hỗ trợ giải thích và hệ thống lại kiến thức.",
  },
];

export default function AuthShell({ children }) {
  return (
    <main className="auth-page min-h-[100dvh] bg-[#111426] text-white">
      <section className="auth-story-panel hidden lg:flex" aria-label="Giới thiệu HOCA">
        <Link
          to="/"
          className="relative z-10 w-fit rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-4 focus-visible:ring-offset-[#C45C0A]"
          aria-label="Về trang chủ HOCA"
        >
          <BrandLogo />
        </Link>

        <div className="auth-story-copy relative z-10">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.16em] text-white/72">
            Không gian học tập HOCA
          </p>
          <h1 className="max-w-xl text-5xl font-extrabold tracking-[-0.04em] xl:text-6xl">
            <span className="block leading-[1.08]">Học cùng nhau,</span>
            <span className="mt-3 block leading-[1.08] text-[#17101A]">
              tiến bộ mỗi ngày.
            </span>
          </h1>
          <p className="mt-6 max-w-lg text-lg leading-8 text-white/82">
            Vào phòng học, bật Pomodoro và duy trì động lực cùng cộng đồng HOCA.
          </p>
        </div>

        <div className="auth-highlight-list relative z-10 grid gap-3">
          {highlights.map(({ icon: Icon, title, description }) => (
            <div key={title} className="auth-highlight-row">
              <span className="auth-highlight-icon" aria-hidden="true">
                <Icon size={20} strokeWidth={2} />
              </span>
              <span>
                <strong className="block text-sm font-bold text-white">{title}</strong>
                <span className="mt-0.5 block text-sm leading-5 text-white/68">
                  {description}
                </span>
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="auth-form-panel">
        <Link
          to="/"
          className="auth-mobile-logo rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
          aria-label="Về trang chủ HOCA"
        >
          <BrandLogo size="compact" />
        </Link>
        <div className="auth-form-card">{children}</div>
        <p className="auth-legal-copy">
          Khi tiếp tục, bạn đồng ý với{" "}
          <Link to="/terms">Điều khoản sử dụng</Link> và{" "}
          <Link to="/privacy">Chính sách bảo mật</Link> của HOCA.
        </p>
      </section>
    </main>
  );
}
