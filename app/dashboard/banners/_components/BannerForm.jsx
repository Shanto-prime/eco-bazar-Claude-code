"use client";

// app/dashboard/banners/_components/BannerForm.jsx
// Create/edit form for one promo banner. Handles the image upload (POST to
// /api/upload/banner, store the returned URL in a hidden field), then submits
// the rest to the server action. Used inline by the banners list page.

import { useRef, useState, useTransition } from "react";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { PLACEMENTS, dealsHref } from "../../../../lib/banners";
import { createBannerAction, updateBannerAction } from "../_actions";

// Prisma Date → the value a <input type="datetime-local"> expects (local time,
// no seconds/zone). Empty when there's no deadline.
function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function BannerForm({ banner, onDone, onCancel }) {
  const t = useT();
  const editing = !!banner?.id;
  const [image, setImage]   = useState(banner?.imageUrl || "");
  const [slug, setSlug]     = useState(banner?.slug || "");
  const [result, setResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pending, start]    = useTransition();
  const fileRef = useRef(null);

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res  = await fetch("/api/upload/banner", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("banners.uploadFailed"));
      setImage(json.url);
    } catch (err) {
      setResult({ ok: false, error: err.message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    start(async () => {
      const res = editing
        ? await updateBannerAction(banner.id, formData)
        : await createBannerAction(formData);
      setResult(res);
      if (res.ok) onDone?.();
    });
  };

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
      <input type="hidden" name="imageUrl" value={image} />

      {/* Image */}
      <div className="mb-5">
        <label className="block text-[13px] font-medium mb-1.5">{t("banners.image")} <span className="text-eco-green">*</span></label>
        {image ? (
          <div className="relative rounded-xl overflow-hidden border border-gray-200 aspect-[1620/440] bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="w-full h-full object-cover" />
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-gray-200 aspect-[1620/440] grid place-items-center text-gray-400 text-sm">
            {t("banners.noImage")}
          </div>
        )}
        <div className="mt-2 flex items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-3.5 py-2 text-sm font-medium hover:bg-gray-50 cursor-pointer min-h-[40px]">
            <i className="fa-solid fa-arrow-up-from-bracket text-eco-green text-xs" />
            {uploading ? t("banners.uploading") : image ? t("banners.replaceImage") : t("banners.uploadImage")}
            <input ref={fileRef} type="file" accept="image/*" onChange={onPickFile} className="hidden" />
          </label>
          <span className="text-xs text-gray-400">{t("banners.imageHint")}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-[13px] font-medium mb-1.5">{t("banners.titleLabel")} <span className="text-eco-green">*</span></span>
          <input name="title" defaultValue={banner?.title || ""} required maxLength={120} className="eco-input rounded-xl" placeholder={t("banners.titlePh")} />
        </label>

        <label className="block">
          <span className="block text-[13px] font-medium mb-1.5">{t("banners.placement")} <span className="text-eco-green">*</span></span>
          <select name="placement" defaultValue={banner?.placement || "TOP"} className="eco-input rounded-xl">
            {PLACEMENTS.map((p) => <option key={p.key} value={p.key}>{t(p.labelKey)}</option>)}
          </select>
        </label>

        <label className="block">
          <span className="block text-[13px] font-medium mb-1.5">{t("banners.slug")} <span className="text-eco-green">*</span></span>
          <div className="flex rounded-xl border border-gray-200 bg-white focus-within:border-eco-green overflow-hidden">
            <span className="inline-flex items-center px-3 bg-gray-50 text-gray-400 text-sm border-r border-gray-200 whitespace-nowrap">/deals/</span>
            <input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} required maxLength={60} className="w-full px-3.5 py-2.5 text-sm bg-transparent focus:outline-none" placeholder="top-deals" />
          </div>
          <span className="block mt-1 text-xs text-gray-400">{t("banners.slugHint", { url: dealsHref(slug || "top-deals") })}</span>
        </label>

        <label className="block">
          <span className="block text-[13px] font-medium mb-1.5">{t("banners.targetTag")} <span className="text-eco-green">*</span></span>
          <input name="targetTag" defaultValue={banner?.targetTag || ""} required maxLength={60} className="eco-input rounded-xl" placeholder={t("banners.targetTagPh")} />
          <span className="block mt-1 text-xs text-gray-400">{t("banners.targetTagHint")}</span>
        </label>

        <label className="block">
          <span className="block text-[13px] font-medium mb-1.5">{t("banners.promoCode")}</span>
          <input name="promoCode" defaultValue={banner?.promoCode || ""} maxLength={40} className="eco-input rounded-xl" placeholder={t("banners.promoCodePh")} />
        </label>

        <label className="block">
          <span className="block text-[13px] font-medium mb-1.5">{t("banners.deadline")}</span>
          <input name="deadline" type="datetime-local" defaultValue={toLocalInput(banner?.deadline)} className="eco-input rounded-xl" />
          <span className="block mt-1 text-xs text-gray-400">{t("banners.deadlineHint")}</span>
        </label>

        <label className="block">
          <span className="block text-[13px] font-medium mb-1.5">{t("banners.sort")}</span>
          <input name="sort" type="number" min="0" defaultValue={banner?.sort ?? 0} className="eco-input rounded-xl" />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm mt-4 cursor-pointer">
        <input type="checkbox" name="active" className="eco-check" defaultChecked={banner ? banner.active : true} />
        {t("banners.active")}
      </label>

      <div className="flex flex-wrap gap-2 mt-5">
        <button type="submit" disabled={pending || uploading} className="inline-flex items-center gap-2 rounded-xl bg-eco-green px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-60 min-h-[44px]">
          {(pending || uploading) && <i className="fa-solid fa-spinner fa-spin" />}
          {editing ? t("banners.saveBanner") : t("banners.createBanner")}
        </button>
        <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl border border-gray-200 text-sm min-h-[44px]">
          {t("banners.cancel")}
        </button>
      </div>

      {result && !result.ok && (
        <p role="alert" className="text-sm mt-3 text-red-500 flex items-start gap-2">
          <i className="fa-solid fa-circle-exclamation mt-0.5" /> {result.error}
        </p>
      )}
    </form>
  );
}
