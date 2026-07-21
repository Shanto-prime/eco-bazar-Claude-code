"use client";

// Email + phone. Each shows its CURRENT saved value as read-only text with an
// Edit button beside it (the components/settings.html pattern). Clicking Edit
// reveals the change field; there is no Delete — an account always has exactly
// one email, and phone is edited rather than removed.
//
// Two behaviours, decided server-side and reflected here only for labelling:
//   • privileged users (ADMIN/MODERATOR) → the change applies immediately.
//   • everyone else                      → it raises a ProfileChangeRequest for
//     review, and the field locks to "Awaiting review" until it clears.
// `canSelfApprove` is a display hint only; requestContactChangeAction re-checks
// the role from the DB and is the real gate.

import { useState, useTransition } from "react";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { requestContactChangeAction, cancelContactChangeAction } from "../_actions";
import { Card, Notice, SubmitButton, GhostButton } from "./ui";

const STATUS_STYLE = {
  PENDING:   "bg-amber-100 text-amber-700",
  APPROVED:  "bg-emerald-100 text-emerald-700",
  REJECTED:  "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

// One field row (email or phone): shows the value + Edit, or the edit form.
function ContactRow({ field, label, value, badge, hint, type, placeholder, locked, canSelfApprove, onSubmit, pending, t }) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="rounded-xl border border-gray-200 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-[13px] font-medium">{label}</p>
        {badge}
      </div>

      {!editing ? (
        <div className="mt-1 flex items-center justify-between gap-3">
          <p className={`text-sm truncate ${value ? "text-gray-700" : "text-gray-400"}`}>
            {value || t("settings.notSet")}
          </p>
          {/* Locked = a request is already pending; no edit until it clears. */}
          {locked ? (
            <span className="text-xs text-amber-600 whitespace-nowrap">
              <i className="fa-solid fa-clock mr-1" />{t("settings.awaitingReview")}
            </span>
          ) : (
            <GhostButton onClick={() => setEditing(true)} className="shrink-0">
              <i className="fa-solid fa-pen text-eco-green text-xs" />
              {t("settings.edit")}
            </GhostButton>
          )}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            onSubmit(field, e);
            setEditing(false);
          }}
          className="mt-3"
        >
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              name="value"
              type={type}
              className="eco-input rounded-xl flex-1"
              placeholder={placeholder}
              autoFocus
              required
            />
            <div className="flex gap-2">
              <SubmitButton pending={pending} className="whitespace-nowrap">
                {canSelfApprove ? t("settings.save") : t("settings.requestChange")}
              </SubmitButton>
              <GhostButton onClick={() => setEditing(false)}>{t("settings.cancel")}</GhostButton>
            </div>
          </div>
          {hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
        </form>
      )}

      {!editing && hint && <p className="mt-1.5 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function RequestRow({ req, onCancel, busy, t }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-200 px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
      <span className="text-gray-600">{t(req.field === "EMAIL" ? "settings.email" : "settings.phone")}</span>
      <i className="fa-solid fa-arrow-right text-gray-400 text-xs" />
      <span className="font-medium truncate max-w-[220px]">{req.newValue}</span>
      <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${STATUS_STYLE[req.status]}`}>
        {t(`settings.status${req.status}`)}
      </span>
      <span className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</span>
      {req.reviewNote && <span className="basis-full text-xs text-gray-500">“{req.reviewNote}”</span>}
      {req.status === "PENDING" && (
        <button
          type="button"
          onClick={() => onCancel(req.id)}
          disabled={busy}
          className="ml-auto text-[13px] font-medium text-red-600 hover:underline disabled:opacity-50"
        >
          {t("settings.cancelRequest")}
        </button>
      )}
    </div>
  );
}

export default function ContactSettings({ email, phone, emailVerified, requests, canSelfApprove }) {
  const t = useT();
  const [result, setResult] = useState(null);
  const [pending, start]    = useTransition();

  const pendingFor = (field) => requests.some((r) => r.field === field && r.status === "PENDING");

  // Only customers ever hit the review queue, so only they see pending state.
  const submit = (field, e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("field", field);
    start(async () => setResult(await requestContactChangeAction(formData)));
  };

  const cancel = (id) => start(async () => setResult(await cancelContactChangeAction(id)));

  const emailBadge = emailVerified ? (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 px-2 py-0.5 text-[11px] font-medium">
      <i className="fa-solid fa-circle-check" />{t("settings.emailVerified")}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 text-amber-700 px-2 py-0.5 text-[11px] font-medium">
      {t("settings.emailUnverified")}
    </span>
  );

  return (
    <Card
      id="contact"
      title={t("settings.contact")}
      description={canSelfApprove ? t("settings.contactHelpSelf") : t("settings.contactHelp")}
    >
      <div className="space-y-5">
        <ContactRow
          field="EMAIL"
          label={t("settings.email")}
          value={email}
          badge={emailBadge}
          type="email"
          placeholder={t("settings.newEmailPlaceholder")}
          locked={pendingFor("EMAIL")}
          canSelfApprove={canSelfApprove}
          onSubmit={submit}
          pending={pending}
          t={t}
        />
        <ContactRow
          field="PHONE"
          label={t("settings.phone")}
          value={phone}
          hint={t("settings.phoneHint")}
          type="tel"
          placeholder={t("settings.newPhonePlaceholder")}
          locked={pendingFor("PHONE")}
          canSelfApprove={canSelfApprove}
          onSubmit={submit}
          pending={pending}
          t={t}
        />

        <Notice result={result} />

        {requests.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-400 mb-2">
              {t("settings.recentRequests")}
            </p>
            <div className="space-y-2">
              {requests.map((r) => (
                <RequestRow key={r.id} req={r} onCancel={cancel} busy={pending} t={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
