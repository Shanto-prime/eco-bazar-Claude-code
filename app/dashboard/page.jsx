// app/dashboard/page.jsx
// Server-side role router. Branches on session.user.role and renders a
// different overview component for each. The shared layout (sidebar + top
// bar) is provided by app/dashboard/layout.js.

import { redirect } from "next/navigation";
import { getCurrentUser } from "../../lib/auth-helpers";
import AdminDashboard from "./_components/AdminDashboard";
import ModeratorDashboard from "./_components/ModeratorDashboard";
import CustomerDashboard from "./_components/CustomerDashboard";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/unauthorized?next=/dashboard");

  if (user.role === "ADMIN")     return <AdminDashboard user={user} />;
  if (user.role === "MODERATOR") return <ModeratorDashboard user={user} />;
  return <CustomerDashboard user={user} />;
}
