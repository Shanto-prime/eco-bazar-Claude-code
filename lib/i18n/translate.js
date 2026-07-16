// lib/i18n/translate.js
// Pure translation lookup shared by the server helper and the client hook.
// Keys are dot-paths ("nav.home"). Resolution order:
//   1. requested locale
//   2. English fallback
//   3. the raw key (so a missing string is visible, never blank)
//
// t() also does simple {placeholder} interpolation from a vars object.

import { dictionaries } from "./dictionaries";
import { DEFAULT_LOCALE, normalizeLocale } from "./config";

function lookup(dict, key) {
  return key.split(".").reduce((o, part) => (o == null ? undefined : o[part]), dict);
}

export function translate(locale, key, vars) {
  const loc = normalizeLocale(locale);
  let str = lookup(dictionaries[loc], key);
  if (str == null) str = lookup(dictionaries[DEFAULT_LOCALE], key);
  if (str == null) return key;
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, String(v));
    }
  }
  return str;
}

// Build a bound t() for a locale.
export function makeT(locale) {
  return (key, vars) => translate(locale, key, vars);
}
