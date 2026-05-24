"use client";

// components/Toast.jsx — global, fixed bottom-right notification.
// Reads the current toast from CartContext (so any consumer can call
// showToast() and the UI updates without prop drilling).

import { useCart } from "../lib/CartContext";

const KIND = {
  success: { bg: "bg-eco-green",  icon: "fa-circle-check" },
  info:    { bg: "bg-gray-800",   icon: "fa-circle-info" },
  error:   { bg: "bg-red-500",    icon: "fa-circle-xmark" },
};

export default function Toast() {
  const { toast } = useCart();
  if (!toast) return null;
  const k = KIND[toast.kind] || KIND.info;
  return (
    <div
      className={`fixed z-50 bottom-6 right-6 ${k.bg} text-white px-5 py-3 rounded-md shadow-lg flex items-center gap-3 animate-[fadeIn_.2s_ease-out]`}
      role="status"
    >
      <i className={`fa-solid ${k.icon}`} />
      <span className="text-sm font-medium">{toast.text}</span>
    </div>
  );
}
