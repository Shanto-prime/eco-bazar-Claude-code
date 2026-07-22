"use client";

// app/dashboard/orders/_components/OrderDetails.jsx
// A "See details" button + modal for one order. The modal shows the FULL status
// timeline — every timestamp, who made the change, and any note/message — plus
// the customer's own order note. This is how a customer (whose table row shows
// only the LATEST update) can still see the complete history on demand; staff
// get it too.
//
// Everything is passed in pre-serialised from the server page (dates as ISO
// strings), so this component does no data fetching.

import { useState } from "react";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { STATUS_PILL, statusKey } from "../../../../lib/order-status";

function fmt(iso) {
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export default function OrderDetails({ order }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-eco-green hover:text-eco-green transition min-h-[32px]"
      >
        <i className="fa-solid fa-circle-info" /> {t("orders.seeDetails")}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-gray-200">
            <div className="p-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
              <div>
                <h2 className="font-semibold">{t("orders.detailsTitle", { number: order.number })}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{t("orders.placedOn", { date: fmt(order.createdAt) })}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-900" aria-label={t("orders.close")}>
                <i className="fa-solid fa-xmark text-lg" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {/* Current status */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">{t("orders.currentStatus")}</span>
                <span className={`text-xs px-2 py-1 rounded-full ${STATUS_PILL[order.status] || "bg-gray-100 text-gray-700"}`}>
                  {t(statusKey(order.status))}
                </span>
              </div>

              {/* Customer's order note (a message about the order), if any */}
              {order.notes && (
                <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">{t("orders.customerNote")}</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
                </div>
              )}

              {/* Full timeline: every status change with timestamp, actor, note */}
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">{t("orders.timeline")}</p>
                {order.history.length === 0 ? (
                  <p className="text-sm text-gray-500">{t("orders.noHistory")}</p>
                ) : (
                  <ol className="space-y-3 border-l border-gray-200 pl-4">
                    {order.history.map((h) => (
                      <li key={h.id} className="relative">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-eco-green ring-2 ring-white" />
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_PILL[h.status] || "bg-gray-100 text-gray-700"}`}>
                            {t(statusKey(h.status))}
                          </span>
                          <span className="text-xs text-gray-400">{fmt(h.createdAt)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          {h.actorName ? t("orders.byActor", { actor: h.actorName }) : t("orders.bySystem")}
                        </div>
                        {h.note && <p className="text-sm text-gray-700 mt-1">“{h.note}”</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
