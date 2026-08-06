import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertCircle,
  Check,
  Image as ImageIcon,
  Loader2,
  Lock,
  Mic,
  MicOff,
  MonitorUp,
  Sparkles,
  Upload,
  Video,
  VideoOff,
  X,
} from "lucide-react";
import useWebRTC from "../lib/useWebRTC";
import useVirtualBackground from "../lib/useVirtualBackground";
import BACKGROUND_PRESETS from "../lib/backgroundPresets";

function VideoTile({
  stream,
  label,
  muted,
  isLocal,
  camOn,
  processing = false,
  audioOnly = false,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && stream) ref.current.srcObject = stream;
  }, [stream]);

  const hasVideo = isLocal
    ? camOn
    : stream &&
      stream.getVideoTracks().some((track) => {
        return track.enabled && track.readyState === "live";
      });

  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-dark-lighter">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={`h-full w-full object-cover ${hasVideo ? "" : "hidden"}`}
      />
      {!hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-primary to-orange-600 text-xl font-bold text-white">
            {label?.[0]?.toUpperCase() || "U"}
          </div>
          <span className="text-xs text-white/50">
            {audioOnly ? "Đang tham gia âm thanh" : "Camera đang tắt"}
          </span>
        </div>
      )}
      {processing && hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#111527]/55">
          <span className="inline-flex items-center gap-2 rounded-xl bg-[#111527]/90 px-3 py-2 text-xs text-white/75">
            <Loader2 size={15} className="animate-spin text-primary" />
            Đang tải phông nền
          </span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 rounded-md bg-black/50 px-2 py-0.5 text-xs text-white">
        {label} {isLocal && "(Bạn)"}
      </div>
    </div>
  );
}

export default function VideoRoom({ socket, roomId, user, onlineUsers, audioOnly = false }) {
  const [showBackgroundPanel, setShowBackgroundPanel] = useState(false);
  const [backgroundMode, setBackgroundMode] = useState("none");
  const [backgroundImageUrl, setBackgroundImageUrl] = useState(null);
  const ownedImageUrlRef = useRef(null);
  const fileInputRef = useRef(null);
  const isPremium =
    user?.role === "ADMIN" ||
    (user?.subscriptionTier && user.subscriptionTier !== "FREE");
  const canUploadCustomBackground =
    user?.role === "ADMIN" ||
    ["MONTHLY", "YEARLY", "LIFETIME"].includes(user?.subscriptionTier);

  const {
    localStream,
    remoteStreams,
    camOn,
    micOn,
    sharing,
    screenShareSupported,
    screenStream,
    mediaError,
    toggleCam,
    toggleMic,
    toggleScreenShare,
    setCameraOutputTrack,
    retryMedia,
  } = useWebRTC(socket, roomId, true, audioOnly);

  const activeBackgroundMode =
    isPremium && camOn && !sharing ? backgroundMode : "none";
  const {
    processedStream,
    loading: backgroundLoading,
    error: backgroundError,
  } = useVirtualBackground({
    sourceStream: localStream,
    mode: activeBackgroundMode,
    backgroundImageUrl,
  });

  useEffect(() => {
    const processedTrack = processedStream?.getVideoTracks()[0] || null;
    setCameraOutputTrack(processedTrack);
  }, [processedStream, setCameraOutputTrack]);

  useEffect(
    () => () => {
      if (ownedImageUrlRef.current) {
        URL.revokeObjectURL(ownedImageUrlRef.current);
      }
    },
    [],
  );

  const handleBackgroundFile = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng chọn một tệp hình ảnh.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ảnh nền không được lớn hơn 5 MB.");
      return;
    }

    if (ownedImageUrlRef.current) {
      URL.revokeObjectURL(ownedImageUrlRef.current);
    }
    const nextUrl = URL.createObjectURL(file);
    ownedImageUrlRef.current = nextUrl;
    setBackgroundImageUrl(nextUrl);
    setBackgroundMode("image");
  };

  const nameBySocket = {};
  (onlineUsers || []).forEach((onlineUser) => {
    if (onlineUser.socketId) {
      nameBySocket[onlineUser.socketId] = onlineUser.userName;
    }
  });

  const remoteEntries = Object.entries(remoteStreams);
  const localPreviewStream = sharing
    ? screenStream
    : processedStream || localStream;

  return (
    <div className="stat-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold">
          {audioOnly ? <Mic size={18} className="text-primary" /> : <Video size={18} className="text-primary" />}
          {audioOnly ? "Sân khấu âm thanh" : "Phòng Camera"}
        </h3>
        <span className="text-xs text-white/40">
          {remoteEntries.length + 1} người trong cuộc gọi
        </span>
      </div>

      {mediaError && (
        <div className="mb-3 flex items-start gap-2 rounded-lg bg-red-500/10 p-3 text-sm text-red-400">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <div className="flex-1">
            <p>{mediaError}</p>
            <button
              type="button"
              onClick={retryMedia}
              className="mt-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-dark"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <VideoTile
          stream={localPreviewStream}
          label={user?.displayName}
          muted
          isLocal
          camOn={camOn || sharing}
          processing={backgroundLoading}
          audioOnly={audioOnly}
        />
        {remoteEntries.map(([socketId, data]) => (
          <VideoTile
            key={socketId}
            stream={data.stream}
            label={
              data.userInfo?.displayName ||
              nameBySocket[socketId] ||
              "Học viên"
            }
            muted={false}
            isLocal={false}
            audioOnly={audioOnly}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {!audioOnly && (
          <button
            type="button"
            onClick={toggleCam}
            className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
              camOn
                ? "bg-primary text-white hover:bg-primary-dark"
                : "bg-dark-lighter text-white/70 hover:bg-dark"
            }`}
            title={camOn ? "Tắt camera" : "Bật camera"}
            aria-label={camOn ? "Tắt camera" : "Bật camera"}
          >
            {camOn ? <Video size={20} /> : <VideoOff size={20} />}
          </button>
        )}
        <button
          type="button"
          onClick={toggleMic}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition ${
            micOn
              ? "bg-primary text-white hover:bg-primary-dark"
              : "bg-dark-lighter text-white/70 hover:bg-dark"
          }`}
          title={micOn ? "Tắt mic" : "Bật mic"}
          aria-label={micOn ? "Tắt mic" : "Bật mic"}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        {!audioOnly && (
          <button
          type="button"
          onClick={toggleScreenShare}
          disabled={!screenShareSupported}
          className={`flex h-12 w-12 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${
            sharing
              ? "bg-green-500 text-white hover:bg-green-600"
              : "bg-dark-lighter text-white/70 hover:bg-dark"
          }`}
          title={!screenShareSupported ? "Android không hỗ trợ chia sẻ màn hình" : sharing ? "Dừng chia sẻ màn hình" : "Chia sẻ màn hình"}
          aria-label={!screenShareSupported ? "Thiết bị không hỗ trợ chia sẻ màn hình" : sharing ? "Dừng chia sẻ màn hình" : "Chia sẻ màn hình"}
        >
          <MonitorUp size={20} />
          </button>
        )}

        {!audioOnly && (isPremium ? (
          <button
            type="button"
            onClick={() => setShowBackgroundPanel((current) => !current)}
            disabled={sharing}
            className={`relative flex h-12 w-12 items-center justify-center rounded-full transition disabled:cursor-not-allowed disabled:opacity-40 ${
              backgroundMode !== "none"
                ? "bg-primary text-white hover:bg-primary-dark"
                : "bg-dark-lighter text-white/70 hover:bg-dark"
            }`}
            title={
              sharing
                ? "Hãy dừng chia sẻ màn hình trước"
                : "Phông nền ảo"
            }
            aria-label="Mở cài đặt phông nền ảo"
            aria-expanded={showBackgroundPanel}
          >
            {backgroundLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Sparkles size={20} />
            )}
          </button>
        ) : (
          <Link
            to="/pricing"
            className="relative flex h-12 w-12 items-center justify-center rounded-full bg-dark-lighter text-white/55 transition hover:text-primary"
            title="Phông nền ảo dành cho HOCA+"
            aria-label="Nâng cấp để dùng phông nền ảo"
          >
            <ImageIcon size={20} />
            <Lock
              size={11}
              className="absolute bottom-1.5 right-1.5 text-primary"
            />
          </Link>
        ))}
      </div>

      {!audioOnly && showBackgroundPanel && isPremium && (
        <div className="mx-auto mt-4 max-w-2xl rounded-2xl border border-white/10 bg-[#171B2E] p-5">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h4 className="font-semibold flex items-center gap-2">
                <Sparkles size={18} className="text-primary" />
                Phông nền ảo
              </h4>
              <p className="mt-0.5 text-xs leading-5 text-white/45">
                Chọn phông nền có sẵn hoặc tải lên ảnh của bạn. Ảnh được xử lý trên thiết bị.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowBackgroundPanel(false)}
              className="flex h-9 w-9 items-center justify-center rounded-xl text-white/45 hover:bg-white/[0.05] hover:text-white"
              aria-label="Đóng cài đặt phông nền"
            >
              <X size={18} />
            </button>
          </div>

          {/* Mode selector */}
          <div className="flex items-center gap-2 mb-4">
            <button
              type="button"
              onClick={() => { setBackgroundMode("none"); setBackgroundImageUrl(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                backgroundMode === "none"
                  ? "bg-primary text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              <X size={14} className="inline mr-1" />
              Không dùng
            </button>
            <button
              type="button"
              onClick={() => { setBackgroundMode("blur"); setBackgroundImageUrl(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
                backgroundMode === "blur"
                  ? "bg-primary text-white"
                  : "bg-white/5 text-white/60 hover:bg-white/10"
              }`}
            >
              <Sparkles size={14} className="inline mr-1" />
              Làm mờ nền
            </button>
          </div>

          {/* Preset gallery */}
          <p className="text-xs font-medium text-white/50 mb-2.5 uppercase tracking-wide">
            Phông nền có sẵn
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 mb-4">
            {BACKGROUND_PRESETS.map((bg) => (
              <button
                key={bg.id}
                type="button"
                onClick={() => {
                  setBackgroundMode("image");
                  setBackgroundImageUrl(bg.full);
                }}
                className={`group relative aspect-video rounded-xl overflow-hidden border-2 transition-all ${
                  backgroundMode === "image" && backgroundImageUrl === bg.full
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-transparent hover:border-white/30"
                }`}
              >
                <img
                  src={bg.thumbnail}
                  alt={bg.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                {backgroundMode === "image" && backgroundImageUrl === bg.full && (
                  <div className="absolute top-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-white">
                    <Check size={12} />
                  </div>
                )}
                <span className="absolute bottom-1 left-1 text-[10px] text-white/90 bg-black/50 px-1.5 py-0.5 rounded">
                  {bg.name}
                </span>
              </button>
            ))}
          </div>

          {/* Upload custom background */}
          <div className="border-t border-white/10 pt-4">
            <p className="text-xs font-medium text-white/50 mb-2.5 uppercase tracking-wide">
              Ảnh của bạn {!canUploadCustomBackground && <span className="text-primary">(Gói Tháng+)</span>}
            </p>
            <button
              type="button"
              onClick={() => canUploadCustomBackground && fileInputRef.current?.click()}
              disabled={!canUploadCustomBackground}
              className={`w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 text-sm transition ${
                canUploadCustomBackground
                  ? backgroundImageUrl && !BACKGROUND_PRESETS.find(b => b.full === backgroundImageUrl)
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-white/15 text-white/50 hover:border-white/30 hover:text-white/70"
                  : "border-white/10 text-white/30 cursor-not-allowed"
              }`}
            >
              {backgroundImageUrl && !BACKGROUND_PRESETS.find(b => b.full === backgroundImageUrl) ? (
                <>
                  <img
                    src={backgroundImageUrl}
                    alt="Custom bg"
                    decoding="async"
                    className="w-12 h-8 object-cover rounded"
                  />
                  <span>Ảnh đã chọn — bấm để đổi</span>
                </>
              ) : (
                <>
                  <Upload size={18} />
                  <span>{canUploadCustomBackground ? "Tải ảnh của bạn lên" : "Nâng cấp lên HOCA+ Tháng để tải ảnh riêng"}</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleBackgroundFile}
              className="hidden"
            />
          </div>

          {/* Messages */}
          {!camOn && backgroundMode !== "none" && (
            <p className="mt-3 text-xs text-primary flex items-center gap-1.5">
              <Video size={13} /> Bật camera để xem phông nền đã chọn.
            </p>
          )}
          {backgroundError && (
            <p className="mt-3 text-xs text-red-400">{backgroundError}</p>
          )}
          {backgroundLoading && (
            <p className="mt-3 text-xs text-white/50 flex items-center gap-1.5">
              <Loader2 size={13} className="animate-spin" /> Đang tải phông nền...
            </p>
          )}
        </div>
      )}

      <p className="mt-2 text-center text-xs text-white/30">
        {audioOnly
          ? "Mic được điều phối theo hàng chờ phát biểu của Smart Room."
          : "Ai muốn bật cam hoặc mic thì bật, hoàn toàn tự do."}
      </p>
    </div>
  );
}
