// components/Breadcrumb.jsx — dark vegetable strip with crumbs
// Used by every interior page (Shop, Product, Cart, Checkout, Contact).
import Link from "next/link";

export default function Breadcrumb({ items = [] }) {
  // items: [{ href?: string, label: string }, ...]; last item is the current page (no href).
  return (
    <section className="breadcrumb-strip">
      <div className="max-w-[1320px] mx-auto px-6 text-sm">
        <i className="fa-solid fa-house mr-1" />
        <Link href="/">Home</Link>
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
