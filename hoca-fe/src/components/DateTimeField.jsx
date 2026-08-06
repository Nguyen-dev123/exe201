import { useEffect, useRef, useState } from "react";
import { CalendarDays, ChevronDown, Clock3 } from "lucide-react";

const formatDate = (value) => {
  if (!value) return "Chọn ngày";
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
};

export default function DateTimeField({ value = "", onChange, min, dateLabel = "Ngày", timeLabel = "Giờ", className = "" }) {
  const dateRef = useRef(null);
  const timeContainerRef = useRef(null);
  const [openPart, setOpenPart] = useState(null);
  const [date = "", time = ""] = value.split("T");
  const [hour = "", minute = ""] = time.split(":");
  const today = new Date();
  const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const update = (nextDate, nextTime) => {
    const resolvedDate = nextDate || (nextTime ? localToday : "");
    onChange?.(resolvedDate ? `${resolvedDate}T${nextTime || "08:00"}` : "");
  };
  const openPicker = (ref) => {
    const picker = ref.current;
    if (!picker) return;
    try { if (typeof picker.showPicker === "function") picker.showPicker(); else picker.click(); }
    catch { picker.focus(); }
  };
  const pickerClass = "pointer-events-none absolute h-px w-px opacity-0";
  useEffect(() => {
    const close = (event) => { if (!timeContainerRef.current?.contains(event.target)) setOpenPart(null); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const TimePart = ({ part, current, options, placeholder, onSelect, align = "right" }) => <div className="relative min-w-0 flex-1">
    <button type="button" aria-haspopup="listbox" aria-expanded={openPart===part} onClick={()=>setOpenPart(openPart===part?null:part)} className="flex w-full items-center justify-center gap-1 rounded-lg py-2 text-sm font-semibold text-white outline-none hover:bg-white/5 focus:bg-white/5">
      <span>{current || placeholder}</span><ChevronDown size={14} className={`text-white/40 transition ${openPart===part?"rotate-180":""}`}/>
    </button>
    {openPart===part && <div role="listbox" className={`absolute top-full z-[100] mt-2 grid max-h-56 w-48 grid-cols-4 gap-1 overflow-y-auto rounded-xl border border-white/15 bg-[#171b2e] p-2 shadow-2xl ${align==="right"?"right-0":"left-0"}`}>
      {options.map((option)=><button type="button" role="option" aria-selected={current===option} key={option} onClick={()=>{onSelect(option);setOpenPart(null);}} className={`rounded-lg px-2 py-2 text-center text-xs font-semibold transition ${current===option?"bg-primary text-[#18100a]":"text-white/70 hover:bg-white/10 hover:text-white"}`}>{option}</button>)}
    </div>}
  </div>;

  return <div className={`grid grid-cols-[1.35fr_0.85fr] gap-3 ${className}`}>
    <div className="block text-xs font-medium text-white/55">{dateLabel}
      <div className="relative">
        <button type="button" onClick={()=>openPicker(dateRef)} className="relative mt-1.5 flex min-h-12 w-full items-center gap-3 rounded-xl border border-white/10 bg-[#252837] px-4 text-left text-sm text-white transition hover:border-primary/60 hover:bg-[#2b2e3e] focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20">
          <CalendarDays size={18} className="shrink-0 text-primary"/>
          <span className={date ? "font-medium" : "text-white/35"}>{formatDate(date)}</span>
        </button>
        <input ref={dateRef} aria-label={dateLabel} type="date" min={min?.slice(0, 10)} value={date} onChange={(event)=>update(event.target.value, time)} className={pickerClass}/>
      </div>
    </div>
    <div className="block text-xs font-medium text-white/55">{timeLabel}
      <div ref={timeContainerRef} className="relative mt-1.5 flex min-h-12 items-center gap-1 rounded-xl border border-white/10 bg-[#252837] px-2 transition hover:border-primary/60 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
        <Clock3 size={18} className="shrink-0 text-primary"/>
        <TimePart part="hour" current={hour} placeholder="Giờ" options={Array.from({length:24},(_,index)=>String(index).padStart(2,"0"))} onSelect={(selected)=>update(date, `${selected}:${minute || "00"}`)}/>
        <span className="font-bold text-white/35">:</span>
        <TimePart part="minute" current={minute} placeholder="Phút" align="right" options={Array.from({length:60},(_,index)=>String(index).padStart(2,"0"))} onSelect={(selected)=>update(date, `${hour || "08"}:${selected}`)}/>
      </div>
    </div>
  </div>;
}
