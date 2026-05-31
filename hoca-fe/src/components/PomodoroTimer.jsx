import { useState, useEffect, useRef } from "react";
import { Coffee, Brain } from "lucide-react";

/**
 * Server-synced Pomodoro timer.
 * Listens to "timer-update" / "timer-sync" socket events which carry:
 *   { status: 'FOCUS' | 'BREAK' | 'IDLE', startTime, duration (minutes), mode, serverTime }
 */
export default function PomodoroTimer({ socket }) {
  const [timer, setTimer] = useState(null); // { status, endTime }
  const [remaining, setRemaining] = useState(0);
  const offsetRef = useRef(0); // serverTime - clientNow

  useEffect(() => {
    if (!socket) return;

    const apply = (data) => {
      if (!data || data.status === "IDLE") {
        setTimer({ status: "IDLE" });
        return;
      }
      // account for clock drift between server and client
      if (data.serverTime) {
        offsetRef.current = data.serverTime - Date.now();
      }
      const endTime = data.startTime + data.duration * 60 * 1000;
      setTimer({ status: data.status, endTime, duration: data.duration });
    };

    socket.on("timer-update", apply);
    socket.on("timer-sync", apply);

    return () => {
      socket.off("timer-update", apply);
      socket.off("timer-sync", apply);
    };
  }, [socket]);

  useEffect(() => {
    if (!timer || timer.status === "IDLE" || !timer.endTime) {
      setRemaining(0);
      return;
    }
    const tick = () => {
      const now = Date.now() + offsetRef.current;
      setRemaining(Math.max(0, Math.floor((timer.endTime - now) / 1000)));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  if (!timer || timer.status === "IDLE") {
    return (
      <div className="text-center py-4">
        <div className="text-4xl font-bold text-white/30 font-mono">--:--</div>
        <p className="text-xs text-white/40 mt-1">Đang chờ phiên học...</p>
      </div>
    );
  }

  const isFocus = timer.status === "FOCUS";
  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");
  const total = (timer.duration || 25) * 60;
  const pct = total > 0 ? ((total - remaining) / total) * 100 : 0;

  return (
    <div className="text-center py-2">
      <div
        className={`inline-flex items-center gap-1.5 pill mb-3 ${
          isFocus
            ? "bg-primary/15 text-primary"
            : "bg-green-500/15 text-green-400"
        }`}
      >
        {isFocus ? <Brain size={13} /> : <Coffee size={13} />}
        {isFocus ? "Tập trung" : "Nghỉ ngơi"}
      </div>

      <div className="relative w-36 h-36 mx-auto">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke={isFocus ? "#ff8c00" : "#2ecc71"}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 45}
            strokeDashoffset={(2 * Math.PI * 45 * (100 - pct)) / 100}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-3xl font-bold font-mono text-white">
            {mm}:{ss}
          </span>
        </div>
      </div>
    </div>
  );
}
