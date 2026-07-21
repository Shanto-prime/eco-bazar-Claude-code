// app/dashboard/settings/page.js — every signed-in role.
//
// Not role-gated beyond "signed in": this page edits only the caller's own
// account, so requireAuth (not requireRole) is the right gate. The individual
// server actions in _actions.js re-derive the user id from the session, so the
// page never passes an id the client could tamper with.
//
// Layout follows components/settings.html: an intro, a row of in-page section
// shortcuts, then the stacked section cards.

import { requireAuth } from "../../../lib/auth-helpers";
import { getT } from "../../../lib/i18n/server";
import { prisma } from "../../../lib/prisma";
import { canSelfApprove } from "../../../lib/profile-changes";
import AppearanceSettings from "./_components/AppearanceSettings";
import ProfileSettings from "./_components/ProfileSettings";
import ContactSettings from "./_components/ContactSettings";
import PasswordSettings from "./_components/PasswordSettings";
import AddressBook from "./_components/AddressBook";

export default async function DashboardSettings() {
  const { t } = await getT();
  const session = await requireAuth("/dashboard/settings");

  const [user, addresses, requests] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true, name: true, username: true, email: true, phone: true,
        image: true, emailVerified: true, passwordHash: true, role: true,
      },
    }),
    prisma.address.findMany({
      where:   { userId: session.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    // Enough history that the latest APPROVED row per field is present for the
    // "last changed" note even behind a run of pending/rejected rows.
    prisma.profileChangeRequest.findMany({
      where:   { userId: session.id },
      orderBy: { createdAt: "desc" },
      take:    25,
    }),
  ]);

  if (!user) {
    return <p className="text-sm text-gray-500">{t("settings.accountMissing")}</p>;
  }

  // Role from the DB, not the JWT — matches the authoritative check the contact
  // action makes, so the button labels never promise a fast-path the server
  // would then deny.
  const selfApprove = canSelfApprove(user.role);

  // "Last changed" note per field: the most recent APPROVED request for that
  // field (requests are ordered newest-first, so the first match is the
  // latest). `added` = the value was empty at request time, so it was set for
  // the first time rather than changed. Covers both admin self-approve and
  // admin-approved moderator/customer changes — both land as APPROVED rows.
  const lastChangedFor = (field) => {
    const r = requests.find((x) => x.field === field && x.status === "APPROVED");
    if (!r) return null;
    return { date: (r.reviewedAt || r.createdAt).toISOString(), added: !r.currentValue };
  };
  const lastChanged = { EMAIL: lastChangedFor("EMAIL"), PHONE: lastChangedFor("PHONE") };

  // The recent-requests list drops APPROVED rows (the change now shows as the
  // "last changed" note) and CANCELLED ones (the user withdrew them). Only
  // PENDING (still actionable — can be cancelled) and REJECTED (carries a note
  // the user needs to read) remain.
  const visibleRequests = requests.filter((r) => r.status === "PENDING" || r.status === "REJECTED");

  return (
    <div className="max-w-4xl">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight">{t("dashboard.settings")}</h1>
        <p className="mt-1.5 text-sm text-gray-500">{t("settings.subtitle")}</p>
      </header>

      <div className="space-y-6">
        <ProfileSettings
          initial={{ name: user.name || "", username: user.username || "", image: user.image || "" }}
        />
        <ContactSettings
          email={user.email}
          phone={user.phone || ""}
          emailVerified={!!user.emailVerified}
          canSelfApprove={selfApprove}
          lastChanged={lastChanged}
          requests={visibleRequests.map((r) => ({
            id: r.id, field: r.field, newValue: r.newValue, currentValue: r.currentValue,
            status: r.status, reviewNote: r.reviewNote,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
        {user.passwordHash ? <PasswordSettings /> : null}
        <AddressBook addresses={addresses.map((a) => ({ ...a, createdAt: null, updatedAt: null }))} />
        <AppearanceSettings />
      </div>

      <p className="mt-8 text-xs text-gray-400">
        {t("settings.signedInAs")} <span className="font-medium text-gray-600">{user.name || user.email}</span>
      </p>
    </div>
  );
}
