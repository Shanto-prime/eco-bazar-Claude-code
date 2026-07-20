"use client";

// Password change. Only rendered for accounts that actually have a
// passwordHash — the page omits this card entirely for OAuth-only users, and
// the action refuses them a second time (defence in depth).

import { useRef, useState, useTransition } from "react";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { changePasswordAction } from "../_actions";
import { Card, Field, Notice, SubmitButton } from "./ui";

export default function PasswordSettings() {
  const t = useT();
  const [result, setResult] = useState(null);
  const [pending, start]    = useTransition();
  const formRef = useRef(null);

  const onSubmit = (e) => {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    start(async () => {
      const res = await changePasswordAction(formData);
      setResult(res);
      // Never leave a typed password sitting in the DOM after a success.
      if (res.ok) formRef.current?.reset();
    });
  };

  return (
    <Card title={t("settings.password")} description={t("settings.passwordHelp")}>
      <form ref={formRef} onSubmit={onSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label={`${t("settings.currentPassword")} *`}>
            <input name="currentPassword" type="password" autoComplete="current-password" className="eco-input" required />
          </Field>
          <Field label={`${t("settings.newPassword")} *`} hint={t("settings.passwordHint")}>
            <input name="newPassword" type="password" autoComplete="new-password" className="eco-input" required minLength={8} />
          </Field>
          <Field label={`${t("settings.confirmPassword")} *`}>
            <input name="confirmPassword" type="password" autoComplete="new-password" className="eco-input" required minLength={8} />
          </Field>
        </div>
        <div className="mt-4">
          <SubmitButton pending={pending}>{t("settings.changePassword")}</SubmitButton>
        </div>
        <Notice result={result} />
      </form>
    </Card>
  );
}
