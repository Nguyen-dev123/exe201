import { useQuery } from "@tanstack/react-query";
import { Activity, DoorOpen, RefreshCw, Server, Users } from "lucide-react";
import { publicApi } from "../lib/services";

export default function StatusPage() {
  const {
    data,
    isError,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ["platform-status-page"],
    queryFn: async () => {
      const [stats, health] = await Promise.all([
        publicApi.getPlatformStats(),
        publicApi.getSystemHealth(),
      ]);
      return { ...stats, health };
    },
    refetchInterval: 15000,
    retry: 1,
  });

  const isOperationalStatus = (status) => status === "operational" || status === "ok";
  const operational = !isError && isOperationalStatus(data?.health?.status);
  const checkedAt = data?.health?.timestamp
    ? new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(new Date(data.health.timestamp))
    : "Chưa có dữ liệu";

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 text-white sm:px-6 lg:px-8 lg:py-16">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
            <Activity size={17} aria-hidden="true" />
            Trạng thái HOCA
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Tình trạng hệ thống
          </h1>
          <p className="mt-3 text-white/60">
            Dữ liệu tự động cập nhật mỗi 15 giây.
          </p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/15 px-4 text-sm font-semibold transition hover:border-primary/60 hover:text-primary disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <RefreshCw
            size={17}
            className={isFetching ? "animate-spin" : ""}
            aria-hidden="true"
          />
          Kiểm tra lại
        </button>
      </div>

      <section
        className={`mt-10 rounded-2xl border p-6 sm:p-8 ${
          operational
            ? "border-emerald-400/25 bg-emerald-400/[0.055]"
            : "border-amber-400/25 bg-amber-400/[0.055]"
        }`}
      >
        <div className="flex items-start gap-4">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              operational
                ? "bg-emerald-400/10 text-emerald-300"
                : "bg-amber-400/10 text-amber-300"
            }`}
          >
            <Server size={22} aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">
              {operational
                ? "Hệ thống hoạt động bình thường"
                : "Hệ thống đang được kiểm tra"}
            </h2>
            <p className="mt-2 text-sm text-white/55">
              Lần cập nhật gần nhất: {checkedAt}
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
          <Users className="text-primary" size={22} aria-hidden="true" />
          <div className="mt-5 text-3xl font-bold">{data?.onlineUsers ?? "--"}</div>
          <div className="mt-2 text-sm text-white/55">Người đang học</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-6">
          <DoorOpen className="text-primary" size={22} aria-hidden="true" />
          <div className="mt-5 text-3xl font-bold">{data?.activeRooms ?? "--"}</div>
          <div className="mt-2 text-sm text-white/55">Phòng đang hoạt động</div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(data?.health?.services || {}).map(([name, service]) => (
          <div key={name} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <span className="text-sm font-medium uppercase tracking-wide text-white/70">{name}</span>
            <span className={`text-xs font-semibold ${isOperationalStatus(service.status) ? "text-emerald-300" : service.status === "degraded" ? "text-amber-300" : "text-red-300"}`}>
              {service.status === "operational" ? "Hoạt động" : service.status === "degraded" ? "Suy giảm" : "Gián đoạn"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
