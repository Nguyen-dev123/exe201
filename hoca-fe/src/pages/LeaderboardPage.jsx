import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Trophy, Flame, Clock, Medal } from "lucide-react";
import { userApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";
import { minutesToHours } from "../lib/format";

const rankColors = ["text-yellow-400", "text-gray-300", "text-amber-600"];

function Row({ index, user, value, unit, me }) {
  const isTop3 = index < 3;
  return (
    <div
      className={`flex items-center gap-4 px-4 py-3 rounded-xl transition ${
        me ? "bg-primary/10 border border-primary/30" : "hover:bg-dark-lighter"
      }`}
    >
      <div className="w-8 text-center font-bold">
        {isTop3 ? (
          <Medal className={`mx-auto ${rankColors[index]}`} size={22} />
        ) : (
          <span className="text-white/40">{index + 1}</span>
        )}
      </div>
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white font-bold overflow-hidden">
        {user.avatar ? (
          <img
            src={user.avatar}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          user.displayName?.[0]?.toUpperCase() || "U"
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-white truncate">
          {user.displayName}
          {me && <span className="text-primary text-xs ml-2">(Bạn)</span>}
        </p>
      </div>
      <div className="font-bold text-primary">
        {value}
        <span className="text-white/40 text-sm font-normal ml-1">{unit}</span>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState("study");
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ["leaderboard"],
    queryFn: userApi.getLeaderboard,
  });

  const list = tab === "study" ? data?.topStudy || [] : data?.topStreak || [];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
          <Trophy className="text-primary" size={32} />
        </div>
        <h1 className="text-3xl font-bold">Bảng xếp hạng</h1>
        <p className="text-white/50 mt-2">
          Thi đua cùng cộng đồng học tập HOCA
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-dark-lighter rounded-xl mb-6 max-w-sm mx-auto">
        <button
          onClick={() => setTab("study")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${
            tab === "study"
              ? "bg-primary text-white"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Clock size={16} /> Giờ học
        </button>
        <button
          onClick={() => setTab("streak")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2 ${
            tab === "streak"
              ? "bg-primary text-white"
              : "text-white/60 hover:text-white"
          }`}
        >
          <Flame size={16} /> Chuỗi học
        </button>
      </div>

      <div className="stat-card">
        {isLoading ? (
          <div className="text-center py-12 text-white/50">Đang tải...</div>
        ) : list.length === 0 ? (
          <div className="text-center py-12 text-white/40">
            Chưa có dữ liệu xếp hạng
          </div>
        ) : (
          <div className="space-y-1">
            {list.map((u, i) => (
              <Row
                key={u._id}
                index={i}
                user={u}
                me={u._id === user?._id}
                value={
                  tab === "study"
                    ? minutesToHours(u.totalStudyMinutes)
                    : u.currentStreak
                }
                unit={tab === "study" ? "giờ" : "ngày"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
