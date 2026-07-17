"use client";

// app/checkout/page.js — Live order summary + form validation + Place Order.
// Fully responsive: form is single column on mobile, two-column on sm+.

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Breadcrumb from "../../components/Breadcrumb";
import { useCart } from "../../lib/CartContext";
import { placeOrderAction } from "../../lib/order-actions";
import { useT } from "../../lib/i18n/LanguageProvider";

const REQUIRED = ["firstName", "lastName", "street", "country", "state", "zip", "email", "phone"];

// UI radio value → PaymentMethod enum expected by the server action.
const PAYMENT_MAP = { cod: "COD", paypal: "PAYPAL", amazon: "AMAZON" };

export default function CheckoutPage() {
  const router = useRouter();
  const t = useT();
  const { items, subtotal, discount, total, coupon, clearCart, hydrated, showToast } = useCart();

  const [form, setForm] = useState({
    firstName: "", lastName: "", company: "", street: "",
    country: "", state: "", zip: "", email: "", phone: "", notes: "",
    payment: "cod",
  });
  const [errors, setErrors] = useState({});
  const [placed, setPlaced] = useState(null);
  const [placing, setPlacing] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const onPlaceOrder = async (e) => {
    e.preventDefault();
    if (placing) return;

    const errs = {};
    for (const k of REQUIRED) if (!form[k].trim()) errs[k] = t("checkout.required");
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) errs.email = t("checkout.invalidEmail");
    if (form.phone && form.phone.replace(/\D/g, "").length < 7) errs.phone = t("checkout.invalidPhone");
    setErrors(errs);
    if (Object.keys(errs).length) {
      showToast(t("checkout.requiredFields"), "error");
      return;
    }

    setPlacing(true);
    const itemCount = items.length;
    try {
      // The server action recomputes prices + stock from the DB (anti-tampering)
      // and decrements inventory inside a transaction.
      const res = await placeOrderAction({
        billing: {
          firstName: form.firstName,
          lastName:  form.lastName,
          street:    form.street,
          country:   form.country,
          state:     form.state,
          zip:       form.zip,
          email:     form.email,
          phone:     form.phone,
          notes:     form.notes || undefined,
          payment:   PAYMENT_MAP[form.payment] || "COD",
        },
        items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
        couponCode: coupon?.code || undefined,
      });

      clearCart();
      setPlaced({ id: res.number, total: res.total, items: itemCount, payment: form.payment });
      showToast(t("checkout.placedMsg", { id: res.number }));
      setTimeout(() => router.push("/dashboard/orders"), 5000);
    } catch (err) {
      // Zod/stock/availability failures surface here with a readable message.
      showToast(err?.message || t("checkout.orderError"), "error");
    } finally {
      setPlacing(false);
    }
  };

  if (!hydrated) return null;

  if (placed) {
    return (
      <>
        <Breadcrumb items={[{ label: t("checkout.thankYou") }]} />
        <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-eco-green text-white text-4xl grid place-items-center mb-4">
            <i className="fa-solid fa-check" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t("checkout.thankYou")}</h1>
          <p className="text-gray-500 mb-1">{t("checkout.placedMsg", { id: placed.id })}</p>
          <p className="text-gray-500 mb-6">
            {t(placed.items === 1 ? "checkout.items_one" : "checkout.items_other", { count: placed.items })} · ${placed.total.toFixed(2)} ·{" "}
            {placed.payment === "cod" ? t("checkout.cod") : placed.payment}
          </p>
          <Link href="/shop" className="inline-block px-6 py-3 rounded-full bg-eco-green text-white font-medium">
            {t("checkout.continueShopping")} <i className="fa-solid fa-arrow-right ml-1" />
          </Link>
        </section>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Breadcrumb items={[{ label: t("checkout.title") }]} />
        <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-12 sm:py-20 text-center">
          <div className="text-6xl sm:text-7xl mb-4">🛒</div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2">{t("checkout.nothingTitle")}</h1>
          <p className="text-gray-500 mb-6">{t("checkout.nothingSub")}</p>
          <Link href="/shop" className="inline-block px-6 py-3 rounded-full bg-eco-green text-white font-medium">{t("checkout.goToShop")}</Link>
        </section>
      </>
    );
  }

  return (
    <>
      <Breadcrumb items={[{ href: "/cart", label: t("cart.title") }, { label: t("checkout.title") }]} />

      <section className="max-w-[1320px] mx-auto px-4 sm:px-6 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
        <form className="lg:col-span-8 space-y-8" onSubmit={onPlaceOrder} noValidate>
          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-4">{t("checkout.billingInfo")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label={`${t("checkout.firstName")} *`} err={errors.firstName}>
                <input className={`eco-input ${errors.firstName ? "border-red-500" : ""}`} value={form.firstName} onChange={set("firstName")} />
              </Field>
              <Field label={`${t("checkout.lastName")} *`} err={errors.lastName}>
                <input className={`eco-input ${errors.lastName ? "border-red-500" : ""}`} value={form.lastName} onChange={set("lastName")} />
              </Field>
              <Field label={t("checkout.company")} wide>
                <input className="eco-input" value={form.company} onChange={set("company")} />
              </Field>
              <Field label={`${t("checkout.street")} *`} wide err={errors.street}>
                <input className={`eco-input ${errors.street ? "border-red-500" : ""}`} value={form.street} onChange={set("street")} />
              </Field>
              <Field label={`${t("checkout.country")} *`} err={errors.country}>
                <select className={`eco-input ${errors.country ? "border-red-500" : ""}`} value={form.country} onChange={set("country")}>
                  <option value="">{t("checkout.select")}</option><option value="USA">{t("checkout.countryUsa")}</option><option value="Canada">{t("checkout.countryCanada")}</option><option value="UK">{t("checkout.countryUk")}</option>
                </select>
              </Field>
              <Field label={`${t("checkout.state")} *`} err={errors.state}>
                <select className={`eco-input ${errors.state ? "border-red-500" : ""}`} value={form.state} onChange={set("state")}>
                  <option value="">{t("checkout.select")}</option><option value="Illinois">{t("checkout.stateIllinois")}</option><option value="California">{t("checkout.stateCalifornia")}</option><option value="New York">{t("checkout.stateNewYork")}</option>
                </select>
              </Field>
              <Field label={`${t("checkout.zip")} *`} err={errors.zip}>
                <input className={`eco-input ${errors.zip ? "border-red-500" : ""}`} value={form.zip} onChange={set("zip")} />
              </Field>
              <Field label={`${t("checkout.email")} *`} err={errors.email}>
                <input className={`eco-input ${errors.email ? "border-red-500" : ""}`} type="email" value={form.email} onChange={set("email")} placeholder={t("checkout.emailPlaceholder")} />
              </Field>
              <Field label={`${t("checkout.phone")} *`} wide err={errors.phone}>
                <input className={`eco-input ${errors.phone ? "border-red-500" : ""}`} type="tel" value={form.phone} onChange={set("phone")} />
              </Field>
            </div>
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold mb-4">{t("checkout.additionalInfo")}</h2>
            <label className="text-xs text-gray-500">{t("checkout.orderNotes")}</label>
            <textarea className="eco-input" rows={4} value={form.notes} onChange={set("notes")} placeholder={t("checkout.orderNotesPh")} />
          </div>
        </form>

        <aside className="lg:col-span-4">
          <div className="border border-gray-200 rounded-md p-5 sm:p-6 lg:sticky lg:top-24">
            <div className="font-semibold mb-4">{t("checkout.orderSummary")}</div>
            {items.map((it) => (
              <div key={it.slug} className="flex justify-between text-sm py-2">
                <div className="flex items-center gap-2 flex-1 truncate"><span className="text-xl">{it.icon}</span> <span className="truncate">{it.name} ×{it.qty}</span></div>
                <div className="font-semibold whitespace-nowrap">${(it.price * it.qty).toFixed(2)}</div>
              </div>
            ))}
            <div className="flex justify-between py-2 border-t mt-2"><span className="text-gray-500">{t("checkout.subtotal")}</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between py-2 text-eco-green"><span>{t("checkout.discount")} ({coupon.code}):</span><span className="font-semibold">−${discount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between py-2"><span className="text-gray-500">{t("checkout.shipping")}</span><span className="font-semibold">{t("checkout.free")}</span></div>
            <div className="flex justify-between py-2 border-t"><span className="text-gray-500">{t("checkout.total")}</span><span className="text-lg font-bold">${total.toFixed(2)}</span></div>

            <div className="font-semibold mt-4 mb-3">{t("checkout.paymentMethod")}</div>
            {[
              { v: "cod",    l: t("checkout.cod") },
              { v: "paypal", l: t("checkout.paypal") },
              { v: "amazon", l: t("checkout.amazon") },
            ].map((p) => (
              <label key={p.v} className="flex items-center gap-2 py-2 text-sm cursor-pointer">
                <input type="radio" name="pay" className="eco-check" checked={form.payment === p.v} onChange={() => setForm((f) => ({ ...f, payment: p.v }))} />
                {p.l}
              </label>
            ))}

            <button
              type="submit" onClick={onPlaceOrder} disabled={placing}
              className="w-full mt-4 py-3 rounded-full bg-eco-green text-white font-medium hover:bg-emerald-600 disabled:opacity-60"
            >
              {placing ? t("checkout.placing") : t("checkout.placeOrder")}
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
