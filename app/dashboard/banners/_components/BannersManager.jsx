"use client";

// app/dashboard/banners/_components/BannersManager.jsx
// The banners dashboard: banners grouped by placement, each with edit / show-
// hide / delete, plus an inline create/edit form. Toggle + delete call server
// actions; the router refresh + revalidatePath keep the list in sync.

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { PLACEMENTS, dealsHref, isExpired } from "../../../../lib/banners";
import { deleteBannerAction, toggleBannerAction } from "../_actions";
import BannerForm from "./BannerForm";

function StatusBadge({ banner, t }) {
  if (!banner.active) return <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{t("banners.hidden")}</span>;
  if (isExpired(banner.deadline)) return <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{t("banners.expired")}</span>;
  return <span className="text-[11px] px-2 py-0.5 rounded-full bg-eco-green/10 text-eco-green">{t("banners.live")}</span>;
}

function BannerRow({ banner, onEdit, t }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState(null);

  const run = (fn) => start(async () => {
    const res = await fn();
    if (!res.ok) setError(res.error); else { setError(null); router.refresh(); }
  });

  return (
    <li className="rounded-xl border border-gray-200 p-3 flex flex-wrap sm:flex-nowrap items-center gap-3">
      <div className="w-28 shrink-0 aspect-[1620/440] rounded-lg overflow-hidden bg-gray-50 border border-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={banner.imageUrl} alt="" className="w-full h-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium truncate">{banner.title}</span>
          <StatusBadge banner={banner} t={t} />
          {banner.promoCode && <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">{banner.promoCode}</span>}
        </div>
        <div className="text-xs text-gray-500 mt-0.5">
          <Link href={dealsHref(banner.slug)} className="text-eco-green hover:underline">{dealsHref(banner.slug)}</Link>
          {" · "}{t("banners.tagShort")} <span className="font-medium">{banner.targetTag}</span>
          {banner.deadline && <> · {t("banners.until")} {new Date(banner.deadline).toLocaleDateString()}</>}
        </div>
        {error && <div className="text-xs text-red-500 mt-1">{error}</div>}
      </div>
      <div className="flex items-center gap-3 text-xs shrink-0">
        <button type="button" onClick={() => run(() => toggleBannerAction(banner.id))} disabled={pending} className="text-gray-500 hover:underline disabled:opacity-50">
          {banner.active ? t("banners.hide") : t("banners.show")}
        </button>
        <button type="button" onClick={() => onEdit(banner)} className="text-gray-500 hover:underline">{t("banners.edit")}</button>
        <button
          type="button"
          onClick={() => { if (confirm(t("banners.confirmDelete"))) run(() => deleteBannerAction(banner.id)); }}
          disabled={pending}
          className="text-red-500 hover:underline disabled:opacity-50"
        >
          {t("banners.delete")}
        </button>
      </div>
    </li>
  );
}

export default function BannersManager({ banners }) {
  const t = useT();
  const router = useRouter();
  // null = closed; {} = creating; banner = editing
  const [editing, setEditing] = useState(null);

  const done = () => { setEditing(null); router.refresh(); };

  const byPlacement = (key) => banners.filter((b) => b.placement === key);

  return (
    <div className="space-y-8">
      {editing !== null ? (
        <BannerForm
          key={editing.id || "new"}
          banner={editing.id ? editing : null}
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
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-2">{t(p.labelKey)}</h2>
            {list.length === 0 ? (
              <p className="text-sm text-gray-400">{t("banners.noneInPlacement")}</p>
            ) : (
              <ul className="space-y-2">
                {list.map((b) => <BannerRow key={b.id} banner={b} onEdit={setEditing} t={t} />)}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
