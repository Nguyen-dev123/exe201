import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import api from "../lib/api";
import { Plus, Users, Clock, Search, Trash2, XCircle } from "lucide-react";
import { useAuthStore } from "../store/authStore";

export default function RoomsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { user } = useAuthStore();

  const {
    data: rooms,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["rooms"],
    queryFn: async () => {
      const response = await api.get("/api/rooms");
      return response.data;
    },
  });

  const handleDeleteRoom = async (roomId, roomName, e) => {
    e.preventDefault(); // Prevent navigation to room detail
    e.stopPropagation();

    if (!confirm(`Bạn có chắc muốn xóa phòng "${roomName}"?`)) {
      return;
    }

    try {
      await api.delete(`/api/rooms/${roomId}`);
      toast.success("Đã xóa phòng thành công!");
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể xóa phòng");
    }
  };

  const handleCloseRoom = async (roomId, roomName, e) => {
    e.preventDefault();
    e.stopPropagation();

    if (
      !confirm(
        `Bạn có chắc muốn đóng phòng "${roomName}"? Tất cả người dùng sẽ bị đá ra.`,
      )
    ) {
      return;
    }

    try {
      await api.post(`/api/rooms/${roomId}/close`);
      toast.success("Đã đóng phòng thành công!");
      refetch();
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể đóng phòng");
    }
  };

  const filteredRooms = rooms?.filter((room) =>
    room.name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Phòng học</h1>
          <p className="text-gray-600 mt-2">Tham gia hoặc tạo phòng học mới</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          <span>Tạo phòng mới</span>
        </button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Tìm kiếm phòng học..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Đang tải...</p>
        </div>
      ) : filteredRooms?.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Chưa có phòng học
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Hãy tạo phòng học đầu tiên của bạn
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Tạo phòng mới
            </button>
          </div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms?.map((room) => {
            const isOwner =
              room.owner?._id === user?._id || room.owner === user?._id;
            const isAdmin = user?.role === "ADMIN";
            const canDelete = isOwner || isAdmin;

            return (
              <div key={room._id} className="relative">
                <Link
                  to={`/rooms/${room._id}`}
                  className="block bg-white rounded-lg shadow hover:shadow-lg transition p-6"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 flex-1">
                      {room.name}
                    </h3>
                    {canDelete && (
                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          onClick={(e) =>
                            handleCloseRoom(room._id, room.name, e)
                          }
                          className="p-2 text-orange-500 hover:bg-orange-50 rounded-lg transition"
                          title="Đóng phòng"
                        >
                          <XCircle size={18} />
                        </button>
                        <button
                          onClick={(e) =>
                            handleDeleteRoom(room._id, room.name, e)
                          }
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                          title="Xóa phòng"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {room.description || "Không có mô tả"}
                  </p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users size={16} />
                      <span>{room.activeParticipants?.length || 0} người</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock size={16} />
                      <span>
                        {room.isActive ? "Đang hoạt động" : "Đã đóng"}
                      </span>
                    </div>
                  </div>
                  {isOwner && (
                    <div className="mt-2 text-xs text-blue-600 font-medium">
                      Phòng của bạn
                    </div>
                  )}
                </Link>
              </div>
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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [roomType, setRoomType] = useState("SILENT");
  const [maxParticipants, setMaxParticipants] = useState(30);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/rooms", {
        name,
        description,
        roomType,
        maxParticipants: parseInt(maxParticipants),
        isPublic: true,
        timerMode: "POMODORO_25_5",
      });
      toast.success("Tạo phòng thành công!");
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Tạo phòng thất bại");
      console.error("Create room error:", error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-4">Tạo phòng học mới</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên phòng
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ví dụ: Học Toán lớp 12"
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mô tả về phòng học..."
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loại phòng
            </label>
            <select
              value={roomType}
              onChange={(e) => setRoomType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="SILENT">🔇 Im lặng (Không mic)</option>
              <option value="DISCUSSION">🎤 Thảo luận (Có mic)</option>
            </select>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số người tối đa
            </label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              min="2"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition flex items-center justify-center space-x-2 font-semibold"
            >
              <XCircle size={20} />
              <span>Hủy</span>
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition font-semibold"
            >
              {loading ? "Đang tạo..." : "Tạo phòng"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
