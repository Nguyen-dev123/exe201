import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { roomApi, studyGoalApi } from "../lib/services";
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
  BookOpen,
  GraduationCap,
  ClipboardCheck,
  Lightbulb,
  Save,
  Star,
  Download,
  UserPlus,
  CalendarDays,
} from "lucide-react";
import { useAuthStore } from "../store/authStore";
import CloseButton from "../components/CloseButton";
import DateTimeField from "../components/DateTimeField";
import { confirmDialog, promptDialog } from "../lib/dialog";

const TIMER_PRESETS = {
  25: "POMODORO_25_5",
  50: "POMODORO_50_10",
  90: "POMODORO_90_15",
};

const ROOM_STARTERS = [
  {
    title: "Ôn thi",
    description: "Một phiên yên tĩnh để hệ thống lại kiến thức.",
    duration: 50,
    roomType: "SILENT",
    icon: GraduationCap,
  },
  {
    title: "Làm bài tập",
    description: "Tập trung xử lý từng bài và hạn chế xao nhãng.",
    duration: 25,
    roomType: "SILENT",
    icon: ClipboardCheck,
  },
  {
    title: "Đọc sách",
    description: "Giữ một khoảng yên tĩnh cho chương đang đọc.",
    duration: 50,
    roomType: "SILENT",
    icon: BookOpen,
  },
  {
    title: "Làm đồ án",
    description: "Một phiên dài để xử lý phần việc quan trọng của đồ án.",
    duration: 90,
    roomType: "SILENT",
    icon: Users,
  },
];

export default function RoomsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomPreset, setRoomPreset] = useState(null);
  const [goalDraft, setGoalDraft] = useState("");
  const [savingGoal, setSavingGoal] = useState(false);
  const [createTimerMode, setCreateTimerMode] = useState(
    TIMER_PRESETS[25],
  );
  const { user } = useAuthStore();

  const { data: activeGoal, isError: activeGoalError, refetch: refetchActiveGoal } = useQuery({
    queryKey: ["study-goal", "active"],
    queryFn: studyGoalApi.getActive,
  });
  const { data: goalHistory = [], isError: goalHistoryError, refetch: refetchGoalHistory } = useQuery({
    queryKey: ["study-goals"],
    queryFn: studyGoalApi.getAll,
  });
  const { data: invitations = [], isError: invitationsError, refetch: refetchInvitations } = useQuery({ queryKey: ["room-invitations"], queryFn: roomApi.getInvitations });
  const { data: recentRooms = [], isError: recentRoomsError, refetch: refetchRecentRooms } = useQuery({
    queryKey: ["room-recent"],
    queryFn: roomApi.recent,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: roomHistory = [], isError: roomHistoryError, refetch: refetchRoomHistory } = useQuery({
    queryKey: ["room-history"],
    queryFn: roomApi.history,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const { data: favoriteRooms = [], isError: favoritesError, refetch: refetchFavorites } = useQuery({ queryKey: ["room-favorites"], queryFn: roomApi.favorites });
  const secondaryDataError = activeGoalError || goalHistoryError || invitationsError || recentRoomsError || roomHistoryError || favoritesError;
  const retrySecondaryData = () => Promise.all([refetchActiveGoal(), refetchGoalHistory(), refetchInvitations(), refetchRecentRooms(), refetchRoomHistory(), refetchFavorites()]);

  React.useEffect(() => {
    setGoalDraft(activeGoal?.text || "");
  }, [activeGoal?.text]);

  const openCreateModal = (preset = null) => {
    setRoomPreset(preset);
    if (preset?.duration) {
      setCreateTimerMode(TIMER_PRESETS[preset.duration]);
    }
    setShowCreateModal(true);
  };

  const saveTodayGoal = async (event) => {
    event.preventDefault();
    const nextGoal = goalDraft.trim();
    if (!nextGoal) {
      toast.error("Hãy viết một mục tiêu trước khi lưu.");
      return;
    }
    setSavingGoal(true);
    try {
      await studyGoalApi.create(nextGoal);
      await Promise.all([refetchActiveGoal(), refetchGoalHistory()]);
      toast.success("Đã lưu mục tiêu vào tài khoản của bạn.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể lưu mục tiêu.");
    } finally {
      setSavingGoal(false);
    }
  };

  React.useEffect(() => {
    if (searchParams.get("create") === "1") {
      setCreateTimerMode(
        TIMER_PRESETS[searchParams.get("timer")] || TIMER_PRESETS[25],
      );
      setShowCreateModal(true);
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("create");
      nextParams.delete("timer");
      setSearchParams(nextParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  React.useEffect(() => {
    if (searchParams.get("feature") !== "virtual-background") return;

    toast(
      "Chọn hoặc tạo một phòng dùng camera. Nút Phông nền ảo nằm ngay dưới khung video.",
      { icon: "✨", duration: 5500 },
    );

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("feature");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

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
    const roomsList = Array.isArray(rooms)
      ? rooms
      : rooms?.data || rooms?.rooms || [];
    const myRoomsList = Array.isArray(myRooms)
      ? myRooms
      : myRooms?.data || myRooms?.rooms || [];

    const roomMap = new Map();
    roomsList.forEach((room) => roomMap.set(room._id, room));
    myRoomsList.forEach((room) => roomMap.set(room._id, room));

    return Array.from(roomMap.values());
  }, [rooms, myRooms]);

  // Force refetch when component mounts (after leaving a room)
  React.useEffect(() => {
    refetch();
    refetchMyRooms();
    refetchRecentRooms();
    refetchRoomHistory();
  }, [refetch, refetchMyRooms, refetchRecentRooms, refetchRoomHistory]);

  const handleDeleteRoom = async (roomId, roomName, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!(await confirmDialog(`Xóa phòng "${roomName}"?`, { destructive: true, confirmText: "Xóa phòng" }))) return;

    try {
      await roomApi.deleteRoom(roomId);
      toast.success("Đã xóa phòng!");

      // ✅ Refetch both queries immediately
      await Promise.all([
        refetch(),
        refetchMyRooms(),
        refetchRecentRooms(),
        refetchRoomHistory(),
      ]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể xóa phòng");
    }
  };

  const handleCloseRoom = async (roomId, roomName, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!(await confirmDialog(`Đóng phòng "${roomName}"? Mọi người sẽ bị đưa ra khỏi phòng.`, { destructive: true, confirmText: "Đóng phòng" }))) return;

    try {
      await roomApi.closeRoom(roomId);
      toast.success("Đã đóng phòng!");

      // ✅ Refetch both queries immediately
      await Promise.all([
        refetch(),
        refetchMyRooms(),
        refetchRecentRooms(),
        refetchRoomHistory(),
      ]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Không thể đóng phòng");
    }
  };

  const filteredRooms = allRooms;
  const favoriteIds = new Set(favoriteRooms.map((room) => room._id));
  const respondToInvitation = async (invitation, status) => {
    try {
      const result = await roomApi.respondInvitation(invitation._id, status);
      await refetchInvitations();
      toast.success(status === "ACCEPTED" ? "Đã chấp nhận lời mời" : "Đã từ chối lời mời");
      if (status === "ACCEPTED" && result.room?._id) navigate(`/rooms/${result.room._id}`);
    } catch (error) { toast.error(error.response?.data?.message || "Không thể phản hồi lời mời"); }
  };
  const toggleFavorite = async (room, event) => {
    event.preventDefault(); event.stopPropagation();
    try { await (favoriteIds.has(room._id) ? roomApi.unfavorite(room._id) : roomApi.favorite(room._id)); await refetchFavorites(); }
    catch { toast.error("Không thể cập nhật phòng yêu thích"); }
  };
  const inviteByEmail = async (room, event) => {
    event.preventDefault(); event.stopPropagation();
    const email = await promptDialog("Email người bạn muốn mời:", "", { title: "Mời vào phòng học", type: "email", confirmText: "Gửi lời mời" });
    if (!email?.trim()) return;
    try { await roomApi.inviteEmail(room._id, email); toast.success("Đã gửi lời mời"); }
    catch (error) { toast.error(error.response?.data?.message || "Không thể gửi lời mời"); }
  };
  const exportRoom = async (roomId, event) => {
    event?.preventDefault(); event?.stopPropagation();
    try {
      const blob = await roomApi.export(roomId);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `hoca-room-${roomId}.json`; anchor.click();
      URL.revokeObjectURL(url);
    } catch (error) { toast.error(error.response?.data?.message || "Không thể xuất buổi học"); }
  };

  return (
    <div className="mx-auto min-h-[calc(100dvh-4rem)] max-w-7xl px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Phòng học</h1>
          <p className="text-white/50 mt-1">Tham gia hoặc tạo phòng học mới</p>
        </div>
        <button
          onClick={() => openCreateModal()}
          className="btn-primary inline-flex min-h-11 w-full items-center justify-center gap-2 sm:w-auto"
        >
          <Plus size={20} /> Tạo phòng mới
        </button>
      </div>

      {invitations.length > 0 && <section className="mb-6 rounded-2xl border border-primary/25 bg-primary/[0.05] p-4"><h2 className="font-semibold">Lời mời phòng học</h2><div className="mt-3 grid gap-3 sm:grid-cols-2">{invitations.map((invitation)=><div key={invitation._id} className="rounded-xl border border-white/10 bg-dark-card p-3"><p className="font-medium">{invitation.room?.name}</p><p className="mt-1 text-xs text-white/45">Từ {invitation.inviter?.displayName}</p><div className="mt-3 flex gap-2"><button className="btn-primary text-sm" onClick={()=>respondToInvitation(invitation,"ACCEPTED")}>Chấp nhận</button><button className="btn-secondary text-sm" onClick={()=>respondToInvitation(invitation,"DECLINED")}>Từ chối</button></div></div>)}</div></section>}

      {secondaryDataError && <div className="mb-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200" role="alert">Một số dữ liệu phòng học chưa tải được. <button type="button" className="ml-2 underline" onClick={retrySecondaryData}>Thử lại</button></div>}

      <section className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="stat-card"><h2 className="flex items-center gap-2 font-semibold"><CalendarDays size={17}/>Phòng gần đây</h2><div className="mt-3 space-y-2">{recentRooms.slice(0,4).map((room)=><Link key={room._id} to={`/rooms/${room._id}`} className="block truncate text-sm text-white/60 hover:text-primary">{room.name}</Link>)}{!recentRooms.length&&<p className="text-sm text-white/35">Chưa có phòng gần đây</p>}</div></div>
        <div className="stat-card"><h2 className="flex items-center gap-2 font-semibold"><Star size={17}/>Yêu thích</h2><div className="mt-3 space-y-2">{favoriteRooms.slice(0,4).map((room)=><Link key={room._id} to={`/rooms/${room._id}`} className="block truncate text-sm text-white/60 hover:text-primary">{room.name}</Link>)}{!favoriteRooms.length&&<p className="text-sm text-white/35">Chưa lưu phòng nào</p>}</div></div>
        <div className="stat-card"><h2 className="flex items-center gap-2 font-semibold"><Download size={17}/>Lịch sử phiên học</h2><div className="mt-3 space-y-2">{roomHistory.slice(0,4).map((session)=><div key={session._id} className="flex items-center justify-between gap-2 text-sm"><span className="truncate text-white/60">{session.room?.name || "Phòng đã xóa"}</span>{session.room?._id&&<button title="Xuất buổi học" onClick={(event)=>exportRoom(session.room._id,event)} className="text-primary"><Download size={14}/></button>}</div>)}{!roomHistory.length&&<p className="text-sm text-white/35">Chưa có phiên học</p>}</div></div>
      </section>

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
                  onClick={() => openCreateModal()}
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
                onClick={() => openCreateModal()}
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
                  <button onClick={(event)=>toggleFavorite(room,event)} className={`p-1.5 ${favoriteIds.has(room._id) ? "text-yellow-300" : "text-white/30"}`} title="Phòng yêu thích"><Star size={16} fill={favoriteIds.has(room._id) ? "currentColor" : "none"}/></button>
                  {canManage && (
                    <div className="flex items-center gap-1 ml-2">
                      <button onClick={(event)=>inviteByEmail(room,event)} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg" title="Mời bằng email"><UserPlus size={16}/></button>
                      <button onClick={(event)=>exportRoom(room._id,event)} className="p-1.5 text-white/50 hover:bg-white/10 rounded-lg" title="Xuất nội dung"><Download size={16}/></button>
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
                {room.scheduledFor && <p className="mb-3 flex items-center gap-1.5 text-xs text-primary"><CalendarDays size={13}/>{new Date(room.scheduledFor).toLocaleString("vi-VN")}</p>}
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
                {room.hasPassword && (
                  <span className="inline-flex items-center gap-1 text-xs text-primary mt-2">
                    <Lock size={11} /> Có mật khẩu
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

      {!isLoading &&
        !myRoomsLoading &&
        filteredRooms?.length === 0 &&
        !searchTerm && (
          <section className="mt-8 grid gap-5 pb-8 lg:grid-cols-[0.78fr_1.22fr]">
            <div className="rounded-2xl border border-white/10 bg-[#171B2E] p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ClipboardCheck size={20} strokeWidth={2} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="font-semibold">Mục tiêu hôm nay</h2>
                  <p className="mt-1 text-sm leading-6 text-white/45">
                    Chọn một việc cụ thể để phiên học có điểm kết thúc rõ ràng.
                  </p>
                </div>
              </div>

              <form onSubmit={saveTodayGoal} className="mt-5">
                <label htmlFor="today-study-goal" className="sr-only">
                  Mục tiêu học tập hôm nay
                </label>
                <textarea
                  id="today-study-goal"
                  value={goalDraft}
                  onChange={(event) => setGoalDraft(event.target.value)}
                  rows={3}
                  maxLength={160}
                  className="app-input resize-none"
                  placeholder="Ví dụ: Hoàn thành chương 3 môn Giải tích"
                />
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-xs text-white/35">
                    {goalDraft.length}/160 ký tự
                  </span>
                  <button
                    type="submit"
                    disabled={savingGoal}
                    className="inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-primary/40 px-4 text-sm font-semibold text-primary transition hover:border-primary hover:bg-primary/[0.08] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Save size={16} aria-hidden="true" />
                    {savingGoal ? "Đang lưu..." : "Lưu mục tiêu"}
                  </button>
                </div>
              </form>

              {activeGoal && (
                <div className="mt-5 border-t border-white/10 pt-4">
                  <p className="text-xs font-medium text-white/40">Đang hướng tới</p>
                  <p className="mt-1.5 text-sm font-medium leading-6 text-white/80">
                    {activeGoal.text}
                  </p>
                  {activeGoal.room?.name && (
                    <p className="mt-2 text-xs text-primary">
                      Đã gắn với phòng: {activeGoal.room.name}
                    </p>
                  )}
                </div>
              )}

              {goalHistory.some((goal) => goal.status === "COMPLETED") && (
                <div className="mt-4 border-t border-white/10 pt-4">
                  <p className="text-xs font-medium text-white/40">
                    Đã hoàn thành gần đây
                  </p>
                  <div className="mt-2 space-y-2">
                    {goalHistory
                      .filter((goal) => goal.status === "COMPLETED")
                      .slice(0, 2)
                      .map((goal) => (
                        <p key={goal._id} className="text-xs leading-5 text-white/55">
                          ✓ {goal.text}
                        </p>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111527] p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold">Bạn muốn học gì?</h2>
                  <p className="mt-1 text-sm leading-6 text-white/45">
                    Chọn một mẫu để HOCA chuẩn bị sẵn phòng và Pomodoro.
                  </p>
                </div>
                <Lightbulb
                  size={20}
                  className="mt-0.5 shrink-0 text-primary"
                  aria-hidden="true"
                />
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {ROOM_STARTERS.map((starter) => {
                  const Icon = starter.icon;
                  return (
                    <button
                      key={starter.title}
                      type="button"
                      onClick={() => openCreateModal(starter)}
                      className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4 text-left transition hover:border-primary/45 hover:bg-primary/[0.045] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-white/55 transition group-hover:bg-primary/10 group-hover:text-primary">
                        <Icon size={18} strokeWidth={2} aria-hidden="true" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center justify-between gap-3">
                          <span className="font-semibold">{starter.title}</span>
                          <span className="shrink-0 text-xs font-medium text-primary">
                            {starter.duration} phút
                          </span>
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-white/45">
                          {starter.description}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="mt-5 flex items-start gap-2 border-t border-white/10 pt-4 text-xs leading-5 text-white/40">
                <Lightbulb size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                Mẹo: Viết ra đúng một việc cần hoàn thành trước khi bắt đầu bộ đếm.
              </p>
            </div>
          </section>
        )}

      {showCreateModal && (
        <CreateRoomModal
          initialTimerMode={createTimerMode}
          initialPreset={roomPreset}
          studyGoal={activeGoal}
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

function CreateRoomModal({
  onClose,
  onSuccess,
  initialTimerMode,
  initialPreset,
  studyGoal,
}) {
  const navigate = useNavigate();
  const [name, setName] = useState(initialPreset?.title || "");
  const [description, setDescription] = useState(
    initialPreset?.description || "",
  );
  const [roomType, setRoomType] = useState(
    initialPreset?.roomType || "SILENT",
  );
  const [maxParticipants, setMaxParticipants] = useState(30);
  const [timerMode, setTimerMode] = useState(
    initialTimerMode || TIMER_PRESETS[25],
  );
  const [password, setPassword] = useState(""); // NEW: Password for premium users
  const [scheduledFor, setScheduledFor] = useState("");
  const [reminderMinutes, setReminderMinutes] = useState(15);
  const [loading, setLoading] = useState(false);
  const scheduledDate = scheduledFor ? new Date(scheduledFor) : null;
  const reminderDate = scheduledDate ? new Date(scheduledDate.getTime() - Number(reminderMinutes) * 60000) : null;
  const formatVietnamDateTime = (date) => new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", weekday: "short", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date);
  const reminderMomentText = reminderDate && reminderDate <= new Date() ? "ngay sau khi tạo phòng" : reminderDate ? formatVietnamDateTime(reminderDate) : "";

  React.useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Which room types this user can create
  const { data: typeInfo } = useQuery({
    queryKey: ["room-types"],
    queryFn: roomApi.getRoomTypes,
  });

  const isPremium = typeInfo?.tier && typeInfo.tier !== "FREE";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const roomData = {
        name,
        description,
        roomType,
        maxParticipants: parseInt(maxParticipants),
        isPublic: true,
        timerMode,
        studyGoalId: studyGoal?._id,
        scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
        reminderMinutes: Number(reminderMinutes),
      };

      // Add password if provided (only for premium)
      if (password && password.trim()) {
        roomData.password = password.trim();
      }

      const newRoom = await roomApi.createRoom(roomData);
      toast.success(scheduledDate
        ? `Đã lên lịch phòng. HOCA sẽ nhắc bạn ${reminderMomentText}.`
        : "Tạo phòng thành công!");
      onSuccess();
      // Navigate to the newly created room so owner joins automatically
      navigate(`/rooms/${newRoom._id}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Tạo phòng thất bại");
    } finally {
      setLoading(false);
    }
  };

  const types = Array.isArray(typeInfo)
    ? typeInfo
    : typeInfo?.roomTypes || [
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto overscroll-contain bg-black/60 p-2 sm:items-center sm:p-4">
      <div
        className="relative flex max-h-[calc(100dvh-1rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-dark-card text-white shadow-2xl shadow-black/30 animate-scaleIn sm:max-h-[calc(100dvh-2rem)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-room-title"
      >
        <div className="relative shrink-0 border-b border-white/10 px-5 py-4 sm:px-6">
          <CloseButton
            onClick={onClose}
            onPointerDown={(event) => {
              if (event.pointerType === "mouse" && event.button !== 0) return;
              event.preventDefault();
              event.stopPropagation();
              onClose();
            }}
            label="Đóng cửa sổ tạo phòng"
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 sm:right-4"
          />
          <h2 id="create-room-title" className="pr-12 text-xl font-bold sm:text-2xl">
            Tạo phòng học mới
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 [scrollbar-gutter:stable] sm:px-6">
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

          {studyGoal && (
            <div className="rounded-xl border border-primary/25 bg-primary/[0.06] p-3">
              <p className="text-xs font-medium text-primary">Mục tiêu sẽ được gắn vào phòng</p>
              <p className="mt-1.5 text-sm leading-6 text-white/75">{studyGoal.text}</p>
            </div>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            <DateTimeField className="sm:col-span-2" value={scheduledFor} min={new Date().toISOString().slice(0,16)} onChange={setScheduledFor} dateLabel="Ngày bắt đầu" timeLabel="Giờ bắt đầu" />
            <label className="text-sm text-white/60">Nhắc trước<select disabled={!scheduledFor} value={reminderMinutes} onChange={e=>setReminderMinutes(e.target.value)} className="app-input mt-1.5 disabled:cursor-not-allowed disabled:opacity-45"><option value="5">5 phút</option><option value="15">15 phút</option><option value="30">30 phút</option><option value="60">1 giờ</option></select></label>
            <div className="rounded-xl border border-primary/20 bg-primary/[0.055] p-3 text-xs leading-5 text-white/55 sm:col-span-2">
              {reminderDate ? <><span className="font-semibold text-primary">🔔 Lịch nhắc đã sẵn sàng</span><br/>Bạn sẽ nhận thông báo trên HOCA <strong className="text-white/80">{reminderMomentText}</strong>, trước giờ học {reminderMinutes} phút.<br/><span className="text-white/35">Nếu đang mở web, thông báo hiện ngay trên màn hình; nếu đã đóng web, thông báo vẫn được lưu để xem khi quay lại.</span></> : <>Chọn ngày và giờ bắt đầu để bật nhắc lịch. Thông báo sẽ xuất hiện ở biểu tượng chuông và trang Thông báo.</>}
            </div>
          </div>

          {/* Password Input - Only for Premium Users creating DISCUSSION rooms */}
          {isPremium && roomType === "DISCUSSION" && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
              <label className="block text-sm text-primary font-medium mb-1.5 flex items-center gap-2">
                🔒 Mật khẩu phòng (tuỳ chọn)
              </label>
              <input
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="app-input"
                placeholder="Đặt mật khẩu để bảo vệ phòng"
              />
              <p className="text-xs text-white/50 mt-1.5">
                Bạn bè cần mật khẩu này để vào phòng. Chủ phòng không cần nhập.
              </p>
            </div>
          )}

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
          </div>
          <div className="flex shrink-0 gap-3 border-t border-white/10 bg-dark-card px-5 py-4 sm:px-6">
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
