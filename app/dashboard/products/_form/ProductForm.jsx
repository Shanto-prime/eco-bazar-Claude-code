"use client";

// app/dashboard/products/_form/ProductForm.jsx
// Form used by both the create and edit pages. Drives image upload by POSTing
// each file to /api/upload, then submits the form via a server action.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../../../../lib/i18n/LanguageProvider";

// specifications is stored as a JSON object; render it back as "Key: Value" lines.
function specsToText(specs) {
  if (!specs || typeof specs !== "object") return "";
  return Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join("\n");
}

export default function ProductForm({ product, action, allowDelete = false, onDelete }) {
  const t = useT();
  const router = useRouter();
  const [images, setImages] = useState(product?.images?.map((i) => i.url) || []);
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    images.forEach((u) => fd.append("imageUrls", u));
    startTransition(async () => {
      try {
        await action(fd);
        router.refresh();
      } catch (err) {
        setError(err.message || t("productForm.saveFailed"));
      }
    });
  };

  const onUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true); setError(null);
    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (!res.ok) {
          const { error } = await res.json().catch(() => ({}));
          throw new Error(error || t("productForm.uploadFailed", { status: res.status }));
        }
        const { url } = await res.json();
        setImages((arr) => [...arr, url]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeImage = (idx) => setImages((arr) => arr.filter((_, i) => i !== idx));
  const moveImage   = (idx, dir) => setImages((arr) => {
    const j = idx + dir;
    if (j < 0 || j >= arr.length) return arr;
    const copy = [...arr];
    [copy[idx], copy[j]] = [copy[j], copy[idx]];
    return copy;
  });

  return (
    <form onSubmit={onSubmit} className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 max-w-3xl">
      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-500">{t("productForm.nameEn")}</label>
          <input name="name" required defaultValue={product?.name} className="eco-input" />
        </div>
        <div>
          <label className="text-xs text-gray-500">{(() => { const [before, after] = t("productForm.slug").split("{slug}"); return <>{before}<i>slug</i>{after}</>; })()}</label>
          <input name="slug" required defaultValue={product?.slug} className="eco-input" placeholder={t("productForm.slugPh")} />
        </div>
        <div>
          <label className="text-xs text-gray-500">{t("productForm.badge")}</label>
          <input name="badge" defaultValue={product?.badge ?? ""} className="eco-input" placeholder={t("productForm.badgePh")} />
        </div>
        <div>
          <label className="text-xs text-gray-500">{t("productForm.priceUsd")}</label>
          <input name="price" type="number" step="0.01" min="0" required defaultValue={product?.price ?? ""} className="eco-input" />
        </div>
        <div>
          <label className="text-xs text-gray-500">{t("productForm.oldPrice")}</label>
          <input name="oldPrice" type="number" step="0.01" min="0" defaultValue={product?.oldPrice ?? ""} className="eco-input" />
        </div>
        <div>
          <label className="text-xs text-gray-500">{t("productForm.stockQty")}</label>
          <input name="stock" type="number" min="0" required defaultValue={product?.stock ?? 0} className="eco-input" />
        </div>
        <div>
          <label className="text-xs text-gray-500">{t("productForm.skuOptional")}</label>
          <input name="sku" defaultValue={product?.sku ?? ""} className="eco-input" placeholder={t("productForm.skuPh")} />
        </div>
        <div>
          <label className="text-xs text-gray-500">{t("productForm.brandOptional")}</label>
          <input name="brand" defaultValue={product?.brand ?? ""} className="eco-input" placeholder={t("productForm.brandPh")} />
        </div>
        <div>
          <label className="text-xs text-gray-500">{t("productForm.tags")}</label>
          <input name="tags" defaultValue={(product?.tags || []).join(", ")} className="eco-input" placeholder={t("productForm.tagsPh")} />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-500">{(() => { const [before, after] = t("productForm.specs").split("{format}"); return <>{before}<code>{t("productForm.specsFormat")}</code>{after}</>; })()}</label>
          <textarea
            name="specifications" rows={4} className="eco-input font-mono text-sm"
            defaultValue={specsToText(product?.specifications)}
            placeholder={t("productForm.specsPh")}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-500">{t("productForm.descEn")}</label>
          <textarea name="description" rows={5} defaultValue={product?.description ?? ""} className="eco-input" />
        </div>
      </div>

      {/* ============ Image manager ===================================== */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">{t("productForm.productImages")}</label>
          <span className="text-xs text-gray-500">{images.length}{t("productForm.uploadedSuffix")}</span>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-3">
            {images.map((url, i) => (
              <div key={url + i} className="relative group border border-gray-200 rounded-md overflow-hidden aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end justify-between p-1 opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={() => moveImage(i, -1)} className="text-white text-xs px-1.5 py-0.5 bg-black/60 rounded" title={t("productForm.moveLeft")}>←</button>
                  <button type="button" onClick={() => moveImage(i, +1)} className="text-white text-xs px-1.5 py-0.5 bg-black/60 rounded" title={t("productForm.moveRight")}>→</button>
                  <button type="button" onClick={() => removeImage(i)} className="text-white text-xs px-1.5 py-0.5 bg-red-600 rounded" title={t("productForm.removeImage")}>×</button>
                </div>
                {i === 0 && <span className="absolute top-1 left-1 bg-eco-green text-white text-[10px] px-1.5 py-0.5 rounded">{t("productForm.cover")}</span>}
              </div>
            ))}
          </div>
        )}

        <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:border-eco-green text-sm min-h-[44px]">
          <i className="fa-solid fa-cloud-arrow-up" />
          {uploading ? t("productForm.uploading") : t("productForm.uploadImages")}
          <input type="file" accept="image/*" multiple hidden onChange={onUpload} disabled={uploading} />
        </label>
        <p className="text-xs text-gray-500 mt-2">
          {t("productForm.imagesHelp")}
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 justify-between">
        <div className="flex gap-3 flex-wrap">
          <button
            type="submit" disabled={pending || uploading}
            className="px-6 py-3 rounded-md bg-eco-green text-white font-medium hover:bg-emerald-600 disabled:opacity-60 min-h-[44px]"
          >
            {pending ? t("productForm.saving") : product ? t("productForm.saveChanges") : t("productForm.createProduct")}
          </button>
          <button type="button" onClick={() => router.push("/dashboard/products")} className="px-6 py-3 rounded-md border border-gray-200 min-h-[44px]">
            {t("productForm.cancel")}
          </button>
        </div>
        {allowDelete && (
          <button
            type="button"
            onClick={async () => {
              if (!confirm(t("productForm.confirmDelete"))) return;
              try { await onDelete(); } catch (e) { setError(e.message); }
            }}
            className="px-6 py-3 rounded-md border border-red-300 text-red-600 hover:bg-red-50 min-h-[44px]"
          >
            <i className="fa-solid fa-trash mr-1" /> {t("productForm.deleteProduct")}
          </button>
        )}
      </div>
    </form>
  );
}
