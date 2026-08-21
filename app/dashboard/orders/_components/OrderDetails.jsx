"use client";

// app/dashboard/orders/_components/OrderDetails.jsx
// "See details" button + modal for one order. Shows:
//   • ordered items with prices + line totals
//   • current status + append-only status timeline (with actor + notes)
//   • customer note, if any
//   • when the viewer OWNS the order:
//       - "Request return" button while it's DELIVERED and inside the
//         15-day return window (see lib/order-return.js)
//       - per-item "Write review" CTA / inline form, or a "You reviewed
//         this" badge once submitted
//
// Everything is passed in pre-serialised from the server page (dates as ISO
// strings, eligibility flags pre-computed) so this component does no data
// fetching beyond the two server actions it invokes.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { STATUS_PILL, statusKey } from "../../../../lib/order-status";
import { RETURN_WINDOW_DAYS } from "../../../../lib/order-return";
import { requestReturnAction, submitReviewAction } from "../_customer-actions";

function fmt(iso) {
    try {
        return new Date(iso).toLocaleString();
    } catch {
        return iso;
    }
}
function fmtDate(iso) {
    try {
        return new Date(iso).toLocaleDateString();
    } catch {
        return iso;
    }
}

// Money display   order fields are integer poisha (BDT base minor units).
function taka(minor) {
    const n = Number(minor || 0) / 100;
    return `৳${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function OrderDetails({ order }) {
    const t = useT();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [returnState, setReturnState] = useState({
        error: null,
        notice: null,
    });
    const [returnPending, startReturnTransition] = useTransition();

    const requestReturn = () => {
        if (!confirm(t("orders.returnConfirm", { number: order.number })))
            return;
        setReturnState({ error: null, notice: null });
        startReturnTransition(async () => {
            const res = await requestReturnAction({ orderId: order.id });
            if (!res?.ok) {
                setReturnState({
                    error: res?.error || "Return request failed.",
                    notice: null,
                });
                return;
            }
            setReturnState({ error: null, notice: t("orders.returnSaved") });
            router.refresh();
        });
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-600 hover:border-eco-green hover:text-eco-green transition min-h-[32px]"
            >
                <i className="fa-solid fa-circle-info" />{" "}
                {t("orders.seeDetails")}
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setOpen(false);
                    }}
                >
                    <div className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-white shadow-xl border border-gray-200">
                        <div className="p-5 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white">
                            <div>
                                <h2 className="font-semibold">
                                    {t("orders.detailsTitle", {
                                        number: order.number,
                                    })}
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {t("orders.placedOn", {
                                        date: fmt(order.createdAt),
                                    })}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="text-gray-400 hover:text-gray-900"
                                aria-label={t("orders.close")}
                            >
                                <i className="fa-solid fa-xmark text-lg" />
                            </button>
                        </div>

                        <div className="p-5 space-y-5">
                            {/* Current status + return CTA when the viewer owns a still-in-window order */}
                            <div className="flex flex-wrap items-center gap-2 text-sm">
                                <span className="text-gray-500">
                                    {t("orders.currentStatus")}
                                </span>
                                <span
                                    className={`text-xs px-2 py-1 rounded-full ${STATUS_PILL[order.status] || "bg-gray-100 text-gray-700"}`}
                                >
                                    {t(statusKey(order.status))}
                                </span>
                                {order.viewerIsOwner && order.canReturn && (
                                    <button
                                        type="button"
                                        onClick={requestReturn}
                                        disabled={returnPending}
                                        className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                                    >
                                        <i className="fa-solid fa-rotate-left" />{" "}
                                        {t("orders.requestReturn")}
                                    </button>
                                )}
                            </div>

                            {/* Return-window helper text   visible on delivered orders even
                  after the window closes, so the customer knows why the button
                  isn't there any more. */}
                            {order.viewerIsOwner &&
                                order.status === "DELIVERED" &&
                                order.returnDeadline && (
                                    <p className="text-xs text-gray-500">
                                        {order.canReturn
                                            ? t("orders.returnWindow", {
                                                  days: RETURN_WINDOW_DAYS,
                                              }) +
                                              " (" +
                                              fmtDate(order.returnDeadline) +
                                              ")"
                                            : t("orders.returnWindowExpired")}
                                    </p>
                                )}
                            {returnState.error && (
                                <p className="text-xs text-red-600">
                                    {returnState.error}
                                </p>
                            )}
                            {returnState.notice && (
                                <p className="text-xs text-eco-green">
                                    {returnState.notice}
                                </p>
                            )}

                            {/* Ordered items   snapshot of what was purchased. */}
                            {order.items && order.items.length > 0 && (
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                                        {t("orders.itemsLabel")}
                                    </p>
                                    <ul className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                                        {order.items.map((it) => (
                                            <ItemRow
                                                key={it.id}
                                                item={it}
                                                orderId={order.id}
                                                canReview={
                                                    order.canReviewItems &&
                                                    !it.reviewed &&
                                                    !!it.productId
                                                }
                                                alreadyReviewed={it.reviewed}
                                            />
                                        ))}
                                    </ul>
                                    {/* Order totals below the item list. */}
                                    <div className="mt-3 text-sm space-y-1">
                                        <div className="flex justify-between text-gray-500">
                                            <span>{t("orders.subtotal")}</span>
                                            <span>{taka(order.subtotal)}</span>
                                        </div>
                                        {order.discount > 0 && (
                                            <div className="flex justify-between text-gray-500">
                                                <span>
                                                    {t("orders.discount")}
                                                </span>
                                                <span>
                                                    −{taka(order.discount)}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-gray-500">
                                            <span>{t("orders.shipping")}</span>
                                            <span>{taka(order.shipping)}</span>
                                        </div>
                                        <div className="flex justify-between font-semibold pt-1 border-t border-gray-200 mt-1">
                                            <span>{t("orders.total")}</span>
                                            <span>{taka(order.total)}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Customer's order note (a message about the order), if any */}
                            {order.notes && (
                                <div className="rounded-xl bg-gray-50 border border-gray-200 p-3">
                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-1">
                                        {t("orders.customerNote")}
                                    </p>
                                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {order.notes}
                                    </p>
                                </div>
                            )}

                            {/* Full timeline: every status change with timestamp, actor, note */}
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400 mb-2">
                                    {t("orders.timeline")}
                                </p>
                                {order.history.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                        {t("orders.noHistory")}
                                    </p>
                                ) : (
                                    <ol className="space-y-3 border-l border-gray-200 pl-4">
                                        {order.history.map((h) => (
                                            <li key={h.id} className="relative">
                                                <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-eco-green ring-2 ring-white" />
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <span
                                                        className={`text-xs px-2 py-0.5 rounded-full ${STATUS_PILL[h.status] || "bg-gray-100 text-gray-700"}`}
                                                    >
                                                        {t(statusKey(h.status))}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {fmt(h.createdAt)}
                                                    </span>
                                                </div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    {h.actorName
                                                        ? t("orders.byActor", {
                                                              actor: h.actorName,
                                                          })
                                                        : t("orders.bySystem")}
                                                </div>
                                                {h.note && (
                                                    <p className="text-sm text-gray-700 mt-1">
                                                        “{h.note}”
                                                    </p>
                                                )}
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

// One row in the items list. Renders the product name + qty + line total, plus
// (for the buyer, on a delivered order) either a "Write review" CTA that
// expands into an inline form, or a "You reviewed this" note.
function ItemRow({ item, orderId, canReview, alreadyReviewed }) {
    const t = useT();
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);
    const [rating, setRating] = useState(5);
    const [body, setBody] = useState("");
    const [error, setError] = useState(null);
    const [saved, setSaved] = useState(false);
    const [pending, startTransition] = useTransition();

    const submit = (e) => {
        e.preventDefault();
        if (!body.trim()) {
            setError(t("orders.reviewPlaceholder"));
            return;
        }
        setError(null);
        startTransition(async () => {
            const res = await submitReviewAction({
                orderId,
                productId: item.productId,
                rating,
                body,
            });
            if (!res?.ok) {
                setError(res?.error || "Failed");
                return;
            }
            setSaved(true);
            setExpanded(false);
            router.refresh();
        });
    };

    return (
        <li className="p-3 flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
                <a
                    href={`/shop/${item.productSlug}`}
                    className="block font-medium text-sm text-gray-800 hover:text-eco-green truncate"
                >
                    {item.productName}
                </a>
                <div className="text-xs text-gray-500 mt-0.5">
                    {taka(item.unitPrice)} × {item.qty}
                </div>

                {/* Review CTA / status */}
                {alreadyReviewed && !saved && (
                    <p className="text-[11px] text-emerald-600 mt-1">
                        <i className="fa-solid fa-check mr-1" />
                        {t("orders.reviewYours", { stars: "" })}
                    </p>
                )}
                {saved && (
                    <p className="text-[11px] text-emerald-600 mt-1">
                        <i className="fa-solid fa-check mr-1" />
                        {t("orders.reviewSaved")}
                    </p>
                )}
                {canReview && !expanded && !saved && (
                    <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-eco-green hover:underline"
                    >
                        <i className="fa-regular fa-star" />{" "}
                        {t("orders.writeReview")}
                    </button>
                )}
                {expanded && (
                    <form
                        onSubmit={submit}
                        className="mt-2 space-y-2 rounded-md border border-gray-200 p-2"
                    >
                        <label className="flex items-center gap-2 text-xs text-gray-600">
                            <span>{t("orders.reviewRatingLabel")}:</span>
                            <StarRatingInput
                                value={rating}
                                onChange={setRating}
                            />
                        </label>
                        <textarea
                            value={body}
                            onChange={(e) => setBody(e.target.value)}
                            rows={3}
                            maxLength={2000}
                            placeholder={t("orders.reviewPlaceholder")}
                            className="w-full rounded border border-gray-200 p-2 text-xs focus:border-eco-green focus:outline-none"
                        />
                        {error && (
                            <p className="text-[11px] text-red-600">{error}</p>
                        )}
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={pending}
                                className="rounded bg-eco-green text-white text-xs px-3 py-1.5 font-medium disabled:opacity-60"
                            >
                                {t("orders.reviewSubmit")}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setExpanded(false);
                                    setError(null);
                                }}
                                className="rounded border border-gray-200 text-xs px-3 py-1.5 text-gray-600 hover:border-gray-300"
                            >
                                {t("orders.close")}
                            </button>
                        </div>
                    </form>
                )}
            </div>
            <div className="text-sm font-semibold whitespace-nowrap">
                {taka(item.lineTotal)}
            </div>
        </li>
    );
}

// 5-star click picker for the inline review form. Simple radio-like set of
// buttons; no external dep needed.
function StarRatingInput({ value, onChange }) {
    return (
        <span className="inline-flex">
            {[1, 2, 3, 4, 5].map((n) => (
                <button
                    key={n}
                    type="button"
                    onClick={() => onChange(n)}
                    className={`text-base ${n <= value ? "text-yellow-400" : "text-gray-300 hover:text-yellow-300"}`}
                    aria-label={`${n} star${n === 1 ? "" : "s"}`}
                >
                    ★
                </button>
            ))}
        </span>
    );
}
