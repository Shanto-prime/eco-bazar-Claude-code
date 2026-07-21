// lib/profile-changes.js
// Shared logic for applying an approved email/phone change and notifying the
// user. Used by BOTH paths that can approve a change:
//   • app/dashboard/settings/_actions.js  — self-service, when the requester is
//     a privileged user (ADMIN/MODERATOR) whose own change is auto-approved.
//   • app/dashboard/profile-requests/_actions.js — a moderator approving
//     somebody else's queued request.
// Keeping the write + notification here guarantees both routes behave
// identically (same emailVerified reset, same verification mail).
//
// Plain module — NOT "use server". It exports helpers, not server actions.

import { issueToken, appBaseUrl } from "./tokens";
import { sendMail } from "./mailer";

// Roles allowed to review profile-change requests. A user with one of these
// roles never needs review for their OWN change — they could just approve it
// themselves — so the settings action applies it immediately instead of
// queueing it. Single source of truth for that rule.
export const SELF_APPROVE_ROLES = ["ADMIN", "MODERATOR"];
export const canSelfApprove = (role) => SELF_APPROVE_ROLES.includes(role);

// Writes the new value onto the User row inside the CALLER's transaction (so it
// commits atomically with the request-status + audit rows). EMAIL additionally
// clears emailVerified: approval confirms the change is legitimate, but only the
// mailbox can confirm the address works, so it must be re-verified.
export async function applyContactChange(tx, field, userId, newValue) {
  if (field === "EMAIL") {
    await tx.user.update({
      where: { id: userId },
      data:  { email: newValue, emailVerified: null },
    });
  } else {
    await tx.user.update({
      where: { id: userId },
      data:  { phone: newValue },
    });
  }
}

// Best-effort notifications, sent AFTER the change is committed. Never throws
// into the caller — a mail transport hiccup must not roll back a committed
// change. For an email change it mails the NEW address a verification link and
// the OLD address a heads-up (the only channel that still reaches the real
// owner if the change was not theirs).
export async function notifyContactChange({ field, newValue, previousEmail }) {
  try {
    if (field === "EMAIL") {
      const token = await issueToken("verify", newValue);
      await sendMail({
        to:      newValue,
        subject: "Confirm your new Ecobazar email",
        text:    `Your Ecobazar email was changed to this address.\n\nConfirm it to finish:\n${appBaseUrl()}/api/auth/verify?token=${token}\n\nThis link expires in 1 hour.`,
      });
      if (previousEmail && previousEmail.toLowerCase() !== newValue.toLowerCase()) {
        await sendMail({
          to:      previousEmail,
          subject: "Your Ecobazar email address was changed",
          text:    `The email on your Ecobazar account was changed to ${newValue}.\n\nIf this was not you, contact support immediately.`,
        });
      }
    } else if (previousEmail) {
      await sendMail({
        to:      previousEmail,
        subject: "Your Ecobazar phone number was updated",
        text:    `The phone number on your Ecobazar account is now ${newValue}.\n\nIf this was not you, contact support immediately.`,
      });
    }
  } catch { /* notification is non-fatal */ }
}
