"use client";

// app/dashboard/offers/_components/OfferForm.jsx
// Create/edit one Hot Deals offer: pick a product, set a percentage, set the end
// time. Rendered by BannerForm when the admin chooses the Hot Deals area at the
// top of that form, so an offer and an image banner are created from the same
// place.
//
// There is no image field on purpose   the featured card shows the selected
// product's own image and details, which is the whole point of the area being
// product-driven rather than artwork-driven.

import { useState, useTransition } from "react";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { useMoney } from "../../../../lib/currency/CurrencyProvider";
import {
    OFFER_MIN_PERCENT,
    OFFER_MAX_PERCENT,
    clampPercent,
} from "../../../../lib/offers";
import { createOfferAction, updateOfferAction } from "../_actions";
import ProductPicker from "./ProductPicker";

// Prisma Date / ISO string → the value <input type="datetime-local"> expects
// (local time, no seconds or zone).
function toLocalInput(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Default a new offer to "ends 24h from now" so the countdown is sensible before
// the admin touches it.
function tomorrowLocalInput() {
    return toLocalInput(new Date(Date.now() + 24 * 60 * 60 * 1000));
}

export default function OfferForm({ offer, header = null, onDone, onCancel }) {
    const t = useT();
    const money = useMoney();
    const editing = !!offer?.id;

    const [product, setProduct] = useState(offer?.product || null);
    const [percent, setPercent] = useState(offer?.percentOff ?? 50);
    const [result, setResult] = useState(null);
    const [pending, start] = useTransition();

    // Preview the real numbers off the UNDISCOUNTED catalogue price, so editing a
    // live offer doesn't discount an already-discounted figure.
    const base = product ? (product.basePrice ?? product.price) : null;
    const now =
        base != null
            ? Math.max(
                  0.01,
                  Math.round(base * (100 - clampPercent(percent))) / 100,
              )
            : null;

    const onSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        start(async () => {
            const res = editing
                ? await updateOfferAction(offer.id, formData)
                : await createOfferAction(formData);
            setResult(res);
            if (res.ok) onDone?.();
        });
    };

    return (
        <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6"
        >
            {/* "Where do you want to add this?"   passed in by BannerForm. */}
            {header}
            <ProductPicker value={product} onChange={setProduct} />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                    <span className="block text-[13px] font-medium mb-1.5">
                        {t("offers.percentOff")}{" "}
                        <span className="text-eco-green">*</span>
                    </span>
                    <div className="flex rounded-xl border border-gray-200 bg-white focus-within:border-eco-green overflow-hidden">
                        <input
                            name="percentOff"
                            type="number"
                            min={OFFER_MIN_PERCENT}
                            max={OFFER_MAX_PERCENT}
                            step="1"
                            required
                            value={percent}
                            onChange={(e) => setPercent(e.target.value)}
                            className="w-full px-3.5 py-2.5 text-sm bg-transparent focus:outline-none"
                        />
                        <span className="inline-flex items-center px-3 bg-gray-50 text-gray-400 text-sm border-l border-gray-200">
                            %
                        </span>
                    </div>
                    <span className="block mt-1 text-xs text-gray-400">
                        {t("offers.percentHint", {
                            min: OFFER_MIN_PERCENT,
                            max: OFFER_MAX_PERCENT,
                        })}
                    </span>
                </label>

                <label className="block">
                    <span className="block text-[13px] font-medium mb-1.5">
                        {t("offers.endsAt")}{" "}
                        <span className="text-eco-green">*</span>
                    </span>
                    <input
                        name="endsAt"
                        type="datetime-local"
                        required
                        defaultValue={
                            offer?.endsAt
                                ? toLocalInput(offer.endsAt)
                                : tomorrowLocalInput()
                        }
                        className="eco-input rounded-xl"
                    />
                    <span className="block mt-1 text-xs text-gray-400">
                        {t("offers.endsAtHint")}
                    </span>
                </label>
            </div>

            {/* What the customer will actually be charged while this offer runs. */}
            {base != null && (
                <p className="mt-4 rounded-xl bg-emerald-50 border border-emerald-100 px-3.5 py-2.5 text-sm text-emerald-800">
                    <i className="fa-solid fa-tag mr-1.5 text-xs" />
                    {t("offers.pricePreview", {
                        now: money(now),
                        was: money(base),
                    })}
                </p>
            )}

            <label className="flex items-center gap-2 text-sm mt-4 cursor-pointer">
                <input
                    type="checkbox"
                    name="active"
                    className="eco-check"
                    defaultChecked={offer ? offer.active : true}
                />
                {t("offers.active")}
            </label>

            <div className="flex flex-wrap gap-2 mt-5">
                <button
                    type="submit"
                    disabled={pending || !product}
                    className="inline-flex items-center gap-2 rounded-xl bg-eco-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 min-h-[44px]"
                >
                    {pending && <i className="fa-solid fa-spinner fa-spin" />}
                    {editing ? t("offers.saveOffer") : t("offers.createOffer")}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm min-h-[44px]"
                >
                    {t("offers.cancel")}
                </button>
            </div>

            {result && !result.ok && (
                <p
                    role="alert"
                    className="text-sm mt-3 text-red-500 flex items-start gap-2"
                >
                    <i className="fa-solid fa-circle-exclamation mt-0.5" />{" "}
                    {result.error}
                </p>
            )}
        </form>
    );
}
