import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import api from "../lib/api";
import { useAuthStore } from "../store/authStore";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("register");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();
  const password = watch("password");

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.post("/api/auth/register", {
        displayName: data.name,
        email: data.email,
        password: data.password,
      });

      // Check if registration returns token (auto-login)
      if (response.data.token && response.data.refreshToken) {
        const { user, token, refreshToken } = response.data;
        setAuth(user, token, refreshToken);
        toast.success("Đăng ký thành công!");
        navigate("/rooms");
      } else {
        // Old flow: requires email verification
        toast.success(
          "Đăng ký thành công! Vui lòng kiểm tra email để xác thực.",
        );
        navigate("/login");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng ký thất bại");
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
      toast.success("Đăng ký Google thành công!");
      navigate("/rooms");
    } catch (error) {
      toast.error(error.response?.data?.message || "Đăng ký Google thất bại");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    toast.error("Đăng ký Google thất bại");
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
            Bắt đầu hành trình học tập của bạn.
          </h1>
          <p className="text-lg text-white/90 max-w-md">
            Tạo tài khoản miễn phí và khám phá thế giới tri thức không giới hạn.
            Học tập cùng cộng đồng và đạt được mục tiêu của bạn.
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

      {/* Right Side - Register Form */}
      <div className="w-full lg:w-1/2 bg-dark flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Welcome Text */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              Tạo tài khoản mới
            </h2>
            <p className="text-white/60">
              Điền thông tin để bắt đầu học tập ngay hôm nay.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex space-x-4 border-b border-white/10">
            <Link
              to="/login"
              className="pb-3 px-4 font-semibold text-white/60 hover:text-white transition"
            >
              Đăng nhập
            </Link>
            <button
              onClick={() => setActiveTab("register")}
              className={`pb-3 px-4 font-semibold transition relative ${
                activeTab === "register"
                  ? "text-primary"
                  : "text-white/60 hover:text-white"
              }`}
            >
              Đăng ký
              {activeTab === "register" && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
              )}
            </button>
          </div>

          {/* Register Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Họ và tên
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-white/40" />
                </div>
                <input
                  {...register("name", {
                    required: "Họ tên là bắt buộc",
                    minLength: {
                      value: 2,
                      message: "Họ tên phải có ít nhất 2 ký tự",
                    },
                  })}
                  type="text"
                  placeholder="Nguyễn Văn A"
                  className="w-full pl-10 pr-4 py-3 bg-dark-lighter border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.name.message}
                </p>
              )}
            </div>

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
              <label className="block text-sm font-medium text-white mb-2">
                Mật khẩu
              </label>
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
                  placeholder="Tạo mật khẩu mạnh"
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

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/40" />
                </div>
                <input
                  {...register("confirmPassword", {
                    required: "Vui lòng xác nhận mật khẩu",
                    validate: (value) =>
                      value === password || "Mật khẩu không khớp",
                  })}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  className="w-full pl-10 pr-12 py-3 bg-dark-lighter border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-white/40 hover:text-white transition"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} />
                  ) : (
                    <Eye size={20} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang đăng ký..." : "Đăng ký"}
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
              text="signup_with"
              shape="rectangular"
              logo_alignment="left"
            />
          </div>
          */}

          {/* Login Link */}
          <p className="text-center text-white/60 text-sm">
            Đã có tài khoản?{" "}
            <Link
              to="/login"
              className="text-primary hover:text-primary-light font-semibold transition"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
