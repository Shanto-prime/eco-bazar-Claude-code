// app/api/upload/route.js
// Image upload endpoint. Writes files to /public/uploads/products with a
// hashed filename, returns { url }. Only signed-in moderators/admins can
// upload.

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { auth } from "../../../auth";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED   = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const UPLOAD_DIR        = process.env.UPLOAD_DIR        || "./public/uploads/products";
const UPLOAD_URL_PREFIX = process.env.UPLOAD_URL_PREFIX || "/uploads/products";

export async function POST(req) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const role = session.user.role;
  if (role !== "ADMIN" && role !== "MODERATOR") {
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
    return NextResponse.json({ error: "File too large (max 4 MB)." }, { status: 413 });
  }

  // Hashed name to avoid collisions and hide the original filename.
  const ext  = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const buf  = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 16);
  const filename = `${Date.now()}-${hash}.${ext}`;

  const absDir = path.resolve(process.cwd(), UPLOAD_DIR);
  await mkdir(absDir, { recursive: true });
  await writeFile(path.join(absDir, filename), buf);

  const url = `${UPLOAD_URL_PREFIX}/${filename}`;
  return NextResponse.json({ ok: true, url });
}
