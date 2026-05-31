import { useState } from "react";
import { Star, X } from "lucide-react";
import toast from "react-hot-toast";
import { feedbackApi } from "../lib/services";

export default function FeedbackModal({ roomId, onClose, onDone }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  // Single exit path - avoids double callbacks
  const finish = () => {
    if (onDone) onDone();
    else onClose?.();
  };

  const submit = async () => {
    if (rating === 0) {
      toast.error("Hãy chọn số sao đánh giá");
      return;
    }
    setLoading(true);
    try {
      await feedbackApi.create({ rating, comment, roomId });
      toast.success("Cảm ơn đánh giá của bạn!");
      finish();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gửi đánh giá thất bại");
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card border border-white/10 rounded-2xl p-6 w-full max-w-md text-white animate-scaleIn relative">
        <button
          onClick={finish}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-1 text-center">
          Đánh giá buổi học
        </h2>
        <p className="text-white/50 text-sm mb-5 text-center">
          Bạn thấy phòng học này thế nào?
        </p>

        <div className="flex justify-center gap-2 mb-5">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onClick={() => setRating(s)}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              className="transition-transform hover:scale-110"
            >
              <Star
                size={36}
                className={
                  s <= (hover || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-white/20"
                }
              />
            </button>
          ))}
        </div>

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="app-input mb-4"
          placeholder="Chia sẻ cảm nhận của bạn (tùy chọn)..."
        />

        <div className="flex gap-3">
          <button
            onClick={finish}
            className="flex-1 py-2.5 bg-dark-lighter hover:bg-dark rounded-lg font-medium"
          >
            Bỏ qua
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 py-2.5 bg-primary hover:bg-primary-dark rounded-lg font-semibold disabled:opacity-50"
          >
            {loading ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </div>
      </div>
    </div>
  );
}
