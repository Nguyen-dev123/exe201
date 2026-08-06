import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useAuthStore } from "../store/authStore";
import { authApi, userApi } from "../lib/services";
import {
  Award,
  BarChart3,
  ChevronDown,
  Crown,
  Home,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Sparkles,
  Trophy,
  User,
  Users,
  X,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import Avatar from "./Avatar";
import Footer from "./Footer";
import BrandLogo from "./BrandLogo";
import { getTierInfo } from "../lib/format";
import { initSocket } from "../lib/socket";

const achievementLinks = [
  { to: "/leaderboard", label: "Bảng xếp hạng", icon: Trophy },
  { to: "/badges", label: "Huy hiệu", icon: Award },
  { to: "/ranks", label: "Cấp bậc", icon: BarChart3 },
];

export default function Layout() {
  const { user, token, logout, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthPage = ["/login", "/register", "/auth/verify", "/verify-otp"].includes(
    location.pathname,
  );
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const nativeRouteInitialized = useRef(false);
  const isNativeApp = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!isNativeApp) return undefined;
    document.documentElement.classList.add("hoca-native");
    return () => document.documentElement.classList.remove("hoca-native");
  }, [isNativeApp]);

  useEffect(() => {
    if (!isNativeApp || isAuthPage) return;

    const currentRoute = `${location.pathname}${location.search}`;
    if (!nativeRouteInitialized.current) {
      nativeRouteInitialized.current = true;
      const savedRoute = window.localStorage.getItem("hoca-native-last-route");
      const canRestore =
        savedRoute &&
        savedRoute !== "/" &&
        /^\/(rooms|dashboard|community|profile|admin)(\/|\?|$)/.test(savedRoute);

      if (location.pathname === "/" && canRestore) {
        navigate(savedRoute, { replace: true });
        return;
      }
    }

    window.localStorage.setItem("hoca-native-last-route", currentRoute);
  }, [isAuthPage, isNativeApp, location.pathname, location.search, navigate]);

  useEffect(() => {
    if (token) {
      initSocket(token);
      userApi
        .getMe()
        .then((fresh) => setUser(fresh))
        .catch(() => {
          /* token interceptor handles 401 */
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  useEffect(() => {
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";
    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useEffect(() => {
    setOpenMenu(null);
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  useLayoutEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.key, location.hash]);

  useEffect(() => {
    if (!location.hash) return undefined;

    const frame = window.requestAnimationFrame(() => {
      const section = document.getElementById(location.hash.slice(1));
      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      section?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!openMenu) return undefined;

    const closeOutside = (event) => {
      if (!event.target.closest("[data-nav-menu]")) setOpenMenu(null);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpenMenu(null);
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [openMenu]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Local logout must still work if the network is unavailable.
    } finally {
      logout();
      navigate("/login");
    }
  };

  const isActive = (path) =>
    location.pathname === path ||
    (path !== "/" && location.pathname.startsWith(`${path}/`));
  const achievementActive = achievementLinks.some(({ to }) => isActive(to));
  const displayName = user?.displayName || user?.name || user?.email;
  const rawTier = user?.subscriptionTier || "FREE";
  const subscriptionActive =
    rawTier === "LIFETIME" ||
    (rawTier !== "FREE" &&
      (!user?.subscriptionExpiry ||
        new Date(user.subscriptionExpiry).getTime() > Date.now()));
  const effectiveTier = subscriptionActive ? rawTier : "FREE";
  const tier = getTierInfo(effectiveTier);
  const canUpgrade = user?.role !== "ADMIN" && effectiveTier === "FREE";

  const desktopNavLink = (to, label) => (
    <Link
      to={to}
      className={`inline-flex h-16 items-center border-b-2 px-0.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
        isActive(to)
          ? "border-primary text-white"
          : "border-transparent text-white/60 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  const mobileNavLink = (to, label, Icon) => (
    <Link
      to={to}
      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${
        isActive(to)
          ? "bg-primary/[0.08] text-primary"
          : "text-white/70 hover:bg-white/[0.04] hover:text-white"
      }`}
    >
      {Icon && <Icon size={17} aria-hidden="true" />}
      {label}
    </Link>
  );

  const nativeNavItems = [
    { to: "/", label: "Trang chủ", icon: Home },
    user?.role === "ADMIN"
      ? { to: "/admin", label: "Quản trị", icon: LayoutDashboard }
      : { to: "/dashboard", label: "Tiến độ", icon: LayoutDashboard },
    { to: "/rooms", label: "Phòng học", icon: Users, primary: true },
    { to: "/community", label: "Cộng đồng", icon: Users },
    { to: user ? "/profile" : "/login", label: "Tài khoản", icon: User },
  ];

  return (
    <div
      className={`min-h-screen ${isNativeApp ? "native-app-shell" : ""}`}
    >
      <nav
        className={`${isAuthPage ? "hidden" : "sticky"} top-0 z-50 border-b border-white/10 bg-[#14182A]/95 backdrop-blur-xl`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div
            className={`flex items-center justify-between gap-5 ${
              isNativeApp ? "h-14" : "h-16"
            }`}
          >
            <Link
              to="/"
              className="shrink-0 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              aria-label="Về trang chủ HOCA"
            >
              <BrandLogo size="compact" />
            </Link>

            <div className="hidden min-w-0 flex-1 items-center justify-center gap-7 lg:flex">
              {user ? (
                <>
                  {desktopNavLink("/rooms", "Phòng học")}
                  {desktopNavLink("/dashboard", "Tiến độ")}

                  <div className="relative" data-nav-menu>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenu((current) =>
                          current === "achievements" ? null : "achievements",
                        )
                      }
                      aria-expanded={openMenu === "achievements"}
                      aria-haspopup="menu"
                      className={`inline-flex h-16 items-center gap-1.5 border-b-2 px-0.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        achievementActive
                          ? "border-primary text-white"
                          : "border-transparent text-white/60 hover:text-white"
                      }`}
                    >
                      Thành tích
                      <ChevronDown
                        size={15}
                        className={`transition-transform ${
                          openMenu === "achievements" ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {openMenu === "achievements" && (
                      <div
                        role="menu"
                        className="absolute left-1/2 top-[calc(100%+0.5rem)] w-56 -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#191D31] p-2 shadow-[0_18px_45px_rgba(7,9,18,0.35)]"
                      >
                        {achievementLinks.map(({ to, label, icon: Icon }) => (
                          <Link
                            key={to}
                            to={to}
                            role="menuitem"
                            className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition ${
                              isActive(to)
                                ? "bg-primary/[0.08] text-primary"
                                : "text-white/70 hover:bg-white/[0.04] hover:text-white"
                            }`}
                          >
                            <Icon size={17} aria-hidden="true" />
                            {label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>

                  {desktopNavLink("/community", "Cộng đồng")}
                  <Link
                    to="/ai"
                    className={`inline-flex h-16 items-center gap-1.5 border-b-2 px-0.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      isActive("/ai")
                        ? "border-primary text-white"
                        : "border-transparent text-white/60 hover:text-white"
                    }`}
                  >
                    <Sparkles size={15} aria-hidden="true" />
                    Trợ lý học tập
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/#study-journey"
                    className="inline-flex h-16 items-center border-b-2 border-transparent px-0.5 text-sm font-medium text-white/60 transition hover:text-white"
                  >
                    Cách hoạt động
                  </Link>
                  {desktopNavLink("/pricing", "Bảng giá")}
                  {desktopNavLink("/community", "Cộng đồng")}
                  {desktopNavLink("/leaderboard", "Xếp hạng")}
                </>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              {user ? (
                <>
                  {canUpgrade ? (
                    <Link
                      to="/pricing"
                      className={`hidden min-h-10 items-center gap-2 whitespace-nowrap rounded-xl border px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:inline-flex ${
                        isActive("/pricing")
                          ? "border-primary bg-primary text-[#18100A]"
                          : "border-primary/45 text-primary hover:border-primary hover:bg-primary/[0.07]"
                      }`}
                    >
                      <Crown size={16} aria-hidden="true" />
                      Nâng cấp
                    </Link>
                  ) : user.role !== "ADMIN" ? (
                    <Link
                      to="/profile"
                      className="hidden min-h-10 items-center gap-2 whitespace-nowrap rounded-xl border border-primary/30 bg-primary/[0.06] px-4 text-sm font-semibold text-primary lg:inline-flex"
                    >
                      <Crown size={16} aria-hidden="true" />
                      {tier.label}
                    </Link>
                  ) : null}
                  <NotificationBell />

                  <div className="relative hidden lg:block" data-nav-menu>
                    <button
                      type="button"
                      onClick={() =>
                        setOpenMenu((current) =>
                          current === "profile" ? null : "profile",
                        )
                      }
                      aria-expanded={openMenu === "profile"}
                      aria-haspopup="menu"
                      className="flex min-h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-2.5 transition hover:border-white/20 hover:bg-white/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Avatar user={user} name={displayName} size={28} />
                      <span className="hidden max-w-[105px] truncate text-sm font-medium text-white xl:block">
                        {displayName}
                      </span>
                      <ChevronDown
                        size={15}
                        className={`text-white/45 transition-transform ${
                          openMenu === "profile" ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>

                    {openMenu === "profile" && (
                      <div
                        role="menu"
                        className="absolute right-0 top-[calc(100%+0.65rem)] w-64 overflow-hidden rounded-2xl border border-white/10 bg-[#191D31] p-2 shadow-[0_18px_45px_rgba(7,9,18,0.35)]"
                      >
                        <div className="border-b border-white/10 px-3 py-3">
                          <p className="truncate text-sm font-semibold text-white">
                            {displayName}
                          </p>
                          <p className={`mt-1 text-xs ${tier.color}`}>
                            {tier.label}
                          </p>
                        </div>
                        <Link
                          to="/profile"
                          role="menuitem"
                          className="mt-2 flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/70 transition hover:bg-white/[0.04] hover:text-white"
                        >
                          <User size={17} aria-hidden="true" />
                          Hồ sơ cá nhân
                        </Link>
                        <Link
                          to="/dashboard"
                          role="menuitem"
                          className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/70 transition hover:bg-white/[0.04] hover:text-white"
                        >
                          <LayoutDashboard size={17} aria-hidden="true" />
                          Tổng quan
                        </Link>
                        {user.role === "ADMIN" && (
                          <Link
                            to="/admin"
                            role="menuitem"
                            className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-white/70 transition hover:bg-white/[0.04] hover:text-white"
                          >
                            <Crown size={17} aria-hidden="true" />
                            Quản trị
                          </Link>
                        )}
                        <button
                          type="button"
                          onClick={handleLogout}
                          role="menuitem"
                          className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-white/60 transition hover:bg-white/[0.04] hover:text-white"
                        >
                          <LogOut size={17} aria-hidden="true" />
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="hidden items-center gap-3 lg:flex">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-white/65 transition hover:text-white"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="inline-flex min-h-10 items-center whitespace-nowrap rounded-xl bg-primary px-4 text-sm font-semibold text-[#18100A] transition hover:bg-primary-light active:translate-y-px"
                  >
                    Bắt đầu miễn phí
                  </Link>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMobileOpen((current) => !current)}
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation"
                aria-label={mobileOpen ? "Đóng menu" : "Mở menu"}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 text-white/70 transition hover:border-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {mobileOpen && (
            <div
              id="mobile-navigation"
              className="border-t border-white/10 py-3 lg:hidden"
            >
              <div className="grid gap-1">
                {user ? (
                  <>
                    {!isNativeApp && mobileNavLink("/rooms", "Phòng học", Users)}
                    {!isNativeApp &&
                      mobileNavLink("/dashboard", "Tiến độ", LayoutDashboard)}
                    <p className="px-3 pb-1 pt-3 text-xs font-medium text-white/35">
                      Thành tích
                    </p>
                    {achievementLinks.map(({ to, label, icon }) => (
                      <div key={to}>{mobileNavLink(to, label, icon)}</div>
                    ))}
                    {!isNativeApp &&
                      mobileNavLink("/community", "Cộng đồng", Users)}
                    {mobileNavLink("/ai", "Trợ lý học tập", Sparkles)}
                    {canUpgrade
                      ? mobileNavLink("/pricing", "Nâng cấp", Crown)
                      : user.role !== "ADMIN"
                        ? mobileNavLink("/profile", tier.label, Crown)
                        : null}
                    {!isNativeApp &&
                      mobileNavLink("/profile", "Hồ sơ cá nhân", User)}
                    {!isNativeApp &&
                      user.role === "ADMIN" &&
                      mobileNavLink("/admin", "Quản trị", Crown)}
                    {isNativeApp &&
                      mobileNavLink("/support", "Hỗ trợ", LifeBuoy)}
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-white/60 transition hover:bg-white/[0.04] hover:text-white"
                    >
                      <LogOut size={17} aria-hidden="true" />
                      Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/#study-journey"
                      className="flex min-h-11 items-center rounded-xl px-3 text-sm font-medium text-white/70 hover:bg-white/[0.04] hover:text-white"
                    >
                      Cách hoạt động
                    </Link>
                    {mobileNavLink("/pricing", "Bảng giá", Crown)}
                    {mobileNavLink("/community", "Cộng đồng", Users)}
                    {mobileNavLink("/leaderboard", "Xếp hạng", Trophy)}
                    {mobileNavLink("/login", "Đăng nhập", User)}
                    <Link
                      to="/register"
                      className="mt-2 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-[#18100A]"
                    >
                      Bắt đầu miễn phí
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      <main
        className={
          isNativeApp && !isAuthPage
            ? "pb-[calc(5.5rem+env(safe-area-inset-bottom))]"
            : undefined
        }
      >
        <Outlet />
      </main>

      {!isAuthPage && !isNativeApp && <Footer />}

      {isNativeApp && !isAuthPage && (
        <nav
          aria-label="Điều hướng ứng dụng"
          className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-[#101426]/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-12px_32px_rgba(4,7,18,0.36)] backdrop-blur-xl lg:hidden"
        >
          <div className="grid h-[4.75rem] grid-cols-5 items-end px-1.5">
            {nativeNavItems.map(({ to, label, icon: Icon, primary }) => {
              const active = isActive(to);
              return (
                <Link
                  key={to}
                  to={to}
                  aria-current={active ? "page" : undefined}
                  className={`group flex min-w-0 flex-col items-center justify-end gap-1 rounded-xl pb-2 text-[10px] font-semibold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                    active ? "text-primary" : "text-white/50"
                  }`}
                >
                  <span
                    className={`flex items-center justify-center transition ${
                      primary
                        ? "h-12 w-12 -translate-y-2 rounded-2xl bg-primary text-[#18100A] shadow-[0_8px_24px_rgba(255,140,0,0.28)]"
                        : active
                          ? "h-7 w-9 rounded-lg bg-primary/10"
                          : "h-7 w-9"
                    }`}
                  >
                    <Icon
                      size={primary ? 23 : 20}
                      strokeWidth={2}
                      aria-hidden="true"
                    />
                  </span>
                  <span className={primary ? "-mt-2 text-primary" : ""}>
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
