// app/api/auth/forgot-password/route.js
// Accepts a username OR email, and if it maps to an account with an email,
// mails a password-reset link. ALWAYS responds { ok: true } — never reveals
// whether the account exists (anti-enumeration), including when rate-limited.

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { rateLimit, clientIp } from "../../../../lib/rate-limit";
import { issueToken, appBaseUrl } from "../../../../lib/tokens";
import { sendMail } from "../../../../lib/mailer";

const Schema = z.object({ identifier: z.string().min(1).max(120) });

export async function POST(req) {
  const rl = rateLimit(`forgot:${clientIp(req)}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) return NextResponse.json({ ok: true });

  let data;
  try { data = Schema.parse(await req.json()); }
  catch { return NextResponse.json({ ok: true }); }

  const id = data.identifier.trim().toLowerCase();
  const user = await prisma.user.findFirst({
    where:  { OR: [{ username: id }, { email: id }] },
    select: { email: true },
  });

  if (user?.email && user.email.includes("@")) {
    const token = await issueToken("reset", user.email);
    await sendMail({
      to:      user.email,
      subject: "Reset your Ecobazar password",
      text:    `Reset your password:\n${appBaseUrl()}/reset-password?token=${token}\n\nThis link expires in 1 hour. If you didn't request this, you can ignore this email.`,
    });
  }

  return NextResponse.json({ ok: true });
}
