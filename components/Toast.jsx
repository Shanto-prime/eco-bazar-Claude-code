"use client";

// components/Toast.jsx — global toaster, fixed TOP-RIGHT.
//
// Reads the toast queue from CartContext (any consumer calls showToast()).
// Each toast:
//   • slides in from the right (butter-smooth), stacks newest-on-top;
//   • runs a countdown bar along its BOTTOM that depletes left→right and
//     sweeps colour green → yellow → red on the same clock (see globals.css
//     .toast-timer / @keyframes toastTimer);
//   • stays a minimum of 3s; HOVER pauses the bar (and the auto-dismiss),
//     so the toast stays until the pointer leaves;
//   • can be dismissed early with the × button.

import { useState, useCallback } from "react";
import { useCart } from "../lib/CartContext";

const KIND = {
  success: { icon: "fa-circle-check", accent: "text-eco-green",   ring: "bg-eco-green/15" },
  info:    { icon: "fa-circle-info",  accent: "text-sky-500",     ring: "bg-sky-500/15" },
  warning: { icon: "fa-triangle-exclamation", accent: "text-amber-500", ring: "bg-amber-500/15" },
  error:   { icon: "fa-circle-xmark", accent: "text-red-500",     ring: "bg-red-500/15" },
};

function ToastItem({ toast, onDismiss }) {
  const [paused, setPaused] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const k = KIND[toast.kind] || KIND.info;

  const beginLeave = useCallback(() => setLeaving(true), []);

  // The bottom bar's animation finishing = time's up → play the exit animation.
  const onTimerEnd = useCallback(() => setLeaving(true), []);

  // When the container's OWN animation ends and we're leaving, remove the toast.
  const onContainerAnimEnd = useCallback(
    (e) => {
      if (e.target === e.currentTarget && leaving) onDismiss(toast.id);
    },
    [leaving, onDismiss, toast.id]
  );

  return (
    <div
      role={toast.kind === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onAnimationEnd={onContainerAnimEnd}
      className={`pointer-events-auto relative w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg bg-white dark:bg-[#151b18] shadow-[0_8px_30px_rgba(0,0,0,0.16)] ring-1 ring-black/5 dark:ring-white/10 ${
        leaving ? "toast-leave" : "toast-enter"
      }`}
    >
      <div className="flex items-start gap-3 p-3.5 pr-9">
        <span
          className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full ${k.ring} ${k.accent}`}
        >
          <i className={`fa-solid ${k.icon} text-sm`} />
        </span>
        <p className="text-sm leading-snug text-gray-800 dark:text-gray-100">
          {toast.text}
        </p>
      </div>

      <button
        type="button"
        onClick={beginLeave}
        aria-label="Dismiss notification"
        className="absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full text-gray-400 transition-colors hover:bg-black/5 hover:text-gray-700 dark:hover:bg-white/10 dark:hover:text-gray-200"
      >
        <i className="fa-solid fa-xmark text-xs" />
      </button>

      {/* Countdown track (bottom). The inner bar is the moving timer. */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-black/5 dark:bg-white/10">
        <div
          className="toast-timer h-full w-full"
          style={{
            animationDuration: `${toast.duration}ms`,
            animationPlayState: paused ? "paused" : "running",
          }}
          onAnimationEnd={onTimerEnd}
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
