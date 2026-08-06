import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Activity, Archive, Bell, CreditCard, Download, Eye, Save, Settings2, Trash2 } from "lucide-react";
import { adminApi } from "../lib/services";
import { formatDate, formatVND } from "../lib/format";

function QueryState({ query, empty, children }) {
  if (query.isLoading) return <div className="space-y-2">{[0, 1, 2].map((item) => <div key={item} className="skeleton h-14 rounded-xl" />)}</div>;
  if (query.isError) return <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">Không tải được dữ liệu.<button type="button" onClick={() => query.refetch()} className="ml-2 font-semibold underline">Thử lại</button></div>;
  if (!children) return <p className="py-8 text-center text-sm text-white/40">{empty}</p>;
  return children;
}

function Panel({ icon: Icon, title, description, actions, children }) {
  return <section className="stat-card"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary"><Icon size={19}/></div><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-xs text-white/45">{description}</p></div></div>{actions}</div>{children}</section>;
}

function BarChart({ labels = [], values = [], suffix = "" }) {
  const max = Math.max(1, ...values);
  if (!values.length) return <p className="py-8 text-center text-sm text-white/40">Chưa có dữ liệu trong khoảng thời gian này.</p>;
  return <div className="overflow-x-auto pb-2"><div className="flex h-48 min-w-[520px] items-end gap-2" role="img" aria-label="Biểu đồ dữ liệu theo ngày">{values.map((value, index) => <div key={`${labels[index]}-${index}`} className="group flex min-w-8 flex-1 flex-col items-center justify-end gap-2"><span className="text-[10px] text-white/0 transition group-hover:text-white/70">{value}{suffix}</span><div className="w-full rounded-t-md bg-primary/70 transition hover:bg-primary" style={{ height: `${Math.max(3, (Number(value) / max) * 140)}px` }} title={`${labels[index]}: ${value}${suffix}`} /><span className="max-w-12 truncate text-[10px] text-white/35">{labels[index]}</span></div>)}</div></div>;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map((cell) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminSystemTools() {
  const [days, setDays] = useState(30);
  const [configDraft, setConfigDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionSearch, setTransactionSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [transactionStatus, setTransactionStatus] = useState("");
  const [notificationPage, setNotificationPage] = useState(1);
  const [notificationBusy, setNotificationBusy] = useState("");

  useEffect(() => { const timer = window.setTimeout(() => { setDebouncedSearch(transactionSearch.trim()); setTransactionPage(1); }, 300); return () => window.clearTimeout(timer); }, [transactionSearch]);

  const growth = useQuery({ queryKey: ["admin-analytics-growth", days], queryFn: () => adminApi.getAnalytics({ type: "growth", days }) });
  const studyHours = useQuery({ queryKey: ["admin-analytics-study", days], queryFn: () => adminApi.getAnalytics({ type: "study_hours", days }) });
  const engagement = useQuery({ queryKey: ["admin-analytics-engagement", days], queryFn: () => adminApi.getAnalytics({ type: "engagement", days }) });
  const webcam = useQuery({ queryKey: ["admin-analytics-webcam", days], queryFn: () => adminApi.getAnalytics({ type: "webcam_usage", days }) });
  const configQuery = useQuery({ queryKey: ["admin-system-config"], queryFn: adminApi.getSystemConfig });
  const transactions = useQuery({ queryKey: ["admin-transactions", transactionPage, debouncedSearch, transactionStatus], queryFn: () => adminApi.getTransactions({ page: transactionPage, limit: 10, search: debouncedSearch || undefined, status: transactionStatus || undefined }) });
  const notifications = useQuery({ queryKey: ["admin-notifications", notificationPage], queryFn: () => adminApi.getNotifications({ page: notificationPage, limit: 10 }) });
  const adViews = useQuery({ queryKey: ["admin-ad-views"], queryFn: () => adminApi.getAdViews({ page: 1, limit: 5 }) });

  useEffect(() => {
    if (!configQuery.data) return;
    setConfigDraft(Object.fromEntries(Object.entries(configQuery.data).map(([key, value]) => [key, typeof value === "object" && value !== null ? JSON.stringify(value, null, 2) : String(value ?? "")])));
  }, [configQuery.data]);

  const analyticsRows = useMemo(() => {
    const labels = growth.data?.labels || studyHours.data?.labels || [];
    return [["Ngày", "User mới", "Giờ học"], ...labels.map((label, index) => [label, growth.data?.newUsers?.[index] || 0, studyHours.data?.studyHours?.[index] || 0])];
  }, [growth.data, studyHours.data]);

  const saveConfig = async () => {
    const parsed = {};
    try {
      for (const [key, original] of Object.entries(configQuery.data || {})) {
        const raw = configDraft[key] ?? "";
        if (typeof original === "boolean") parsed[key] = raw === "true";
        else if (typeof original === "number") {
          parsed[key] = Number(raw);
          if (!Number.isFinite(parsed[key])) throw new Error(`${key} phải là số hợp lệ`);
        } else if (typeof original === "object" && original !== null) parsed[key] = JSON.parse(raw);
        else parsed[key] = raw;
      }
    } catch (error) {
      toast.error(error.message || "JSON cấu hình không hợp lệ");
      return;
    }
    setSaving(true);
    try { await adminApi.updateSystemConfig(parsed); toast.success("Đã lưu cấu hình hệ thống"); await configQuery.refetch(); }
    catch (error) { toast.error(error.response?.data?.message || "Không lưu được cấu hình"); }
    finally { setSaving(false); }
  };

  const notificationAction = async (id, action, message) => {
    setNotificationBusy(id);
    try { await action(); toast.success(message); await notifications.refetch(); }
    catch (error) { toast.error(error.response?.data?.message || "Không xử lý được thông báo"); }
    finally { setNotificationBusy(""); }
  };

  const analyticsError = growth.isError || studyHours.isError || engagement.isError || webcam.isError;
  return <div className="space-y-5">
    <Panel icon={Activity} title="Analytics nâng cao" description="Tăng trưởng, thời gian học, retention và khung giờ sử dụng" actions={<div className="flex gap-2"><select aria-label="Khoảng thời gian analytics" value={days} onChange={(event) => setDays(Number(event.target.value))} className="app-input min-h-10 w-auto"><option value="7">7 ngày</option><option value="30">30 ngày</option><option value="90">90 ngày</option></select><button type="button" onClick={() => downloadCsv(`hoca-analytics-${days}-ngay.csv`, analyticsRows)} disabled={!growth.data || !studyHours.data} className="btn-secondary inline-flex min-h-10 items-center gap-2 px-3 disabled:opacity-40"><Download size={15}/> CSV</button></div>}>
      {analyticsError ? <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-200">Một phần analytics chưa tải được.<button type="button" onClick={() => { growth.refetch(); studyHours.refetch(); engagement.refetch(); webcam.refetch(); }} className="ml-2 font-semibold underline">Thử lại</button></div> : <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">{[["User mới", growth.data?.totalNewUsers || 0],["User hoạt động", growth.data?.activeUsers || 0],["MAU", growth.data?.mau || 0],["Retention", `${engagement.data?.retentionRate || 0}%`],["Phiên trung bình", engagement.data?.avgSessionTime || "0m"],["Giờ học", webcam.data?.totalHoursLast7Days || 0]].map(([label,value]) => <div key={label} className="rounded-xl bg-white/[0.035] p-3"><p className="text-xs text-white/45">{label}</p><strong className="mt-2 block text-lg">{value}</strong></div>)}</div>
        <div className="grid gap-5 xl:grid-cols-2"><div><h4 className="mb-3 text-sm font-semibold">User mới theo ngày</h4><BarChart labels={growth.data?.labels} values={growth.data?.newUsers}/></div><div><h4 className="mb-3 text-sm font-semibold">Giờ học theo ngày</h4><BarChart labels={studyHours.data?.labels} values={studyHours.data?.studyHours} suffix="h"/></div></div>
        <div><h4 className="mb-3 text-sm font-semibold">Retention 4 tuần</h4><BarChart labels={engagement.data?.retentionTrend?.map((item) => item.week)} values={engagement.data?.retentionTrend?.map((item) => item.rate)} suffix="%"/></div>
      </div>}
    </Panel>

    <div className="grid gap-5 xl:grid-cols-2">
      <Panel icon={Eye} title="Hiệu quả quảng cáo" description="Lượt xem, click và tỷ lệ hoàn thành"><QueryState query={adViews} empty="Chưa có lượt xem quảng cáo.">{adViews.data && <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[["Lượt xem", adViews.data.stats?.totalViews || 0],["Click", adViews.data.stats?.totalClicks || 0],["CTR", `${adViews.data.stats?.ctr || 0}%`],["Hoàn thành", `${adViews.data.stats?.completionRate || 0}%`]].map(([label,value]) => <div key={label} className="rounded-xl bg-white/[0.035] p-3"><p className="text-xs text-white/45">{label}</p><strong className="mt-2 block">{value}</strong></div>)}</div>}</QueryState></Panel>
      <Panel icon={Settings2} title="Cấu hình hệ thống" description="Hỗ trợ chuỗi, số, boolean và JSON object"><QueryState query={configQuery} empty="Chưa có khóa cấu hình nào.">{Object.keys(configDraft).length ? <><div className="max-h-96 space-y-3 overflow-y-auto pr-1">{Object.entries(configQuery.data || {}).map(([key, original]) => <label key={key} className="block text-xs text-white/55">{key}{typeof original === "boolean" ? <select value={configDraft[key]} onChange={(event) => setConfigDraft((current) => ({ ...current, [key]: event.target.value }))} className="app-input mt-1"><option value="true">Bật</option><option value="false">Tắt</option></select> : typeof original === "object" && original !== null ? <textarea value={configDraft[key]} onChange={(event) => setConfigDraft((current) => ({ ...current, [key]: event.target.value }))} rows={4} spellCheck="false" className="app-input mt-1 resize-y font-mono text-xs" /> : <input type={typeof original === "number" ? "number" : "text"} value={configDraft[key]} onChange={(event) => setConfigDraft((current) => ({ ...current, [key]: event.target.value }))} className="app-input mt-1" />}</label>)}</div><button type="button" onClick={saveConfig} disabled={saving} className="btn-primary mt-4 inline-flex min-h-10 items-center gap-2 px-4 disabled:opacity-50"><Save size={16}/>{saving ? "Đang lưu..." : "Lưu cấu hình"}</button></> : null}</QueryState></Panel>
    </div>

    <Panel icon={CreditCard} title="Giao dịch toàn hệ thống" description={`${transactions.data?.total || 0} giao dịch`} actions={<button type="button" onClick={() => downloadCsv("hoca-giao-dich.csv", [["Mã", "User", "Email", "Số tiền", "Loại", "Trạng thái", "Ngày"], ...(transactions.data?.transactions || []).map((item) => [item.id, item.user?.displayName, item.user?.email, item.amount, item.type, item.status, item.date])])} disabled={!transactions.data?.transactions?.length} className="btn-secondary inline-flex min-h-10 items-center gap-2 px-3 disabled:opacity-40"><Download size={15}/> Xuất trang</button>}>
      <div className="mb-4 grid gap-3 sm:grid-cols-[1fr_180px]"><input value={transactionSearch} onChange={(event) => setTransactionSearch(event.target.value)} className="app-input" placeholder="Tìm theo mã giao dịch"/><select value={transactionStatus} onChange={(event) => { setTransactionStatus(event.target.value); setTransactionPage(1); }} className="app-input"><option value="">Tất cả trạng thái</option><option value="PENDING">Đang chờ</option><option value="COMPLETED">Hoàn tất</option><option value="FAILED">Thất bại</option><option value="CANCELLED">Đã hủy</option></select></div>
      <QueryState query={transactions} empty="Chưa có giao dịch."><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="text-xs text-white/40"><tr><th className="pb-3">Mã</th><th className="pb-3">Người dùng</th><th className="pb-3">Loại</th><th className="pb-3">Trạng thái</th><th className="pb-3">Ngày</th><th className="pb-3 text-right">Số tiền</th></tr></thead><tbody className="divide-y divide-white/[0.06]">{transactions.data?.transactions?.map((item) => <tr key={item._id}><td className="py-3 font-mono text-xs text-white/60">{item.id}</td><td className="py-3"><p>{item.user?.displayName || "Không xác định"}</p><p className="text-xs text-white/35">{item.user?.email}</p></td><td className="py-3 text-white/55">{item.type || "-"}</td><td className="py-3">{item.status}</td><td className="py-3 text-white/45">{formatDate(item.date)}</td><td className="py-3 text-right font-semibold">{formatVND(item.amount || 0)}</td></tr>)}</tbody></table></div></QueryState>
      {(transactions.data?.pages || 1) > 1 && <div className="mt-4 flex items-center justify-center gap-3"><button type="button" disabled={transactionPage <= 1} onClick={() => setTransactionPage((page) => page - 1)} className="btn-secondary disabled:opacity-35">Trang trước</button><span className="text-sm text-white/45">{transactionPage}/{transactions.data.pages}</span><button type="button" disabled={transactionPage >= transactions.data.pages} onClick={() => setTransactionPage((page) => page + 1)} className="btn-secondary disabled:opacity-35">Trang sau</button></div>}
    </Panel>

    <Panel icon={Bell} title="Trung tâm thông báo quản trị" description={`${notifications.data?.unreadCount || 0} thông báo chưa đọc`} actions={notifications.data?.unreadCount ? <button type="button" onClick={() => notificationAction("all", () => adminApi.markNotificationsRead(notifications.data.notifications.filter((item) => !item.isRead).map((item) => item._id)), "Đã đánh dấu đã đọc")} disabled={notificationBusy !== ""} className="btn-secondary min-h-10 px-3 disabled:opacity-40">Đọc tất cả trang</button> : null}>
      <QueryState query={notifications} empty="Không có thông báo quản trị."><div className="divide-y divide-white/[0.06]">{notifications.data?.notifications?.map((item) => <div key={item._id} className="flex items-start gap-3 py-3"><button type="button" onClick={() => !item.isRead && notificationAction(item._id, () => adminApi.markNotificationsRead([item._id]), "Đã đánh dấu đã đọc")} className="min-w-0 flex-1 text-left"><div className="flex items-center gap-2"><p className="truncate text-sm font-medium">{item.title || item.type}</p>{!item.isRead && <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Chưa đọc"/>}</div><p className="mt-1 line-clamp-2 text-xs text-white/45">{item.message}</p><p className="mt-1 text-[11px] text-white/30">{formatDate(item.createdAt)}</p></button><button type="button" title="Lưu trữ" aria-label="Lưu trữ" disabled={notificationBusy !== ""} onClick={() => notificationAction(item._id, () => adminApi.archiveNotification(item._id), "Đã lưu trữ")} className="rounded-lg p-2 text-white/40 hover:bg-white/5 hover:text-white disabled:opacity-30"><Archive size={16}/></button><button type="button" title="Xóa" aria-label="Xóa" disabled={notificationBusy !== ""} onClick={() => notificationAction(item._id, () => adminApi.deleteNotification(item._id), "Đã xóa thông báo")} className="rounded-lg p-2 text-white/40 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-30"><Trash2 size={16}/></button></div>)}</div></QueryState>
      {(notifications.data?.pagination?.pages || 1) > 1 && <div className="mt-4 flex items-center justify-center gap-3"><button type="button" disabled={notificationPage <= 1} onClick={() => setNotificationPage((page) => page - 1)} className="btn-secondary disabled:opacity-35">Trang trước</button><span className="text-sm text-white/45">{notificationPage}/{notifications.data.pagination.pages}</span><button type="button" disabled={notificationPage >= notifications.data.pagination.pages} onClick={() => setNotificationPage((page) => page + 1)} className="btn-secondary disabled:opacity-35">Trang sau</button></div>}
    </Panel>
  </div>;
}
