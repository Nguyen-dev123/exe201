import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/api";
import AuthShell from "../components/AuthShell";
import { useAuthStore } from "../store/authStore";

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ mode: "onTouched" });
  const password = watch("password");

  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError("");
    try {
      const response = await api.post("/api/auth/register", {
        displayName: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
      });

      // Registration successful - redirect to login page
      toast.success(
        response.data.message ||
          "Tạo tài khoản thành công! Vui lòng đăng nhập.",
      );
      navigate("/login", { replace: true });
    } catch (error) {
      if (error.response?.data?.code === "ACCOUNT_EXISTS") {
        setSubmitError(
          "Email này đã có tài khoản. Vui lòng chuyển sang đăng nhập.",
        );
        return;
      }
      setSubmitError(
        error.response?.data?.message ||
          "Không thể tạo tài khoản. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const updateCapsLock = (event) => {
    setCapsLockOn(event.getModifierState?.("CapsLock") || false);
  };

  return (
    <AuthShell>
      <header className="auth-form-heading">
        <p className="auth-form-kicker">Bắt đầu cùng HOCA</p>
        <h2>Tạo tài khoản học tập</h2>
        <p>Thiết lập tài khoản để vào phòng học và theo dõi tiến độ.</p>
      </header>

      <nav className="auth-tabs" aria-label="Chọn hình thức xác thực">
        <Link to="/login">Đăng nhập</Link>
        <Link to="/register" className="is-active" aria-current="page">
          Đăng ký
        </Link>
      </nav>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="auth-form auth-register-form"
        noValidate
        aria-busy={loading}
      >
        {submitError && (
          <div className="auth-submit-error" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <span>{submitError}</span>
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="register-name">Họ và tên</label>
          <div className="auth-input-wrap">
            <User size={19} aria-hidden="true" />
            <input
              id="register-name"
              {...register("name", {
                required: "Vui lòng nhập họ và tên.",
                minLength: {
                  value: 2,
                  message: "Họ và tên phải có ít nhất 2 ký tự.",
                },
              })}
              type="text"
              autoComplete="name"
              placeholder="Nguyễn Minh Anh"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "register-name-error" : undefined}
            />
          </div>
          {errors.name && (
            <p
              id="register-name-error"
              className="auth-field-error"
              role="alert"
            >
              {errors.name.message}
            </p>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="register-email">Email</label>
          <div className="auth-input-wrap">
            <Mail size={19} aria-hidden="true" />
            <input
              id="register-email"
              {...register("email", {
                required: "Vui lòng nhập email.",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Email chưa đúng định dạng.",
                },
              })}
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="ban@hoca.vn"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={
                errors.email ? "register-email-error" : undefined
              }
            />
          </div>
          {errors.email && (
            <p
              id="register-email-error"
              className="auth-field-error"
              role="alert"
            >
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="register-password">Mật khẩu</label>
          <div className="auth-input-wrap">
            <Lock size={19} aria-hidden="true" />
            <input
              id="register-password"
              {...register("password", {
                required: "Vui lòng tạo mật khẩu.",
                minLength: {
                  value: 6,
                  message: "Mật khẩu phải có ít nhất 6 ký tự.",
                },
              })}
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Tối thiểu 6 ký tự"
              onKeyDown={updateCapsLock}
              onKeyUp={updateCapsLock}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? "register-password-error" : undefined
              }
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          {errors.password ? (
            <p
              id="register-password-error"
              className="auth-field-error"
              role="alert"
            >
              {errors.password.message}
            </p>
          ) : capsLockOn ? (
            <p className="auth-field-note">Caps Lock đang bật.</p>
          ) : (
            <p className="auth-field-note">
              Dùng ít nhất 6 ký tự để bảo vệ tài khoản.
            </p>
          )}
        </div>

        <div className="auth-field">
          <label htmlFor="register-confirm-password">Xác nhận mật khẩu</label>
          <div className="auth-input-wrap">
            <Lock size={19} aria-hidden="true" />
            <input
              id="register-confirm-password"
              {...register("confirmPassword", {
                required: "Vui lòng nhập lại mật khẩu.",
                validate: (value) =>
                  value === password || "Mật khẩu xác nhận chưa khớp.",
              })}
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu"
              onKeyDown={updateCapsLock}
              onKeyUp={updateCapsLock}
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword
                  ? "register-confirm-password-error"
                  : undefined
              }
            />
            <button
              type="button"
              className="auth-password-toggle"
              onClick={() => setShowConfirmPassword((current) => !current)}
              aria-label={
                showConfirmPassword
                  ? "Ẩn mật khẩu xác nhận"
                  : "Hiện mật khẩu xác nhận"
              }
              aria-pressed={showConfirmPassword}
            >
              {showConfirmPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p
              id="register-confirm-password-error"
              className="auth-field-error"
              role="alert"
            >
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button type="submit" disabled={loading} className="auth-submit-button">
          {loading && (
            <Loader2
              className="auth-loading-icon"
              size={19}
              aria-hidden="true"
            />
          )}
          <span>{loading ? "Đang tạo tài khoản..." : "Tạo tài khoản"}</span>
        </button>
      </form>
    </AuthShell>
  );
}
