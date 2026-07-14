// app/api/auth/signup/route.js
// Credentials sign-up. Hashes the password with bcrypt and creates the User
// row. The `username` field doubles as the unique login identifier stored
// in `User.email` (which is just a unique String — emails or bare usernames
// both work).
//
// On success the client calls signIn("credentials", ...) to start a session.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { rateLimit, clientIp } from "../../../../lib/rate-limit";

const Schema = z.object({
  name:     z.string().min(1).max(80),
  username: z.string().min(2).max(80).transform((s) => s.trim().toLowerCase()),
  password: z.string().min(8).max(128),
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

  const existing = await prisma.user.findUnique({ where: { email: data.username } });
  if (existing) return NextResponse.json({ error: "An account with this username already exists." }, { status: 409 });

  const passwordHash = await bcrypt.hash(data.password, 12);

  // First user gets ADMIN role so a fresh install has a privileged account.
  const count = await prisma.user.count();
  const role  = count === 0 ? "ADMIN" : "CUSTOMER";

  const user = await prisma.user.create({
    data:   { name: data.name, email: data.username, passwordHash, role },
    select: { id: true, email: true, role: true },
  });

  return NextResponse.json({ ok: true, user });
}
