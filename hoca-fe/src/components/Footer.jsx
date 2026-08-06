import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Clipboard,
  Download,
  DoorOpen,
  ExternalLink,
  Facebook,
  Mail,
  Music2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { publicApi } from "../lib/services";
import { API_BASE } from "../lib/config";
import BrandLogo from "./BrandLogo";

const EMAIL = "hocavn2026@gmail.com";
const FACEBOOK_URL =
  "https://www.facebook.com/profile.php?id=61585476356863";
const TIKTOK_URL = "https://www.tiktok.com/@hoc.tap.cung.nhau";

const linkGroups = [
  {
    title: "Sản phẩm",
    links: [
      { label: "Tổng quan", to: "/dashboard" },
      { label: "Phòng học", to: "/rooms" },
      { label: "HOCA AI", to: "/ai" },
      { label: "HOCA+", to: "/pricing" },
    ],
  },
  {
    title: "Cộng đồng",
    links: [
      { label: "Bảng xếp hạng", to: "/leaderboard" },
      { label: "Thành tích", to: "/badges" },
      { label: "Quy tắc cộng đồng", to: "/community" },
    ],
  },
  {
    title: "Hỗ trợ",
    links: [
      { label: "Trung tâm trợ giúp", to: "/support" },
      { label: "Liên hệ", to: "/support#contact" },
      { label: "Báo lỗi", to: "/support#report" },
      { label: "Câu hỏi thường gặp", to: "/support#faq" },
    ],
  },
];

function resolveDownloadUrl() {
  const configuredDownloadUrl = import.meta.env.VITE_APK_DOWNLOAD_URL?.trim();
  if (configuredDownloadUrl) return configuredDownloadUrl;

  if (typeof window === "undefined") {
    return `${API_BASE.replace(/\/$/, "")}/api/download/apk?source=footer-qr`;
  }

  const apiIsLocal = /localhost|127\.0\.0\.1/.test(API_BASE);
  const pageIsLan = !/localhost|127\.0\.0\.1/.test(window.location.hostname);
  const base = apiIsLocal && pageIsLan ? window.location.origin : API_BASE;
  return `${base.replace(/\/$/, "")}/api/download/apk?source=footer-qr`;
}

function resolveQrUrl(downloadUrl) {
  const configuredQrUrl = import.meta.env.VITE_APK_QR_URL?.trim();
  if (configuredQrUrl) return configuredQrUrl;

  try {
    return new URL("/", downloadUrl).toString();
  } catch {
    return downloadUrl;
  }
}

function FooterLink({ item }) {
  return (
    <Link
      to={item.to}
      className="group inline-flex items-center gap-1.5 text-sm text-[#98A2B8] transition duration-200 hover:translate-x-1 hover:text-[#FF8C00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00] focus-visible:ring-offset-4 focus-visible:ring-offset-[#0D1020]"
    >
      <span>{item.label}</span>
      <ArrowRight
        size={13}
        className="opacity-0 transition group-hover:opacity-100"
        aria-hidden="true"
      />
    </Link>
  );
}

function DesktopLinkGroup({ group }) {
  return (
    <div className="hidden md:block" data-reveal>
      <h3 className="mb-4 text-sm font-semibold text-[#F7F7F2]">
        {group.title}
      </h3>
      <ul className="space-y-3">
        {group.links.map((item) => (
          <li key={item.label}>
            <FooterLink item={item} />
          </li>
        ))}
      </ul>
    </div>
  );
}

function MobileLinkGroup({ group }) {
  return (
    <details className="footer-accordion group border-b border-white/10 md:hidden">
      <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-sm font-semibold text-[#F7F7F2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]">
        {group.title}
        <ChevronDown
          size={18}
          className="transition group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>
      <ul className="space-y-3 pb-5">
        {group.links.map((item) => (
          <li key={item.label}>
            <FooterLink item={item} />
          </li>
        ))}
      </ul>
    </details>
  );
}

export default function Footer() {
  const footerRef = useRef(null);
  const qrCloseRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const downloadUrl = useMemo(resolveDownloadUrl, []);
  const qrUrl = useMemo(() => resolveQrUrl(downloadUrl), [downloadUrl]);

  const { data: platform, isError: statsError } = useQuery({
    queryKey: ["public-platform-stats"],
    queryFn: publicApi.getPlatformStats,
    refetchInterval: 15000,
    staleTime: 10000,
    retry: 1,
  });

  const operational = !statsError && platform?.status === "operational";

  useEffect(() => {
    const footer = footerRef.current;
    if (!footer) return undefined;

    if (!("IntersectionObserver" in window)) {
      footer.classList.add("is-visible");
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          footer.classList.add("is-visible");
          observer.disconnect();
        }
      },
      { threshold: 0.08 },
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!showQr) return undefined;
    const previouslyFocused = document.activeElement;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowQr(false);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    qrCloseRef.current?.focus({ preventScroll: true });
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.({ preventScroll: true });
    };
  }, [showQr]);

  const copyEmail = async () => {
    try {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(EMAIL);
        } catch {
          const textarea = document.createElement("textarea");
          textarea.value = EMAIL;
          textarea.style.position = "fixed";
          textarea.style.opacity = "0";
          document.body.appendChild(textarea);
          textarea.select();
          const copiedSuccessfully = document.execCommand("copy");
          textarea.remove();
          if (!copiedSuccessfully) throw new Error("Copy failed");
        }
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = EMAIL;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        const copiedSuccessfully = document.execCommand("copy");
        textarea.remove();
        if (!copiedSuccessfully) throw new Error("Copy failed");
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Không thể sao chép email trên trình duyệt này.");
    }
  };

  const subscribe = async (event) => {
    event.preventDefault();
    if (!email.trim()) return;

    setSubmitting(true);
    try {
      const response = await publicApi.subscribeNewsletter({ email, website });
      toast.success(response.message || "Đã đăng ký nhận cập nhật.");
      setEmail("");
      setWebsite("");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Chưa thể đăng ký lúc này. Vui lòng thử lại sau.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer
      ref={footerRef}
      className="footer-reveal mt-20 overflow-hidden border-t border-white/10 bg-[#0D1020] text-[#F7F7F2]"
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <section
          className="relative overflow-hidden rounded-2xl border border-[#FF8C00]/30 bg-[#15192B] p-6 sm:p-8 lg:p-10"
          data-reveal
        >
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[#FF8C00]/10 blur-3xl" />
          <div className="relative grid items-center gap-7 lg:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-[#FFB35C]">
                <Sparkles size={16} aria-hidden="true" />
                Học cùng nhau, tiến bộ mỗi ngày
              </div>
              <h2 className="max-w-2xl break-words text-2xl font-bold tracking-tight sm:text-3xl lg:text-4xl">
                Sẵn sàng cho một phiên học hiệu quả?
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#AAB3C5] sm:text-base">
                Vào phòng học, bật bộ đếm tập trung và duy trì động lực cùng
                cộng đồng HOCA.
              </p>
            </div>
            <div className="grid w-full gap-3 sm:grid-cols-2 lg:w-auto">
              <Link
                to="/rooms?create=1"
                className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#FF8C00] px-6 py-3 font-semibold text-[#18100A] transition hover:bg-[#FFA733] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD09A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#15192B]"
              >
                <DoorOpen size={19} aria-hidden="true" />
                Tạo phòng học
              </Link>
              <Link
                to="/rooms"
                className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 font-semibold text-[#F7F7F2] transition hover:border-[#FF8C00]/70 hover:bg-[#FF8C00]/10 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
              >
                Khám phá phòng
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gap-10 py-12 lg:grid-cols-[1.25fr_1fr] lg:gap-16">
          <div data-reveal>
            <Link
              to="/"
              className="inline-flex rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
              aria-label="Về trang chủ HOCA"
            >
              <BrandLogo />
            </Link>
            <p className="mt-4 max-w-md text-sm leading-6 text-[#98A2B8]">
              Nền tảng học tập trực tuyến giúp bạn tập trung, kết nối và xây
              dựng thói quen học bền vững.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:max-w-md">
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <Users size={19} className="text-[#FF8C00]" aria-hidden="true" />
                <div className="mt-3 text-2xl font-bold">
                  {platform?.onlineUsers ?? "--"}
                </div>
                <div className="mt-1 text-xs text-[#98A2B8]">
                  người đang học
                </div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                <DoorOpen
                  size={19}
                  className="text-[#FF8C00]"
                  aria-hidden="true"
                />
                <div className="mt-3 text-2xl font-bold">
                  {platform?.activeRooms ?? "--"}
                </div>
                <div className="mt-1 text-xs text-[#98A2B8]">
                  phòng đang hoạt động
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                to="/status"
                className="inline-flex items-center gap-2 rounded-lg text-sm text-[#B8C0D0] transition hover:text-[#FF8C00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    operational
                      ? "live-dot bg-emerald-400"
                      : "bg-amber-400"
                  }`}
                  aria-hidden="true"
                />
                {operational
                  ? "Hệ thống hoạt động bình thường"
                  : "Đang kiểm tra hệ thống"}
              </Link>
            </div>
          </div>

          <div className="grid content-start gap-8 sm:grid-cols-[1fr_auto]" data-reveal>
            <form onSubmit={subscribe} className="min-w-0">
              <label
                htmlFor="footer-newsletter"
                className="block text-sm font-semibold text-[#F7F7F2]"
              >
                Nhận tin mới từ HOCA
              </label>
              <p className="mt-2 text-sm leading-5 text-[#98A2B8]">
                Tính năng mới, mẹo tập trung và cập nhật cộng đồng.
              </p>
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <input
                  id="footer-newsletter"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  autoComplete="email"
                  placeholder="ban@email.com"
                  className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/15 bg-[#191E32] px-4 text-sm text-[#F7F7F2] placeholder:text-[#98A2B8] focus:border-[#FF8C00] focus:outline-none focus:ring-2 focus:ring-[#FF8C00]/20"
                />
                <input
                  type="text"
                  value={website}
                  onChange={(event) => setWebsite(event.target.value)}
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  className="hidden"
                  name="website"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-12 whitespace-nowrap rounded-xl bg-[#FF8C00] px-5 text-sm font-semibold text-[#18100A] transition hover:bg-[#FFA733] active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD09A]"
                >
                  {submitting ? "Đang gửi..." : "Đăng ký"}
                </button>
              </div>
              <p className="mt-2 text-xs leading-5 text-[#8D97AA]">
                Bạn có thể yêu cầu hủy đăng ký bất cứ lúc nào.
              </p>
            </form>

            <div className="hidden text-center sm:block">
              <button
                type="button"
                onClick={() => setShowQr(true)}
                className="group rounded-2xl border border-white/10 bg-white p-2.5 transition hover:scale-[1.04] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
                aria-label="Phóng to mã QR tải ứng dụng HOCA"
              >
                <QRCodeSVG
                  value={qrUrl}
                  size={112}
                  bgColor="#FFFFFF"
                  fgColor="#0D1020"
                  level="M"
                />
              </button>
              <div className="mt-2 text-xs text-[#98A2B8]">Quét để tải APK</div>
            </div>

            <a
              href={downloadUrl.replace("footer-qr", "footer-button")}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-5 text-sm font-semibold text-[#F7F7F2] transition hover:border-[#FF8C00]/70 hover:text-[#FFB35C] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00] sm:col-span-2"
            >
              <Download size={18} aria-hidden="true" />
              Tải ứng dụng Android (.zip)
            </a>
          </div>
        </div>

        <div className="border-t border-white/10 py-10">
          <div className="grid gap-8 md:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_1.25fr]">
            {linkGroups.map((group) => (
              <DesktopLinkGroup key={group.title} group={group} />
            ))}

            <div data-reveal>
              <h3 className="mb-4 text-sm font-semibold text-[#F7F7F2]">
                Kết nối với HOCA
              </h3>
              <a
                href={`mailto:${EMAIL}`}
                className="inline-flex items-center gap-2 text-sm text-[#98A2B8] transition hover:text-[#FF8C00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
              >
                <Mail size={16} aria-hidden="true" />
                {EMAIL}
              </a>
              <button
                type="button"
                onClick={copyEmail}
                className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-medium text-[#B8C0D0] transition hover:border-[#FF8C00]/60 hover:text-[#FFB35C] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
              >
                {copied ? (
                  <Check size={15} aria-hidden="true" />
                ) : (
                  <Clipboard size={15} aria-hidden="true" />
                )}
                {copied ? "Đã sao chép" : "Sao chép email"}
              </button>
              <a
                href="https://hoca.asia"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-[#98A2B8] transition hover:text-[#FF8C00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
              >
                hoca.asia
                <ExternalLink size={14} aria-hidden="true" />
              </a>
              <div className="mt-5 flex flex-wrap gap-2">
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 text-xs font-semibold text-[#B8C0D0] transition hover:border-[#FF8C00]/60 hover:text-[#FFB35C] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
                  aria-label="Mở trang Facebook của HOCA"
                >
                  <Facebook size={16} strokeWidth={2} aria-hidden="true" />
                  Facebook
                </a>
                <a
                  href={TIKTOK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-3.5 text-xs font-semibold text-[#B8C0D0] transition hover:border-[#FF8C00]/60 hover:text-[#FFB35C] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
                  aria-label="Mở trang TikTok của HOCA"
                >
                  <Music2 size={16} strokeWidth={2} aria-hidden="true" />
                  TikTok
                </a>
              </div>
            </div>
          </div>

          <div className="mt-7 md:hidden">
            {linkGroups.map((group) => (
              <MobileLinkGroup key={group.title} group={group} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-white/10 pt-6 text-xs text-[#8D97AA] sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} HOCA. Mọi quyền được bảo lưu.</p>
          <nav className="flex flex-wrap gap-x-5 gap-y-3" aria-label="Pháp lý">
            <Link className="transition hover:text-[#FF8C00]" to="/terms">
              Điều khoản sử dụng
            </Link>
            <Link className="transition hover:text-[#FF8C00]" to="/privacy">
              Chính sách quyền riêng tư
            </Link>
            <Link className="transition hover:text-[#FF8C00]" to="/status">
              Trạng thái hệ thống
            </Link>
          </nav>
        </div>
      </div>

      {showQr && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-[#080A12]/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="download-qr-title"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowQr(false);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#15192B] p-6 text-center shadow-2xl shadow-black/40">
            <button
              ref={qrCloseRef}
              type="button"
              onClick={() => setShowQr(false)}
              className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-[#98A2B8] transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF8C00]"
              aria-label="Đóng mã QR"
            >
              <X size={19} aria-hidden="true" />
            </button>
            <h2 id="download-qr-title" className="mt-1 text-xl font-bold">
              Tải ứng dụng HOCA
            </h2>
            <p className="mt-2 text-sm text-[#98A2B8]">
              Quét mã bằng điện thoại Android để tải APK.
            </p>
            <div className="mx-auto mt-5 w-fit rounded-2xl bg-white p-4">
              <QRCodeSVG
                value={qrUrl}
                size={220}
                bgColor="#FFFFFF"
                fgColor="#0D1020"
                level="M"
              />
            </div>
            <a
              href={downloadUrl.replace("footer-qr", "footer-modal")}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#FF8C00] px-5 font-semibold text-[#18100A] transition hover:bg-[#FFA733] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD09A]"
            >
              <Download size={18} aria-hidden="true" />
              Tải APK trực tiếp
            </a>
          </div>
        </div>
      )}
    </footer>
  );
}
