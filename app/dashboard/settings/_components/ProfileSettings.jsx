"use client";

// Name / username / avatar — applied immediately, no review. Email and phone
// deliberately live in ContactSettings instead; see prisma/schema.prisma.

import { useState, useRef, useTransition } from "react";
import { useT } from "../../../../lib/i18n/LanguageProvider";
import { updateProfileAction } from "../_actions";
import { Card, Field, Notice, SubmitButton } from "./ui";

export default function ProfileSettings({ initial }) {
  const t = useT();
  const [image, setImage]     = useState(initial.image);
  const [result, setResult]   = useState(null);
  const [uploading, setUploading] = useState(false);
  const [pending, start]      = useTransition();
  const fileRef = useRef(null);

  // Upload first, then store the returned URL in a hidden field — the profile
  // action takes a URL string, never the file itself, so the avatar survives a
  // failed form submit and can be re-tried without re-picking the image.
  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setResult(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res  = await fetch("/api/upload/avatar", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || t("settings.uploadFailed"));
      setImage(json.url);
    } catch (err) {
      setResult({ ok: false, error: err.message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = ""; // allow re-picking the same file
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    start(async () => setResult(await updateProfileAction(formData)));
  };

  return (
    <Card title={t("settings.profile")} description={t("settings.profileHelp")}>
      <form onSubmit={onSubmit}>
        <input type="hidden" name="image" value={image} />

        <div className="flex items-center gap-4 mb-5">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-eco-green text-white grid place-items-center text-lg font-semibold ring-1 ring-gray-200 shrink-0">
            {image ? (
              // Plain <img>: uploaded avatars and OAuth provider URLs are not
              // both covered by next.config images.remotePatterns.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <i className="fa-solid fa-user" />
            )}
          </div>
          <div className="min-w-0">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={onPickFile}
              className="block text-sm max-w-full file:mr-3 file:px-3 file:py-2 file:rounded-full file:border-0 file:bg-eco-green file:text-white file:text-sm"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              {uploading ? t("settings.uploading") : t("settings.avatarHint")}
            </p>
            {image && (
              <button
                type="button"
                onClick={() => setImage("")}
                className="text-[11px] text-red-500 hover:underline mt-1"
              >
                {t("settings.removePhoto")}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label={`${t("settings.name")} *`}>
            <input name="name" className="eco-input" defaultValue={initial.name} required maxLength={120} />
          </Field>
          <Field label={t("settings.username")} hint={t("settings.usernameHint")}>
            <input name="username" className="eco-input" defaultValue={initial.username} maxLength={32} />
          </Field>
        </div>

        <div className="mt-4">
          <SubmitButton pending={pending || uploading}>{t("settings.save")}</SubmitButton>
        </div>
        <Notice result={result} />
      </form>
    </Card>
  );
}
