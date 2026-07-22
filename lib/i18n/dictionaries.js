// lib/i18n/dictionaries.js
// Locale dictionaries — the actual strings live in /locales/*.json (one JSON
// file per language). This module loads them and exposes the shape the
// translator expects: dictionaries[locale] -> nested object of dot-path keys.
//
// The app is English-only. The i18n plumbing (t(), getT()) is kept because ~60
// files reference it and it centralises copy, but there is a single locale.
// Bangla was removed; to re-add a language, drop in its JSON and register it in
// both here and lib/i18n/config.js.

import en from "../../locales/en.json";

export const dictionaries = { en };
