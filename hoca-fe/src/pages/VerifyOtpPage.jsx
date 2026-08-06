import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, Loader2, Mail, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import AuthShell from "../components/AuthShell";
import { authApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";

const RESEND_SECONDS = 60;

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [code, setCode] = useState(
    searchParams.get("code") || location.state?.developmentCode || "",
  );
  const [developmentMode, setDevelopmentMode] = useState(
    Boolean(location.state?.developmentCode),
  );
  const [countdown, setCountdown] = useState(
    searchParams.get("sent") === "1" ? RESEND_SECONDS : 0,
  );
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (countdown <= 0) return undefined;
    const timer = window.setInterval(() => {
      setCountdown((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [countdown]);

  const handleVerify = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedCode = code.replace(/\D/g, "").slice(0, 6);
    if (!normalizedEmail || normalizedCode.length !== 6) {
      setError("Vui lòng nhập email và mã xác minh gồm 6 chữ số.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const result = await authApi.verifyOtp(normalizedEmail, normalizedCode);
      setAuth(result.user, result.token, result.refreshToken);
      toast.success("Xác minh email thành công.");
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Không thể xác minh mã. Vui lòng thử lại.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Vui lòng nhập email đã dùng để đăng ký.");
      return;
    }

    setResending(true);
    setError("");
    try {
      const result = await authApi.resendOtp(normalizedEmail);
      if (result.developmentCode) {
        setCode(result.developmentCode);
        setDevelopmentMode(true);
        setCountdown(result.retryAfterSeconds || 0);
        toast("SMTP chưa gửi được. Mã development đã được điền tự động.");
      } else {
        setCountdown(RESEND_SECONDS);
        toast.success("Đã gửi mã xác minh mới.");
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          "Chưa thể gửi lại mã. Vui lòng thử lại sau.",
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell>
      <header className="auth-form-heading">
        <p className="auth-form-kicker">Bảo vệ tài khoản</p>
        <h2>Xác minh email</h2>
        <p>Nhập mã gồm 6 chữ số đã được gửi đến email đăng ký của bạn.</p>
      </header>

      <form className="auth-form" onSubmit={handleVerify} noValidate>
        {error && (
          <div className="auth-submit-error" role="alert">
            <AlertCircle size={18} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}

        {developmentMode && (
          <div className="auth-dev-notice" role="status">
            Đang chạy development: SMTP Gmail chưa xác thực nên mã đã được điền tự động.
          </div>
        )}

        <div className="auth-field">
          <label htmlFor="verify-email">Email</label>
          <div className="auth-input-wrap">
            <Mail size={19} aria-hidden="true" />
            <input
              id="verify-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              inputMode="email"
              placeholder="ban@hoca.vn"
              required
            />
          </div>
        </div>

        <div className="auth-field">
          <label htmlFor="verify-code">Mã xác minh</label>
          <div className="auth-input-wrap auth-otp-input">
            <ShieldCheck size={19} aria-hidden="true" />
            <input
              id="verify-code"
              type="text"
              value={code}
              onChange={(event) =>
                setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
              }
              autoComplete="one-time-code"
              inputMode="numeric"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="000000"
              aria-describedby="verify-code-note"
              required
              autoFocus
            />
          </div>
          <p id="verify-code-note" className="auth-field-note">
            Mã có hiệu lực trong 5 phút và chỉ dùng được một lần.
          </p>
        </div>

        <button type="submit" className="auth-submit-button" disabled={loading}>
          {loading && <Loader2 className="auth-loading-icon" size={19} aria-hidden="true" />}
          <span>{loading ? "Đang xác minh..." : "Xác minh tài khoản"}</span>
        </button>
      </form>

      <div className="auth-otp-actions">
        <button
          type="button"
          onClick={handleResend}
          disabled={countdown > 0 || resending}
        >
          {resending
            ? "Đang gửi..."
            : countdown > 0
              ? `Gửi lại sau ${countdown}s`
              : "Gửi lại mã"}
        </button>
        <Link to="/login">Quay lại đăng nhập</Link>
      </div>
    </AuthShell>
  );
}
