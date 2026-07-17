"use client";

// lib/CartContext.jsx
// Global cart, wishlist, and toast state for the whole app.
// - Pure React Context + useReducer (no external dependency).
// - Cart and wishlist persist to localStorage so they survive reloads.
// - Exposes a single useCart() hook with everything the UI needs.

import { createContext, useContext, useEffect, useReducer, useState, useCallback } from "react";
import { useT } from "./i18n/LanguageProvider";

// ---------- Coupons -----------------------------------------------------------
const COUPONS = {
  ECO10: { type: "percent", value: 10, label: "10% off your order" },
  ECO20: { type: "percent", value: 20, label: "20% off your order" },
  FREE5: { type: "flat",    value: 5,  label: "$5 off your order" },
};

// ---------- Reducer -----------------------------------------------------------
const initialState = {
  items: [],      // [{ slug, name, icon, price, qty }]
  wishlist: [],   // [slug, slug, ...]
  coupon: null,   // { code, type, value, label } | null
};

function reducer(state, action) {
  switch (action.type) {
    case "HYDRATE":
      return { ...state, ...action.payload };

    case "ADD_ITEM": {
      const { product, qty = 1 } = action;
      const existing = state.items.find((i) => i.slug === product.slug);
      const items = existing
        ? state.items.map((i) => (i.slug === product.slug ? { ...i, qty: i.qty + qty } : i))
        : [...state.items, { slug: product.slug, name: product.name, icon: product.icon, price: product.price, qty }];
      return { ...state, items };
    }

    case "REMOVE_ITEM":
      return { ...state, items: state.items.filter((i) => i.slug !== action.slug) };

    case "UPDATE_QTY": {
      const qty = Math.max(1, action.qty);
      return { ...state, items: state.items.map((i) => (i.slug === action.slug ? { ...i, qty } : i)) };
    }

    case "CLEAR_CART":
      return { ...state, items: [], coupon: null };

    case "APPLY_COUPON":
      return { ...state, coupon: action.coupon };

    case "TOGGLE_WISHLIST": {
      const has = state.wishlist.includes(action.slug);
      return { ...state, wishlist: has ? state.wishlist.filter((s) => s !== action.slug) : [...state.wishlist, action.slug] };
    }

    default:
      return state;
  }
}

// ---------- Context ----------------------------------------------------------
const CartContext = createContext(null);

export function CartProvider({ children }) {
  const t = useT();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState([]); // [{ id, kind, text, duration }]

  // Load from localStorage once, on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ecobazar-cart-v1");
      if (raw) dispatch({ type: "HYDRATE", payload: JSON.parse(raw) });
    } catch {}
    setHydrated(true);
  }, []);

  // Persist on every change (after first hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem("ecobazar-cart-v1", JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  // Toast helper — pushes onto a queue (newest first). The Toast component owns
  // each toast's countdown/auto-dismiss (so it can pause on hover), then calls
  // dismissToast(). Duration is clamped to a 3s minimum per the UX spec.
  const dismissToast = useCallback((id) => {
    setToasts((list) => list.filter((x) => x.id !== id));
  }, []);

  const showToast = useCallback((text, kind = "success", duration = 3000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [
      { id, kind, text, duration: Math.max(3000, duration) },
      ...list,
    ]);
    return id;
  }, []);

  // Derived totals.
  const subtotal = state.items.reduce((s, i) => s + i.price * i.qty, 0);
  let discount = 0;
  if (state.coupon) {
    discount = state.coupon.type === "percent" ? subtotal * (state.coupon.value / 100) : state.coupon.value;
    discount = Math.min(discount, subtotal);
  }
  const shipping = 0;
  const total = Math.max(0, subtotal - discount + shipping);
  const itemCount = state.items.reduce((s, i) => s + i.qty, 0);

  // High-level actions.
  const addItem = useCallback((product, qty = 1) => {
    dispatch({ type: "ADD_ITEM", product, qty });
    showToast(t("toast.addedToCart", { qty, name: product.name }));
  }, [showToast, t]);

  const removeItem = useCallback((slug) => {
    const i = state.items.find((x) => x.slug === slug);
    dispatch({ type: "REMOVE_ITEM", slug });
    if (i) showToast(t("toast.removedFromCart", { name: i.name }), "info");
  }, [state.items, showToast, t]);

  const updateQty = useCallback((slug, qty) => {
    dispatch({ type: "UPDATE_QTY", slug, qty });
  }, []);

  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), []);

  const applyCoupon = useCallback((code) => {
    const key = code.trim().toUpperCase();
    if (!key) return { ok: false, error: t("toast.enterCoupon") };
    const def = COUPONS[key];
    if (!def) {
      showToast(t("toast.invalidCoupon"), "error");
      return { ok: false, error: t("toast.invalidCoupon") };
    }
    // Localized, code-derived label (falls back to the English COUPONS label).
    const label = t(`coupon.${key}`);
    dispatch({ type: "APPLY_COUPON", coupon: { code: key, ...def, label } });
    showToast(t("toast.couponApplied", { label }));
    return { ok: true };
  }, [showToast, t]);

  const toggleWishlist = useCallback((slug, name) => {
    const has = state.wishlist.includes(slug);
    dispatch({ type: "TOGGLE_WISHLIST", slug });
    const nm = name || t("common.item", {});
    showToast(
      has
        ? t("toast.removedFromWishlist", { name: nm })
        : t("toast.addedToWishlist", { name: nm }),
      "info"
    );
  }, [state.wishlist, showToast, t]);

  const value = {
    items: state.items,
    wishlist: state.wishlist,
    coupon: state.coupon,
    itemCount,
    subtotal,
    discount,
    shipping,
    total,
    hydrated,
    addItem,
    removeItem,
    updateQty,
    clearCart,
    applyCoupon,
    toggleWishlist,
    showToast,
    toasts,
    dismissToast,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
