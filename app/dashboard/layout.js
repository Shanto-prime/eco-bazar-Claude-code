// app/dashboard/layout.js
// Shared chrome for every /dashboard/* route.
// Renders the sidebar (drawer on mobile, persistent on desktop) and a tiny
// top bar with the signed-in user + sign-out button. Reuses the public site
// header/footer from the root layout.

import { requireAuth } from "../../lib/auth-helpers";
import DashboardShell from "./_components/DashboardShell";

export const metadata = { title: "Dashboard — Ecobazar" };

export default async function DashboardLayout({ children }) {
  // Defence-in-depth: middleware already redirects anonymous users, but if
  // someone disables it, requireAuth still catches the request.
  const user = await requireAuth();
  return <DashboardShell user={user}>{children}</DashboardShell>;
}
