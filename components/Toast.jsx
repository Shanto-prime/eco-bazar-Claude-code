"use client";

// components/Toast.jsx — global toaster, fixed TOP-RIGHT.
//
// Reads the toast queue from CartContext (any consumer calls showToast()).
// Each toast:
//   • fades in from the right (moving right→left into place) and, when its
//     time is up, fades back out to the right (left→right);
//   • stacks newest-on-top and collapses the gap as it leaves;
//   • runs a countdown bar along its BOTTOM that depletes and sweeps colour
//     green → yellow → red on the same clock;
//   • HOVER freezes the bar and the auto-dismiss; leaving the toast resumes
//     from exactly where it stopped;
//   • has no close button — it goes away only when the countdown finishes.
//
// The countdown is driven in JS (rAF + a remaining-ms ref) rather than by CSS
// animationend. animationend is unreliable here: pausing/resuming or a
// re-render mid-flight can drop the event and the toast then never leaves.

import { useCallback, useEffect, useRef, useState } from "react";
import { useCart } from "../lib/CartContext";

// Must match the .toast-leave animation duration in globals.css.
const EXIT_MS = 240;

const KIND = {
  success: { icon: "fa-circle-check", accent: "text-eco-green",   ring: "bg-eco-green/15" },
  info:    { icon: "fa-circle-info",  accent: "text-sky-500",     ring: "bg-sky-500/15" },
  warning: { icon: "fa-triangle-exclamation", accent: "text-amber-500", ring: "bg-amber-500/15" },
  error:   { icon: "fa-circle-xmark", accent: "text-red-500",     ring: "bg-red-500/15" },
};

const GREEN  = [34, 197, 94];
const YELLOW = [250, 204, 21];
const RED    = [239, 68, 68];

const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

// p is the fraction of time REMAINING: 1 → green, 0.5 → yellow, 0 → red.
function timerColor(p) {
  const [r, g, b] = p > 0.5 ? mix(YELLOW, GREEN, (p - 0.5) * 2) : mix(RED, YELLOW, p * 2);
  return `rgb(${r}, ${g}, ${b})`;
}

function ToastItem({ toast, onDismiss }) {
  const [progress, setProgress] = useState(1);
  const [paused, setPaused] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const remainingRef = useRef(toast.duration);
  const k = KIND[toast.kind] || KIND.info;

  // Countdown. Restarts on pause/resume, carrying the remaining time in a ref
  // so hovering costs the toast nothing.
  useEffect(() => {
    if (paused || leaving) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now) => {
      remainingRef.current -= now - last;
      last = now;
      if (remainingRef.current <= 0) {
        remainingRef.current = 0;
        setProgress(0);
        setLeaving(true);
        return;
      }
      setProgress(remainingRef.current / toast.duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [paused, leaving, toast.duration]);

  // Time's up → let the exit animation play, then drop it from the queue.
  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(() => onDismiss(toast.id), EXIT_MS);
    return () => clearTimeout(id);
  }, [leaving, onDismiss, toast.id]);

  const pause = useCallback(() => setPaused(true), []);
  const resume = useCallback(() => setPaused(false), []);

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      onMouseEnter={pause}
      onMouseLeave={resume}
      onFocus={pause}
      onBlur={resume}
      className={`pointer-events-auto relative w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg bg-white dark:bg-[#151b18] shadow-[0_8px_30px_rgba(0,0,0,0.16)] ring-1 ring-black/5 dark:ring-white/10 ${
        leaving ? "toast-leave" : "toast-enter"
      }`}
    >
      <div className="flex items-start gap-3 p-3.5 pb-4">
        <span
          className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${k.ring} ${k.accent}`}
        >
          <i className={`fa-solid ${k.icon} text-sm`} />
        </span>
        <p className="text-sm leading-snug text-gray-800 dark:text-gray-100">
          {toast.text}
        </p>
      </div>

      {/* Countdown track (bottom). The inner bar is the timer itself. */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-black/5 dark:bg-white/10">
        <div
          className="h-full w-full origin-right"
          style={{
            transform: `scaleX(${progress})`,
            backgroundColor: timerColor(progress),
          }}
        />
      </div>
    </div>
  );
}

export default function Toast() {
  const { toasts, dismissToast } = useCart();
  if (!toasts || toasts.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-[100] flex flex-col items-end gap-2"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
      ))}
    </div>
  );
}
