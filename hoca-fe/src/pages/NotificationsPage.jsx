import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Archive, Bell, Check, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { notificationApi } from "../lib/services";
import { timeAgo } from "../lib/format";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [archived, setArchived] = useState(false);
  const [data, setData] = useState({ notifications: [], pagination: { pages: 1 } });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setData(await notificationApi.getAll(page, 20, archived));
      setError("");
    } catch {
      setError("Không tải được thông báo. Vui lòng kiểm tra kết nối và thử lại.");
    } finally { setLoading(false); }
  };
  // load is scoped to the active page/filter and should rerun only when either changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [page, archived]);

  const markOne = async (item) => {
    if (!item.isRead) await notificationApi.markRead([item._id]);
    const target = item.data?.url || item.data?.link;
    if (target?.startsWith("/")) navigate(target);
    else load();
  };
  const act = async (event, action, id) => {
    event.stopPropagation();
    try { await action(id); await load(); }
    catch { toast.error("Không thể cập nhật thông báo."); }
  };

  return <div className="mx-auto max-w-3xl px-4 py-10 text-white">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-3xl font-bold">Thông báo</h1><p className="mt-2 text-white/50">Tất cả cập nhật từ HOCA</p></div><div className="grid grid-cols-2 gap-2 sm:flex"><button className="btn-secondary min-w-0 justify-center px-3" onClick={()=>{setPage(1);setArchived(value=>!value);}}><Archive size={16}/><span className="truncate">{archived ? "Đang lưu trữ" : "Xem lưu trữ"}</span></button><button className="btn-secondary min-w-0 justify-center px-3" onClick={async()=>{await notificationApi.markRead("all");load();}}><Check size={16}/><span className="truncate">Đọc tất cả</span></button></div></div>
    {error && <div className="mt-6 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-red-200">{error} <button className="ml-2 underline" onClick={load}>Thử lại</button></div>}
    <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
      {loading ? <div className="p-10 text-center text-white/50">Đang tải...</div> : !data.notifications.length ? <div className="p-12 text-center text-white/40"><Bell className="mx-auto mb-3"/>Chưa có thông báo</div> : data.notifications.map(item=><div key={item._id} role="button" tabIndex={0} onClick={()=>markOne(item)} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' ')markOne(item);}} className={`flex w-full items-start gap-3 border-b border-white/5 p-4 text-left cursor-pointer hover:bg-white/5 ${!item.isRead?"bg-primary/5":""}`}><span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${item.isRead?"bg-transparent":"bg-primary"}`}/><span className="min-w-0 flex-1"><strong className="block">{item.title}</strong><span className="mt-1 block text-sm text-white/60">{item.message}</span><small className="mt-2 block text-white/35">{timeAgo(item.createdAt)}</small></span><span className="flex shrink-0 gap-1"><button type="button" title="Lưu trữ" onClick={e=>act(e,notificationApi.archive,item._id)} className="rounded-lg p-2 hover:bg-white/10"><Archive size={16}/></button><button type="button" title="Xóa" onClick={e=>act(e,notificationApi.remove,item._id)} className="rounded-lg p-2 text-red-300 hover:bg-red-400/10"><Trash2 size={16}/></button></span></div>)}
    </div>
    <div className="mt-5 flex items-center justify-center gap-3"><button disabled={page<=1} onClick={()=>setPage(p=>p-1)} className="btn-secondary disabled:opacity-40"><ChevronLeft size={16}/></button><span className="text-sm text-white/60">Trang {page}/{data.pagination?.pages||1}</span><button disabled={page>=data.pagination?.pages} onClick={()=>setPage(p=>p+1)} className="btn-secondary disabled:opacity-40"><ChevronRight size={16}/></button></div>
  </div>;
}
