// app/api/upload/route.js
// Product-image upload endpoint, returns { url }. ADMIN + MODERATOR only.
//
// Storage backend is chosen in lib/upload-store.js: Vercel Blob in production,
// public/uploads/products in local development.

import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { validateImageUpload } from "../../../lib/upload";
import { storeImage } from "../../../lib/upload-store";

const MAX_BYTES = 4 * 1024 * 1024; // 4 MB
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./public/uploads/products";
const UPLOAD_URL_PREFIX = process.env.UPLOAD_URL_PREFIX || "/uploads/products";

export async function POST(req) {
    const session = await auth();
    if (!session?.user)
        return NextResponse.json(
            { error: "Sign in required" },
            { status: 401 },
        );
    const role = session.user.role;
    if (role !== "ADMIN" && role !== "MODERATOR") {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const form = await req.formData();
    const check = await validateImageUpload(form.get("file"), {
        allowed: ALLOWED,
        maxBytes: MAX_BYTES,
    });
    if (!check.ok) {
        return NextResponse.json(
            { error: check.error },
            { status: check.status },
        );
    }

    // `ext` comes from the validated MIME type, never from the client's filename
    //   see lib/upload.js for why that matters.
    const url = await storeImage(check.buf, {
        ext: check.ext,
        localDir: UPLOAD_DIR,
        urlPrefix: UPLOAD_URL_PREFIX,
        blobDir: "products",
    });

    return NextResponse.json({ ok: true, url });
}
