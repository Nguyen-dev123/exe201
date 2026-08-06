import { X } from "lucide-react";

export default function CloseButton({
  onClick,
  onPointerDown,
  label = "Đóng",
  className = "",
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      className={`flex h-11 w-11 shrink-0 touch-manipulation select-none items-center justify-center rounded-xl text-white/50 transition hover:bg-white/[0.07] hover:text-white active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${className}`}
      aria-label={label}
      title={label}
    >
      <X className="pointer-events-none" size={19} aria-hidden="true" />
    </button>
  );
}
