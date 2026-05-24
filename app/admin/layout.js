// app/admin/layout.js
// Root layout for ALL /admin/* pages.
//
// Note: this is a nested layout under the root app/layout.js, so the public
// site chrome (TopBar/Header/Nav/Footer) renders behind us. We want a fully
// separate admin chrome, so we put the chrome here and rely on the root
// layout's <main className="flex-1">. The admin chrome (sidebar + topbar)
// only appears when a session exists — the /admin/login page renders without
// it.

import { headers } from "next/headers";
import { auth } from "../../auth";
import AdminShell from "./AdminShell";

export const metadata = { title: "Admin — Ecobazar" };

export default async function AdminLayout({ children }) {
  const session = await auth();
  const headersList = await headers();
  const pathname = headersList.get("x-invoke-path") || "";
  const onLogin = pathname.endsWith("/admin/login");

  // Login page renders standalone (no sidebar).
  if (!session || onLogin) {
    return <div className="min-h-screen bg-eco-bg">{children}</div>;
  }

  return <AdminShell user={session.user}>{children}</AdminShell>;
}
