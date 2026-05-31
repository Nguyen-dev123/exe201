import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Crown,
  Bot,
  User as UserIcon,
  RefreshCw,
} from "lucide-react";
import { aiApi } from "../lib/services";

const SUGGESTIONS = [
  "Giải thích định luật Newton thứ nhất",
  "Cách ghi nhớ bảng tuần hoàn hóa học?",
  "Mẹo học từ vựng tiếng Anh hiệu quả",
  "Công thức tính đạo hàm cơ bản",
];

export default function AIPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const send = async (question) => {
    const q = (question ?? input).trim();
    if (!q || sending) return;

    const history = messages.map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content,
    }));

    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setInput("");
    setSending(true);

    try {
      const res = await aiApi.ask(q, history);
      setMessages((prev) => [...prev, { role: "ai", content: res.response }]);
    } catch (err) {
      const data = err.response?.data;
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            data?.message || "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
          error: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">HOCA AI</h1>
            <p className="text-white/50 text-sm">Trợ lý học tập thông minh</p>
          </div>
        </div>
        <div className="text-right">
          <span className="pill bg-amber-500/15 text-amber-400">
            <Crown size={13} /> Không giới hạn
          </span>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="ml-2 pill bg-white/10 text-white/70 hover:bg-white/20 transition"
              title="Cuộc trò chuyện mới"
            >
              <RefreshCw size={13} /> Mới
            </button>
          )}
        </div>
      </div>

      {/* Chat container */}
      <div className="stat-card flex flex-col h-[60vh] p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <Bot size={48} className="text-primary/50 mb-4" />
              <p className="text-white/60 mb-6">
                Hỏi mình bất cứ điều gì về học tập nhé!
              </p>
              <div className="grid sm:grid-cols-2 gap-2 w-full max-w-md">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-left text-sm px-4 py-3 rounded-xl bg-dark-lighter hover:bg-dark border border-white/5 hover:border-primary/30 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  m.role === "user"
                    ? "bg-dark-lighter"
                    : "bg-gradient-to-br from-primary to-orange-600"
                }`}
              >
                {m.role === "user" ? (
                  <UserIcon size={16} />
                ) : (
                  <Sparkles size={16} className="text-white" />
                )}
              </div>
              <div
                className={`max-w-[80%] px-4 py-2.5 rounded-2xl whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-primary text-white rounded-tr-sm"
                    : m.error
                      ? "bg-red-500/10 text-red-300 border border-red-500/20 rounded-tl-sm"
                      : "bg-dark-lighter text-white/90 rounded-tl-sm"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {sending && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-orange-600 flex items-center justify-center">
                <Sparkles size={16} className="text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-dark-lighter flex gap-1">
                <span className="typing-dot w-2 h-2 bg-white/50 rounded-full" />
                <span className="typing-dot w-2 h-2 bg-white/50 rounded-full" />
                <span className="typing-dot w-2 h-2 bg-white/50 rounded-full" />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="border-t border-white/10 p-4"
        >
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi của bạn..."
              maxLength={2000}
              className="flex-1 app-input"
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="px-5 bg-primary hover:bg-primary-dark rounded-lg disabled:opacity-50 flex items-center justify-center transition"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
      </div>
      <p className="text-center text-xs text-white/30 mt-3">
        HOCA AI có thể mắc lỗi. Hãy kiểm tra lại thông tin quan trọng.
      </p>
    </div>
  );
}
