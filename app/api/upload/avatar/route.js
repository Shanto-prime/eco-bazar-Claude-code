// app/api/upload/avatar/route.js
// Profile-picture upload. Writes to /public/uploads/avatars and returns { url }.
//
// Separate from /api/upload (products) on purpose   that route is ADMIN +
// MODERATOR only, and relaxing it so customers could set an avatar would also
// hand every customer the product-image endpoint. Different audience, different
// directory, different limits: this one is open to any signed-in user but caps
// files at 2 MB and rejects GIF (an animated avatar in the top bar is noise).

import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { validateImageUpload } from "../../../../lib/upload";
import { storeImage } from "../../../../lib/upload-store";
import { isDemoAccount, DEMO_BLOCK_MESSAGE } from "../../../../lib/demo-accounts";

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB   avatars render at 28px
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

const UPLOAD_DIR = process.env.AVATAR_UPLOAD_DIR || "./public/uploads/avatars";
const UPLOAD_URL_PREFIX =
    process.env.AVATAR_UPLOAD_URL_PREFIX || "/uploads/avatars";

export async function POST(req) {
    const session = await auth();
    if (!session?.user) {
        return NextResponse.json(
            { error: "Sign in required" },
            { status: 401 },
        );
    }
    if (isDemoAccount(session.user)) {
        return NextResponse.json({ error: DEMO_BLOCK_MESSAGE }, { status: 403 });
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

    // This route is open to every signed-in user, so the extension must come from
    // the validated MIME type rather than the client's filename   see lib/upload.js.
    const url = await storeImage(check.buf, {
        ext: check.ext,
        localDir: UPLOAD_DIR,
        urlPrefix: UPLOAD_URL_PREFIX,
        blobDir: "avatars",
    });

    return NextResponse.json({ ok: true, url });
}
