"use client";

// components/ProductGallery.jsx
// -----------------------------------------------------------------------------
// Product image gallery — fully responsive, touch-friendly, no external libs.
//
//   ┌───────────────────────────────────┐
//   │                                   │
//   │         MAIN STAGE                │     ← swipe left/right (touch)
//   │         (zoom on hover desktop)   │     ← hover to magnify 2× (desktop)
//   │                                   │     ← tap to open lightbox (touch)
//   │   ●  ○  ○  ○  ○  ○                │     ← dots indicator
//   └───────────────────────────────────┘
//   ◀  [▢] [▢] [▢] [▢] [▢] [▢]  ▶            ← thumbnail strip
//        ▲                                    (native scroll-snap + swipe;
//        active                                arrows scroll by one thumb)
//
// Image data lives in `lib/data.js` as an array of view descriptors. Two
// shapes are supported:
//
//   { type: "image", src: "/path.jpg", label: "Front" }
//   { type: "view",  emoji: "🍏", bg: "...", scale: 1, rotate: 0, label: "" }
// -----------------------------------------------------------------------------

import { useEffect, useRef, useState } from "react";

const ZOOM = 2;
// Min horizontal distance (px) to count a touch as a swipe.
const SWIPE_THRESHOLD = 40;

export default function ProductGallery({ images = [], alt = "Product" }) {
  const [active, setActive]     = useState(0);
  const [zoom, setZoom]         = useState({ on: false, x: 50, y: 50 });
  const [lightbox, setLightbox] = useState(false);

  const stageRef  = useRef(null);
  const thumbsRef = useRef(null);
  const touchStartX = useRef(null);

  const total = images.length;
  const go = (delta) => setActive((i) => (i + delta + total) % total);

  // Keyboard nav.
  const onKey = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); go(+1); }
    if (e.key === "ArrowLeft")  { e.preventDefault(); go(-1); }
    if (e.key === "Escape" && lightbox) setLightbox(false);
  };

  // Touch swipe on main stage.
  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd   = (e) => {
    if (touchStartX.current == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? +1 : -1);
    touchStartX.current = null;
  };

  // Auto-scroll the active thumbnail into view (smooth) whenever it changes.
  useEffect(() => {
    const el = thumbsRef.current?.querySelector(`[data-i="${active}"]`);
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [active]);

  // Hover-zoom only on devices with a real mouse.
  const supportsHoverZoom = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  const onMove = (e) => {
    if (!supportsHoverZoom() || !stageRef.current) return;
    const r = stageRef.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width)  * 100;
    const y = ((e.clientY - r.top)  / r.height) * 100;
    setZoom({ on: true, x, y });
  };
  const onLeave = () => setZoom((z) => ({ ...z, on: false }));

  // Reset zoom when active image changes.
  useEffect(() => { setZoom({ on: false, x: 50, y: 50 }); }, [active]);

  if (!total) {
    return (
      <div className="aspect-square border border-gray-200 rounded-md grid place-items-center text-gray-400">
        No images
      </div>
    );
  }

  const current = images[active];

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* ============ MAIN STAGE ========================================== */}
      <div
        ref={stageRef}
        tabIndex={0}
        onKeyDown={onKey}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={() => !supportsHoverZoom() && setLightbox(true)}
        className="gallery-stage relative border border-gray-200 rounded-md overflow-hidden bg-white aspect-square select-none focus:outline-none focus:ring-2 focus:ring-eco-green cursor-pointer"
        role="img"
        aria-label={`${alt} — image ${active + 1} of ${total}`}
      >
        <View
          v={current}
          alt={alt}
          style={
            zoom.on
              ? { transform: `scale(${ZOOM})`, transformOrigin: `${zoom.x}% ${zoom.y}%` }
              : undefined
          }
        />

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(-1); }}
              className="gallery-nav left-2 sm:left-3"
              aria-label="Previous image"
            ><i className="fa-solid fa-chevron-left" /></button>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); go(+1); }}
              className="gallery-nav right-2 sm:right-3"
              aria-label="Next image"
            ><i className="fa-solid fa-chevron-right" /></button>
          </>
        )}

        <div className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 bg-black/60 text-white text-[10px] sm:text-xs px-2 py-1 rounded">
          {active + 1} / {total}
        </div>

        {/* Hover-to-zoom hint — desktop only */}
        <div className="absolute bottom-3 left-3 bg-white/90 text-gray-700 text-xs px-2 py-1 rounded hidden md:flex items-center gap-1 pointer-events-none">
          <i className="fa-solid fa-magnifying-glass-plus" /> Hover to zoom
        </div>

        {/* Swipe-hint pulse — touch only, fades after a moment */}
        <div className="absolute bottom-3 left-3 bg-white/90 text-gray-700 text-xs px-2 py-1 rounded md:hidden flex items-center gap-1 pointer-events-none">
          <i className="fa-solid fa-hand-pointer" /> Swipe / tap
        </div>
      </div>

      {/* ============ DOT PAGINATION (mobile, ≤ 8 images) ================ */}
      {total > 1 && total <= 8 && (
        <div className="flex justify-center gap-1.5 sm:hidden">
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-eco-green" : "w-1.5 bg-gray-300"}`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* ============ THUMBNAIL CAROUSEL ================================= */}
      <div className="relative">
        {total > 1 && (
          <button
            type="button"
            onClick={() => thumbsRef.current?.scrollBy({ left: -200, behavior: "smooth" })}
            className="thumb-scroll left-0 hidden sm:grid"
            aria-label="Scroll thumbnails left"
          ><i className="fa-solid fa-chevron-left" /></button>
        )}

        <div
          ref={thumbsRef}
          className="flex gap-2 sm:gap-3 overflow-x-auto overflow-y-hidden scroll-smooth snap-x snap-mandatory no-scrollbar sm:px-10 py-1"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {images.map((img, i) => (
            <button
              key={i}
              type="button"
              data-i={i}
              onClick={() => setActive(i)}
              className={`relative flex-none w-[72px] sm:w-24 h-[72px] sm:h-24 rounded-md border-2 overflow-hidden snap-start transition ${
                i === active ? "border-eco-green ring-1 ring-eco-green/40" : "border-gray-200 hover:border-eco-green/60"
              }`}
              aria-label={`View ${i + 1}${img.label ? ` — ${img.label}` : ""}`}
              aria-current={i === active}
            >
              <View v={img} alt={alt} small />
            </button>
          ))}
        </div>

        {total > 1 && (
          <button
            type="button"
            onClick={() => thumbsRef.current?.scrollBy({ left: 200, behavior: "smooth" })}
            className="thumb-scroll right-0 hidden sm:grid"
            aria-label="Scroll thumbnails right"
          ><i className="fa-solid fa-chevron-right" /></button>
        )}
      </div>

      {/* ============ LIGHTBOX (tap-to-open on touch) ==================== */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 grid place-items-center p-4"
          onClick={() => setLightbox(false)}
          role="dialog"
          aria-label="Image lightbox"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setLightbox(false); }}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white grid place-items-center"
            aria-label="Close"
          ><i className="fa-solid fa-xmark" /></button>

          <div
            className="relative w-full max-w-3xl aspect-square"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            onClick={(e) => e.stopPropagation()}
          >
            <View v={current} alt={alt} />
            {total > 1 && (
              <>
                <button type="button" onClick={() => go(-1)} className="gallery-nav left-3" aria-label="Previous">
                  <i className="fa-solid fa-chevron-left" />
                </button>
                <button type="button" onClick={() => go(+1)} className="gallery-nav right-3" aria-label="Next">
                  <i className="fa-solid fa-chevron-right" />
                </button>
              </>
            )}
            <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {active + 1} / {total}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// View — renders one image. Two flavors:
//   - { type: "image", src }  → real photo via <img>
//   - { type: "view",  ... }  → styled placeholder with emoji
//
// The component uses `absolute inset-0` so callers MUST give it a positioned,
// sized parent (e.g. `relative w-24 h-24` or `relative aspect-square`).
// ---------------------------------------------------------------------------
function View({ v, alt, small = false, style }) {
  if (v?.type === "image" && v.src) {
    return (
      <img
        src={v.src}
        alt={v.label || alt}
        draggable={false}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-150 ease-out will-change-transform"
        style={style}
      />
    );
  }

  // "view" placeholder — styled card.
  const fontSize = small ? "1.75rem" : "clamp(7rem, 18vw, 16rem)";
  const scale  = v?.scale ?? 1;
  const rotate = v?.rotate ?? 0;

  return (
    <div
      className="absolute inset-0 grid place-items-center transition-transform duration-150 ease-out will-change-transform"
      style={{ background: v?.bg || "#fff", ...style }}
    >
      <div
        className={`leading-none ${v?.dark ? "drop-shadow-[0_8px_24px_rgba(0,0,0,0.5)]" : ""}`}
        style={{ fontSize, transform: `scale(${scale}) rotate(${rotate}deg)` }}
        aria-hidden="true"
      >
        {v?.emoji}
      </div>
      {!small && v?.label && (
        <div className={`absolute top-3 left-3 text-[10px] uppercase tracking-wider font-semibold px-2 py-1 rounded ${
          v.dark ? "bg-white/15 text-white" : "bg-white/80 text-gray-600"
        }`}>
          {v.label}
        </div>
      )}
    </div>
  );
}
