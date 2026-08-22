"use client";

// app/dashboard/users/_components/DeleteUserButton.jsx
// Per-row delete for the ADMIN users table. Confirms, calls deleteUserAction,
// shows an error on rejection (super admin / self / last admin are blocked
// server-side too). Hidden entirely for the super admin and the acting admin.

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { deleteUserAction } from "../_actions";

export default function DeleteUserButton({
    userId,
    label,
    disabled = false,
    reason,
}) {
    const t = useT();
    const router = useRouter();
    const [error, setError] = useState(null);
    const [pending, startTransition] = useTransition();

    if (disabled) {
        return (
            <span className="text-xs text-gray-300" title={reason}>
                {" "}
            </span>
        );
    }

    const onDelete = () => {
        if (!confirm(t("dashboard.confirmDeleteUser", { label }))) return;
        setError(null);
        startTransition(async () => {
            const res = await deleteUserAction({ userId });
            if (!res?.ok) {
                setError(res?.error || t("dashboard.userDeleteFailed"));
                return;
            }
            router.refresh();
        });
    };

    return (
        <div className="flex flex-col gap-1">
            <button
                type="button"
                onClick={onDelete}
                disabled={pending}
                className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
            >
                {pending ? t("dashboard.deleting") : t("dashboard.delete")}
            </button>
            {error && (
                <span className="text-xs text-red-600 max-w-[9rem]">
                    {error}
                </span>
            )}
        </div>
    );
}
