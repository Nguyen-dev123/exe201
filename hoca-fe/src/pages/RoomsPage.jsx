import { useState } from "react";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { roomApi } from "../lib/services";
import {
  Plus,
  Users,
  Search,
  Trash2,
  XCircle,
  Lock,
  Mic,
  MicOff,
  Video,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function RoomsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuthStore();

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const {
    data: rooms,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["rooms", debouncedSearch],
    queryFn: () => roomApi.getRooms(debouncedSearch || undefined),
    staleTime: 0, // Always consider data stale
    refetchOnMount: "always", // Always refetch on mount
  });

  const {
    data: myRooms,
    isLoading: myRoomsLoading,
    refetch: refetchMyRooms,
  } = useQuery({
    queryKey: ["my-rooms"],
    queryFn: () => roomApi.getMyRooms(),
    staleTime: 0, // Always consider data stale
    refetchOnMount: "always", // Always refetch on mount
  });

  // Merge public rooms with my rooms (avoid duplicates)
  const allRooms = React.useMemo(() => {
    if (!rooms) return myRooms || [];
    if (!myRooms) return rooms || [];

    const roomMap = new Map();
    rooms.forEach((room) => roomMap.set(room._id, room));
    myRooms.forEach((room) => roomMap.set(room._id, room));

    return Array.from(roomMap.values());
  }, [rooms, myRooms]);

  // Force refetch when component mounts (after leaving a room)
  React.useEffect(() => {
    console.log("🔄 RoomsPage mounted, refetching data...");
    refetch();
    refetchMyRooms();
  }, [refetch, refetchMyRooms]);

  const handleDeleteRoom = async (roomId, roomName, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Xóa phòng "${roomName}"?`)) return;

    try {
      console.log("🗑️ Deleting room:", roomId);
      await roomApi.deleteRoom(roomId);
      toast.success("Đã xóa phòng!");

      // ✅ Refetch both queries immediately
      console.log("🔄 Refetching after delete...");
      await refetch();
      await refetchMyRooms();
      console.log("✅ Refetch complete");
    } catch (error) {
      console.error("❌ Delete error:", error);
      toast.error(error.response?.data?.message || "Không thể xóa phòng");
    }
  };

  const handleCloseRoom = async (roomId, roomName, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Đóng phòng "${roomName}"? Mọi người sẽ bị đá ra.`)) return;

    try {
      console.log("🔒 Closing room:", roomId);
      await roomApi.closeRoom(roomId);
      toast.success("Đã đóng phòng!");

      // ✅ Refetch both queries immediately
      console.log("🔄 Refetching after close...");
      await refetch();
      await refetchMyRooms();
      console.log("✅ Refetch complete");
    } catch (error) {
      console.error("❌ Close error:", error);
      toast.error(error.response?.data?.message || "Không thể đóng phòng");
    }
  };

  const filteredRooms = allRooms;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Phòng học</h1>
          <p className="text-white/50 mt-1">Tham gia hoặc tạo phòng học mới</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Plus size={20} /> Tạo phòng mới
        </button>
      </div>

      <div className="mb-6 relative max-w-md">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40"
          size={18}
        />
        <input
          type="text"
          placeholder="Tìm kiếm phòng học..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="app-input pl-10 pr-10"
        />
        {isLoading && searchTerm && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
          </div>
        )}
      </div>

      {isLoading || myRoomsLoading ? (
        <div className="text-center py-16">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
          <p className="mt-4 text-white/50">
            {searchTerm ? "Đang tìm kiếm..." : "Đang tải..."}
          </p>
        </div>
      ) : filteredRooms?.length === 0 ? (
        <div className="text-center py-16 stat-card">
          <Users className="mx-auto h-12 w-12 text-white/30" />
          {searchTerm ? (
            <>
              <h3 className="mt-3 font-medium">Không tìm thấy phòng học</h3>
              <p className="mt-1 text-sm text-white/40">
                Không có phòng nào có tên &ldquo;{searchTerm}&rdquo;
              </p>
              <p className="mt-1 text-xs text-white/30">
                Thử tìm kiếm với từ khóa khác hoặc tạo phòng mới
              </p>
              <div className="flex gap-3 justify-center mt-5">
                <button
                  onClick={() => setSearchTerm("")}
                  className="btn-secondary inline-flex items-center gap-2"
                >
                  Xóa tìm kiếm
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary inline-flex items-center gap-2"
                >
                  <Plus size={18} /> Tạo phòng mới
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="mt-3 font-medium">Chưa có phòng học</h3>
              <p className="mt-1 text-sm text-white/40">
                Hãy tạo phòng học đầu tiên của bạn
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="btn-primary inline-flex items-center gap-2 mt-5"
              >
                <Plus size={18} /> Tạo phòng mới
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms?.map((room) => {
            const isOwner =
              room.owner?._id === user?._id || room.owner === user?._id;
            const canManage = isOwner || user?.role === "ADMIN";
            const isDiscussion = room.roomType === "DISCUSSION";
            const isVideo = room.roomType === "VIDEO";

            return (
              <Link
                key={room._id}
                to={`/rooms/${room._id}`}
                className="stat-card hover:border-primary/40 transition block"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-semibold flex-1">{room.name}</h3>
                  {canManage && (
                    <div className="flex items-center gap-1 ml-2">
                      <button
                        onClick={(e) => handleCloseRoom(room._id, room.name, e)}
                        className="p-1.5 text-orange-400 hover:bg-orange-500/10 rounded-lg transition"
                        title="Đóng phòng"
                      >
                        <XCircle size={16} />
                      </button>
                      <button
                        onClick={(e) =>
                          handleDeleteRoom(room._id, room.name, e)
                        }
                        className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                        title="Xóa phòng"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-white/50 text-sm mb-4 line-clamp-2 min-h-[2.5rem]">
                  {room.description || "Không có mô tả"}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-white/60">
                    <Users size={15} />
                    {room.activeParticipants?.length || 0}/
                    {room.maxParticipants}
                  </span>
                  <span
                    className={`pill ${
                      isVideo
                        ? "bg-green-500/15 text-green-400"
                        : isDiscussion
                          ? "bg-blue-500/15 text-blue-400"
                          : "bg-white/10 text-white/60"
                    }`}
                  >
                    {isVideo ? (
                      <Video size={12} />
                    ) : isDiscussion ? (
                      <Mic size={12} />
                    ) : (
                      <MicOff size={12} />
                    )}
                    {isVideo
                      ? "Camera"
                      : isDiscussion
                        ? "Thảo luận"
                        : "Im lặng"}
                  </span>
                </div>
                {!room.isPublic && (
                  <span className="inline-flex items-center gap-1 text-xs text-white/40 mt-2">
                    <Lock size={11} /> Riêng tư
                  </span>
                )}
                {isOwner && (
                  <div className="mt-2 text-xs text-primary font-medium">
                    Phòng của bạn
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {showCreateModal && (
        <CreateRoomModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function CreateRoomModal({ onClose, onSuccess }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roomType, setRoomType] = useState("SILENT");
  const [maxParticipants, setMaxParticipants] = useState(30);
  const [timerMode, setTimerMode] = useState("POMODORO_25_5");
  const [loading, setLoading] = useState(false);

  // Which room types this user can create
  const { data: typeInfo } = useQuery({
    queryKey: ["room-types"],
    queryFn: roomApi.getRoomTypes,
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const newRoom = await roomApi.createRoom({
        name,
        description,
        roomType,
        maxParticipants: parseInt(maxParticipants),
        isPublic: true,
        timerMode,
      });
      toast.success("Tạo phòng thành công!");
      onSuccess();
      // Navigate to the newly created room so owner joins automatically
      navigate(`/rooms/${newRoom._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Tạo phòng thất bại");
    } finally {
      setLoading(false);
    }
  };

  const types = typeInfo?.roomTypes || [
    { type: "SILENT", name: "Phòng Im lặng", available: true, icon: "🔇" },
    { type: "VIDEO", name: "Phòng Camera", available: true, icon: "📹" },
    {
      type: "DISCUSSION",
      name: "Phòng Thảo luận",
      available: true,
      icon: "🎤",
    },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-card border border-white/10 rounded-2xl p-6 max-w-md w-full text-white animate-scaleIn">
        <h2 className="text-2xl font-bold mb-5">Tạo phòng học mới</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Tên phòng
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="app-input"
              placeholder="Ví dụ: Học Toán lớp 12"
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="app-input"
              placeholder="Mô tả về phòng học..."
            />
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-1.5">
              Loại phòng
            </label>
            <div className="grid grid-cols-2 gap-2">
              {types.map((t) => {
                const disabled = t.available === false;
                const active = roomType === t.type;
                return (
                  <button
                    type="button"
                    key={t.type}
                    disabled={disabled}
                    onClick={() => setRoomType(t.type)}
                    className={`p-3 rounded-lg border text-left text-sm transition ${
                      active
                        ? "border-primary bg-primary/10"
                        : "border-white/10 hover:border-white/20"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="text-lg">{t.icon}</div>
                    <div className="font-medium">{t.name}</div>
                    {disabled && (
                      <div className="text-[11px] text-primary mt-0.5">
                        Cần HOCA+
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Số người
              </label>
              <input
                type="number"
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                min="2"
                max="50"
                className="app-input"
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-1.5">
                Pomodoro
              </label>
              <select
                value={timerMode}
                onChange={(e) => setTimerMode(e.target.value)}
                className="app-input"
              >
                <option value="POMODORO_25_5">25 / 5</option>
                <option value="POMODORO_50_10">50 / 10</option>
                <option value="POMODORO_90_15">90 / 15</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-dark-lighter hover:bg-dark rounded-lg transition font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-dark rounded-lg disabled:opacity-50 transition font-semibold"
            >
              {loading ? "Đang tạo..." : "Tạo phòng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
