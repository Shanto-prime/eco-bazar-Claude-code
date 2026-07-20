"use client";

// Email + phone. Neither is written directly — submitting raises a
// ProfileChangeRequest that ADMIN/MODERATOR reviews at
// /dashboard/profile-requests. The current value stays live until approval, so
// this form shows "current" and "pending" as distinct states rather than
// optimistically rendering the new value.

import { useState, useTransition } from "react";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { requestContactChangeAction, cancelContactChangeAction } from "../_actions";
import { Card, Field, Notice, SubmitButton } from "./ui";

const STATUS_STYLE = {
  PENDING:   "bg-amber-100 text-amber-700",
  APPROVED:  "bg-emerald-100 text-emerald-700",
  REJECTED:  "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

function ChangeRow({ req, onCancel, busy, t }) {
  return (
    <li className="flex flex-wrap items-center gap-2 text-sm py-2 border-t border-gray-100 first:border-t-0">
      <span className="font-medium">{t(req.field === "EMAIL" ? "settings.email" : "settings.phone")}</span>
      <span className="text-gray-400">→</span>
      <span className="truncate max-w-[220px]">{req.newValue}</span>
      <span className={`text-[11px] px-2 py-0.5 rounded-full ${STATUS_STYLE[req.status]}`}>
        {t(`settings.status${req.status}`)}
      </span>
      <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</span>
      {req.reviewNote && <span className="text-xs text-gray-500 basis-full">“{req.reviewNote}”</span>}
      {req.status === "PENDING" && (
        <button
          type="button"
          onClick={() => onCancel(req.id)}
          disabled={busy}
          className="ml-auto text-xs text-red-500 hover:underline disabled:opacity-50"
        >
          {t("settings.cancelRequest")}
        </button>
      )}
    </li>
  );
}

export default function ContactSettings({ email, phone, emailVerified, requests }) {
  const t = useT();
  const [result, setResult] = useState(null);
  const [pending, start]    = useTransition();

  const pendingFor = (field) => requests.some((r) => r.field === field && r.status === "PENDING");

  const submit = (field) => (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("field", field);
    start(async () => setResult(await requestContactChangeAction(formData)));
  };

  const cancel = (id) => start(async () => setResult(await cancelContactChangeAction(id)));

  return (
    <Card title={t("settings.contact")} description={t("settings.contactHelp")}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <form onSubmit={submit("EMAIL")}>
          <Field
            label={t("settings.email")}
            hint={emailVerified ? t("settings.emailVerified") : t("settings.emailUnverified")}
          >
            <div className="text-sm font-medium truncate mb-2">{email}</div>
            <input
              name="value"
              type="email"
              className="eco-input"
              placeholder={t("settings.newEmailPlaceholder")}
              disabled={pendingFor("EMAIL")}
              required
            />
          </Field>
          <SubmitButton pending={pending} className="mt-3 w-full sm:w-auto">
            {pendingFor("EMAIL") ? t("settings.awaitingReview") : t("settings.requestChange")}
          </SubmitButton>
        </form>

        <form onSubmit={submit("PHONE")}>
          <Field label={t("settings.phone")} hint={t("settings.phoneHint")}>
            <div className="text-sm font-medium truncate mb-2">{phone || t("settings.notSet")}</div>
            <input
              name="value"
              type="tel"
              className="eco-input"
              placeholder={t("settings.newPhonePlaceholder")}
              disabled={pendingFor("PHONE")}
              required
            />
          </Field>
          <SubmitButton pending={pending} className="mt-3 w-full sm:w-auto">
            {pendingFor("PHONE") ? t("settings.awaitingReview") : t("settings.requestChange")}
          </SubmitButton>
        </form>
      </div>

      <Notice result={result} />

      {requests.length > 0 && (
        <div className="mt-5">
          <h3 className="text-xs uppercase tracking-wide text-gray-400 mb-1">{t("settings.recentRequests")}</h3>
          <ul>
            {requests.map((r) => (
              <ChangeRow key={r.id} req={r} onCancel={cancel} busy={pending} t={t} />
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
