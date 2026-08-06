import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { AlertCircle, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { GoogleLogin } from "@react-oauth/google";
import api from "../lib/api";
import { authApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";
import AuthShell from "../components/AuthShell";
import { promptDialog } from "../lib/dialog";
import { GOOGLE_LOGIN_ENABLED } from "../lib/googleOAuth";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: "onTouched" });

  const finishLogin = (user, token, refreshToken) => {
    setAuth(user, token, refreshToken);
    const returnTo = window.sessionStorage.getItem("hoca-return-to");
    window.sessionStorage.removeItem("hoca-return-to");
    navigate(user?.role === "ADMIN" ? "/admin" : returnTo || "/", { replace: true });
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setSubmitError("");
    try {
      const response = await api.post("/api/auth/login", data);
      let authData = response.data;
      if (authData.requiresTwoFactor) {
        const code = await promptDialog("Nhập mã 6 chữ số từ ứng dụng xác thực:", "", { title: "Xác thực hai lớp", confirmText: "Xác thực" });
        if (!code) return;
        const verified = await api.post('/api/auth/2fa/login', { challengeToken: authData.challengeToken, code: code.trim() });
        authData = verified.data;
      }
      const { user, token, refreshToken } = authData;
      finishLogin(user, token, refreshToken);
      toast.success("Đăng nhập thành công!");
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          "Không thể đăng nhập. Vui lòng kiểm tra lại thông tin.",
      );
    } finally {
      setLoading(false);
    }
  };

  const updateCapsLock = (event) => {
    setCapsLockOn(event.getModifierState?.("CapsLock") || false);
  };

  const googleClientConfigured = GOOGLE_LOGIN_ENABLED;
  const handleGoogleSuccess = async ({ credential }) => {
    if (!credential) return;
    setLoading(true);
    setSubmitError("");
    try {
      const { user, token, refreshToken } = await authApi.google(credential);
      finishLogin(user, token, refreshToken);
      toast.success("Đăng nhập Google thành công!");
    } catch (error) {
      setSubmitError(error.response?.data?.message || "Không thể đăng nhập bằng Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <header className="auth-form-heading">
        <p className="auth-form-kicker">Chào mừng trở lại</p>
        <h2>Tiếp tục hành trình học</h2>
        <p>Đăng nhập để quay lại phòng học và tiến độ của bạn.</p>
      </header>

      <nav className="auth-tabs" aria-label="Chọn hình thức xác thực">
        <Link to="/login" className="is-active" aria-current="page">
          Đăng nhập
        </Link>
        <Link to="/register">Đăng ký</Link>
      </nav>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="auth-form"
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
          <label htmlFor="login-email">Email</label>
          <div className="auth-input-wrap">
            <Mail size={19} aria-hidden="true" />
            <input
              id="login-email"
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
              aria-describedby={errors.email ? "login-email-error" : undefined}
            />
          </div>
          {errors.email && (
            <p id="login-email-error" className="auth-field-error" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="auth-field">
          <div className="auth-label-row">
            <label htmlFor="login-password">Mật khẩu</label>
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>
          <div className="auth-input-wrap">
            <Lock size={19} aria-hidden="true" />
            <input
              id="login-password"
              {...register("password", {
                required: "Vui lòng nhập mật khẩu.",
                minLength: {
                  value: 6,
                  message: "Mật khẩu phải có ít nhất 6 ký tự.",
                },
              })}
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
              onKeyDown={updateCapsLock}
              onKeyUp={updateCapsLock}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password
                  ? "login-password-error"
                  : capsLockOn
                    ? "login-caps-lock"
                    : undefined
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
            <p id="login-password-error" className="auth-field-error" role="alert">
              {errors.password.message}
            </p>
          ) : capsLockOn ? (
            <p id="login-caps-lock" className="auth-field-note">
              Caps Lock đang bật.
            </p>
          ) : null}
        </div>

        <button type="submit" disabled={loading} className="auth-submit-button">
          {loading && <Loader2 className="auth-loading-icon" size={19} aria-hidden="true" />}
          <span>{loading ? "Đang đăng nhập..." : "Đăng nhập"}</span>
        </button>
      </form>

      {googleClientConfigured && (
        <div className="mt-5">
          <div className="mb-4 flex items-center gap-3 text-xs text-white/35"><span className="h-px flex-1 bg-white/10"/><span>Hoặc</span><span className="h-px flex-1 bg-white/10"/></div>
          <div className="flex justify-center">
            <GoogleLogin onSuccess={handleGoogleSuccess} onError={() => setSubmitError("Không thể mở đăng nhập Google.")} useOneTap={false} />
          </div>
        </div>
      )}

    </AuthShell>
  );
}
