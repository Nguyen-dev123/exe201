import { useState, useRef } from "react";
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
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { userApi, authApi, paymentApi, uploadApi } from "../lib/services";
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
  const { user, setUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm({
    defaultValues: {
      displayName: user?.displayName || "",
      bio: user?.bio || "",
      dailyStudyGoal: user?.dailyStudyGoal || 120,
    },
  });

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      const updated = await userApi.updateMe({
        displayName: data.displayName,
        bio: data.bio,
        dailyStudyGoal: parseInt(data.dailyStudyGoal),
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
      <button
        type="submit"
        disabled={saving}
        className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
      >
        <Save size={16} />
        {saving ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </form>
  );
}

function PasswordTab() {
  const [saving, setSaving] = useState(false);
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
    </form>
  );
}

function TransactionsTab() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-transactions"],
    queryFn: () => paymentApi.getTransactions(1, 20),
  });

  const statusStyle = {
    COMPLETED: "bg-green-500/15 text-green-400",
    PENDING: "bg-yellow-500/15 text-yellow-400",
    FAILED: "bg-red-500/15 text-red-400",
  };

  return (
    <div className="stat-card">
      {isLoading ? (
        <div className="text-center py-10 text-white/50">Đang tải...</div>
      ) : !data?.transactions?.length ? (
        <div className="text-center py-10 text-white/40">
          <Receipt className="mx-auto mb-2 opacity-40" size={32} />
          Chưa có giao dịch nào
        </div>
      ) : (
        <div className="divide-y divide-white/5">
          {data.transactions.map((t) => (
            <div key={t._id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">{t.plan?.name || "Gói HOCA+"}</p>
                <p className="text-xs text-white/40">
                  {formatDate(t.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatVND(t.amount)}</p>
                <span
                  className={`pill ${statusStyle[t.status] || "bg-white/10 text-white/60"}`}
                >
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
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
    if (
      !window.confirm(
        "Bạn CHẮC CHẮN muốn xóa tài khoản? Hành động này không thể hoàn tác và sẽ xóa toàn bộ dữ liệu học tập.",
      )
    )
      return;
    try {
      await userApi.deleteMe();
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
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-3xl font-bold overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                user?.displayName?.[0]?.toUpperCase() || "U"
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition"
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
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{user?.displayName}</h1>
            <p className="text-white/50">{user?.email}</p>
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
      <div className="flex gap-2 mb-5 flex-wrap">
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
          Giao dịch
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
      {tab === "password" && <PasswordTab />}
      {tab === "billing" && <TransactionsTab />}
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
