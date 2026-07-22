// app/api/upload/banner/route.js
// Promo-banner image upload — ADMIN only. Banners are wide Canva-designed
// artwork, so this allows a larger file than the avatar route and writes to its
// own directory. Same hashed-filename convention as the product uploader.

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { auth } from "../../../../auth";

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB — full-width banner art
const ALLOWED   = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const UPLOAD_DIR        = process.env.BANNER_UPLOAD_DIR        || "./public/uploads/banners";
const UPLOAD_URL_PREFIX = process.env.BANNER_UPLOAD_URL_PREFIX || "/uploads/banners";

export async function POST(req) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof file === "string") {
    return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
  }
  if (!ALLOWED.has(file.type)) {
    return NextResponse.json({ error: `Unsupported file type: ${file.type}` }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 6 MB)." }, { status: 413 });
  }

  const ext  = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const buf  = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 16);
  const filename = `${Date.now()}-${hash}.${ext}`;

  const absDir = path.resolve(process.cwd(), UPLOAD_DIR);
  await mkdir(absDir, { recursive: true });
  await writeFile(path.join(absDir, filename), buf);

  return NextResponse.json({ ok: true, url: `${UPLOAD_URL_PREFIX}/${filename}` });
}
