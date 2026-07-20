// app/api/upload/avatar/route.js
// Profile-picture upload. Writes to /public/uploads/avatars and returns { url }.
//
// Separate from /api/upload (products) on purpose — that route is ADMIN +
// MODERATOR only, and relaxing it so customers could set an avatar would also
// hand every customer the product-image endpoint. Different audience, different
// directory, different limits: this one is open to any signed-in user but caps
// files at 2 MB and rejects GIF (an animated avatar in the top bar is noise).

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { auth } from "../../../../auth";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB — avatars render at 28px
const ALLOWED   = new Set(["image/jpeg", "image/png", "image/webp"]);

const UPLOAD_DIR        = process.env.AVATAR_UPLOAD_DIR        || "./public/uploads/avatars";
const UPLOAD_URL_PREFIX = process.env.AVATAR_UPLOAD_URL_PREFIX || "/uploads/avatars";

export async function POST(req) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
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
    return NextResponse.json({ error: "File too large (max 2 MB)." }, { status: 413 });
  }

  // Hashed name, same convention as the product uploader.
  const ext  = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const buf  = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 16);
  const filename = `${Date.now()}-${hash}.${ext}`;

  const absDir = path.resolve(process.cwd(), UPLOAD_DIR);
  await mkdir(absDir, { recursive: true });
  await writeFile(path.join(absDir, filename), buf);

  return NextResponse.json({ ok: true, url: `${UPLOAD_URL_PREFIX}/${filename}` });
}
