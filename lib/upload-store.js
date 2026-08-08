// lib/upload-store.js
// Where uploaded images actually get written. Two backends behind one function.
//
// WHY: Vercel's filesystem is read-only at runtime and wiped between deploys, so
// the original `writeFile("./public/uploads/…")` silently breaks in production —
// an admin adding a product image would get a 500, and anything that did land
// would vanish on the next deploy. On Vercel we upload to Blob storage instead.
//
// Locally there is no reason to need a Blob token just to run `npm run dev`, and
// writing to /public keeps the existing dev workflow (drop a file in, reload).
// So the backend is chosen by whether a Blob token is present:
//
//   BLOB_READ_WRITE_TOKEN set   → Vercel Blob, returns an absolute https URL
//   not set                     → public/uploads/…, returns a root-relative path
//
// Both return a URL string that goes straight into the DB. Existing rows holding
// "/uploads/…" paths keep working either way — those files are committed to the
// repo and served as static assets.
//
// NOTE: absolute Blob URLs are remote hosts as far as next/image is concerned, so
// next.config.mjs must allow the blob hostname in images.remotePatterns.

import "server-only";
import crypto from "crypto";

// Vercel injects this when a Blob store is linked to the project. Treating its
// presence (rather than NODE_ENV) as the switch means a production build run
// locally still writes to disk, and a preview deployment still uses Blob.
const hasBlob = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

// `<timestamp>-<sha1 of the bytes>.<ext>` — collision-resistant, and it hides the
// name the client sent. Unchanged from the original local-only implementation, so
// filenames stay consistent across both backends.
function buildFilename(buf, ext) {
  const hash = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 16);
  return `${Date.now()}-${hash}.${ext}`;
}

// Store one validated image (see validateImageUpload in lib/upload.js) and return
// its public URL.
//
//   buf       — the file bytes
//   ext       — extension derived from the VALIDATED mime type, never the filename
//   localDir  — filesystem dir for the dev backend  (e.g. "./public/uploads/avatars")
//   urlPrefix — url prefix for the dev backend      (e.g. "/uploads/avatars")
//   blobDir   — folder inside the Blob store        (e.g. "avatars")
export async function storeImage(buf, { ext, localDir, urlPrefix, blobDir }) {
  const filename = buildFilename(buf, ext);

  if (hasBlob()) {
    const { put } = await import("@vercel/blob");
    // addRandomSuffix:false keeps the filename we computed; it is already unique
    // by timestamp+hash, and a stable name makes the DB value predictable.
    const { url } = await put(`${blobDir}/${filename}`, buf, {
      access: "public",
      addRandomSuffix: false,
      contentType: mimeForExt(ext),
    });
    return url;
  }

  // Local development. Imported lazily so the Node fs/path modules are not part of
  // the serverless bundle in production, where this branch never runs.
  //
  // `turbopackIgnore` on the process.cwd() call: a filesystem path built from the
  // working directory makes Turbopack assume the whole project might be read at
  // runtime, so it traces every file into the deployed function bundle (it warns
  // "a file was traced that indicates that the whole project was traced
  // unintentionally"). The comment tells it not to follow this one — correct here,
  // because on Vercel this branch is unreachable.
  const { writeFile, mkdir } = await import("fs/promises");
  const path = await import("path");
  const absDir = path.resolve(/* turbopackIgnore: true */ process.cwd(), localDir);
  await mkdir(absDir, { recursive: true });
  await writeFile(path.join(absDir, filename), buf);
  return `${urlPrefix}/${filename}`;
}

// Blob stores the content type it is given; without it everything would be served
// as application/octet-stream and browsers would download rather than render.
function mimeForExt(ext) {
  switch (ext) {
    case "png":  return "image/png";
    case "webp": return "image/webp";
    case "gif":  return "image/gif";
    default:     return "image/jpeg";
  }
}
