import { useQuery } from "@tanstack/react-query";
import { Shield, Lock, CheckCircle } from "lucide-react";
import { rankApi, userApi } from "../lib/services";
import { minutesToHours } from "../lib/format";

const RANK_COLORS = [
  "from-gray-400 to-gray-600",
  "from-green-400 to-green-600",
  "from-teal-400 to-cyan-600",
  "from-blue-400 to-blue-600",
  "from-indigo-400 to-indigo-600",
  "from-purple-400 to-purple-600",
  "from-pink-400 to-pink-600",
  "from-orange-400 to-red-500",
  "from-yellow-400 to-amber-600",
  "from-amber-300 to-yellow-500",
];

export default function RanksPage() {
  const { data: ranks, isLoading } = useQuery({
    queryKey: ["ranks"],
    queryFn: rankApi.getAll,
  });
  const { data: profile } = useQuery({
    queryKey: ["me-profile"],
    queryFn: userApi.getMe,
  });

  const myHours = minutesToHours(profile?.totalStudyMinutes || 0);
  const myLevel = profile?.rank?.level ?? 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Shield className="text-primary" size={32} />
        </div>
        <h1 className="text-3xl font-bold">Hệ thống cấp bậc</h1>
        <p className="text-white/50 mt-2">
          Tích lũy giờ học để thăng hạng. Bạn đang có{" "}
          <span className="text-primary font-semibold">{myHours}h</span> học.
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-white/50">Đang tải...</div>
      ) : (
        <div className="space-y-3">
          {(ranks || []).map((rank) => {
            const achieved = myHours >= rank.requiredHours;
            const isCurrent = rank.level === myLevel;
            const gradient = RANK_COLORS[rank.level] || RANK_COLORS[0];
            return (
              <div
                key={rank._id || rank.level}
                className={`stat-card flex items-center gap-4 ${
                  isCurrent ? "border-primary" : ""
                } ${!achieved ? "opacity-70" : ""}`}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}
                >
                  {achieved ? rank.level : <Lock size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg">{rank.name}</h3>
                    {isCurrent && (
                      <span className="pill bg-primary/15 text-primary">
                        Hạng của bạn
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/50">
                    Yêu cầu: {rank.requiredHours} giờ học
                  </p>
                </div>
                {achieved && (
                  <CheckCircle
                    className="text-green-500 flex-shrink-0"
                    size={22}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
