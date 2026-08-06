import {
  ArrowUpRight,
  Bug,
  Flag,
  HelpCircle,
  Mail,
  MessageCircle,
  Paperclip,
  Send,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { supportApi, uploadApi } from "../lib/services";
import { useAuthStore } from "../store/authStore";

const EMAIL = "hocavn2026@gmail.com";

const faqs = [
  {
    question: "Tôi có thể sử dụng HOCA miễn phí không?",
    answer:
      "Có. Tài khoản miễn phí có thể tham gia phòng học và sử dụng các tính năng tập trung cơ bản. HOCA+ mở thêm giới hạn và tính năng nâng cao.",
  },
  {
    question: "Làm thế nào để tạo phòng học?",
    answer:
      "Đăng nhập, mở trang Phòng học và chọn Tạo phòng mới. Bạn có thể đặt tên, loại phòng, bộ đếm thời gian và quyền riêng tư.",
  },
  {
    question: "Tôi không nghe hoặc bật được micro trong phòng?",
    answer:
      "Hãy kiểm tra quyền micro của trình duyệt và loại phòng. Phòng yên lặng không cho phép dùng micro, còn một số phòng thảo luận áp dụng quyền theo gói tài khoản.",
  },
  {
    question: "Tôi cần làm gì khi phát hiện hành vi vi phạm?",
    answer:
      "Dùng chức năng báo cáo trong phòng hoặc gửi email cho HOCA. Vui lòng nêu rõ tài khoản, phòng học, thời gian và nội dung liên quan.",
  },
];

export default function SupportPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const ticketFormRef = useRef(null);
  const ticketSubjectRef = useRef(null);
  const [form, setForm] = useState({ category: "TECHNICAL", subject: "", message: "" });
  const [tickets, setTickets] = useState([]);
  const [ticketPage, setTicketPage] = useState(1);
  const [ticketPagination, setTicketPagination] = useState({ page: 1, pages: 1 });
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [replyAttachment, setReplyAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const startInternalReport = (category, subject) => {
    if (!user) {
      toast("Vui lòng đăng nhập để gửi báo cáo cho HOCA.");
      navigate("/login", { state: { from: "/support" } });
      return;
    }

    setForm((current) => ({
      ...current,
      category,
      subject: current.subject || subject,
    }));
    window.requestAnimationFrame(() => {
      ticketFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      ticketSubjectRef.current?.focus({ preventScroll: true });
    });
  };
  const loadTickets = async (page = ticketPage) => {
    if (!user) return;
    setTicketsLoading(true);
    try {
      const data = await supportApi.mine(page);
      setTickets(data.tickets || []);
      setTicketPagination(data.pagination || { page, pages: 1 });
      setTicketsError("");
    } catch {
      setTicketsError("Không thể tải danh sách yêu cầu hỗ trợ.");
    } finally {
      setTicketsLoading(false);
    }
  };
  const openTicket = async (id) => {
    try { setSelectedTicket(await supportApi.get(id)); }
    catch { toast.error("Không thể tải nội dung ticket"); }
  };
  // loadTickets uses the current user and page values from this render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadTickets(ticketPage); }, [user, ticketPage]);
  const submitTicket = async (event) => {
    event.preventDefault(); setSending(true);
    try { const uploaded = attachment ? await uploadApi.supportAttachment(attachment) : null; const ticket = await supportApi.create({ ...form, attachments: uploaded ? [uploaded.url] : [] }); toast.success(`Đã tạo ticket ${ticket.code}`); setForm({ ...form, subject: "", message: "" }); setAttachment(null); setTicketPage(1); await loadTickets(1); }
    catch (error) { toast.error(error.response?.data?.message || "Không thể gửi yêu cầu hỗ trợ"); }
    finally { setSending(false); }
  };
  const sendReply = async (event) => {
    event.preventDefault(); if (!replyMessage.trim() || !selectedTicket) return;
    try { const uploaded = replyAttachment ? await uploadApi.supportAttachment(replyAttachment) : null; await supportApi.reply(selectedTicket._id, replyMessage, uploaded ? [uploaded.url] : []); setReplyMessage(""); setReplyAttachment(null); await openTicket(selectedTicket._id); loadTickets(); toast.success("Đã gửi phản hồi"); }
    catch (error) { toast.error(error.response?.data?.message || "Không thể gửi phản hồi"); }
  };
  return (
    <div className="mx-auto max-w-5xl px-4 py-12 text-white sm:px-6 lg:px-8 lg:py-16">
      <div className="max-w-2xl">
        <div className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <HelpCircle size={17} aria-hidden="true" />
          Trung tâm trợ giúp
        </div>
        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          HOCA có thể giúp gì cho bạn?
        </h1>
        <p className="mt-4 leading-7 text-white/60">
          Tìm câu trả lời nhanh hoặc liên hệ trực tiếp với đội ngũ HOCA.
        </p>
      </div>

      <div className="mt-10 grid gap-5 md:grid-cols-2">
        {user && <section ref={ticketFormRef} className="scroll-mt-24 rounded-2xl border border-primary/25 bg-primary/[0.04] p-6 md:col-span-2">
          <h2 className="text-xl font-semibold">Gửi yêu cầu hỗ trợ</h2>
          <form onSubmit={submitTicket} className="mt-5 grid gap-3 sm:grid-cols-2">
            <select className="app-input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}><option value="TECHNICAL">Lỗi kỹ thuật</option><option value="ACCOUNT">Tài khoản</option><option value="PAYMENT">Thanh toán</option><option value="REPORT">Báo cáo vi phạm</option><option value="OTHER">Khác</option></select>
            <input ref={ticketSubjectRef} className="app-input" required maxLength={160} placeholder="Tiêu đề" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})}/>
            <textarea className="app-input min-h-32 sm:col-span-2" required maxLength={5000} placeholder="Mô tả chi tiết vấn đề..." value={form.message} onChange={e=>setForm({...form,message:e.target.value})}/>
            <label className="btn-secondary cursor-pointer sm:col-span-2"><Paperclip size={16}/>{attachment ? attachment.name : "Đính kèm ảnh/video (tối đa 25 MB)"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" className="hidden" onChange={e=>setAttachment(e.target.files?.[0] || null)}/></label>
            <button disabled={sending} className="btn-primary sm:col-span-2">{sending?"Đang gửi...":"Tạo ticket hỗ trợ"}</button>
          </form>
          <div className="mt-6 border-t border-white/10 pt-4"><div className="flex items-center justify-between gap-3"><h3 className="font-semibold">Yêu cầu của bạn</h3>{ticketsLoading && <span className="text-xs text-white/40">Đang tải...</span>}</div>{ticketsError ? <div className="mt-3 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-200">{ticketsError}<button type="button" onClick={()=>loadTickets(ticketPage)} className="ml-2 font-semibold underline">Thử lại</button></div> : tickets.length ? <><div className="mt-3 space-y-2">{tickets.map(ticket=><button type="button" onClick={()=>openTicket(ticket._id)} key={ticket._id} className="flex w-full items-center justify-between rounded-xl bg-black/15 px-4 py-3 text-left text-sm hover:bg-black/25"><span><strong>{ticket.code}</strong><span className="ml-2 text-white/55">{ticket.subject}</span></span><span className="text-primary">{ticket.status}</span></button>)}</div><div className="mt-3 flex items-center justify-center gap-3"><button type="button" disabled={ticketPage<=1} onClick={()=>setTicketPage(page=>page-1)} className="btn-secondary disabled:opacity-40">Trang trước</button><span className="text-xs text-white/50">{ticketPagination.page}/{ticketPagination.pages || 1}</span><button type="button" disabled={ticketPage>=ticketPagination.pages} onClick={()=>setTicketPage(page=>page+1)} className="btn-secondary disabled:opacity-40">Trang sau</button></div></> : !ticketsLoading && <p className="mt-3 text-sm text-white/45">Bạn chưa có yêu cầu hỗ trợ nào.</p>}</div>
        </section>}
        {selectedTicket && <section className="rounded-2xl border border-white/10 bg-white/[0.035] p-6 md:col-span-2"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-xl font-semibold">{selectedTicket.code} · {selectedTicket.subject}</h2><p className="mt-1 text-sm text-primary">{selectedTicket.status}</p></div><button className="btn-secondary" onClick={()=>setSelectedTicket(null)}>Đóng</button></div><div className="mt-5 max-h-96 space-y-3 overflow-y-auto">{selectedTicket.messages?.map((message,index)=><div key={message._id||index} className={`rounded-xl p-3 ${message.role==="ADMIN"?"bg-primary/10":"bg-black/20"}`}><p className="text-xs font-semibold text-white/45">{message.role==="ADMIN"?"HOCA hỗ trợ":"Bạn"} · {new Date(message.createdAt).toLocaleString("vi-VN")}</p><p className="mt-2 whitespace-pre-wrap text-sm text-white/75">{message.content}</p>{message.attachments?.map((url)=><a key={url} href={url} target="_blank" rel="noreferrer" className="mt-2 block truncate text-xs text-primary underline">Tệp đính kèm</a>)}</div>)}</div>{!["RESOLVED","CLOSED"].includes(selectedTicket.status)&&<form onSubmit={sendReply} className="mt-5 grid gap-3"><textarea required className="app-input min-h-24" value={replyMessage} onChange={e=>setReplyMessage(e.target.value)} placeholder="Nhập phản hồi..."/><div className="flex flex-wrap gap-2"><label className="btn-secondary cursor-pointer"><Paperclip size={16}/>{replyAttachment?.name||"Đính kèm"}<input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm" className="hidden" onChange={e=>setReplyAttachment(e.target.files?.[0]||null)}/></label><button className="btn-primary"><Send size={16}/>Gửi phản hồi</button></div></form>}</section>}
        <section
          id="contact"
          className="scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.035] p-6"
        >
          <Mail className="text-primary" size={24} aria-hidden="true" />
          <h2 className="mt-5 text-xl font-semibold">Liên hệ hỗ trợ</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Gửi câu hỏi về tài khoản, thanh toán hoặc cách sử dụng HOCA.
          </p>
          <a
            href={`mailto:${EMAIL}?subject=Hỗ trợ sử dụng HOCA`}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-[#18100A] transition hover:bg-primary-light active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
          >
            Gửi email hỗ trợ
            <ArrowUpRight size={17} aria-hidden="true" />
          </a>
        </section>

        <section
          id="report"
          className="scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.035] p-6"
        >
          <Bug className="text-primary" size={24} aria-hidden="true" />
          <h2 className="mt-5 text-xl font-semibold">Báo lỗi</h2>
          <p className="mt-2 text-sm leading-6 text-white/60">
            Mô tả thao tác, thiết bị và ảnh chụp lỗi để HOCA xử lý nhanh hơn.
          </p>
          <button
            type="button"
            onClick={() => startInternalReport("TECHNICAL", "Báo lỗi HOCA")}
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold transition hover:border-primary/70 hover:text-primary active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Gửi báo lỗi
            <ArrowUpRight size={17} aria-hidden="true" />
          </button>
        </section>

        <section
          id="violation"
          className="scroll-mt-24 rounded-2xl border border-primary/25 bg-primary/[0.045] p-6 md:col-span-2"
        >
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <Flag className="text-primary" size={24} aria-hidden="true" />
              <h2 className="mt-5 text-xl font-semibold">
                Báo cáo vi phạm cộng đồng
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/60">
                Gửi tên tài khoản, phòng học, thời gian và mô tả hành vi để
                quản trị viên HOCA kiểm tra. Nếu đang ở trong phòng, bạn cũng
                có thể bấm vào thành viên và chọn Báo cáo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => startInternalReport("REPORT", "Báo cáo vi phạm cộng đồng")}
              className="inline-flex min-h-12 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 text-sm font-semibold text-[#18100A] transition hover:bg-primary-light active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-light"
            >
              Gửi báo cáo
              <ArrowUpRight size={17} aria-hidden="true" />
            </button>
          </div>
        </section>
      </div>

      <section id="faq" className="mt-14 scroll-mt-24">
        <div className="flex items-center gap-3">
          <MessageCircle className="text-primary" size={23} aria-hidden="true" />
          <h2 className="text-2xl font-bold">Câu hỏi thường gặp</h2>
        </div>
        <div className="mt-6 space-y-3">
          {faqs.map((item) => (
            <details
              key={item.question}
              className="group rounded-2xl border border-white/10 bg-white/[0.025] px-5 open:border-primary/30 open:bg-primary/[0.04]"
            >
              <summary className="cursor-pointer list-none py-5 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                {item.question}
              </summary>
              <p className="max-w-3xl pb-5 text-sm leading-6 text-white/60">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
