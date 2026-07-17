// lib/i18n/dictionaries.js
// Locale dictionaries — the actual strings live in /locales/*.json (the
// professional, scalable structure: one JSON file per language). This module
// just loads them and exposes the shape the translator expects:
//   dictionaries[locale] -> nested object of dot-path keys.
//
// Keys are dot-paths used via t() ("nav.home", "cart.title"). Any key missing
// from `bn` automatically falls back to `en` (see translate.js), so a partial
// translation never breaks a page. To add a language, drop in a new JSON file
// and register it here.

import en from "../../locales/en.json";
import bn from "../../locales/bn.json";

export const dictionaries = { en, bn };
