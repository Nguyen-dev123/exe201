import { useQuery } from "@tanstack/react-query";
import { Award, Lock, Flame, Clock } from "lucide-react";
import { badgeApi } from "../lib/services";

const typeLabel = {
  STREAK: { label: "Chuỗi học tập", icon: Flame, unit: "ngày" },
  STUDY_HOURS: { label: "Giờ học", icon: Clock, unit: "giờ" },
  TOP_LEARNER: { label: "Top học tập", icon: Award, unit: "" },
  TOP_STREAK: { label: "Top chuỗi", icon: Flame, unit: "" },
};

function BadgeCard({ badge }) {
  const earned = badge.isEarned;
  return (
    <div
      className={`stat-card relative overflow-hidden ${
        earned ? "border-primary/40" : "opacity-90"
      }`}
    >
      {earned && (
        <span className="absolute top-3 right-3 pill bg-green-500/15 text-green-400">
          Đã đạt
        </span>
      )}
      <div
        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4 ${
          earned
            ? "bg-gradient-to-br from-primary/30 to-orange-600/30"
            : "bg-dark-lighter grayscale"
        }`}
      >
        {earned ? (
          badge.icon || "🏆"
        ) : (
          <Lock className="text-white/30" size={26} />
        )}
      </div>
      <h3 className="font-bold text-white">{badge.name}</h3>
      <p className="text-sm text-white/50 mb-3 line-clamp-2">
        {badge.description}
      </p>
      {!earned && typeof badge.progress === "number" && (
        <>
          <div className="w-full h-2 rounded-full bg-dark-lighter overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${badge.progress}%` }}
            />
          </div>
          <p className="text-xs text-white/40 mt-1">{badge.progress}%</p>
        </>
      )}
    </div>
  );
}

export default function BadgesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["badges-me"],
    queryFn: badgeApi.getMine,
  });

  const all = data?.allBadges || [];
  const earnedCount = all.filter((b) => b.isEarned).length;

  // group by type
  const groups = all.reduce((acc, b) => {
    (acc[b.type] = acc[b.type] || []).push(b);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-purple-500/15 flex items-center justify-center mx-auto mb-4">
          <Award className="text-purple-400" size={32} />
        </div>
        <h1 className="text-3xl font-bold">Huy hiệu thành tích</h1>
        <p className="text-white/50 mt-2">
          Đã mở khóa{" "}
          <span className="text-primary font-semibold">{earnedCount}</span> /{" "}
          {all.length} huy hiệu
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-white/50">Đang tải...</div>
      ) : all.length === 0 ? (
        <div className="text-center py-20 text-white/40">
          Chưa có huy hiệu nào được cấu hình.
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groups).map(([type, badges]) => {
            const meta = typeLabel[type] || { label: type, icon: Award };
            const Icon = meta.icon;
            return (
              <div key={type}>
                <h2 className="flex items-center gap-2 text-lg font-semibold mb-4">
                  <Icon size={18} className="text-primary" />
                  {meta.label}
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {badges.map((b) => (
                    <BadgeCard key={b._id} badge={b} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
