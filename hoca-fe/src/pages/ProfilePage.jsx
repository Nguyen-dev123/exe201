import { useAuthStore } from "../store/authStore";
import { User, Mail, Award, TrendingUp } from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Hồ sơ của tôi</h1>

      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-white">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-blue-600 text-4xl font-bold">
              {user?.name?.[0]?.toUpperCase() || "U"}
            </div>
            <div>
              <h2 className="text-2xl font-bold">{user?.name}</h2>
              <p className="opacity-90">{user?.email}</p>
              <div className="mt-2 flex items-center space-x-4">
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  {user?.rank || "Newbie"}
                </span>
                <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm">
                  Level {user?.level || 1}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Content */}
        <div className="p-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Personal Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <User size={20} />
                <span>Thông tin cá nhân</span>
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-600">Họ và tên</label>
                  <p className="font-medium">{user?.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <p className="font-medium">{user?.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-600">Ngày tham gia</label>
                  <p className="font-medium">
                    {user?.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("vi-VN")
                      : "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                <TrendingUp size={20} />
                <span>Thống kê</span>
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span className="text-gray-700">Tổng giờ học</span>
                  <span className="font-bold text-blue-600">
                    {user?.totalStudyHours || 0}h
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-gray-700">Streak hiện tại</span>
                  <span className="font-bold text-green-600">
                    {user?.currentStreak || 0} ngày
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                  <span className="text-gray-700">Phòng đã tham gia</span>
                  <span className="font-bold text-purple-600">
                    {user?.roomsJoined || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
              <Award size={20} />
              <span>Huy hiệu</span>
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {user?.badges?.length > 0 ? (
                user.badges.map((badge, index) => (
                  <div
                    key={index}
                    className="text-center p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="text-4xl mb-2">{badge.icon || "🏆"}</div>
                    <p className="font-medium text-sm">{badge.name}</p>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-gray-500">
                  <Award className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <p>Chưa có huy hiệu nào</p>
                  <p className="text-sm mt-1">
                    Hãy hoàn thành các mục tiêu để nhận huy hiệu!
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex space-x-4">
            <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              Chỉnh sửa hồ sơ
            </button>
            <button className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Đổi mật khẩu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
