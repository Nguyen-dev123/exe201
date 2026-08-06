import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Flame,
  Clock,
  Award,
  Crown,
  Loader2,
  Trophy,
} from "lucide-react";
import { publicApi } from "../lib/services";
import { formatMinutes, getTierInfo, formatDate } from "../lib/format";
import Avatar from "../components/Avatar";

export default function PublicProfilePage() {
  const { id } = useParams();

  const {
    data: student,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["public-profile", id],
    queryFn: () => publicApi.getProfile(id),
  });

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={40} className="text-primary animate-spin" />
      </div>
    );
  }

  if (isError || !student) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-white px-4">
        <p className="text-white/60 mb-4">Không tìm thấy học viên này.</p>
        <Link to="/" className="btn-primary">
          Về trang chủ
        </Link>
      </div>
    );
  }

  const tier = getTierInfo(student.subscriptionTier);

  const stats = [
    {
      icon: Clock,
      label: "Tổng giờ học",
      value: formatMinutes(student.totalStudyMinutes),
      color: "text-blue-400 bg-blue-500/15",
    },
    {
      icon: Flame,
      label: "Streak hiện tại",
      value: `${student.currentStreak || 0} ngày`,
      color: "text-orange-400 bg-orange-500/15",
    },
    {
      icon: Trophy,
      label: "Streak dài nhất",
      value: `${student.longestStreak || 0} ngày`,
      color: "text-purple-400 bg-purple-500/15",
    },
    {
      icon: Award,
      label: "Điểm XP",
      value: (student.xp || 0).toLocaleString("vi-VN"),
      color: "text-green-400 bg-green-500/15",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 text-sm"
      >
        <ArrowLeft size={16} /> Về trang chủ
      </Link>

      {/* Header card */}
      <div className="stat-card text-center py-10 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
        <div className="relative">
          <Avatar
            src={student.avatar}
            name={student.displayName}
            size={96}
            className="mx-auto mb-4 ring-4 ring-primary/20"
          />
          <h1 className="text-2xl font-bold mb-2">{student.displayName}</h1>
          <span
            className={`pill ${tier.bg} ${tier.color} inline-flex items-center gap-1`}
          >
            <Crown size={13} /> {tier.label}
          </span>
          {student.bio && (
            <p className="text-white/60 text-sm mt-4 max-w-md mx-auto">
              {student.bio}
            </p>
          )}
          <p className="text-white/30 text-xs mt-3">
            Tham gia từ {formatDate(student.createdAt)}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
        {stats.map((s) => (
          <div key={s.label} className="stat-card text-center py-5">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-2 ${s.color}`}
            >
              <s.icon size={22} />
            </div>
            <p className="text-lg font-bold">{s.value}</p>
            <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      {student.badges?.length > 0 && (
        <div className="stat-card mt-6">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Award size={18} className="text-primary" />
            Huy hiệu ({student.badges.length})
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {student.badges.map((b) => (
              <div
                key={b._id}
                className="flex flex-col items-center text-center p-3 rounded-xl bg-white/5"
                title={b.description}
              >
                <span className="text-3xl mb-1">{b.icon || "🏅"}</span>
                <span className="text-xs text-white/70 line-clamp-2">
                  {b.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
