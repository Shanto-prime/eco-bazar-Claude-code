// app/api/upload/route.js
// Image upload endpoint. Writes files to /public/uploads/products with a
// hashed filename, returns { url }. Only signed-in moderators/admins can
// upload.

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import crypto from "crypto";
import { auth } from "../../../auth";
import { validateImageUpload } from "../../../lib/upload";

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
  const check = await validateImageUpload(form.get("file"), { allowed: ALLOWED, maxBytes: MAX_BYTES });
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  // Hashed name to avoid collisions and hide the original filename. The
  // extension comes from the validated MIME type, never from the client's
  // filename — see lib/upload.js.
  const { buf, ext } = check;
  const hash = crypto.createHash("sha1").update(buf).digest("hex").slice(0, 16);
  const filename = `${Date.now()}-${hash}.${ext}`;

  const absDir = path.resolve(process.cwd(), UPLOAD_DIR);
  await mkdir(absDir, { recursive: true });
  await writeFile(path.join(absDir, filename), buf);

  const url = `${UPLOAD_URL_PREFIX}/${filename}`;
  return NextResponse.json({ ok: true, url });
}
