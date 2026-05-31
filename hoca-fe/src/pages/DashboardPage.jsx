import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import {
  Flame,
  Clock,
  Target,
  Trophy,
  Award,
  TrendingUp,
  Sparkles,
  RotateCcw,
  Plus,
} from "lucide-react";
import { userApi, quoteApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";
import { formatMinutes, minutesToHours } from "../lib/format";

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}
        >
          <Icon size={22} />
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      <div className="text-sm text-white/50">{label}</div>
      {sub && <div className="text-xs text-white/40 mt-1">{sub}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [quote, setQuote] = useState(null);

  const {
    data: dashboard,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: userApi.getDashboard,
  });

  const { data: weekly } = useQuery({
    queryKey: ["weekly-activity"],
    queryFn: userApi.getWeeklyActivity,
  });

  useEffect(() => {
    quoteApi
      .getRandom()
      .then(setQuote)
      .catch(() => setQuote(null));
  }, []);

  const handleRecover = async () => {
    try {
      const res = await userApi.recoverStreak();
      toast.success(res.message || "Đã khôi phục streak!");
      refetch();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể khôi phục streak");
    }
  };

  const stats = dashboard?.stats || {};
  const goal = stats.dailyGoal || 120;
  const today = stats.todayMinutes || 0;
  const goalPct = Math.min(100, Math.round((today / goal) * 100));

  const maxWeekly = Math.max(1, ...(weekly?.map((d) => d.minutes) || [1]));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      {/* Greeting */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">
            Chào, {user?.displayName || "bạn"} 👋
          </h1>
          <p className="text-white/50 mt-1">
            Cùng nhìn lại hành trình học tập của bạn nhé.
          </p>
        </div>
        <Link
          to="/rooms"
          className="btn-primary inline-flex items-center gap-2 self-start"
        >
          <Plus size={18} /> Vào phòng học
        </Link>
      </div>

      {/* Motivational quote */}
      {quote && (
        <div className="mb-8 rounded-2xl bg-gradient-to-r from-primary/15 to-accent-purple/15 border border-primary/20 p-5 flex items-start gap-3">
          <Sparkles className="text-primary flex-shrink-0 mt-0.5" size={20} />
          <p className="text-white/90 italic">{quote.content}</p>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-20 text-white/50">Đang tải...</div>
      ) : (
        <>
          {/* Stat grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Clock}
              label="Tổng giờ học"
              value={`${minutesToHours(stats.totalMinutes)}h`}
              sub={formatMinutes(stats.totalMinutes)}
              color="bg-blue-500/15 text-blue-400"
            />
            <StatCard
              icon={Flame}
              label="Chuỗi hiện tại"
              value={`${stats.currentStreak || 0} ngày`}
              sub={`Dài nhất: ${stats.longestStreak || 0} ngày`}
              color="bg-orange-500/15 text-orange-400"
            />
            <StatCard
              icon={Target}
              label="Hôm nay"
              value={formatMinutes(today)}
              sub={`Mục tiêu: ${formatMinutes(goal)}`}
              color="bg-green-500/15 text-green-400"
            />
            <StatCard
              icon={Award}
              label="Huy hiệu"
              value={dashboard?.badges?.length || 0}
              sub="Đã mở khóa"
              color="bg-purple-500/15 text-purple-400"
            />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Daily goal + weekly chart */}
            <div className="lg:col-span-2 space-y-6">
              {/* Daily goal progress */}
              <div className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Target size={18} className="text-primary" />
                    Mục tiêu hôm nay
                  </h2>
                  <span className="text-sm text-white/50">
                    {formatMinutes(today)} / {formatMinutes(goal)}
                  </span>
                </div>
                <div className="w-full h-4 rounded-full bg-dark-lighter overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-500"
                    style={{ width: `${goalPct}%` }}
                  />
                </div>
                <p className="text-sm text-white/50 mt-2">
                  {goalPct >= 100
                    ? "🎉 Bạn đã hoàn thành mục tiêu hôm nay!"
                    : `Còn ${formatMinutes(goal - today)} nữa là đạt mục tiêu.`}
                </p>
              </div>

              {/* Weekly chart */}
              <div className="stat-card">
                <h2 className="font-semibold flex items-center gap-2 mb-5">
                  <TrendingUp size={18} className="text-primary" />
                  Hoạt động 7 ngày qua
                </h2>
                <div className="flex items-end justify-between gap-2 h-44">
                  {(weekly || []).map((d, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center gap-2 h-full justify-end"
                    >
                      <span className="text-[11px] text-white/40">
                        {d.minutes > 0 ? `${minutesToHours(d.minutes)}h` : ""}
                      </span>
                      <div
                        className={`w-full rounded-t-md transition-all duration-500 ${
                          d.isToday
                            ? "bg-primary"
                            : "bg-primary/40 hover:bg-primary/60"
                        }`}
                        style={{
                          height: `${Math.max(4, (d.minutes / maxWeekly) * 100)}%`,
                        }}
                        title={`${d.minutes} phút`}
                      />
                      <span
                        className={`text-xs ${d.isToday ? "text-primary font-semibold" : "text-white/40"}`}
                      >
                        {d.dayName}
                      </span>
                    </div>
                  ))}
                  {!weekly && (
                    <div className="w-full text-center text-white/40 text-sm self-center">
                      Chưa có dữ liệu
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Side column */}
            <div className="space-y-6">
              {/* Streak recovery */}
              <div className="stat-card">
                <h2 className="font-semibold flex items-center gap-2 mb-3">
                  <Flame size={18} className="text-orange-400" />
                  Chuỗi học tập
                </h2>
                <div className="text-center py-3">
                  <div className="text-5xl font-bold text-orange-400">
                    {stats.currentStreak || 0}
                  </div>
                  <div className="text-white/50 text-sm mt-1">
                    ngày liên tiếp
                  </div>
                </div>
                {stats.canRecoverStreak ? (
                  <button
                    onClick={handleRecover}
                    className="w-full mt-2 py-2.5 rounded-lg bg-orange-500/15 text-orange-400 hover:bg-orange-500/25 transition flex items-center justify-center gap-2 text-sm font-semibold"
                  >
                    <RotateCcw size={16} /> Khôi phục chuỗi
                  </button>
                ) : (
                  <p className="text-xs text-white/40 text-center mt-2">
                    Học mỗi ngày để giữ chuỗi không bị mất.
                  </p>
                )}
              </div>

              {/* Recent badges */}
              <div className="stat-card">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Trophy size={18} className="text-purple-400" />
                    Huy hiệu
                  </h2>
                  <Link
                    to="/badges"
                    className="text-xs text-primary hover:underline"
                  >
                    Xem tất cả
                  </Link>
                </div>
                {dashboard?.badges?.length > 0 ? (
                  <div className="grid grid-cols-4 gap-3">
                    {dashboard.badges.slice(0, 8).map((b) => (
                      <div
                        key={b._id}
                        className="aspect-square rounded-xl bg-dark-lighter flex items-center justify-center text-2xl"
                        title={b.name}
                      >
                        {b.icon || "🏆"}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-white/40 text-center py-4">
                    Chưa có huy hiệu. Hãy bắt đầu học!
                  </p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
