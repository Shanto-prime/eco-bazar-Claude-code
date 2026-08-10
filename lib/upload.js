// lib/upload.js
// Shared validation for the three image-upload routes (products, avatars,
// banners). They differ only in who may call them, the size cap and the target
// directory — the file-safety rules below are identical, so they live here.
//
// WHY the extension is NOT taken from the uploaded filename:
// `file.name` and `file.type` both come from the client and neither is
// trustworthy. Deriving the stored extension from `file.name` while only
// checking `file.type` let a caller send filename="x.html" with
// Content-Type: image/png. The bytes landed in /public as a .html file, which
// Next serves from the app's own origin as `text/html` — stored XSS, reachable
// by any signed-in user through the avatar route. The extension is therefore
// derived from the MIME type we allowed, and the MIME type is confirmed against
// the file's magic bytes so a declared type can't lie about the content.

// Allowed MIME type → the extension we store it as. Anything absent is rejected.
const EXT_BY_MIME = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
};

// Leading-byte signatures per type. WebP is RIFF....WEBP, so it needs the
// bytes at offset 8 as well as the RIFF header.
function sniffMime(buf) {
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length >= 6 && (buf.subarray(0, 6).toString("latin1") === "GIF87a" || buf.subarray(0, 6).toString("latin1") === "GIF89a")) return "image/gif";
  if (buf.length >= 12 && buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  return null;
}

// Is this a URL we're willing to store in User.image / ProductImage.url and later
// render into an <img src>?
//
// Two shapes are legitimate:
//   • "/uploads/…"  — a path our own upload routes returned in local development
//   • "https://…"   — Vercel Blob in production, and OAuth provider avatars
//                     (googleusercontent.com, fbcdn.net) written by the adapter
//
// Everything else is rejected. The profile form resubmits the current value in a
// hidden field, so an OAuth user's absolute avatar URL has to keep passing — the
// point is to exclude junk and non-network schemes like `javascript:` or `data:`,
// which previously sailed through as any 500-character string was accepted.
export function isSafeImageUrl(value) {
  if (typeof value !== "string") return false;
  const v = value.trim();
  if (!v || v.length > 500) return false;

  // Our own uploads. Reject "//host" (protocol-relative) and any "/../" escape.
  if (v.startsWith("/uploads/")) return !v.includes("..");

  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
}

// Validate an uploaded File against a route's policy.
//
//   allowed  — Set of permitted MIME types (a subset of EXT_BY_MIME's keys)
//   maxBytes — size cap for this route
//
// Returns { ok: true, buf, ext } or { ok: false, error, status } so the caller
// can respond without duplicating the message/status choices.
export async function validateImageUpload(file, { allowed, maxBytes }) {
  if (!file || typeof file === "string") {
    return { ok: false, error: "No file uploaded.", status: 400 };
  }
  if (!allowed.has(file.type)) {
    return { ok: false, error: `Unsupported file type: ${file.type}`, status: 415 };
  }
  if (file.size > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `File too large (max ${mb} MB).`, status: 413 };
  }

  const buf = Buffer.from(await file.arrayBuffer());

  // Re-check the size against the actual bytes: `file.size` is client-reported
  // metadata, so the cap above can be understated.
  if (buf.length > maxBytes) {
    const mb = Math.round(maxBytes / (1024 * 1024));
    return { ok: false, error: `File too large (max ${mb} MB).`, status: 413 };
  }

  // The declared type must match what the bytes actually are, and that sniffed
  // type must itself be allowed for this route.
  const sniffed = sniffMime(buf);
  if (!sniffed || sniffed !== file.type || !allowed.has(sniffed)) {
    return { ok: false, error: "That file is not a valid image.", status: 415 };
  }

  return { ok: true, buf, ext: EXT_BY_MIME[sniffed] };
}
