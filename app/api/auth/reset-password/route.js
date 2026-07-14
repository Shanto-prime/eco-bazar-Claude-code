// app/api/auth/reset-password/route.js
// Completes a password reset: validates the one-time token, sets a new bcrypt
// hash (cost 12), and writes an AuditLog row. Rate-limited per IP.

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../../../../lib/prisma";
import { rateLimit, clientIp } from "../../../../lib/rate-limit";
import { consumeToken } from "../../../../lib/tokens";

const Schema = z.object({
  token:    z.string().min(1),
  password: z.string().min(8).max(128),
});

export async function POST(req) {
  const rl = rateLimit(`reset:${clientIp(req)}`, { limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Please try again later." }, { status: 429 });
  }

  let data;
  try { data = Schema.parse(await req.json()); }
  catch { return NextResponse.json({ error: "Invalid input." }, { status: 400 }); }

  const res = await consumeToken("reset", data.token);
  if (!res) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: res.email }, select: { id: true } });
  if (!user) {
    return NextResponse.json({ error: "This reset link is invalid or has expired." }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(data.password, 12);
  await prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: user.id }, data: { passwordHash } });
    await tx.auditLog.create({
      data: { actorId: user.id, action: "user.password.reset", entity: "User", entityId: user.id, metadata: {} },
    });
  });

  return NextResponse.json({ ok: true });
}
