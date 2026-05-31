import { useState } from "react";
import { X, Flag } from "lucide-react";
import toast from "react-hot-toast";
import { reportApi } from "../lib/services";

const REASONS = [
  { value: "INAPPROPRIATE_CONTENT", label: "Nội dung không phù hợp" },
  { value: "HARASSMENT", label: "Quấy rối / bắt nạt" },
  { value: "SPAM", label: "Spam / quảng cáo" },
  { value: "DISRUPTION", label: "Gây rối phòng học" },
  { value: "OTHER", label: "Khác" },
];

export default function ReportModal({ targetUser, roomId, onClose }) {
  const [reason, setReason] = useState("HARASSMENT");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await reportApi.submit({
        targetUser: targetUser.userId || targetUser._id,
        room: roomId,
        reason,
        description,
      });
      toast.success("Đã gửi báo cáo. Cảm ơn bạn!");
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || "Gửi báo cáo thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card border border-white/10 rounded-2xl p-6 w-full max-w-md text-white animate-scaleIn relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white"
        >
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
          <Flag size={20} className="text-red-400" /> Báo cáo người dùng
        </h2>
        <p className="text-white/50 text-sm mb-4">
          Báo cáo{" "}
          <b className="text-white/80">
            {targetUser.userName || targetUser.displayName}
          </b>{" "}
          về hành vi vi phạm.
        </p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Lý do</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="app-input"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Mô tả (tùy chọn)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="app-input"
              placeholder="Mô tả chi tiết hành vi vi phạm..."
            />
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-dark-lighter hover:bg-dark rounded-lg font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-red-500/80 hover:bg-red-600 rounded-lg font-semibold disabled:opacity-50"
            >
              {loading ? "Đang gửi..." : "Gửi báo cáo"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
