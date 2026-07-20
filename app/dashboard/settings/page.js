// app/dashboard/settings/page.js — every signed-in role.
//
// Not role-gated beyond "signed in": this page edits only the caller's own
// account, so requireAuth (not requireRole) is the right gate. The individual
// server actions in _actions.js re-derive the user id from the session, so the
// page never passes an id the client could tamper with.

import { requireAuth } from "../../../lib/auth-helpers";
import { getT } from "../../../lib/i18n/server";
import { prisma } from "../../../lib/prisma";
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
        image: true, emailVerified: true, passwordHash: true,
      },
    }),
    prisma.address.findMany({
      where:   { userId: session.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    }),
    // Pending blocks a new request for the same field; the recent reviewed ones
    // are what tell the user *why* a change did not land.
    prisma.profileChangeRequest.findMany({
      where:   { userId: session.id },
      orderBy: { createdAt: "desc" },
      take:    10,
    }),
  ]);

  if (!user) {
    // Session outlived the row (deleted account). Nothing to render.
    return <p className="text-sm text-gray-500">{t("settings.accountMissing")}</p>;
  }

  return (
    <div>
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">{t("dashboard.settings")}</h1>
        <p className="text-sm text-gray-500 mt-1">{t("settings.subtitle")}</p>
      </header>

      <div className="space-y-5 max-w-3xl">
        <ProfileSettings
          initial={{ name: user.name || "", username: user.username || "", image: user.image || "" }}
        />
        <ContactSettings
          email={user.email}
          phone={user.phone || ""}
          emailVerified={!!user.emailVerified}
          // Dates don't survive the server→client boundary as Date objects in a
          // way the UI needs; send display-ready strings instead.
          requests={requests.map((r) => ({
            id: r.id, field: r.field, newValue: r.newValue, currentValue: r.currentValue,
            status: r.status, reviewNote: r.reviewNote,
            createdAt: r.createdAt.toISOString(),
          }))}
        />
        {/* OAuth-only accounts have no password to change. */}
        {user.passwordHash ? <PasswordSettings /> : null}
        <AddressBook addresses={addresses.map((a) => ({ ...a, createdAt: null, updatedAt: null }))} />
        <AppearanceSettings />
      </div>
    </div>
  );
}
