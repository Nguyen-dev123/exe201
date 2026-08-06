import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { authApi } from "../lib/services";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await authApi.forgotPassword(data.email);
      if (result.developmentResetUrl) {
        const target = new URL(result.developmentResetUrl, window.location.origin);
        toast.success("Mở trang đặt lại mật khẩu trong môi trường local");
        navigate(`${target.pathname}${target.search}`);
        return;
      }
      setSent(true);
      toast.success("Đã gửi email khôi phục!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Không gửi được email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 text-white">
      <div className="w-full max-w-md">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 text-sm"
        >
          <ArrowLeft size={16} /> Quay lại đăng nhập
        </Link>

        <div className="stat-card">
          {sent ? (
            <div className="text-center py-6">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Kiểm tra email của bạn</h2>
              <p className="text-white/60 text-sm">
                Chúng tôi đã gửi liên kết đặt lại mật khẩu. Hãy kiểm tra hộp thư
                (kể cả thư rác).
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold mb-2">Quên mật khẩu?</h2>
              <p className="text-white/60 text-sm mb-6">
                Nhập email và chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.
              </p>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <label htmlFor="forgot-password-email" className="sr-only">Email</label>
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
                    size={18}
                  />
                  <input
                    id="forgot-password-email"
                    {...register("email", {
                      required: "Email là bắt buộc",
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: "Email không hợp lệ",
                      },
                    })}
                    type="email"
                    required
                    aria-invalid={errors.email ? "true" : "false"}
                    aria-describedby={errors.email ? "forgot-password-email-error" : undefined}
                    placeholder="name@example.com"
                    className="app-input pl-10"
                  />
                </div>
                {errors.email && (
                  <p id="forgot-password-email-error" className="text-red-400 text-xs" role="alert">{errors.email.message}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading ? "Đang gửi..." : "Gửi liên kết khôi phục"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
