import { BookOpen } from "lucide-react";

const sizes = {
  compact: {
    mark: "h-10 w-10 rounded-xl text-xl",
    badge: "h-3.5 w-3.5",
    icon: 8,
    word: "text-2xl",
    gap: "gap-2.5",
  },
  default: {
    mark: "h-12 w-12 rounded-2xl text-2xl",
    badge: "h-4 w-4",
    icon: 9,
    word: "text-[26px]",
    gap: "gap-3",
  },
};

export default function BrandLogo({ size = "default", className = "" }) {
  const style = sizes[size] || sizes.default;

  return (
    <span
      className={`inline-flex items-center ${style.gap} ${className}`}
      aria-label="HOCA"
    >
      <span
        className={`relative flex shrink-0 items-center justify-center bg-[#FF8C00] font-extrabold leading-none text-[#18100A] shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] ${style.mark}`}
        aria-hidden="true"
      >
        H
        <span
          className={`absolute -bottom-1 -right-1 flex items-center justify-center rounded-full border-2 border-[#14182A] bg-[#F7F7F2] text-[#18100A] ${style.badge}`}
        >
          <BookOpen size={style.icon} strokeWidth={2.3} />
        </span>
      </span>
      <span
        className={`font-extrabold tracking-[-0.035em] text-[#F7F7F2] ${style.word}`}
        aria-hidden="true"
      >
        HOCA
      </span>
    </span>
  );
}
