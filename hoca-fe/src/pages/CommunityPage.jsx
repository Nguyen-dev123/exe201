import { Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  Shield,
  CheckCircle,
  XCircle,
  Award,
  Heart,
  Ban,
  MessageSquareWarning,
  ArrowLeft,
} from "lucide-react";
import { reactionApi } from "../lib/services";

const RULES = [
  {
    icon: Shield,
    color: "text-blue-400 bg-blue-500/15",
    title: "Tôn trọng lẫn nhau",
    desc: "Không quấy rối, bắt nạt, phân biệt đối xử hay dùng ngôn từ thù ghét với bất kỳ thành viên nào.",
    points: [
      "Giao tiếp lịch sự, văn minh trong chat và khi bật mic.",
      "Tôn trọng sự khác biệt về quan điểm, vùng miền, tôn giáo.",
      "Không công kích cá nhân hay khiêu khích người khác.",
    ],
  },
  {
    icon: CheckCircle,
    color: "text-green-400 bg-green-500/15",
    title: "Giữ gìn môi trường học tập",
    desc: "Sử dụng phòng học đúng mục đích, giữ không gian tập trung cho mọi người.",
    points: [
      "Không gây tiếng ồn, làm phiền trong phòng im lặng.",
      "Tắt mic khi không nói để tránh tạp âm.",
      "Không spam tin nhắn, sticker hay đường link vô nghĩa.",
    ],
  },
  {
    icon: Ban,
    color: "text-purple-400 bg-purple-500/15",
    title: "Nội dung phù hợp",
    desc: "Không chia sẻ nội dung bạo lực, phản cảm, vi phạm pháp luật hoặc không phù hợp.",
    points: [
      "Cấm nội dung khiêu dâm, bạo lực, cờ bạc, chất cấm.",
      "Không quảng cáo, bán hàng trái phép trong phòng học.",
      "Camera/avatar phải lịch sự, đúng thuần phong mỹ tục.",
    ],
  },
  {
    icon: Award,
    color: "text-orange-400 bg-orange-500/15",
    title: "Trung thực & công bằng",
    desc: "Không gian lận, mạo danh hay lạm dụng hệ thống để trục lợi.",
    points: [
      "Không dùng công cụ gian lận để tăng giờ học, streak ảo.",
      "Không mạo danh người khác hoặc ban quản trị HOCA.",
      "Báo cáo lỗi/lỗ hổng thay vì lợi dụng chúng.",
    ],
  },
];

const CONSEQUENCES = [
  "Lần 1: Nhắc nhở / cảnh cáo từ hệ thống.",
  "Lần 2: Tạm khóa quyền chat hoặc tạo phòng.",
  "Vi phạm nghiêm trọng: Khóa tài khoản vĩnh viễn.",
];

export default function CommunityPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 text-white">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 text-sm"
      >
        <ArrowLeft size={16} /> Về trang chủ
      </Link>

      {/* Header */}
      <div className="text-center mb-10">
        <HeartButton />
        <h1 className="text-3xl md:text-4xl font-bold">
          Quy tắc cộng đồng HOCA
        </h1>
        <p className="text-white/50 mt-3 max-w-2xl mx-auto">
          Để HOCA luôn là không gian học tập tích cực, an toàn và truyền cảm
          hứng, mọi thành viên vui lòng tuân thủ các quy tắc dưới đây.
        </p>
      </div>

      {/* Rules */}
      <div className="space-y-5">
        {RULES.map((rule, i) => (
          <div key={i} className="stat-card">
            <div className="flex items-start gap-4">
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${rule.color}`}
              >
                <rule.icon size={24} />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1">
                  {i + 1}. {rule.title}
                </h2>
                <p className="text-white/60 text-sm mb-3">{rule.desc}</p>
                <ul className="space-y-1.5">
                  {rule.points.map((p, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 text-sm text-white/70"
                    >
                      <CheckCircle
                        size={15}
                        className="text-green-500 flex-shrink-0 mt-0.5"
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Consequences */}
      <div className="stat-card mt-6 border-red-500/20">
        <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
          <MessageSquareWarning size={20} className="text-red-400" />
          Xử lý vi phạm
        </h2>
        <ul className="space-y-2">
          {CONSEQUENCES.map((c, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-white/70"
            >
              <XCircle
                size={15}
                className="text-red-400 flex-shrink-0 mt-0.5"
              />
              {c}
            </li>
          ))}
        </ul>
      </div>

      {/* CTA */}
      <div className="text-center mt-10">
        <p className="text-white/50 mb-4">
          Cảm ơn bạn đã cùng xây dựng cộng đồng HOCA văn minh 💛
        </p>
        <Link to="/rooms" className="btn-primary inline-block">
          Bắt đầu học ngay
        </Link>
      </div>
    </div>
  );
}

/* ---------- Heart reaction button ---------- */
const LIKED_KEY = "hoca_community_hearted";

function HeartButton() {
  const burstTimerRef = useRef(null);
  const [count, setCount] = useState(null);
  const [liked, setLiked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [burst, setBurst] = useState(false);

  // Load current count + whether this device already liked
  useEffect(() => {
    setLiked(localStorage.getItem(LIKED_KEY) === "1");
    reactionApi
      .getHearts()
      .then((d) => setCount(d.count ?? 0))
      .catch(() => setCount(0));
  }, []);

  useEffect(
    () => () => {
      if (burstTimerRef.current) window.clearTimeout(burstTimerRef.current);
    },
    [],
  );

  const handleClick = async () => {
    if (busy) return;

    const nextLiked = !liked;
    if (nextLiked) {
      setBurst(true);
      burstTimerRef.current = window.setTimeout(() => setBurst(false), 600);
    }

    setBusy(true);
    setCount((current) =>
      Math.max(0, (current ?? 0) + (nextLiked ? 1 : -1)),
    );
    setLiked(nextLiked);
    if (nextLiked) localStorage.setItem(LIKED_KEY, "1");
    else localStorage.removeItem(LIKED_KEY);

    try {
      const data = nextLiked
        ? await reactionApi.addHeart()
        : await reactionApi.removeHeart();
      if (typeof data.count === "number") setCount(data.count);
      toast.success(
        nextLiked ? "Đã ghi nhận cam kết của bạn." : "Đã hủy cam kết.",
      );
    } catch {
      setCount((current) =>
        Math.max(0, (current ?? 0) + (nextLiked ? -1 : 1)),
      );
      setLiked(liked);
      if (liked) localStorage.setItem(LIKED_KEY, "1");
      else localStorage.removeItem(LIKED_KEY);
      toast.error("Chưa thể cập nhật cam kết. Vui lòng thử lại.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col items-center mb-4">
      <button
        onClick={handleClick}
        disabled={busy}
        aria-pressed={liked}
        aria-label={
          liked
            ? "Hủy cam kết cộng đồng HOCA"
            : "Đồng ý cam kết cộng đồng HOCA"
        }
        title={liked ? "Bấm để hủy cam kết" : "Bấm để cùng cam kết"}
        className={`relative w-16 h-16 cursor-pointer rounded-2xl flex items-center justify-center mx-auto transition-all duration-300 press disabled:cursor-wait disabled:opacity-70 ${
          liked
            ? "bg-primary/25 ring-2 ring-primary/50"
            : "bg-primary/15 hover:bg-primary/25 hover:scale-105"
        }`}
      >
        <Heart
          size={30}
          className={`transition-all duration-300 ${
            liked ? "text-primary scale-110" : "text-primary"
          } ${burst ? "animate-heartPop" : ""}`}
          fill={liked ? "currentColor" : "none"}
        />

        {/* Floating hearts burst */}
        {burst && (
          <>
            <Heart
              size={16}
              className="text-primary absolute -top-1 left-3 animate-floatUp"
              fill="currentColor"
            />
            <Heart
              size={12}
              className="text-pink-400 absolute -top-1 right-3 animate-floatUp"
              fill="currentColor"
              style={{ animationDelay: "0.1s" }}
            />
            <Heart
              size={14}
              className="text-red-400 absolute top-0 left-1/2 animate-floatUp"
              fill="currentColor"
              style={{ animationDelay: "0.05s" }}
            />
          </>
        )}
      </button>

      {/* Count + label */}
      <div
        className="mt-3 flex items-center gap-1.5 text-sm"
        aria-live="polite"
        aria-atomic="true"
      >
        <Heart size={14} className="text-primary" fill="currentColor" />
        <span className="font-bold text-white">
          {count === null ? "..." : count.toLocaleString("vi-VN")}
        </span>
        <span className="text-white/50">lượt yêu thích</span>
      </div>
      <p className="text-white/40 text-xs mt-1">
        {busy
          ? "Đang cập nhật..."
          : liked
            ? "Đã cùng cam kết. Bấm lại để hủy."
            : "Bấm vào tim để cùng cam kết với HOCA."}
      </p>
    </div>
  );
}
