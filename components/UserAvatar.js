// components/UserAvatar.js — round avatar for the signed-in user, with a
// CSS-only hover/focus tooltip carrying the greeting. The avatar doubles as the
// dashboard entry point (`href`), which is why the TopBar carries no separate
// Dashboard link.
//
// Server component: no state, no client JS. The tooltip is pure CSS
// (group-hover / group-focus-within) so it costs nothing at runtime.
//
// `User.image` is nullable — OAuth users get a provider avatar, credentials
// users (including every seeded account) have none — so we always fall back to
// initials derived from the name/email rather than rendering an empty circle.

import Link from "next/link";

// "Site Admin" → "SA", "customer@ecobazar.test" → "C".
function initialsOf(user) {
  const source = (user.name || "").trim() || (user.email || "").trim();
  if (!source) return "?";
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return source[0].toUpperCase();
}

export default function UserAvatar({ user, label, href = "/dashboard" }) {
  const initials = initialsOf(user);

  return (
    <div className="relative group">
      {/* A real link, so it is focusable (tooltip on keyboard focus) for free. */}
      <Link
        href={href}
        aria-label={label}
        className="w-7 h-7 rounded-full overflow-hidden grid place-items-center
                   bg-eco-green text-white text-[11px] font-semibold uppercase
                   ring-1 ring-white/25 select-none
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        {user.image ? (
          // Plain <img>, not next/image: OAuth avatar hosts (Google, Facebook)
          // aren't in next.config images.remotePatterns, and next/image would
          // reject them at runtime.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={label}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          initials
        )}
      </Link>

      {/* Shown on hover, or on keyboard focus — but NOT on plain :focus, which
          a mouse click leaves behind on the link and would pin the tooltip open
          after the cursor moves away. `group-has-[:focus-visible]` is the
          keyboard-only half; browsers omit :focus-visible for mouse clicks.
          bg is eco-green, not eco-footer — the topbar is already #1a2424
          (== --eco-footer), so the tooltip needs to sit apart from it. */}
      <span
        role="tooltip"
        className="pointer-events-none absolute top-full right-0 mt-2 z-50
                   whitespace-nowrap rounded-md bg-eco-green text-white
                   px-2.5 py-1.5 text-[12px] shadow-lg
                   opacity-0 invisible transition-opacity duration-150
                   group-hover:opacity-100 group-hover:visible
                   group-has-[:focus-visible]:opacity-100 group-has-[:focus-visible]:visible"
      >
        {label}
      </span>
    </div>
  );
}
