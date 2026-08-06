import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bot,
  Clock3,
  Crown,
  RefreshCw,
  Send,
  Sparkles,
  User as UserIcon,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Pencil,
} from "lucide-react";
import { aiApi } from "../lib/services";
import { confirmDialog, promptDialog } from "../lib/dialog";
import toast from "react-hot-toast";

const SUGGESTIONS = [
  "Giải thích định luật Newton thứ nhất",
  "Cách ghi nhớ bảng tuần hoàn hóa học?",
  "Mẹo học từ vựng tiếng Anh hiệu quả",
  "Công thức tính đạo hàm cơ bản",
];

const FREE_DAILY_LIMIT = 15;

export default function AIPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);
  const [statusError, setStatusError] = useState("");
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(true);
  const [conversationsError, setConversationsError] = useState("");
  const [conversationId, setConversationId] = useState(null);
  const [subject, setSubject] = useState("Chung");
  const [explanationLevel, setExplanationLevel] = useState("STANDARD");
  const messagesRef = useRef(null);

  const loadStatus = async () => {
    try {
      const data = await aiApi.getStatus("MAIN");
      setStatus(data);
      setStatusError("");
    } catch {
      setStatusError("Chưa tải được số lượt còn lại.");
    }
  };

  const refreshConversations = async () => {
    setConversationsLoading(true);
    setConversationsError("");
    try { setConversations(await aiApi.listConversations()); }
    catch { setConversationsError("Không thể tải lịch sử trò chuyện."); }
    finally { setConversationsLoading(false); }
  };

  useEffect(() => {
    loadStatus();
    refreshConversations();

    const refreshInterval = window.setInterval(loadStatus, 60_000);
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadStatus();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.clearInterval(refreshInterval);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  useEffect(() => {
    if (!messages.length && !sending) return;
    const container = messagesRef.current;
    container?.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  const limitReached = status?.canAsk === false || status?.remaining === 0;

  const openConversation = async (id) => {
    if (!id) { setConversationId(null); setMessages([]); setSubject("Chung"); setExplanationLevel("STANDARD"); return; }
    try {
      const item = await aiApi.getConversation(id);
      setConversationId(id);
      setSubject(item.subject || "Chung");
      setExplanationLevel(item.explanationLevel || "STANDARD");
      setMessages(item.messages.map((message) => ({ ...message, role: message.role === "assistant" ? "ai" : "user" })));
    } catch {
      toast.error("Không thể mở cuộc trò chuyện");
    }
  };

  const send = async (question) => {
    const q = (question ?? input).trim();
    if (!q || sending || limitReached) return;

    const history = messages.map((message) => ({
      role: message.role === "ai" ? "assistant" : "user",
      content: message.content,
    }));

    setMessages((current) => [...current, { role: "user", content: q }]);
    setInput("");
    setSending(true);

    try {
      const result = await aiApi.ask(q, history, { scope: "MAIN", conversationId, subject, explanationLevel });
      setMessages((current) => [
        ...current,
        { role: "ai", content: result.response, _id: result.messageId, sources: result.sources || [] },
      ]);
      if (result.conversationId) setConversationId(result.conversationId);
      refreshConversations();
      if (typeof result.remaining === "number") {
        setStatus((current) => current && ({
          ...current,
          remaining: result.remaining,
          limit: result.remaining >= 0 ? FREE_DAILY_LIMIT : current.limit,
          used: result.remaining >= 0
            ? FREE_DAILY_LIMIT - result.remaining
            : current.used,
          canAsk: result.remaining !== 0,
          isPremium: result.remaining < 0,
        }));
      }
    } catch (error) {
      const data = error.response?.data;
      if (data?.limitReached) {
        setStatus((current) => current && ({
          ...current,
          remaining: 0,
          used: current.limit,
          canAsk: false,
        }));
      }
      setMessages((current) => [
        ...current,
        {
          role: "ai",
          content: data?.message || "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 text-white sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-orange-600">
            <Sparkles size={24} className="text-white" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">HOCA AI</h1>
            <p className="text-sm text-white/50">Trợ lý học tập thông minh</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          <select aria-label="Lịch sử trò chuyện" disabled={conversationsLoading || Boolean(conversationsError)} value={conversationId || ""} onChange={(event) => openConversation(event.target.value)} className="app-input max-w-48 py-1.5 text-sm disabled:opacity-50">
            <option value="">Cuộc trò chuyện mới</option>
            {conversations.map((item) => <option key={item._id} value={item._id}>{item.title}</option>)}
          </select>
          {conversationsLoading && <span className="text-xs text-white/45">Đang tải lịch sử...</span>}
          {conversationsError && <button type="button" className="text-xs text-red-300 underline" onClick={refreshConversations}>Tải lại lịch sử</button>}
          {conversationId && <>
            <button type="button" title="Đổi tên" className="pill bg-white/10" onClick={async()=>{const title=await promptDialog("Tên cuộc trò chuyện:", "", { title: "Đổi tên cuộc trò chuyện" });if(title){try{await aiApi.updateConversation(conversationId,{title});refreshConversations();}catch{toast.error("Không thể đổi tên cuộc trò chuyện");}}}}><Pencil size={13}/></button>
            <button type="button" title="Xóa" className="pill bg-red-500/10 text-red-300" onClick={async()=>{if(await confirmDialog("Xóa cuộc trò chuyện này?", { destructive: true, confirmText: "Xóa cuộc trò chuyện" })){try{await aiApi.deleteConversation(conversationId);setConversationId(null);setMessages([]);refreshConversations();}catch{toast.error("Không thể xóa cuộc trò chuyện");}}}}><Trash2 size={13}/></button>
          </>}
          {!status && !statusError && <span className="skeleton h-8 w-40 rounded-full" />}
          {status?.isPremium ? (
            <span className="pill bg-amber-500/15 text-amber-300">
              <Crown size={13} aria-hidden="true" /> Không giới hạn
            </span>
          ) : status ? (
            <span className={`pill ${limitReached ? "bg-red-500/10 text-red-300" : "bg-primary/10 text-primary"}`}>
              <Clock3 size={13} aria-hidden="true" />
              {status.remaining}/{status.limit} lượt hôm nay
            </span>
          ) : null}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={() => { setMessages([]); setConversationId(null); }}
              className="pill bg-white/10 text-white/70 transition hover:bg-white/20 active:translate-y-px"
              title="Cuộc trò chuyện mới"
            >
              <RefreshCw size={13} aria-hidden="true" /> Mới
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-white/55">Môn học
          <input value={subject} onChange={(event)=>setSubject(event.target.value)} maxLength={80} className="app-input mt-1.5" placeholder="Ví dụ: Toán, Vật lý..." />
        </label>
        <label className="text-xs font-medium text-white/55">Mức độ giải thích
          <select value={explanationLevel} onChange={(event)=>setExplanationLevel(event.target.value)} className="app-input mt-1.5">
            <option value="SIMPLE">Dễ hiểu</option><option value="STANDARD">Tiêu chuẩn</option><option value="ADVANCED">Chuyên sâu</option>
          </select>
        </label>
      </div>

      {!status?.isPremium && (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/[0.055] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-white/85">
              Dùng thử miễn phí 15 câu mỗi ngày
            </p>
            <p className="mt-0.5 text-xs text-white/45">
              Tự đặt lại lúc 00:00. Thành viên HOCA+ dùng AI trong phòng thảo luận không giới hạn.
            </p>
          </div>
          <Link
            to="/pricing"
            className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-4 text-sm font-semibold text-[#18100A] transition hover:bg-primary-light active:translate-y-px"
          >
            <Crown size={15} aria-hidden="true" /> Nâng cấp
          </Link>
        </div>
      )}

      {statusError && (
        <div className="mb-4 flex items-center justify-between gap-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3 text-sm text-amber-200">
          <span>{statusError}</span>
          <button type="button" onClick={loadStatus} className="font-semibold hover:text-white">
            Thử lại
          </button>
        </div>
      )}

      <div className="stat-card flex h-[60vh] flex-col overflow-hidden p-0">
        <div ref={messagesRef} className="flex-1 space-y-5 overflow-y-auto p-5">
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <Bot size={48} className="mb-4 text-primary/50" aria-hidden="true" />
              <p className="mb-6 text-white/60">
                Hỏi mình bất cứ điều gì về học tập nhé!
              </p>
              <div className="grid w-full max-w-md gap-2 sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={limitReached || sending}
                    onClick={() => send(suggestion)}
                    className="rounded-xl border border-white/5 bg-dark-lighter px-4 py-3 text-left text-sm transition hover:border-primary/30 hover:bg-dark active:translate-y-px disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div key={`${message.role}-${index}`} className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${message.role === "user" ? "bg-dark-lighter" : "bg-gradient-to-br from-primary to-orange-600"}`}>
                {message.role === "user" ? <UserIcon size={16} /> : <Sparkles size={16} className="text-white" />}
              </div>
              <div className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 ${message.role === "user" ? "rounded-tr-sm bg-primary text-white" : message.error ? "rounded-tl-sm border border-red-500/20 bg-red-500/10 text-red-300" : "rounded-tl-sm bg-dark-lighter text-white/90"}`}>
                {message.content}
                {message.sources?.length > 0 && <div className="mt-3 border-t border-white/10 pt-2 text-xs"><span className="text-white/45">Nguồn tham khảo:</span><ul className="mt-1 space-y-1">{message.sources.map((source, sourceIndex)=><li key={`${source.url}-${sourceIndex}`}><a href={source.url} target="_blank" rel="noreferrer" className="text-primary underline hover:text-primary-light">{source.title || source.url}</a></li>)}</ul></div>}
                {message.role === "ai" && !message.error && <div className="mt-2 flex gap-2 border-t border-white/10 pt-2">
                  <button title="Sao chép" onClick={()=>navigator.clipboard.writeText(message.content)}><Copy size={14}/></button>
                  <button title="Tạo lại" onClick={()=>send(messages.slice(0,index).reverse().find(item=>item.role==="user")?.content)}><RefreshCw size={14}/></button>
                  {message._id && conversationId && <><button title="Hữu ích" onClick={async()=>{try{await aiApi.rateMessage(conversationId,message._id,"UP");toast.success("Đã gửi đánh giá");}catch{toast.error("Không thể gửi đánh giá");}}}><ThumbsUp size={14}/></button><button title="Chưa tốt" onClick={async()=>{try{await aiApi.rateMessage(conversationId,message._id,"DOWN");toast.success("Đã gửi đánh giá");}catch{toast.error("Không thể gửi đánh giá");}}}><ThumbsDown size={14}/></button></>}
                </div>}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-orange-600">
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="flex gap-1 rounded-2xl bg-dark-lighter px-4 py-3">
                <span className="typing-dot h-2 w-2 rounded-full bg-white/50" />
                <span className="typing-dot h-2 w-2 rounded-full bg-white/50" />
                <span className="typing-dot h-2 w-2 rounded-full bg-white/50" />
              </div>
            </div>
          )}
        </div>

        {limitReached ? (
          <div className="border-t border-white/10 bg-red-500/[0.045] p-4 text-center">
            <p className="text-sm font-semibold text-white/85">Bạn đã dùng hết 15 lượt miễn phí hôm nay.</p>
            <p className="mt-1 text-xs text-white/45">Lượt hỏi sẽ tự đặt lại lúc 00:00.</p>
            <Link to="/pricing" className="mt-3 inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-primary px-5 text-sm font-semibold text-[#18100A] hover:bg-primary-light active:translate-y-px">
              <Crown size={15} /> Xem gói HOCA+
            </Link>
          </div>
        ) : (
          <form onSubmit={(event) => { event.preventDefault(); send(); }} className="border-t border-white/10 p-4">
            <label htmlFor="ai-question" className="sr-only">Câu hỏi cho HOCA AI</label>
            <div className="flex gap-2">
              <input
                id="ai-question"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                maxLength={2000}
                className="app-input flex-1"
              />
              <button type="submit" disabled={!input.trim() || sending} className="flex items-center justify-center rounded-lg bg-primary px-5 transition hover:bg-primary-dark active:translate-y-px disabled:opacity-50" aria-label="Gửi câu hỏi">
                <Send size={18} />
              </button>
            </div>
          </form>
        )}
      </div>
      <p className="mt-3 text-center text-xs text-white/30">
        HOCA AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
      </p>
    </div>
  );
}
