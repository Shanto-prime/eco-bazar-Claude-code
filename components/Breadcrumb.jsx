"use client";

// components/Breadcrumb.jsx — dark vegetable strip with crumbs
// Used by every interior page (Shop, Product, Cart, Checkout, Contact).
// Client component: it's rendered by both client pages (cart/wishlist/checkout/
// contact) and server pages (shop/product/not-found), so it uses the client
// useT() hook — which works in either context (a server component may render a
// client one). Callers pass already-localized crumb labels via `items`.
import Link from "next/link";
import { useT } from "../lib/i18n/LanguageProvider";

export default function Breadcrumb({ items = [] }) {
  // items: [{ href?: string, label: string }, ...]; last item is the current page (no href).
  const t = useT();
  return (
    <section className="breadcrumb-strip">
      <div className="max-w-[1320px] mx-auto px-6 text-sm">
        <i className="fa-solid fa-house mr-1" />
        <Link href="/">{t("nav.home")}</Link>
        {items.map((it, i) => (
          <span key={i}>
            <span className="mx-1">›</span>
            {it.href ? <Link href={it.href}>{it.label}</Link> : <span className="text-eco-green">{it.label}</span>}
          </span>
        ))}
      </div>
    </section>
  );
}
