import type { LocalizationPreferences } from "./get-preferences";

export function getLocale(preferences: LocalizationPreferences) {
  return preferences.language === "ar" ? "ar-AE" : "en";
}

export function formatDate(
  date: string | Date,
  preferences: LocalizationPreferences,
) {
  return new Intl.DateTimeFormat(getLocale(preferences), {
    timeZone: preferences.timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(
  date: string | Date,
  preferences: LocalizationPreferences,
) {
  return new Intl.DateTimeFormat(getLocale(preferences), {
    timeZone: preferences.timeZone,
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: preferences.timeFormat === "12",
  }).format(new Date(date));
}

export function formatCurrency(
  amount: number,
  preferences: LocalizationPreferences,
) {
  return new Intl.NumberFormat(getLocale(preferences), {
    style: "currency",
    currency: preferences.currency,
  }).format(amount);
}
