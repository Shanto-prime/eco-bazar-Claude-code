// lib/mailer.js
// Pluggable mail transport.
//
// DEFAULT (dev) transport just logs the message — including any action link —
// to the server console, so verification / password-reset flows are fully
// testable with no email provider configured. Everything that sends mail calls
// `sendMail`; to go to production, replace the body below with a real provider
// (Resend, nodemailer/SMTP, SES) — no call sites change.

export async function sendMail({ to, subject, text }) {
  console.log("\n[mailer] ─────────────────────────────────────────");
  console.log(`[mailer] To:      ${to}`);
  console.log(`[mailer] Subject: ${subject}`);
  console.log(`[mailer]`);
  for (const line of String(text).split("\n")) console.log(`[mailer] ${line}`);
  console.log("[mailer] ─────────────────────────────────────────\n");
  return { ok: true };
}
