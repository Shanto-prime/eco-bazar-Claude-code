"use client";

// app/dashboard/products/_form/ProductForm.jsx
// Form used by both the create and edit pages. Drives image upload by POSTing
// each file to /api/upload, then submits the form via a server action.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

// specifications is stored as a JSON object; render it back as "Key: Value" lines.
function specsToText(specs) {
  if (!specs || typeof specs !== "object") return "";
  return Object.entries(specs).map(([k, v]) => `${k}: ${v}`).join("\n");
}

export default function ProductForm({ product, action, allowDelete = false, onDelete }) {
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
        setError(err.message || "Failed to save.");
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
          throw new Error(error || `Upload failed (${res.status})`);
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
          <label className="text-xs text-gray-500">Product name *</label>
          <input name="name" required defaultValue={product?.name} className="eco-input" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Slug * (URL: /shop/<i>slug</i>)</label>
          <input name="slug" required defaultValue={product?.slug} className="eco-input" placeholder="green-apple" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Badge (optional)</label>
          <input name="badge" defaultValue={product?.badge ?? ""} className="eco-input" placeholder="Sale 50%" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Price (USD) *</label>
          <input name="price" type="number" step="0.01" min="0" required defaultValue={product?.price ?? ""} className="eco-input" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Old price (optional)</label>
          <input name="oldPrice" type="number" step="0.01" min="0" defaultValue={product?.oldPrice ?? ""} className="eco-input" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Stock quantity *</label>
          <input name="stock" type="number" min="0" required defaultValue={product?.stock ?? 0} className="eco-input" />
        </div>
        <div>
          <label className="text-xs text-gray-500">SKU (optional)</label>
          <input name="sku" defaultValue={product?.sku ?? ""} className="eco-input" placeholder="ECO-APL-001" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Brand (optional)</label>
          <input name="brand" defaultValue={product?.brand ?? ""} className="eco-input" placeholder="Ecobazar" />
        </div>
        <div>
          <label className="text-xs text-gray-500">Tags (comma-separated)</label>
          <input name="tags" defaultValue={(product?.tags || []).join(", ")} className="eco-input" placeholder="organic, fruit, fresh" />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-500">Specifications (one per line — <code>Key: Value</code>)</label>
          <textarea
            name="specifications" rows={4} className="eco-input font-mono text-sm"
            defaultValue={specsToText(product?.specifications)}
            placeholder={"Weight: 1 kg\nOrigin: India\nStorage: Keep refrigerated"}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="text-xs text-gray-500">Description</label>
          <textarea name="description" rows={5} defaultValue={product?.description ?? ""} className="eco-input" />
        </div>
      </div>

      {/* ============ Image manager ===================================== */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">Product images</label>
          <span className="text-xs text-gray-500">{images.length} uploaded</span>
        </div>

        {images.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3 mb-3">
            {images.map((url, i) => (
              <div key={url + i} className="relative group border border-gray-200 rounded-md overflow-hidden aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-end justify-between p-1 opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={() => moveImage(i, -1)} className="text-white text-xs px-1.5 py-0.5 bg-black/60 rounded" title="Move left">←</button>
                  <button type="button" onClick={() => moveImage(i, +1)} className="text-white text-xs px-1.5 py-0.5 bg-black/60 rounded" title="Move right">→</button>
                  <button type="button" onClick={() => removeImage(i)} className="text-white text-xs px-1.5 py-0.5 bg-red-600 rounded" title="Remove">×</button>
                </div>
                {i === 0 && <span className="absolute top-1 left-1 bg-eco-green text-white text-[10px] px-1.5 py-0.5 rounded">Cover</span>}
              </div>
            ))}
          </div>
        )}

        <label className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-md cursor-pointer hover:border-eco-green text-sm min-h-[44px]">
          <i className="fa-solid fa-cloud-arrow-up" />
          {uploading ? "Uploading…" : "Upload image(s)"}
          <input type="file" accept="image/*" multiple hidden onChange={onUpload} disabled={uploading} />
        </label>
        <p className="text-xs text-gray-500 mt-2">
          JPEG / PNG / WebP. Up to 4 MB each. The first image is used as the cover on the shop grid.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3 justify-between">
        <div className="flex gap-3 flex-wrap">
          <button
            type="submit" disabled={pending || uploading}
            className="px-6 py-3 rounded-md bg-eco-green text-white font-medium hover:bg-emerald-600 disabled:opacity-60 min-h-[44px]"
          >
            {pending ? "Saving…" : product ? "Save changes" : "Create product"}
          </button>
          <button type="button" onClick={() => router.push("/dashboard/products")} className="px-6 py-3 rounded-md border border-gray-200 min-h-[44px]">
            Cancel
          </button>
        </div>
        {allowDelete && (
          <button
            type="button"
            onClick={async () => {
              if (!confirm("Delete this product? This cannot be undone.")) return;
              try { await onDelete(); } catch (e) { setError(e.message); }
            }}
            className="px-6 py-3 rounded-md border border-red-300 text-red-600 hover:bg-red-50 min-h-[44px]"
          >
            <i className="fa-solid fa-trash mr-1" /> Delete product
          </button>
        )}
      </div>
    </form>
  );
}
