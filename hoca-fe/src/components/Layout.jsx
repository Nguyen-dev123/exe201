import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { LogOut, User } from "lucide-react";

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="min-h-screen bg-dark">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-dark/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-white text-xl">
                H
              </div>
              <span className="text-2xl font-bold text-white">HOCA</span>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <Link
                to="/"
                className={`text-sm font-medium transition ${
                  isActive("/")
                    ? "text-primary"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Tính năng
              </Link>
              <Link
                to="/pricing"
                className={`text-sm font-medium transition ${
                  isActive("/pricing")
                    ? "text-primary"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Bảng giá
              </Link>
              <Link
                to="/about"
                className={`text-sm font-medium transition ${
                  isActive("/about")
                    ? "text-primary"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Về chúng tôi
              </Link>
              <Link
                to="/community"
                className={`text-sm font-medium transition ${
                  isActive("/community")
                    ? "text-primary"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Quy tắc cộng đồng
              </Link>
            </div>

            {/* Auth Buttons */}
            <div className="flex items-center space-x-4">
              {user ? (
                <>
                  <Link
                    to="/rooms"
                    className="text-sm font-medium text-white/70 hover:text-white transition"
                  >
                    Phòng học
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-dark-lighter hover:bg-dark-card transition"
                  >
                    <User size={18} />
                    <span className="text-sm font-medium">
                      {user.name || user.email}
                    </span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition"
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

      {/* Main Content */}
      <main>
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Logo & Description */}
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

            {/* Links */}
            <div>
              <h3 className="font-semibold text-white mb-4">Liên kết</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/community"
                    className="text-white/60 hover:text-primary text-sm transition"
                  >
                    Quy tắc cộng đồng
                  </Link>
                </li>
                <li>
                  <Link
                    to="/terms"
                    className="text-white/60 hover:text-primary text-sm transition"
                  >
                    Điều khoản
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-white/60 hover:text-primary text-sm transition"
                  >
                    Bảo mật
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-white mb-4">Liên hệ</h3>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>Email: support@hoca.asia</li>
                <li>Website: www.hoca.asia</li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
