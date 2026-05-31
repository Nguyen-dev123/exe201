import { useQuery } from "@tanstack/react-query";
import { stickerApi } from "../lib/services";

// Built-in emoji fallback (works even if admin hasn't uploaded image stickers)
const EMOJIS = [
  "👍",
  "❤️",
  "🎉",
  "😂",
  "🔥",
  "👏",
  "💪",
  "📚",
  "✨",
  "😍",
  "🤔",
  "😎",
  "🙌",
  "💯",
  "☕",
  "⏰",
];

export default function StickerPicker({ onPick, onClose }) {
  const { data: stickers } = useQuery({
    queryKey: ["stickers"],
    queryFn: stickerApi.getAll,
  });

  return (
    <div className="absolute bottom-16 right-4 w-72 bg-dark-card border border-white/10 rounded-xl p-3 shadow-2xl z-40 animate-scaleIn">
      <p className="text-xs text-white/40 mb-2">Emoji</p>
      <div className="grid grid-cols-8 gap-1 mb-3">
        {EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => {
              onPick({ text: e });
              onClose();
            }}
            className="text-xl hover:bg-dark-lighter rounded-lg p-1 transition"
          >
            {e}
          </button>
        ))}
      </div>

      {stickers?.length > 0 && (
        <>
          <p className="text-xs text-white/40 mb-2">Sticker</p>
          <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto">
            {stickers.map((s) => (
              <button
                key={s._id}
                onClick={() => {
                  onPick({ stickerUrl: s.url, stickerId: s._id });
                  onClose();
                }}
                className="aspect-square rounded-lg overflow-hidden hover:ring-2 hover:ring-primary transition"
                title={s.name}
              >
                <img
                  src={s.url}
                  alt={s.name}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
