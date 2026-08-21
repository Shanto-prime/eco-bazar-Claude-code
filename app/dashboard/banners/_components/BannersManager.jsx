"use client";

// app/dashboard/banners/_components/BannersManager.jsx
// The banners dashboard: banners grouped by placement, each with edit / show-
// hide / delete, plus an inline create/edit form. Toggle + delete call server
// actions; the router refresh + revalidatePath keep the list in sync.

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { useMoney } from "../../../../lib/currency/CurrencyProvider";
import {
    PLACEMENTS,
    placementLabelKey,
    dealsHref,
    isExpired,
} from "../../../../lib/banners";
import { deleteBannerAction, toggleBannerAction } from "../_actions";
import { deleteOfferAction, toggleOfferAction } from "../../offers/_actions";
import BannerForm from "./BannerForm";

function StatusBadge({ banner, t }) {
    if (!banner.active)
        return (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                {t("banners.hidden")}
            </span>
        );
    if (isExpired(banner.deadline))
        return (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                {t("banners.expired")}
            </span>
        );
    return (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-eco-green/10 text-eco-green">
            {t("banners.live")}
        </span>
    );
}

function BannerRow({ banner, onEdit, t }) {
    const router = useRouter();
    const [pending, start] = useTransition();
    const [error, setError] = useState(null);

    const run = (fn) =>
        start(async () => {
            const res = await fn();
            if (!res.ok) setError(res.error);
            else {
                setError(null);
                router.refresh();
            }
        });

    return (
        <li className="rounded-xl border border-gray-200 p-3 flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="w-28 shrink-0 aspect-[1620/440] rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={banner.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium truncate">{banner.title}</span>
                    <StatusBadge banner={banner} t={t} />
                    {banner.promoCode && (
                        <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                            {banner.promoCode}
                        </span>
                    )}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                    <Link
                        href={dealsHref(banner.slug)}
                        className="text-eco-green hover:underline"
                    >
                        {dealsHref(banner.slug)}
                    </Link>
                    {" · "}
                    {t("banners.tagShort")}{" "}
                    <span className="font-medium">{banner.targetTag}</span>
                    {banner.deadline && (
                        <>
                            {" "}
                            · {t("banners.until")}{" "}
                            {new Date(banner.deadline).toLocaleDateString()}
                        </>
                    )}
                </div>
                {error && (
                    <div className="text-xs text-red-500 mt-1">{error}</div>
                )}
            </div>
            <div className="flex items-center gap-3 text-xs shrink-0">
                <button
                    type="button"
                    onClick={() => run(() => toggleBannerAction(banner.id))}
                    disabled={pending}
                    className="text-gray-500 hover:underline disabled:opacity-50"
                >
                    {banner.active ? t("banners.hide") : t("banners.show")}
                </button>
                <button
                    type="button"
                    onClick={() => onEdit(banner)}
                    className="text-gray-500 hover:underline"
                >
                    {t("banners.edit")}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        if (confirm(t("banners.confirmDelete")))
                            run(() => deleteBannerAction(banner.id));
                    }}
                    disabled={pending}
                    className="text-red-500 hover:underline disabled:opacity-50"
                >
                    {t("banners.delete")}
                </button>
            </div>
        </li>
    );
}

// One Hot Deals offer in the list. Shows the product, the discount, the price the
// customer is actually charged and when it ends   the four things that decide
// what the storefront does with it.
function OfferRow({ offer, onEdit, t, money }) {
    const router = useRouter();
    const [pending, start] = useTransition();
    const [error, setError] = useState(null);

    const run = (fn) =>
        start(async () => {
            const res = await fn();
            if (!res.ok) setError(res.error);
            else {
                setError(null);
                router.refresh();
            }
        });

    const ended = isExpired(offer.endsAt);
    const badge = !offer.active ? (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {t("offers.paused")}
        </span>
    ) : ended ? (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
            {t("offers.ended")}
        </span>
    ) : (
        <span className="text-[11px] px-2 py-0.5 rounded-full bg-eco-green/10 text-eco-green">
            {t("offers.live")}
        </span>
    );

    return (
        <li className="rounded-xl border border-gray-200 p-3 flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 grid place-items-center">
                {offer.product?.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                        src={offer.product.image}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <i className="fa-regular fa-image text-gray-300" />
                )}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium truncate">
                        {offer.product?.name || " "}
                    </span>
                    {badge}
                    <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-50 text-red-600 font-medium">
                        {t("offers.offLabel", { percent: offer.percentOff })}
                    </span>
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                    <span className="font-medium text-gray-700">
                        {money(offer.salePrice)}
                    </span>
                    <span className="line-through ml-1.5">
                        {money(offer.basePrice)}
                    </span>
                    {" · "}
                    {t("offers.endsLabel")}{" "}
                    {new Date(offer.endsAt).toLocaleString()}
                </div>
                {error && (
                    <div className="text-xs text-red-500 mt-1">{error}</div>
                )}
            </div>
            <div className="flex items-center gap-3 text-xs shrink-0">
                <button
                    type="button"
                    onClick={() => run(() => toggleOfferAction(offer.id))}
                    disabled={pending}
                    className="text-gray-500 hover:underline disabled:opacity-50"
                >
                    {offer.active ? t("offers.pause") : t("offers.resume")}
                </button>
                <button
                    type="button"
                    onClick={() => onEdit(offer)}
                    className="text-gray-500 hover:underline"
                >
                    {t("offers.edit")}
                </button>
                <button
                    type="button"
                    onClick={() => {
                        if (confirm(t("offers.confirmDelete")))
                            run(() => deleteOfferAction(offer.id));
                    }}
                    disabled={pending}
                    className="text-red-500 hover:underline disabled:opacity-50"
                >
                    {t("offers.delete")}
                </button>
            </div>
        </li>
    );
}

export default function BannersManager({ banners, offers = [] }) {
    const t = useT();
    const money = useMoney();
    const router = useRouter();
    // null = closed; {} = creating; {banner|offer} = editing that record
    const [editing, setEditing] = useState(null);

    const done = () => {
        setEditing(null);
        router.refresh();
    };

    const byPlacement = (key) => banners.filter((b) => b.placement === key);

    // Banner rows whose placement is no longer offerable (the retired HOT_DEALS
    // image banner). Listed separately so an existing row stays visible and
    // deletable instead of vanishing from the UI with no explanation.
    const legacy = banners.filter(
        (b) => !PLACEMENTS.some((p) => p.key === b.placement),
    );

    return (
        <div className="space-y-8">
            {editing !== null ? (
                <BannerForm
                    key={editing.id || "new"}
                    // An offer row carries `percentOff`; that's what tells the form which
                    // kind of record it is editing.
                    banner={
                        editing.id && editing.percentOff == null
                            ? editing
                            : null
                    }
                    offer={
                        editing.id && editing.percentOff != null
                            ? editing
                            : null
                    }
                    onDone={done}
                    onCancel={() => setEditing(null)}
                />
            ) : (
                <button
                    type="button"
                    onClick={() => setEditing({})}
                    className="inline-flex items-center gap-2 rounded-xl bg-eco-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 min-h-[44px]"
                >
                    <i className="fa-solid fa-plus" /> {t("banners.addBanner")}
                </button>
            )}

            {PLACEMENTS.map((p) => {
                const list = byPlacement(p.key);
                return (
                    <section key={p.key}>
                        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-2">
                            {t(p.labelKey)}
                        </h2>
                        {list.length === 0 ? (
                            <p className="text-sm text-gray-400">
                                {t("banners.noneInPlacement")}
                            </p>
                        ) : (
                            <ul className="space-y-2">
                                {list.map((b) => (
                                    <BannerRow
                                        key={b.id}
                                        banner={b}
                                        onEdit={setEditing}
                                        t={t}
                                    />
                                ))}
                            </ul>
                        )}
                    </section>
                );
            })}

            {/* Hot Deals offers   sorted soonest-ending first, the same order the
          storefront uses, so this list reads as the running schedule. */}
            <section>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-1">
                    {t("offers.sectionTitle")}
                </h2>
                <p className="text-xs text-gray-400 mb-2">
                    {t("offers.sectionSubtitle")}
                </p>
                {offers.length === 0 ? (
                    <p className="text-sm text-gray-400">{t("offers.none")}</p>
                ) : (
                    <ul className="space-y-2">
                        {offers.map((o) => (
                            <OfferRow
                                key={o.id}
                                offer={o}
                                onEdit={setEditing}
                                t={t}
                                money={money}
                            />
                        ))}
                    </ul>
                )}
            </section>

            {legacy.length > 0 && (
                <section>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-2">
                        {t(placementLabelKey(legacy[0].placement))}
                    </h2>
                    <ul className="space-y-2">
                        {legacy.map((b) => (
                            <BannerRow
                                key={b.id}
                                banner={b}
                                onEdit={setEditing}
                                t={t}
                            />
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
}
