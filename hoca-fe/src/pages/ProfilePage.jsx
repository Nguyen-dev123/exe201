import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useForm } from "react-hook-form";
import {
  User,
  Lock,
  Receipt,
  TrendingUp,
  Flame,
  Clock,
  Save,
  Crown,
  Camera,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock3,
  MonitorSmartphone,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Download,
  RefreshCw,
  CalendarDays,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { userApi, authApi, paymentApi, pricingApi, uploadApi } from "../lib/services";
import Avatar from "../components/Avatar";
import { confirmDialog, promptDialog } from "../lib/dialog";
import {
  formatMinutes,
  minutesToHours,
  formatVND,
  formatDate,
  getTierInfo,
} from "../lib/format";

function TabButton({ active, onClick, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
        active
          ? "bg-primary text-white"
          : "text-white/60 hover:text-white hover:bg-dark-lighter"
      }`}
    >
      <Icon size={16} />
      {children}
    </button>
  );
}

function ProfileTab() {
  const { user, setUser, logout } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      displayName: user?.displayName || "",
      bio: user?.bio || "",
      dailyStudyGoal: user?.dailyStudyGoal || 120,
      profileVisibility: user?.profileVisibility || "PUBLIC",
      showStudyStats: user?.showStudyStats !== false,
      searchable: user?.searchable !== false,
      notificationEnabled: user?.notificationEnabled !== false,
    },
  });

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const updated = await userApi.updateMe({
        displayName: data.displayName,
        bio: data.bio,
        dailyStudyGoal: parseInt(data.dailyStudyGoal),
        profileVisibility: data.profileVisibility,
        showStudyStats: Boolean(data.showStudyStats),
        searchable: Boolean(data.searchable),
        notificationEnabled: Boolean(data.notificationEnabled),
      });
      setUser({ ...user, ...updated });
      toast.success("Đã cập nhật hồ sơ!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="stat-card space-y-5">
      <div>
        <label className="block text-sm text-white/60 mb-2">Họ và tên</label>
        <input
          {...register("displayName", { required: true })}
          className="app-input"
        />
      </div>
      <div>
        <label className="block text-sm text-white/60 mb-2">Giới thiệu</label>
        <textarea
          {...register("bio")}
          rows={3}
          className="app-input"
          placeholder="Vài dòng về bạn..."
        />
      </div>
      <div>
        <label className="block text-sm text-white/60 mb-2">
          Mục tiêu học mỗi ngày (phút)
        </label>
        <input
          type="number"
          min="15"
          max="960"
          {...register("dailyStudyGoal", { required: true })}
          className="app-input"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm text-white/60">Quyền riêng tư hồ sơ<select {...register("profileVisibility")} className="app-input mt-2"><option value="PUBLIC">Công khai</option><option value="MEMBERS">Chỉ thành viên</option><option value="PRIVATE">Riêng tư</option></select></label>
        <div className="space-y-3 pt-1 text-sm text-white/65"><label className="flex items-center gap-2"><input type="checkbox" {...register("showStudyStats")}/> Hiển thị tiến độ học tập</label><label className="flex items-center gap-2"><input type="checkbox" {...register("searchable")}/> Cho phép tìm thấy hồ sơ</label><label className="flex items-center gap-2"><input type="checkbox" {...register("notificationEnabled")}/> Nhận thông báo trong ứng dụng</label></div>
      </div>
      <button
        type="submit"
        disabled={saving}
        className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
      >
        <Save size={16} />
        {saving ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
      <div className="border-t border-white/10 pt-5">
        <p className="text-sm font-medium">Email đăng nhập</p>
        <p className="mt-1 text-sm text-white/50">{user?.email}</p>
        <button type="button" className="btn-secondary mt-3" onClick={async()=>{const newEmail=await promptDialog("Nhập email mới:","",{title:"Đổi địa chỉ email",type:"email"});const password=await promptDialog("Nhập mật khẩu hiện tại:","",{title:"Xác nhận danh tính",type:"password"});if(!newEmail||!password)return;try{await userApi.requestEmailChange(password,newEmail);const code=await promptDialog("Nhập mã 6 chữ số đã gửi đến email mới:","",{title:"Xác minh email",confirmText:"Xác minh"});if(code){await userApi.confirmEmailChange(code.trim());toast.success("Đã đổi email. Vui lòng đăng nhập lại.");logout();window.location.href="/login";}}catch(error){toast.error(error.response?.data?.message||"Không thể đổi email");}}}>Đổi email có xác minh</button>
      </div>
      <div className="border-t border-white/10 pt-5"><p className="text-sm font-medium">Dữ liệu tài khoản</p><button type="button" className="btn-secondary mt-3" onClick={async()=>{try{const blob=await userApi.exportData();const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='hoca-account-data.json';a.click();URL.revokeObjectURL(url);}catch{toast.error('Không thể tải dữ liệu');}}}>Tải xuống dữ liệu của tôi</button></div>
    </form>
  );
}

function PasswordTab({ user, onUserUpdated }) {
  const [saving, setSaving] = useState(false);
  const [twoFactorBusy, setTwoFactorBusy] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm();
  const newPassword = watch("newPassword");

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await authApi.changePassword(data.oldPassword, data.newPassword);
      toast.success("Đã đổi mật khẩu!");
      reset();
    } catch (err) {
      toast.error(err.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const changeTwoFactor = async (enable) => {
    try {
      if (enable) {
        setTwoFactorBusy(true);
        const setup = await authApi.begin2fa();
        await promptDialog("Sao chép khóa này vào ứng dụng xác thực:", setup.secret, { title: "Thiết lập xác thực hai lớp", confirmText: "Tiếp tục" });
        const code = await promptDialog("Nhập mã 6 chữ số từ ứng dụng:", "", { title: "Xác nhận 2FA", confirmText: "Kích hoạt" });
        if (!code) return;
        await authApi.confirm2fa(code.trim());
      } else {
        const password = await promptDialog("Nhập mật khẩu:", "", { title: "Tắt xác thực hai lớp", type: "password" });
        if (!password) return;
        const code = await promptDialog("Nhập mã 2FA hiện tại:", "", { title: "Xác nhận 2FA" });
        if (!code) return;
        setTwoFactorBusy(true);
        await authApi.disable2fa(password, code.trim());
      }
      onUserUpdated({ ...user, twoFactorEnabled: enable });
      toast.success(enable ? "Đã bật 2FA" : "Đã tắt 2FA");
    } catch (error) {
      toast.error(error.response?.data?.message || (enable ? "Không thể bật 2FA" : "Không thể tắt 2FA"));
    } finally { setTwoFactorBusy(false); }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="stat-card space-y-5">
      <div>
        <label className="block text-sm text-white/60 mb-2">
          Mật khẩu hiện tại
        </label>
        <input
          type="password"
          {...register("oldPassword", { required: "Bắt buộc" })}
          className="app-input"
        />
        {errors.oldPassword && (
          <p className="text-red-400 text-xs mt-1">
            {errors.oldPassword.message}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm text-white/60 mb-2">Mật khẩu mới</label>
        <input
          type="password"
          {...register("newPassword", {
            required: "Bắt buộc",
            minLength: { value: 6, message: "Ít nhất 6 ký tự" },
          })}
          className="app-input"
        />
        {errors.newPassword && (
          <p className="text-red-400 text-xs mt-1">
            {errors.newPassword.message}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm text-white/60 mb-2">
          Xác nhận mật khẩu mới
        </label>
        <input
          type="password"
          {...register("confirmPassword", {
            validate: (v) => v === newPassword || "Mật khẩu không khớp",
          })}
          className="app-input"
        />
        {errors.confirmPassword && (
          <p className="text-red-400 text-xs mt-1">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={saving}
        className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
      >
        <Lock size={16} />
        {saving ? "Đang lưu..." : "Đổi mật khẩu"}
      </button>
      <div className="mt-8 border-t border-white/10 pt-6">
        <h3 className="font-semibold">Xác thực hai lớp (2FA)</h3>
        <p className="mt-1 text-sm text-white/50">Bảo vệ tài khoản bằng ứng dụng Google Authenticator, Microsoft Authenticator hoặc ứng dụng TOTP.</p>
        <button
          type="button"
          disabled={twoFactorBusy}
          className={user?.twoFactorEnabled ? "mt-4 rounded-lg bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-300 disabled:opacity-50" : "btn-secondary mt-4 disabled:opacity-50"}
          onClick={() => changeTwoFactor(!user?.twoFactorEnabled)}
        >
          {twoFactorBusy ? "Đang xử lý..." : user?.twoFactorEnabled ? "Tắt 2FA" : "Bật 2FA"}
        </button>
      </div>
    </form>
  );
}

// eslint-disable-next-line no-unused-vars
function TransactionsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-transactions"],
    queryFn: () => paymentApi.getTransactions(1, 20),
  });

  const STATUS = {
    COMPLETED: {
      label: "Thành công",
      style: "bg-green-500/15 text-green-400",
      icon: CheckCircle2,
    },
    PENDING: {
      label: "Đang chờ",
      style: "bg-yellow-500/15 text-yellow-400",
      icon: Clock3,
    },
    FAILED: {
      label: "Thất bại",
      style: "bg-red-500/15 text-red-400",
      icon: XCircle,
    },
  };

  const transactions = data?.transactions || [];

  // Tổng tiền đã chi (chỉ tính giao dịch thành công)
  const totalSpent = transactions
    .filter((t) => t.status === "COMPLETED")
    .reduce((sum, t) => sum + (t.amount || 0), 0);
  const successCount = transactions.filter(
    (t) => t.status === "COMPLETED",
  ).length;

  if (isLoading) {
    return (
      <div className="stat-card text-center py-10 text-white/50">
        Đang tải...
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div className="stat-card text-center py-12 text-white/40">
        <Receipt className="mx-auto mb-3 opacity-40" size={36} />
        <p className="font-medium text-white/60">Chưa có giao dịch nào</p>
        <p className="text-sm mt-1">
          Lịch sử thanh toán của bạn sẽ hiển thị ở đây.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Tổng quan */}
      <div className="grid grid-cols-2 gap-3">
        <div className="stat-card py-4">
          <p className="text-white/50 text-xs mb-1">Tổng đã chi</p>
          <p className="text-xl font-bold gradient-text">
            {formatVND(totalSpent)}
          </p>
        </div>
        <div className="stat-card py-4">
          <p className="text-white/50 text-xs mb-1">Giao dịch thành công</p>
          <p className="text-xl font-bold">{successCount}</p>
        </div>
      </div>

      {/* Danh sách giao dịch */}
      <div className="stat-card">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Receipt size={18} className="text-primary" />
          Lịch sử thanh toán
        </h3>
        <div className="divide-y divide-white/5">
          {transactions.map((t) => {
            const st = STATUS[t.status] || {
              label: t.status,
              style: "bg-white/10 text-white/60",
              icon: Clock3,
            };
            const StIcon = st.icon;
            return (
              <div
                key={t._id}
                className="flex items-center justify-between py-3 gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${st.style}`}
                  >
                    <StIcon size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {t.plan?.name || "Gói HOCA+"}
                    </p>
                    <p className="text-xs text-white/40">
                      {formatDate(t.createdAt)}
                      {t.paymentMethod ? ` · ${t.paymentMethod}` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold">{formatVND(t.amount)}</p>
                  <span
                    className={`pill ${st.style} mt-1 inline-flex items-center gap-1`}
                  >
                    <StIcon size={12} />
                    {st.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BillingTab() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState("");
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["my-transactions", page],
    queryFn: () => paymentApi.getTransactions(page, 8),
  });
  const { data: plans = [] } = useQuery({
    queryKey: ["pricing-plans"],
    queryFn: pricingApi.getPlans,
  });
  const currentPlan = plans.find((plan) => plan.tier === user?.subscriptionTier);
  const transactions = data?.transactions || [];
  const tier = getTierInfo(user?.subscriptionTier);

  const downloadReceipt = async (transaction) => {
    setBusyId(`receipt-${transaction._id}`);
    try {
      const blob = await paymentApi.downloadReceipt(transaction._id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `hoca-receipt-${transaction.txnRef}.html`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể tải biên nhận");
    } finally {
      setBusyId("");
    }
  };

  const retryPayment = async (transaction) => {
    setBusyId(`retry-${transaction._id}`);
    try {
      const result = await paymentApi.retryTransaction(transaction._id);
      const destination = result.url || result.checkoutUrl || result.successUrl;
      if (destination) window.location.assign(destination);
      else toast.success("Đã tạo lại yêu cầu thanh toán");
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể thanh toán lại");
    } finally {
      setBusyId("");
    }
  };

  const askRefund = async (transaction) => {
    const reason = await promptDialog("Mô tả lý do yêu cầu hoàn tiền (ít nhất 10 ký tự):", "", { title: "Yêu cầu hoàn tiền", confirmText: "Gửi yêu cầu" });
    if (!reason) return;
    setBusyId(`refund-${transaction._id}`);
    try {
      await paymentApi.requestRefund(transaction._id, reason);
      toast.success("Đã gửi yêu cầu hoàn tiền");
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể gửi yêu cầu hoàn tiền");
    } finally {
      setBusyId("");
    }
  };

  return <div className="space-y-4">
    <section className="stat-card overflow-hidden">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Gói của tôi</p>
          <h2 className="mt-2 text-2xl font-bold">{currentPlan?.name || tier.label}</h2>
          <p className="mt-2 text-sm text-white/55">Thanh toán một lần, không tự động gia hạn hoặc tự động trừ tiền.</p>
        </div>
        <button onClick={() => navigate("/pricing")} className="btn-primary min-h-11 whitespace-nowrap px-5">
          {user?.subscriptionTier === "FREE" ? "Nâng cấp gói" : "Gia hạn / đổi gói"}
        </button>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><span className="flex items-center gap-2 text-xs text-white/45"><CalendarDays size={15}/> Ngày bắt đầu</span><strong className="mt-2 block">{user?.subscriptionStartDate ? formatDate(user.subscriptionStartDate) : "Chưa có"}</strong></div>
        <div className="rounded-xl border border-white/10 bg-white/[0.025] p-4"><span className="flex items-center gap-2 text-xs text-white/45"><Clock3 size={15}/> Ngày hết hạn</span><strong className="mt-2 block">{user?.subscriptionTier === "LIFETIME" ? "Trọn đời" : user?.subscriptionExpiry ? formatDate(user.subscriptionExpiry) : "Không áp dụng"}</strong></div>
      </div>
      {!!currentPlan?.features?.length && <div className="mt-5 border-t border-white/10 pt-4"><p className="text-sm font-semibold">Quyền lợi hiện tại</p><ul className="mt-3 grid gap-2 text-sm text-white/65 sm:grid-cols-2">{currentPlan.features.map((feature) => <li key={feature} className="flex gap-2"><CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary"/>{feature}</li>)}</ul></div>}
    </section>

    <section className="stat-card">
      <div className="flex items-center justify-between gap-3"><h3 className="flex items-center gap-2 font-semibold"><Receipt size={18} className="text-primary"/> Lịch sử giao dịch</h3><span className="text-xs text-white/40">{data?.total || 0} giao dịch</span></div>
      {isLoading && <div className="mt-4 space-y-3">{[1, 2, 3].map((item) => <div key={item} className="h-16 animate-pulse rounded-xl bg-white/5"/>)}</div>}
      {isError && <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/5 p-4 text-sm text-red-200">Không tải được lịch sử giao dịch. <button onClick={() => refetch()} className="ml-2 underline">Thử lại</button></div>}
      {!isLoading && !isError && !transactions.length && <div className="py-10 text-center text-sm text-white/45">Bạn chưa có giao dịch nào.</div>}
      <div className="mt-3 divide-y divide-white/10">{transactions.map((transaction) => {
        const status = transaction.status === "COMPLETED" ? ["Thành công", "text-emerald-300 bg-emerald-500/10"] : transaction.status === "FAILED" ? ["Thất bại", "text-red-300 bg-red-500/10"] : ["Đang chờ", "text-amber-300 bg-amber-500/10"];
        return <article key={transaction._id} className="py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><div className="flex items-center gap-2"><strong className="truncate">{transaction.plan?.name || "Gói HOCA+"}</strong><span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${status[1]}`}>{status[0]}</span></div><p className="mt-1 text-xs text-white/40">{formatDate(transaction.createdAt)} · {transaction.paymentMethod || "--"} · {transaction.txnRef}</p></div><strong className="shrink-0">{formatVND(transaction.amount)}</strong></div>
          <div className="mt-3 flex flex-wrap gap-2">
            {transaction.status === "COMPLETED" && <button disabled={busyId === `receipt-${transaction._id}`} onClick={() => downloadReceipt(transaction)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-white/10 px-3 text-xs font-semibold text-white/65 hover:border-primary/35 hover:text-primary disabled:opacity-40"><Download size={14}/> Biên nhận</button>}
            {transaction.status === "FAILED" && <button disabled={busyId === `retry-${transaction._id}`} onClick={() => retryPayment(transaction)} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-primary/35 px-3 text-xs font-semibold text-primary hover:bg-primary/10 disabled:opacity-40"><RefreshCw size={14}/> Thanh toán lại</button>}
            {transaction.status === "COMPLETED" && (!transaction.refundStatus || transaction.refundStatus === "NONE") && <button disabled={busyId === `refund-${transaction._id}`} onClick={() => askRefund(transaction)} className="min-h-9 rounded-lg px-3 text-xs font-semibold text-white/45 hover:bg-white/5 hover:text-white disabled:opacity-40">Yêu cầu hoàn tiền</button>}
            {transaction.refundStatus && transaction.refundStatus !== "NONE" && <span className="self-center text-xs text-amber-300">Hoàn tiền: {transaction.refundStatus}</span>}
          </div>
        </article>;
      })}</div>
      {(data?.totalPages || 1) > 1 && <div className="mt-5 flex items-center justify-center gap-3"><button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="btn-secondary min-h-10 px-3 disabled:opacity-35" aria-label="Trang trước"><ChevronLeft size={17}/></button><span className="text-sm text-white/55">Trang {page}/{data.totalPages}</span><button onClick={() => setPage((value) => Math.min(data.totalPages, value + 1))} disabled={page >= data.totalPages} className="btn-secondary min-h-10 px-3 disabled:opacity-35" aria-label="Trang sau"><ChevronRight size={17}/></button></div>}
    </section>
  </div>;
}

function SessionsTab({ onLogoutAll }) {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const load = async () => {
    setLoading(true);
    setError("");
    try { setSessions(await authApi.getSessions()); }
    catch { setError("Không tải được danh sách phiên đăng nhập."); }
    finally { setLoading(false); }
  };
  const revoke = async (session) => {
    if (!(await confirmDialog("Thu hồi phiên đăng nhập trên thiết bị này?", { destructive: true, confirmText: "Thu hồi phiên" }))) return;
    setBusyId(session.sessionId);
    try {
      await authApi.revokeSession(session.sessionId);
      await load();
      toast.success("Đã thu hồi phiên đăng nhập");
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || "Không thể thu hồi phiên đăng nhập");
    } finally { setBusyId(""); }
  };
  useEffect(() => { load(); }, []);
  return <div className="stat-card">
    <h3 className="flex items-center gap-2 font-semibold"><MonitorSmartphone size={18}/> Thiết bị và phiên đăng nhập</h3>
    {loading && <div className="skeleton mt-4 h-20 w-full rounded-xl" />}
    {error && <p className="mt-3 text-sm text-red-300" role="alert">{error} <button type="button" className="underline" onClick={load}>Thử lại</button></p>}
    {!loading && !error && sessions.length === 0 && <p className="mt-4 text-sm text-white/45">Không có phiên đăng nhập nào khác.</p>}
    {!loading && !error && <div className="mt-4 divide-y divide-white/10">{sessions.map(session=><div key={session.sessionId} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{session.userAgent || "Thiết bị không xác định"}</p><p className="mt-1 text-xs text-white/40">{session.ip || "--"} · {formatDate(session.lastUsedAt)}</p></div><button type="button" disabled={busyId === session.sessionId} onClick={() => revoke(session)} className="text-xs text-red-300 hover:text-red-200 disabled:opacity-40">{busyId === session.sessionId ? "Đang thu hồi..." : "Thu hồi"}</button></div>)}</div>}
    <button onClick={onLogoutAll} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-300"><LogOut size={16}/> Đăng xuất tất cả thiết bị</button>
  </div>;
}

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const [tab, setTab] = useState("profile");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);
  const navigate = useNavigate();
  const tier = getTierInfo(user?.subscriptionTier);

  const { data: dashboard } = useQuery({
    queryKey: ["dashboard"],
    queryFn: userApi.getDashboard,
  });
  const stats = dashboard?.stats || {};

  const handleAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.avatar(file);
      setUser({ ...user, avatar: res.url });
      toast.success("Đã cập nhật ảnh đại diện!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Tải ảnh thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const password = await promptDialog("Nhập lại mật khẩu để yêu cầu xóa tài khoản:", "", { title: "Xác nhận danh tính", type: "password" });
    if (!password) return;
    try {
      await userApi.requestDelete(password);
      const code = await promptDialog("Nhập mã xác nhận 6 chữ số vừa được gửi đến email của bạn:", "", { title: "Xác minh xóa tài khoản" });
      if (!code) return;
      if (!(await confirmDialog("Xóa vĩnh viễn tài khoản và dữ liệu cá nhân? Hành động này không thể hoàn tác.", { destructive: true, confirmText: "Xóa vĩnh viễn" }))) return;
      await userApi.deleteMe(password, code.trim());
      toast.success("Đã xóa tài khoản");
      logout();
      navigate("/");
    } catch (err) {
      toast.error(err.response?.data?.message || "Xóa thất bại");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      {/* Header card */}
      <div className="stat-card mb-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative group">
            <Avatar user={user} size={80} rounded="2xl" />
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="avatar-edit-button absolute inset-0 flex items-center justify-center rounded-2xl bg-black/50 opacity-0 transition group-hover:opacity-100"
              title="Đổi ảnh đại diện"
            >
              <Camera size={20} />
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleAvatar}
              className="hidden"
            />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold sm:text-2xl">{user?.displayName}</h1>
            <p className="break-all text-sm text-white/50 sm:text-base">{user?.email}</p>
            <span className={`pill mt-2 ${tier.bg} ${tier.color}`}>
              <Crown size={13} /> {tier.label}
            </span>
            {uploading && (
              <p className="text-xs text-primary mt-1">Đang tải ảnh...</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="text-center p-3 rounded-xl bg-dark-lighter">
            <Clock className="mx-auto text-blue-400 mb-1" size={18} />
            <div className="font-bold">
              {minutesToHours(stats.totalMinutes)}h
            </div>
            <div className="text-xs text-white/40">Tổng giờ học</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-dark-lighter">
            <Flame className="mx-auto text-orange-400 mb-1" size={18} />
            <div className="font-bold">{stats.currentStreak || 0}</div>
            <div className="text-xs text-white/40">Chuỗi ngày</div>
          </div>
          <div className="text-center p-3 rounded-xl bg-dark-lighter">
            <TrendingUp className="mx-auto text-green-400 mb-1" size={18} />
            <div className="font-bold">{formatMinutes(stats.todayMinutes)}</div>
            <div className="text-xs text-white/40">Hôm nay</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs mb-5 flex gap-2 overflow-x-auto pb-1">
        <TabButton
          active={tab === "sessions"}
          onClick={() => setTab("sessions")}
          icon={MonitorSmartphone}
        >
          Thiết bị
        </TabButton>
        <TabButton
          active={tab === "profile"}
          onClick={() => setTab("profile")}
          icon={User}
        >
          Hồ sơ
        </TabButton>
        <TabButton
          active={tab === "password"}
          onClick={() => setTab("password")}
          icon={Lock}
        >
          Mật khẩu
        </TabButton>
        <TabButton
          active={tab === "billing"}
          onClick={() => setTab("billing")}
          icon={Receipt}
        >
          Gói của tôi
        </TabButton>
        <TabButton
          active={tab === "danger"}
          onClick={() => setTab("danger")}
          icon={Trash2}
        >
          Xóa tài khoản
        </TabButton>
      </div>

      {tab === "profile" && <ProfileTab />}
      {tab === "password" && <PasswordTab user={user} onUserUpdated={setUser} />}
      {tab === "sessions" && <SessionsTab onLogoutAll={async()=>{if(!(await confirmDialog("Đăng xuất khỏi tất cả thiết bị?", { destructive: true, confirmText: "Đăng xuất tất cả" })))return;await authApi.logoutAll();logout();navigate("/login");}} />}
      {tab === "billing" && <BillingTab />}
      {tab === "danger" && (
        <div className="stat-card border-red-500/20">
          <h3 className="font-semibold text-red-400 mb-2 flex items-center gap-2">
            <Trash2 size={18} /> Xóa tài khoản
          </h3>
          <p className="text-white/60 text-sm mb-4">
            Hành động này sẽ xóa vĩnh viễn tài khoản, lịch sử học tập, phòng và
            mọi dữ liệu liên quan. Không thể hoàn tác.
          </p>
          <button
            onClick={handleDeleteAccount}
            className="px-4 py-2.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500/25 transition font-semibold"
          >
            Xóa tài khoản của tôi
          </button>
        </div>
      )}
    </div>
  );
}
