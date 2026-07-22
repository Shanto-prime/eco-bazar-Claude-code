// components/TopBar.jsx — site-wide top utility bar.
// On small screens, hide the location selector to save space.
//
// Server component: reads the NextAuth session so the right-hand links reflect
// auth state — Log In / Sign Up when signed out; the user avatar (which links
// to /dashboard and carries the greeting as a tooltip) + Log Out when signed
// in. (This opts the layout into dynamic rendering, which is expected for a
// session-aware navbar.)
//
// No language or currency picker here: the app is English-only, and the display
// currency is a store-wide setting the ADMIN controls in the dashboard, not a
// per-visitor choice.

import Link from "next/link";
import { auth, signOut } from "../auth";
import { getT } from "../lib/i18n/server";
import ThemeToggle from "./ThemeToggle";
import UserAvatar from "./UserAvatar";

export default async function TopBar() {
  const session = await auth();
  const user = session?.user || null;
  const { t } = await getT();

  return (
    <div className="topbar">
      <div className="max-w-[1320px] mx-auto px-4 sm:px-6 flex items-center justify-between">
        <div className="hidden sm:flex items-center gap-2">
          <i className="fa-solid fa-location-dot text-eco-green" />
          <span className="truncate">{t("topbar.storeLocation")}</span>
        </div>
        <div className="sm:hidden">
          <i className="fa-solid fa-location-dot text-eco-green mr-1" />
          <span>{t("topbar.cityShort")}</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <ThemeToggle />

          {user ? (
            <>
              {/* The avatar itself links to /dashboard — no separate button. */}
              <UserAvatar
                user={user}
                href="/dashboard"
                label={t("topbar.hi", { name: user.name || user.email })}
              />
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="hover:text-white">{t("topbar.logout")}</button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:text-white">{t("topbar.login")}</Link>
              <span>/</span>
              <Link href="/register" className="hover:text-white">{t("topbar.signup")}</Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
