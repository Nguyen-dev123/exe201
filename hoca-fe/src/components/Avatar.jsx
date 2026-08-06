/**
 * Reusable user avatar.
 * - Shows the uploaded image when available.
 * - Otherwise shows the user's initials on a gradient whose color is derived
 *   from the name, so each person gets a consistent, distinct look.
 *
 * Usage:
 *   <Avatar user={user} size={28} />
 *   <Avatar name="Tuan" src={url} className="ring-2 ring-white/20" rounded="full" />
 */

// Pleasant gradient palettes. The name picks one deterministically.
const GRADIENTS = [
  "from-orange-500 to-rose-500",
  "from-fuchsia-500 to-purple-600",
  "from-sky-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-violet-500 to-indigo-600",
  "from-cyan-500 to-blue-600",
  "from-lime-500 to-emerald-600",
  "from-red-500 to-pink-600",
];

function hashString(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function getInitials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  // First letter of the first and last word (e.g. "Nguyen Dinh Tuan" -> "NT")
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({
  user,
  src,
  name,
  size = 40,
  rounded = "full", // "full" | "2xl" | "xl" | "lg"
  className = "",
  ring = true,
}) {
  const displayName = name || user?.displayName || user?.name || "User";
  const imageUrl = src ?? user?.avatar;
  const initials = getInitials(displayName);
  const gradient = GRADIENTS[hashString(displayName) % GRADIENTS.length];

  const roundedClass =
    rounded === "full"
      ? "rounded-full"
      : rounded === "2xl"
        ? "rounded-2xl"
        : rounded === "xl"
          ? "rounded-xl"
          : "rounded-lg";

  const ringClass = ring ? "ring-2 ring-white/15 shadow-lg" : "";
  // Scale the font with the avatar size, keep it crisp and centered.
  const fontSize = Math.round(size * 0.42);

  return (
    <div
      className={`relative inline-flex items-center justify-center overflow-hidden ${roundedClass} ${ringClass} ${className}`}
      style={{ width: size, height: size }}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={displayName}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div
          className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${gradient} text-white font-bold select-none leading-none`}
          style={{ fontSize }}
        >
          {initials}
        </div>
      )}
    </div>
  );
}
