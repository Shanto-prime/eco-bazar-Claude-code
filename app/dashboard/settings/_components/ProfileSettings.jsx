"use client";

// Name / username / avatar — applied immediately for everyone, no review. Email
// and phone deliberately live in ContactSettings instead; see
// prisma/schema.prisma and lib/profile-changes.js.
//
// Styling follows components/settings.html: avatar + Upload photo / Remove
// buttons, name, and an @-prefixed username field.

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

  const initials = (initial.name || initial.username || "?").trim().slice(0, 2).toUpperCase();

  return (
    <Card id="profile" title={t("settings.profile")} description={t("settings.profileHelp")}>
      <form onSubmit={onSubmit}>
        <input type="hidden" name="image" value={image} />

        <div className="flex items-center gap-4">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full overflow-hidden bg-eco-green/10 ring-1 ring-eco-green/20 text-eco-green text-xl font-semibold shrink-0">
            {image ? (
              // Plain <img>: uploaded avatars and OAuth provider URLs are not
              // both covered by next.config images.remotePatterns.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={image} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              initials
            )}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 rounded-xl bg-white border border-gray-200 px-3.5 py-2 text-sm font-medium hover:bg-gray-50 cursor-pointer min-h-[40px]">
                <i className="fa-solid fa-arrow-up-from-bracket text-eco-green text-xs" />
                {uploading ? t("settings.uploading") : t("settings.uploadPhoto")}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onPickFile}
                  className="hidden"
                />
              </label>
              {image && (
                <button
                  type="button"
                  onClick={() => setImage("")}
                  className="rounded-xl px-3.5 py-2 text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 min-h-[40px]"
                >
                  {t("settings.removePhoto")}
                </button>
              )}
            </div>
            <p className="mt-1.5 text-xs text-gray-400">{t("settings.avatarHint")}</p>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <Field label={t("settings.name")} required>
            <input name="name" className="eco-input rounded-xl" defaultValue={initial.name} required maxLength={120} />
          </Field>
          <Field label={t("settings.username")} hint={t("settings.usernameHint")}>
            <div className="flex rounded-xl border border-gray-200 bg-white focus-within:border-eco-green overflow-hidden">
              <span className="inline-flex items-center px-3 bg-gray-50 text-gray-400 text-sm border-r border-gray-200">@</span>
              <input
                name="username"
                className="w-full px-3.5 py-2.5 text-sm bg-transparent focus:outline-none"
                defaultValue={initial.username}
                maxLength={32}
              />
            </div>
          </Field>
        </div>

        <div className="mt-5 flex justify-end">
          <SubmitButton pending={pending || uploading}>{t("settings.save")}</SubmitButton>
        </div>
        <Notice result={result} />
      </form>
    </Card>
  );
}
