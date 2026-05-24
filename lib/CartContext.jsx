"use client";

// lib/CartContext.jsx
// Global cart, wishlist, and toast state for the whole app.
// - Pure React Context + useReducer (no external dependency).
// - Cart and wishlist persist to localStorage so they survive reloads.
// - Exposes a single useCart() hook with everything the UI needs.

import { createContext, useContext, useEffect, useReducer, useState, useCallback } from "react";

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
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [toast, setToast] = useState(null); // { id, kind, text }

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

  // Toast helper — auto-dismiss after 2.4s.
  const showToast = useCallback((text, kind = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToast({ id, kind, text });
    setTimeout(() => setToast((t) => (t && t.id === id ? null : t)), 2400);
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
    showToast(`Added ${qty} × ${product.name} to your cart`);
  }, [showToast]);

  const removeItem = useCallback((slug) => {
    const i = state.items.find((x) => x.slug === slug);
    dispatch({ type: "REMOVE_ITEM", slug });
    if (i) showToast(`Removed ${i.name} from your cart`, "info");
  }, [state.items, showToast]);

  const updateQty = useCallback((slug, qty) => {
    dispatch({ type: "UPDATE_QTY", slug, qty });
  }, []);

  const clearCart = useCallback(() => dispatch({ type: "CLEAR_CART" }), []);

  const applyCoupon = useCallback((code) => {
    const key = code.trim().toUpperCase();
    if (!key) return { ok: false, error: "Please enter a coupon code." };
    const def = COUPONS[key];
    if (!def) { showToast("Invalid coupon code", "error"); return { ok: false, error: "Invalid coupon code" }; }
    dispatch({ type: "APPLY_COUPON", coupon: { code: key, ...def } });
    showToast(`Coupon applied: ${def.label}`);
    return { ok: true };
  }, [showToast]);

  const toggleWishlist = useCallback((slug, name) => {
    const has = state.wishlist.includes(slug);
    dispatch({ type: "TOGGLE_WISHLIST", slug });
    showToast(has ? `Removed ${name || "item"} from wishlist` : `Added ${name || "item"} to wishlist`, "info");
  }, [state.wishlist, showToast]);

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
    toast,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
