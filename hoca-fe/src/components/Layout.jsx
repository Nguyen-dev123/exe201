import { useEffect } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { userApi } from "../lib/services";
import { LogOut, User, LayoutDashboard, Sparkles } from "lucide-react";
import NotificationBell from "./NotificationBell";
import { getTierInfo } from "../lib/format";

export default function Layout() {
  const { user, token, logout, setUser } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Refresh the user profile on mount so we always have fresh stats/tier/displayName
  useEffect(() => {
    if (token) {
      userApi
        .getMe()
        .then((fresh) => setUser(fresh))
        .catch(() => {
          /* token interceptor handles 401 */
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;
  const displayName = user?.displayName || user?.name || user?.email;
  const tier = getTierInfo(user?.subscriptionTier);

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`text-sm font-medium transition ${
        isActive(to) ? "text-primary" : "text-white/70 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen">
      <nav className="border-b border-white/10 glass sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-2 press">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-xl bg-gradient-to-br from-primary to-orange-600 glow-primary">
                H
              </div>
              <span className="text-2xl font-bold text-white">HOCA</span>
            </Link>

            <div className="hidden md:flex items-center space-x-7">
              {user ? (
                <>
                  {navLink("/dashboard", "Tổng quan")}
                  {navLink("/rooms", "Phòng học")}
                  {navLink("/leaderboard", "Xếp hạng")}
                  {navLink("/badges", "Huy hiệu")}
                  {navLink("/ranks", "Cấp bậc")}
                  <Link
                    to="/ai"
                    className={`text-sm font-medium transition flex items-center gap-1 ${
                      isActive("/ai")
                        ? "text-primary"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    <Sparkles size={15} /> AI
                  </Link>
                  {navLink("/pricing", "Nâng cấp")}
                  {user.role === "ADMIN" && navLink("/admin", "Quản trị")}
                </>
              ) : (
                <>
                  {navLink("/", "Tính năng")}
                  {navLink("/pricing", "Bảng giá")}
                  {navLink("/leaderboard", "Xếp hạng")}
                </>
              )}
            </div>

            <div className="flex items-center space-x-3">
              {user ? (
                <>
                  <NotificationBell />
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-dark-lighter hover:bg-dark-card transition"
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        displayName?.[0]?.toUpperCase() || "U"
                      )}
                    </div>
                    <span className="text-sm font-medium text-white max-w-[120px] truncate">
                      {displayName}
                    </span>
                    <span
                      className={`pill ${tier.bg} ${tier.color} hidden lg:inline-flex`}
                    >
                      {tier.label}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
                    title="Đăng xuất"
                  >
                    <LogOut size={18} />
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-sm font-medium text-white/70 hover:text-white transition"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    to="/register"
                    className="px-6 py-2.5 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition"
                  >
                    Bắt đầu miễn phí
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-white text-xl">
                  H
                </div>
                <span className="text-2xl font-bold text-white">HOCA</span>
              </div>
              <p className="text-white/60 text-sm mb-4">
                © 2025 HOCA. Nền tảng học tập trực tuyến hàng đầu Việt Nam.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Khám phá</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/dashboard"
                    className="text-white/60 hover:text-primary text-sm transition"
                  >
                    Tổng quan
                  </Link>
                </li>
                <li>
                  <Link
                    to="/leaderboard"
                    className="text-white/60 hover:text-primary text-sm transition"
                  >
                    Bảng xếp hạng
                  </Link>
                </li>
                <li>
                  <Link
                    to="/pricing"
                    className="text-white/60 hover:text-primary text-sm transition"
                  >
                    Bảng giá
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-white mb-4">Liên hệ</h3>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>
                  Email:{" "}
                  <a
                    href="mailto:hocavn2026@gmail.com"
                    className="hover:text-primary transition"
                  >
                    hocavn2026@gmail.com
                  </a>
                </li>
                <li>
                  Website:{" "}
                  <a
                    href="https://exe201-ten.vercel.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-primary transition"
                  >
                    exe201-ten.vercel.app
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
