import { useEffect, useRef } from "react";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  AlertCircle,
  MonitorUp,
} from "lucide-react";
import useWebRTC from "../lib/useWebRTC";

function VideoTile({ stream, label, muted, isLocal, camOn }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && stream) {
      ref.current.srcObject = stream;
    }
  }, [stream]);

  // For local tile we know camOn; for remote we rely on the stream having a live video track
  const hasVideo = isLocal
    ? camOn
    : stream &&
      stream.getVideoTracks().some((t) => t.enabled && t.readyState === "live");

  return (
    <div className="relative aspect-video bg-dark-lighter rounded-xl overflow-hidden border border-white/10">
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={muted}
        className={`w-full h-full object-cover ${hasVideo ? "" : "hidden"}`}
      />
      {!hasVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center text-white text-xl font-bold mb-2">
            {label?.[0]?.toUpperCase() || "U"}
          </div>
          <span className="text-xs text-white/50">Camera đang tắt</span>
        </div>
      )}
      <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/50 text-xs text-white">
        {label} {isLocal && "(Bạn)"}
      </div>
    </div>
  );
}

export default function VideoRoom({ socket, roomId, user, onlineUsers }) {
  const {
    localStream,
    remoteStreams,
    camOn,
    micOn,
    sharing,
    mediaError,
    toggleCam,
    toggleMic,
    toggleScreenShare,
    retryMedia,
  } = useWebRTC(socket, roomId, true);

  // Map socketId -> displayName from the online users list
  const nameBySocket = {};
  (onlineUsers || []).forEach((u) => {
    if (u.socketId) nameBySocket[u.socketId] = u.userName;
  });

  const remoteEntries = Object.entries(remoteStreams);

  return (
    <div className="stat-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Video size={18} className="text-primary" /> Phòng Camera
        </h3>
        <span className="text-xs text-white/40">
          {remoteEntries.length + 1} người trong cuộc gọi
        </span>
      </div>

      {mediaError ? (
        <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 rounded-lg p-3 mb-3">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{mediaError}</p>
            <button
              onClick={retryMedia}
              className="mt-2 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-white text-xs font-semibold"
            >
              Thử lại
            </button>
          </div>
        </div>
      ) : null}

      {/* Video grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Local */}
        <VideoTile
          stream={localStream}
          label={user?.displayName}
          muted
          isLocal
          camOn={camOn}
        />
        {/* Remotes */}
        {remoteEntries.map(([sid, data]) => (
          <VideoTile
            key={sid}
            stream={data.stream}
            label={
              data.userInfo?.displayName || nameBySocket[sid] || "Học viên"
            }
            muted={false}
            isLocal={false}
          />
        ))}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3 mt-4">
        <button
          onClick={toggleCam}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            camOn
              ? "bg-primary hover:bg-primary-dark text-white"
              : "bg-dark-lighter hover:bg-dark text-white/70"
          }`}
          title={camOn ? "Tắt camera" : "Bật camera"}
        >
          {camOn ? <Video size={20} /> : <VideoOff size={20} />}
        </button>
        <button
          onClick={toggleMic}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            micOn
              ? "bg-primary hover:bg-primary-dark text-white"
              : "bg-dark-lighter hover:bg-dark text-white/70"
          }`}
          title={micOn ? "Tắt mic" : "Bật mic"}
        >
          {micOn ? <Mic size={20} /> : <MicOff size={20} />}
        </button>
        <button
          onClick={toggleScreenShare}
          className={`w-12 h-12 rounded-full flex items-center justify-center transition ${
            sharing
              ? "bg-green-500 hover:bg-green-600 text-white"
              : "bg-dark-lighter hover:bg-dark text-white/70"
          }`}
          title={sharing ? "Dừng chia sẻ màn hình" : "Chia sẻ màn hình"}
        >
          <MonitorUp size={20} />
        </button>
      </div>
      <p className="text-center text-xs text-white/30 mt-2">
        Ai muốn bật cam/mic thì bật, hoàn toàn tự do.
      </p>
    </div>
  );
}
