// app/api/auth/verify/route.js
// Email verification landing endpoint. The link mailed at signup points here.
// Consuming a valid token stamps User.emailVerified. Verification is NOT
// enforced at login — it's an "extra confidence" signal only.

import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { consumeToken, appBaseUrl } from "../../../../lib/tokens";

export async function GET(req) {
  const token = new URL(req.url).searchParams.get("token");
  const res = await consumeToken("verify", token);

  if (!res) {
    return NextResponse.redirect(`${appBaseUrl()}/login?verify=invalid`);
  }

  // updateMany so a missing/already-verified row is a no-op, not an error.
  await prisma.user.updateMany({
    where: { email: res.email, emailVerified: null },
    data:  { emailVerified: new Date() },
  });

  return NextResponse.redirect(`${appBaseUrl()}/login?verify=ok`);
}
