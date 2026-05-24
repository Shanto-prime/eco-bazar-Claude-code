"use client";

// app/checkout/page.js — Live order summary + form validation + Place Order.
// Fully responsive: form is single column on mobile, two-column on sm+.

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "../../components/Breadcrumb";
import { useCart } from "../../lib/CartContext";

const REQUIRED = ["firstName", "lastName", "street", "country", "state", "zip", "email", "phone"];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, discount, total, coupon, clearCart, hydrated, showToast } = useCart();

  const [form, setForm] = useState({
    firstName: "", lastName: "", company: "", street: "",
    country: "", state: "", zip: "", email: "", phone: "", notes: "",
    payment: "cod",
  });
  const [errors, setErrors] = useState({});
  const [placed, setPlaced] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onPlaceOrder = (e) => {
    e.preventDefault();
    const errs = {};
    for (const k of REQUIRED) if (!form[k].trim()) errs[k] = "Required";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Invalid email";
    if (form.phone && form.phone.replace(/\D/g, "").length < 7) errs.phone = "Invalid phone";
    setErrors(errs);
    if (Object.keys(errs).length) {
      showToast("Please fill in all required fields", "error");
      return;
    }
    const orderId = "ECO-" + Date.now().toString().slice(-6);
    const snapshot = { id: orderId, total, items: items.length, payment: form.payment };
    clearCart();
    setPlaced(snapshot);
    showToast(`Order ${orderId} placed!`);
    setTimeout(() => router.push("/"), 5000);
  };

  if (!hydrated) return null;

  if (placed) {
    return (
      <>
        <Breadcrumb items={[{ label: "Order Confirmation" }]} />
        <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-eco-green text-white text-4xl grid place-items-center mb-4">
            <i className="fa-solid fa-check" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Thank you for your order!</h1>
          <p className="text-gray-500 mb-1">Your order <b>{placed.id}</b> has been placed.</p>
          <p className="text-gray-500 mb-6">
            {placed.items} item{placed.items === 1 ? "" : "s"} · ${placed.total.toFixed(2)} ·{" "}
            {placed.payment === "cod" ? "Cash on Delivery" : placed.payment}
          </p>
          <Link href="/shop" className="inline-block px-6 py-3 rounded-full bg-eco-green text-white font-medium">
            Continue shopping <i className="fa-solid fa-arrow-right ml-1" />
          </Link>
        </section>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Breadcrumb items={[{ label: "Checkout" }]} />
        <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
          <div className="text-6xl sm:text-7xl mb-4">🛒</div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">Nothing to check out</h1>
          <p className="text-gray-500 mb-6">Your cart is empty — add a few items first.</p>
          <Link href="/shop" className="inline-block px-6 py-3 rounded-full bg-eco-green text-white font-medium">Go to shop</Link>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ href: "/cart", label: "Shopping Cart" }, { label: "Checkout" }]} />

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <form className="lg:col-span-8 space-y-8" onSubmit={onPlaceOrder} noValidate>
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-4">Billing Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="First name *" err={errors.firstName}>
                <input className={`eco-input ${errors.firstName ? "border-red-500" : ""}`} value={form.firstName} onChange={set("firstName")} placeholder="Your first name" />
              </Field>
              <Field label="Last name *" err={errors.lastName}>
                <input className={`eco-input ${errors.lastName ? "border-red-500" : ""}`} value={form.lastName} onChange={set("lastName")} placeholder="Your last name" />
              </Field>
              <Field label="Company name (optional)" wide>
                <input className="eco-input" value={form.company} onChange={set("company")} placeholder="Company name" />
              </Field>
              <Field label="Street Address *" wide err={errors.street}>
                <input className={`eco-input ${errors.street ? "border-red-500" : ""}`} value={form.street} onChange={set("street")} placeholder="Street Address" />
              </Field>
              <Field label="Country / Region *" err={errors.country}>
                <select className={`eco-input ${errors.country ? "border-red-500" : ""}`} value={form.country} onChange={set("country")}>
                  <option value="">Select</option><option>USA</option><option>Canada</option><option>UK</option>
                </select>
              </Field>
              <Field label="State *" err={errors.state}>
                <select className={`eco-input ${errors.state ? "border-red-500" : ""}`} value={form.state} onChange={set("state")}>
                  <option value="">Select</option><option>Illinois</option><option>California</option><option>New York</option>
                </select>
              </Field>
              <Field label="Zip Code *" err={errors.zip}>
                <input className={`eco-input ${errors.zip ? "border-red-500" : ""}`} value={form.zip} onChange={set("zip")} placeholder="Zip Code" />
              </Field>
              <Field label="Email *" err={errors.email}>
                <input className={`eco-input ${errors.email ? "border-red-500" : ""}`} type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" />
              </Field>
              <Field label="Phone *" wide err={errors.phone}>
                <input className={`eco-input ${errors.phone ? "border-red-500" : ""}`} type="tel" value={form.phone} onChange={set("phone")} placeholder="Phone number" />
              </Field>
            </div>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-4">Additional Info</h2>
            <label className="text-xs text-gray-500">Order Notes (Optional)</label>
            <textarea className="eco-input" rows={4} value={form.notes} onChange={set("notes")} placeholder="Notes about your order, e.g. special notes for delivery" />
          </div>
        </form>

        <aside className="lg:col-span-4">
          <div className="border border-gray-200 rounded-md p-5 sm:p-6 lg:sticky lg:top-24">
            <div className="font-semibold mb-4">Order Summary</div>
            {items.map((it) => (
              <div key={it.slug} className="flex justify-between text-sm py-2">
                <div className="flex items-center gap-2 flex-1 truncate"><span className="text-xl">{it.icon}</span> <span className="truncate">{it.name} ×{it.qty}</span></div>
                <div className="font-semibold whitespace-nowrap">${(it.price * it.qty).toFixed(2)}</div>
              </div>
            ))}
            <div className="flex justify-between py-2 border-t mt-2"><span className="text-gray-500">Subtotal:</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between py-2 text-eco-green"><span>Discount ({coupon.code}):</span><span className="font-semibold">−${discount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between py-2"><span className="text-gray-500">Shipping:</span><span className="font-semibold">Free</span></div>
            <div className="flex justify-between py-2 border-t"><span className="text-gray-500">Total:</span><span className="text-lg font-bold">${total.toFixed(2)}</span></div>

            <div className="font-semibold mt-4 mb-3">Payment Method</div>
            {[
              { v: "cod",    l: "Cash on Delivery" },
              { v: "paypal", l: "Paypal" },
              { v: "amazon", l: "Amazon Pay" },
            ].map((p) => (
              <label key={p.v} className="flex items-center gap-2 py-2 text-sm cursor-pointer">
                <input type="radio" name="pay" className="eco-check" checked={form.payment === p.v} onChange={() => setForm((f) => ({ ...f, payment: p.v }))} />
                {p.l}
              </label>
            ))}

            <button type="submit" onClick={onPlaceOrder} className="w-full mt-4 py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600">
              Place Order
            </button>
          </div>
        </aside>
      </section>
    </>
  );
}

function Field({ label, err, wide, children }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <label className="text-xs text-gray-500">{label}</label>
      {children}
      {err && <div className="text-xs text-red-500 mt-1">{err}</div>}
    </div>
  );
}
