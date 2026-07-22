"use server";

// app/dashboard/settings/_actions.js — server actions for a user editing their
// OWN account. Every action re-derives the user id from the session
// (requireAuth) and never accepts one from the client, so there is no parameter
// a caller could tamper with to edit somebody else's record.
//
// Two tiers of change:
//   • name / username / image / password / addresses → applied immediately.
//   • email / phone                                  → ProfileChangeRequest,
//     reviewed in /dashboard/profile-requests. See prisma/schema.prisma for why.
//
// Audit: profile writes are self-service, not privileged, so they are not
// "every privileged write must log" cases — but email/phone are recovery
// channels and password is a credential, so those three DO write AuditLog rows
// (actor == subject). Address CRUD and name/avatar edits do not.

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/prisma";
import { requireAuth, requireRole } from "../../../lib/auth-helpers";
import { COUNTRIES, STATES } from "../../../lib/geo";
import { canSelfApprove, applyContactChange, notifyContactChange } from "../../../lib/profile-changes";
import { CURRENCY_CODES, BASE_CURRENCY, isValidCurrency } from "../../../lib/currency";
import { saveStoreConfig, getStoreConfig } from "../../../lib/store-config";

// Actions return {ok,message} / {error} rather than throwing, so the client
// components can render an inline result instead of tripping an error boundary.
const ok   = (message) => ({ ok: true, message });
const fail = (error)   => ({ ok: false, error });

// ---------------------------------------------------------------------------
// Profile — name, username, avatar. Applied immediately.
// ---------------------------------------------------------------------------
const ProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  // Same shape the login identifier is normalised to in lib/auth.js authorize()
  // (trimmed + lowercased) — a username with capitals would simply never match
  // at sign-in.
  username: z.string().trim().toLowerCase()
    .min(3, "Username must be at least 3 characters.")
    .max(32)
    .regex(/^[a-z0-9._-]+$/, "Use lowercase letters, digits, dot, underscore or dash.")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  image: z.string().max(500).optional().or(z.literal("").transform(() => undefined)),
});

export async function updateProfileAction(formData) {
  const session = await requireAuth("/dashboard/settings");

  let data;
  try {
    data = ProfileSchema.parse({
      name:     formData.get("name"),
      username: formData.get("username") || undefined,
      image:    formData.get("image") || undefined,
    });
  } catch (e) {
    return fail(e.issues?.[0]?.message || "Invalid input.");
  }

  // username is @unique in the schema, so a clash would surface as an opaque
  // P2002. Check first to return something the user can act on.
  if (data.username) {
    const clash = await prisma.user.findFirst({
      where:  { username: data.username, NOT: { id: session.id } },
      select: { id: true },
    });
    if (clash) return fail(`Username "${data.username}" is already taken.`);
  }

  await prisma.user.update({
    where: { id: session.id },
    data: {
      name:     data.name,
      username: data.username ?? null,
      image:    data.image ?? null,
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/", "layout"); // top-bar avatar + greeting live in the root layout
  return ok("Profile updated.");
}

// ---------------------------------------------------------------------------
// Email / phone — reviewed before they take effect.
// ---------------------------------------------------------------------------
const ContactSchema = z.object({
  field: z.enum(["EMAIL", "PHONE"]),
  value: z.string().trim().min(1, "Value is required.").max(200),
});

export async function requestContactChangeAction(formData) {
  const session = await requireAuth("/dashboard/settings");

  let data;
  try {
    data = ContactSchema.parse({
      field: formData.get("field"),
      value: formData.get("value"),
    });
  } catch (e) {
    return fail(e.issues?.[0]?.message || "Invalid input.");
  }

  const value = data.field === "EMAIL" ? data.value.toLowerCase() : data.value;

  if (data.field === "EMAIL") {
    if (!/^\S+@\S+\.\S+$/.test(value)) return fail("Enter a valid email address.");
  } else if (value.replace(/\D/g, "").length < 7) {
    return fail("Enter a valid phone number.");
  }

  // Read role from the DB, not the session — a self-approve must not ride on a
  // possibly-stale JWT role. This is the authoritative check.
  const me = await prisma.user.findUnique({
    where:  { id: session.id },
    select: { email: true, phone: true, role: true },
  });
  if (!me) return fail("Account not found.");

  const current = data.field === "EMAIL" ? me.email : me.phone;
  if (current && current.toLowerCase() === value.toLowerCase()) {
    return fail("That is already your current value.");
  }

  // Reject a duplicate email up front rather than at approval time — otherwise
  // the request sits in the queue only for the reviewer to hit the unique index.
  // Not a leak: signup already reveals whether an email is registered.
  if (data.field === "EMAIL") {
    const taken = await prisma.user.findFirst({
      where:  { email: value, NOT: { id: session.id } },
      select: { id: true },
    });
    if (taken) return fail("That email is already used by another account.");
  }

  const pending = await prisma.profileChangeRequest.findFirst({
    where: { userId: session.id, field: data.field, status: "PENDING" },
  });
  if (pending) {
    return fail("You already have a pending request for this field. Cancel it first.");
  }

  // ADMIN / MODERATOR change their own contact details with no review — they
  // are exactly the people who would otherwise approve the request, so routing
  // it through the queue would just be them approving themselves. The change is
  // applied immediately and logged as self-approved (auditable, not silent).
  if (canSelfApprove(me.role)) {
    await prisma.$transaction(async (tx) => {
      await applyContactChange(tx, data.field, session.id, value);
      // Recorded as an already-APPROVED request so it still shows in the user's
      // history and the reviewer is on record as themselves.
      await tx.profileChangeRequest.create({
        data: {
          userId:       session.id,
          field:        data.field,
          currentValue: current ?? null,
          newValue:     value,
          status:       "APPROVED",
          reviewerId:   session.id,
          reviewedAt:   new Date(),
          reviewNote:   "Self-approved (privileged role).",
        },
      });
      await tx.auditLog.create({
        data: {
          actorId:  session.id,
          action:   "profile.change_self_approved",
          entity:   "User",
          entityId: session.id,
          metadata: { field: data.field, from: current ?? null, to: value, role: me.role },
        },
      });
    });

    await notifyContactChange({
      field:        data.field,
      newValue:     value,
      previousEmail: me.email,
    });

    revalidatePath("/dashboard/settings");
    revalidatePath("/", "layout"); // email/name feed the top-bar session
    return ok(
      data.field === "EMAIL"
        ? "Email updated. Check the new address for a verification link."
        : "Phone number updated.",
    );
  }

  // Everyone else: queue it for review.
  await prisma.profileChangeRequest.create({
    data: {
      userId:       session.id,
      field:        data.field,
      currentValue: current ?? null,
      newValue:     value,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId:  session.id,
      action:   "profile.change_requested",
      entity:   "User",
      entityId: session.id,
      metadata: { field: data.field, from: current ?? null, to: value },
    },
  });

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/profile-requests");
  return ok("Request submitted for review.");
}

export async function cancelContactChangeAction(requestId) {
  const session = await requireAuth("/dashboard/settings");

  // Scope the update by userId as well as id: a guessed request id from another
  // account matches zero rows instead of cancelling someone else's request.
  const res = await prisma.profileChangeRequest.updateMany({
    where: { id: String(requestId), userId: session.id, status: "PENDING" },
    data:  { status: "CANCELLED", reviewedAt: new Date() },
  });
  if (res.count === 0) return fail("Request not found or already reviewed.");

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard/profile-requests");
  return ok("Request cancelled.");
}

// ---------------------------------------------------------------------------
// Password
// ---------------------------------------------------------------------------
const PasswordSchema = z.object({
  currentPassword: z.string().min(1, "Enter your current password."),
  newPassword:     z.string().min(8, "New password must be at least 8 characters.").max(200),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "New passwords do not match.",
  path:    ["confirmPassword"],
});

export async function changePasswordAction(formData) {
  const session = await requireAuth("/dashboard/settings");

  let data;
  try {
    data = PasswordSchema.parse({
      currentPassword: formData.get("currentPassword"),
      newPassword:     formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
    });
  } catch (e) {
    return fail(e.issues?.[0]?.message || "Invalid input.");
  }

  const me = await prisma.user.findUnique({
    where:  { id: session.id },
    select: { passwordHash: true },
  });

  // OAuth-only accounts have no passwordHash — there is nothing to change, and
  // setting one here would silently create a second way into the account.
  if (!me?.passwordHash) {
    return fail("This account signs in with Google/Facebook and has no password.");
  }

  const matches = await bcrypt.compare(data.currentPassword, me.passwordHash);
  if (!matches) return fail("Current password is incorrect.");

  await prisma.user.update({
    where: { id: session.id },
    data:  { passwordHash: await bcrypt.hash(data.newPassword, 10) },
  });

  await prisma.auditLog.create({
    data: {
      actorId:  session.id,
      action:   "profile.password_changed",
      entity:   "User",
      entityId: session.id,
    },
  });

  return ok("Password changed.");
}

// ---------------------------------------------------------------------------
// Address book
// ---------------------------------------------------------------------------
const AddressSchema = z.object({
  label:     z.string().trim().max(40).optional().or(z.literal("").transform(() => undefined)),
  firstName: z.string().trim().min(1, "First name is required.").max(80),
  lastName:  z.string().trim().min(1, "Last name is required.").max(80),
  company:   z.string().trim().max(120).optional().or(z.literal("").transform(() => undefined)),
  street:    z.string().trim().min(1, "Street address is required.").max(200),
  city:      z.string().trim().max(80).optional().or(z.literal("").transform(() => undefined)),
  // Constrained to the shared option sets so a saved address always prefills
  // checkout's <select>s cleanly — see lib/geo.js.
  state:     z.enum(STATES).optional().or(z.literal("").transform(() => undefined)),
  country:   z.enum(COUNTRIES).optional().or(z.literal("").transform(() => undefined)),
  zip:       z.string().trim().max(20).optional().or(z.literal("").transform(() => undefined)),
  phone:     z.string().trim().max(40).optional().or(z.literal("").transform(() => undefined)),
  isDefault: z.coerce.boolean().optional().default(false),
});

function parseAddress(formData) {
  return AddressSchema.parse({
    label:     formData.get("label")     || undefined,
    firstName: formData.get("firstName"),
    lastName:  formData.get("lastName"),
    company:   formData.get("company")   || undefined,
    street:    formData.get("street"),
    city:      formData.get("city")      || undefined,
    state:     formData.get("state")     || undefined,
    country:   formData.get("country")   || undefined,
    zip:       formData.get("zip")       || undefined,
    phone:     formData.get("phone")     || undefined,
    isDefault: formData.get("isDefault") === "on" || formData.get("isDefault") === "true",
  });
}

// Address.isDefault has no DB-level "only one true" constraint (Mongo), so
// every write that can set it clears the flag on the user's other rows first.
async function clearOtherDefaults(tx, userId, exceptId = null) {
  await tx.address.updateMany({
    where: { userId, isDefault: true, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
    data:  { isDefault: false },
  });
}

export async function createAddressAction(formData) {
  const session = await requireAuth("/dashboard/settings");

  let data;
  try {
    data = parseAddress(formData);
  } catch (e) {
    return fail(e.issues?.[0]?.message || "Invalid address.");
  }

  const count = await prisma.address.count({ where: { userId: session.id } });
  if (count >= 20) return fail("You can save at most 20 addresses.");
  // First address is always the default — otherwise a user with exactly one
  // saved address would get no checkout prefill at all.
  const makeDefault = data.isDefault || count === 0;

  await prisma.$transaction(async (tx) => {
    if (makeDefault) await clearOtherDefaults(tx, session.id);
    await tx.address.create({
      data: { ...data, isDefault: makeDefault, userId: session.id },
    });
  });

  revalidatePath("/dashboard/settings");
  return ok("Address added.");
}

export async function updateAddressAction(addressId, formData) {
  const session = await requireAuth("/dashboard/settings");

  let data;
  try {
    data = parseAddress(formData);
  } catch (e) {
    return fail(e.issues?.[0]?.message || "Invalid address.");
  }

  const existing = await prisma.address.findFirst({
    where:  { id: String(addressId), userId: session.id },
    select: { id: true, isDefault: true },
  });
  if (!existing) return fail("Address not found.");

  // Un-ticking "default" on the only default would leave the user with none, so
  // the flag can be set here but only cleared by promoting a different address.
  const makeDefault = data.isDefault || existing.isDefault;

  await prisma.$transaction(async (tx) => {
    if (makeDefault) await clearOtherDefaults(tx, session.id, existing.id);
    await tx.address.update({
      where: { id: existing.id },
      data:  { ...data, isDefault: makeDefault },
    });
  });

  revalidatePath("/dashboard/settings");
  return ok("Address updated.");
}

export async function deleteAddressAction(addressId) {
  const session = await requireAuth("/dashboard/settings");

  const existing = await prisma.address.findFirst({
    where:  { id: String(addressId), userId: session.id },
    select: { id: true, isDefault: true },
  });
  if (!existing) return fail("Address not found.");

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: existing.id } });
    // Deleting the default promotes the next-newest, so the user is never left
    // with addresses but no default (which would silently kill the prefill).
    if (existing.isDefault) {
      const next = await tx.address.findFirst({
        where:   { userId: session.id },
        orderBy: { createdAt: "desc" },
        select:  { id: true },
      });
      if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }
  });

  revalidatePath("/dashboard/settings");
  return ok("Address deleted.");
}

export async function setDefaultAddressAction(addressId) {
  const session = await requireAuth("/dashboard/settings");

  const existing = await prisma.address.findFirst({
    where:  { id: String(addressId), userId: session.id },
    select: { id: true },
  });
  if (!existing) return fail("Address not found.");

  await prisma.$transaction(async (tx) => {
    await clearOtherDefaults(tx, session.id, existing.id);
    await tx.address.update({ where: { id: existing.id }, data: { isDefault: true } });
  });

  revalidatePath("/dashboard/settings");
  return ok("Default address updated.");
}

// ---------------------------------------------------------------------------
// Store currency — ADMIN only, store-wide. Not a personal preference: this sets
// the display currency + exchange rates for EVERY visitor. Rates are "BASE (BDT)
// per 1 unit" of each non-base currency. Logged, since it changes what every
// price on the site reads.
// ---------------------------------------------------------------------------
export async function updateStoreCurrencyAction(formData) {
  const admin = await requireRole("ADMIN", "/dashboard/settings");

  const currency = String(formData.get("currency") || "").toUpperCase();
  if (!isValidCurrency(currency)) return fail("Unknown currency.");

  // Collect a rate for every non-base currency. Each must be a positive number —
  // a zero or negative rate would divide prices to nonsense (or NaN).
  const rates = {};
  for (const code of CURRENCY_CODES) {
    if (code === BASE_CURRENCY) continue;
    const raw = Number(formData.get(`rate_${code}`));
    if (!Number.isFinite(raw) || raw <= 0) {
      return fail(`Enter a valid exchange rate for ${code} (BDT per 1 ${code}).`);
    }
    rates[code] = raw;
  }

  const before = await getStoreConfig();
  await saveStoreConfig({ currency, rates });

  await prisma.auditLog.create({
    data: {
      actorId:  admin.id,
      action:   "store.currency.update",
      entity:   "StoreConfig",
      entityId: "store",
      metadata: { from: before.currency, to: currency, rates },
    },
  });

  // Prices render everywhere — revalidate the whole app so the new currency and
  // rates take effect immediately, on the storefront and the dashboard alike.
  revalidatePath("/", "layout");
  return ok(`Store currency set to ${currency}.`);
}
