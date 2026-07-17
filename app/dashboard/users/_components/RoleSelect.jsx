"use client";

// app/dashboard/users/_components/RoleSelect.jsx
// Inline per-row role picker for the ADMIN users table. Optimistically updates
// the <select>, calls the server action, and rolls back + shows an error if the
// action rejects (e.g. "can't demote the last admin"). On success it
// router.refresh()es so the server-rendered table reflects the new value.
//
// Note: the *acting* admin's row is locked (isSelf) — self role changes are
// blocked server-side too. A user whose role is changed here picks up the new
// role on their next request within the JWT role TTL (see lib/auth.js), or
// immediately on their next sign-in.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { updateUserRoleAction } from "../_actions";

const ROLES = ["CUSTOMER", "MODERATOR", "ADMIN"];
const ROLE_LABEL_KEY = {
  CUSTOMER:  "dashboard.roleCustomer",
  MODERATOR: "dashboard.roleModerator",
  ADMIN:     "dashboard.roleAdmin",
};

const COLOR = {
  ADMIN:     "text-eco-green",
  MODERATOR: "text-blue-700",
  CUSTOMER:  "text-gray-700",
};

export default function RoleSelect({ userId, role, isSelf }) {
  const t = useT();
  const router = useRouter();
  const [value, setValue] = useState(role);
  const [error, setError] = useState(null);
  const [pending, startTransition] = useTransition();

  const onChange = (e) => {
    const next = e.target.value;
    const prev = value;
    setValue(next);
    setError(null);
    startTransition(async () => {
      const res = await updateUserRoleAction({ userId, role: next });
      if (!res?.ok) {
        setValue(prev);
        setError(res?.error || t("dashboard.roleUpdateFailed"));
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <select
        value={value}
        onChange={onChange}
        disabled={isSelf || pending}
        title={isSelf ? t("dashboard.cantChangeOwnRole") : undefined}
        className={`text-xs font-medium rounded-md border border-gray-200 bg-white px-2 py-1 disabled:opacity-60 disabled:cursor-not-allowed ${COLOR[value] || ""}`}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>{t(ROLE_LABEL_KEY[r])}</option>
        ))}
      </select>
      {error && <span className="text-xs text-red-600 max-w-[9rem]">{error}</span>}
    </div>
  );
}
