import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Lock } from "lucide-react";
import { authApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
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
      const res = await authApi.resetPassword(token, data.password);
      if (res.token && res.user) {
        setAuth(res.user, res.token, res.refreshToken);
        toast.success("Đặt lại mật khẩu thành công!");
        navigate("/dashboard");
      } else {
        toast.success("Đặt lại mật khẩu thành công! Hãy đăng nhập.");
        navigate("/login");
      }
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Liên kết không hợp lệ hoặc đã hết hạn",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 text-white">
      <div className="w-full max-w-md stat-card">
        <h2 className="text-2xl font-bold mb-2">Đặt lại mật khẩu</h2>
        <p className="text-white/60 text-sm mb-6">
          Nhập mật khẩu mới cho tài khoản của bạn.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              size={18}
            />
            <input
              type="password"
              placeholder="Mật khẩu mới"
              {...register("password", {
                required: "Bắt buộc",
                minLength: { value: 6, message: "Ít nhất 6 ký tự" },
              })}
              className="app-input pl-10"
            />
          </div>
          {errors.password && (
            <p className="text-red-400 text-xs">{errors.password.message}</p>
          )}
          <div className="relative">
            <Lock
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
              size={18}
            />
            <input
              type="password"
              placeholder="Xác nhận mật khẩu"
              {...register("confirmPassword", {
                validate: (v) => v === password || "Mật khẩu không khớp",
              })}
              className="app-input pl-10"
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-red-400 text-xs">
              {errors.confirmPassword.message}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50"
          >
            {loading ? "Đang xử lý..." : "Đặt lại mật khẩu"}
          </button>
        </form>
        <p className="text-center text-white/50 text-sm mt-4">
          <Link to="/login" className="text-primary hover:underline">
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
