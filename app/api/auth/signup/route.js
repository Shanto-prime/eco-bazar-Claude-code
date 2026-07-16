// app/api/auth/signup/route.js
// Credentials sign-up. Creates a User with a distinct `username` (login handle)
// and a real `email` (used for verification + password reset). Login later
// accepts either identifier + password.
//
// On success the client calls signIn("credentials", ...) to start a session.
// A best-effort verification email is sent (non-fatal, non-enforcing).

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { rateLimit, clientIp } from "../../../../lib/rate-limit";
import { promoteIfFirstUser } from "../../../../lib/user-service";
import { issueToken, appBaseUrl } from "../../../../lib/tokens";
import { sendMail } from "../../../../lib/mailer";

const Schema = z.object({
  name:     z.string().min(1).max(80),
  username: z.string().min(2).max(30).regex(/^[A-Za-z0-9_.-]+$/, "letters, digits, . _ - only").transform((s) => s.toLowerCase()),
  email:    z.string().max(120).email().transform((s) => s.trim().toLowerCase()),
  password: z.string().min(8).max(128),
  // Optional profile fields.
  phone:    z.string().max(30).optional().or(z.literal("").transform(() => undefined)),
  image:    z.string().url().max(500).optional().or(z.literal("").transform(() => undefined)),
});

export async function POST(req) {
  // Throttle account-creation spam per IP.
  const rl = rateLimit(`signup:${clientIp(req)}`, { limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) } },
    );
  }

  let data;
  try { data = Schema.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid input." }, { status: 400 }); }

  const existing = await prisma.user.findFirst({
    where:  { OR: [{ username: data.username }, { email: data.email }] },
    select: { username: true, email: true },
  });
  if (existing) {
    const which = existing.username === data.username ? "username" : "email";
    return NextResponse.json({ error: `An account with this ${which} already exists.` }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(data.password, 12);

  const user = await prisma.user.create({
    data:   { name: data.name, username: data.username, email: data.email, passwordHash, phone: data.phone ?? null, image: data.image ?? null },
    select: { id: true, username: true, email: true, role: true },
  });

  // First user in the system is promoted to ADMIN (single source of truth in
  // lib/user-service). No-op for every signup after the first.
  const promotedRole = await promoteIfFirstUser(user.id);

  // Best-effort email verification — never blocks signup or login.
  try {
    const token = await issueToken("verify", user.email);
    await sendMail({
      to:      user.email,
      subject: "Verify your Ecobazar email",
      text:    `Welcome to Ecobazar!\n\nConfirm your email address:\n${appBaseUrl()}/api/auth/verify?token=${token}\n\nThis link expires in 1 hour.`,
    });
  } catch { /* verification email is non-fatal */ }

  return NextResponse.json({ ok: true, user: { ...user, role: promotedRole || user.role } });
}
