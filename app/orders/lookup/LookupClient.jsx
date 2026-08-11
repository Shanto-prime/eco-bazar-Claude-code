"use client";

// app/orders/lookup/LookupClient.jsx — "track my order" form + result.
//
// Public on purpose: this is the only way a GUEST can see an order they placed,
// since guest orders have no userId and so never appear in /dashboard/orders.
// The server action requires the order number AND the email used at checkout.

import { useState, useTransition } from "react";
import Link from "next/link";
import Breadcrumb from "../../../components/Breadcrumb";
import LocalTime from "../../../components/LocalTime";
import { useT } from "../../../lib/i18n/LanguageProvider";
import { useMoney } from "../../../lib/currency/CurrencyProvider";
import { STATUS_PILL, statusKey } from "../../../lib/order-status";
import { lookupOrderAction } from "./_actions";

export default function LookupClient({ initialNumber = "", initialEmail = "" }) {
  const t = useT();
  const money = useMoney();
  const [result, setResult] = useState(null);
  const [pending, start] = useTransition();

  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    start(async () => setResult(await lookupOrderAction(formData)));
  };

  const order = result?.ok ? result.order : null;

  return (
    <>
      <Breadcrumb items={[{ label: t("lookup.breadcrumb") }]} />

      <section className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("lookup.heading")}</h1>
        <p className="mt-1.5 text-sm text-gray-500">{t("lookup.subtitle")}</p>

        <form onSubmit={onSubmit} className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-[13px] font-medium mb-1.5">
                {t("lookup.orderNumber")} <span className="text-eco-green">*</span>
              </span>
              <input
                name="number" required maxLength={40} defaultValue={initialNumber}
                placeholder="ECO-XXXXXXXX" className="eco-input rounded-xl font-mono"
              />
            </label>
            <label className="block">
              <span className="block text-[13px] font-medium mb-1.5">
                {t("lookup.email")} <span className="text-eco-green">*</span>
              </span>
              <input
                name="email" type="email" required maxLength={120} defaultValue={initialEmail}
                placeholder="you@example.com" className="eco-input rounded-xl"
              />
            </label>
          </div>

          <button
            type="submit" disabled={pending}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-eco-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 min-h-[44px]"
          >
            {pending && <i className="fa-solid fa-spinner fa-spin" />}
            {t("lookup.submit")}
          </button>

          {result && !result.ok && (
            <p role="alert" className="mt-3 text-sm text-red-500 flex items-start gap-2">
              <i className="fa-solid fa-circle-exclamation mt-0.5" /> {result.error}
            </p>
          )}
        </form>

        {order && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="font-mono font-semibold">{order.number}</span>
              <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_PILL[order.status] || "bg-gray-100 text-gray-700"}`}>
                {t(statusKey(order.status))}
              </span>
              <span className="text-xs text-gray-500 ml-auto"><LocalTime value={order.createdAt} /></span>
            </div>

            <ul className="mt-4 divide-y divide-gray-100">
              {order.items.map((it) => (
                <li key={it.productSlug + it.productName} className="py-2.5 flex items-center gap-3 text-sm">
                  <Link href={`/shop/${it.productSlug}`} className="hover:text-eco-green truncate">{it.productName}</Link>
                  <span className="text-gray-400">×{it.qty}</span>
                  <span className="ml-auto font-medium">{money(it.unitPrice * it.qty)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 space-y-1.5 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">{t("cart.subtotalLabel")}</dt><dd>{money(order.subtotal)}</dd></div>
              {order.discount > 0 && (
                <div className="flex justify-between"><dt className="text-gray-500">{t("cart.discount")}</dt><dd>−{money(order.discount)}</dd></div>
              )}
              <div className="flex justify-between font-semibold pt-1.5 border-t"><dt>{t("cart.totalLabel")}</dt><dd>{money(order.total)}</dd></div>
            </dl>

            {/* Where it's going — the customer's own address, echoed back. */}
            <div className="mt-4 pt-4 border-t text-sm text-gray-500">
              <div className="font-medium text-gray-700">{order.firstName} {order.lastName}</div>
              {[order.street, order.thana, order.city, order.state, order.zip, order.country].filter(Boolean).join(", ")}
            </div>

            {order.history?.length > 1 && (
              <ol className="mt-4 pt-4 border-t space-y-1.5 text-xs text-gray-500">
                {order.history.map((h, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <i className="fa-regular fa-circle-dot text-[10px] text-eco-green" />
                    {t(statusKey(h.status))} · <LocalTime value={h.createdAt} />
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </section>
    </>
  );
}
