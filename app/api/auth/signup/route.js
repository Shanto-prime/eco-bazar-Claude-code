// app/api/auth/signup/route.js
// Email + password sign-up endpoint. Hashes the password with bcrypt and
// creates the User row. Returns 200 on success; the client then calls
// signIn("credentials", ...) to start a session.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";

const Schema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email().transform((s) => s.toLowerCase()),
  password: z.string().min(8).max(128),
});

export async function POST(req) {
  let data;
  try { data = Schema.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid input." }, { status: 400 }); }

  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });

  const passwordHash = await bcrypt.hash(data.password, 10);

  // First user gets ADMIN role so you have a way in to admin.* the first
  // time. Subsequent users default to CUSTOMER.
  const count = await prisma.user.count();
  const role = count === 0 ? "ADMIN" : "CUSTOMER";

  const user = await prisma.user.create({
    data: { name: data.name, email: data.email, passwordHash, role },
    select: { id: true, email: true, role: true },
  });

  return NextResponse.json({ ok: true, user });
}
