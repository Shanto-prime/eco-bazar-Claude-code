// app/api/upload/banner/route.js
// Promo-banner image upload   ADMIN only. Banners are wide Canva-designed
// artwork, so this allows a larger file than the avatar route and writes to its
// own directory. Same hashed-filename convention as the product uploader.

import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { validateImageUpload } from "../../../../lib/upload";
import { storeImage } from "../../../../lib/upload-store";

const MAX_BYTES = 6 * 1024 * 1024; // 6 MB   full-width banner art
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

const UPLOAD_DIR = process.env.BANNER_UPLOAD_DIR || "./public/uploads/banners";
const UPLOAD_URL_PREFIX =
    process.env.BANNER_UPLOAD_URL_PREFIX || "/uploads/banners";

export async function POST(req) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json(
            { error: "Sign in required" },
            { status: 401 },
        );
    }
    if (session.user.role !== "ADMIN") {
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

    // Extension from the validated MIME type, not the client's filename   see
    // lib/upload.js.
    const url = await storeImage(check.buf, {
        ext: check.ext,
        localDir: UPLOAD_DIR,
        urlPrefix: UPLOAD_URL_PREFIX,
        blobDir: "banners",
    });

    return NextResponse.json({ ok: true, url });
}
