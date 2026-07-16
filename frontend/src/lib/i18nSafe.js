/**
 * Safe i18n lookup — never surface raw "a.b.c" keys in the UI.
 * Prefer i18next defaultValue; also treat key-looking results as missing.
 */
export function safeT(t, key, fallback = "") {
  if (!t || !key) return fallback;
  const value = t(key, { defaultValue: fallback || key });
  if (!value || value === key || looksLikeI18nKey(value)) {
    return fallback || humanizeKey(key);
  }
  return value;
}

function looksLikeI18nKey(value) {
  if (typeof value !== "string") return false;
  // e.g. hr.ats.job_title or common.add
  return /^[a-z0-9]+(\.[a-z0-9_]+)+$/i.test(value.trim());
}

function humanizeKey(key) {
  const leaf = String(key).split(".").pop() || key;
  return leaf
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
