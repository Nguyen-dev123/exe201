import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.post("/api/auth/login", data);
      const { user, token, refreshToken } = response.data;
      setAuth(user, token, refreshToken);
      toast.success("Đăng nhập thành công!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const response = await api.post("/api/auth/google", {
        token: credentialResponse.credential,
      });
      const { user, token, refreshToken } = response.data;
      setAuth(user, token, refreshToken);
      toast.success("Đăng nhập Google thành công!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng nhập Google thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Đăng nhập Google thất bại");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Gradient Background */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-orange-600 to-yellow-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Logo */}
        <div className="flex items-center space-x-2 text-white">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center font-bold text-xl">
            H
          </div>
          <span className="text-2xl font-bold">HOCA</span>
        </div>

        {/* Main Content */}
        <div className="text-white space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Kiến thức là sức mạnh của tương lai.
          </h1>
          <p className="text-lg text-white/90 max-w-md">
            Tham gia cùng hàng triệu học viên khác để truy cập thư viện tài liệu
            không giới hạn và bắt đầu hành trình chinh phục tri thức ngay hôm
            nay.
          </p>

          {/* User Avatars */}
          <div className="flex items-center space-x-2 pt-4">
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-sm font-semibold"
                >
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/30 flex items-center justify-center text-xs font-semibold">
                +2k
              </div>
            </div>
            <span className="text-sm text-white/80">
              học viên mới trong tuần này
            </span>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-20 right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 bg-dark flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Welcome Text */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              Chào mừng trở lại!
            </h2>
            <p className="text-white/60">
              Vui lòng nhập thông tin để tiếp tục.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 border-b border-white/10">
            <button
              onClick={() => setActiveTab("login")}
              className={`pb-3 px-4 font-semibold transition relative ${
                activeTab === "login"
                  ? "text-primary"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Đăng nhập
              {activeTab === "login" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
            <Link
              to="/register"
              className="pb-3 px-4 font-semibold text-white/60 hover:text-white transition"
            >
              Đăng ký
            </Link>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-white/40" />
                </div>
                <input
                  {...register("email", {
                    required: "Email là bắt buộc",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Email không hợp lệ",
                    },
                  })}
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-dark-lighter border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-white">
                  Mật khẩu
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary hover:text-primary-light transition"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/40" />
                </div>
                <input
                  {...register("password", {
                    required: "Mật khẩu là bắt buộc",
                    minLength: {
                      value: 6,
                      message: "Mật khẩu phải có ít nhất 6 ký tự",
                    },
                  })}
                  type={showPassword ? "text" : "password"}
                  placeholder="Nhập mật khẩu của bạn"
                  className="w-full pl-10 pr-12 py-3 bg-dark-lighter border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white transition"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </button>
          </form>

          {/* Divider */}
          {/* Tạm thời ẩn Google Login - Cần setup GOOGLE_CLIENT_ID */}
          {/* 
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-dark text-white/60">
                Hoặc tiếp tục với
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              theme="filled_black"
              size="large"
              text="signin_with"
              shape="rectangular"
              logo_alignment="left"
            />
          </div>
          */}

          {/* Sign Up Link */}
          <p className="text-center text-white/60 text-sm">
            Chưa có tài khoản?{" "}
            <Link
              to="/register"
              className="text-primary hover:text-primary-light font-semibold transition"
            >
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
