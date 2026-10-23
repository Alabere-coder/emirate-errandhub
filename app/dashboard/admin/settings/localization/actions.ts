"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

const COUNTRIES = [
  "United Arab Emirates",
  "Nigeria",
  "Ghana",
  "Kenya",
  "South Africa",
  "United Kingdom",
] as const;

const LANGUAGES = ["en", "ar"] as const;
const CURRENCIES = ["AED", "NGN", "GHS", "KES", "ZAR", "GBP", "USD"] as const;
const DATE_FORMATS = ["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"] as const;
const TIME_FORMATS = ["12", "24"] as const;

export type LocalizationActionState = {
  error?: string;
  success?: string;
};

export async function savePlatformLocalizationSettings(
  _previousState: LocalizationActionState,
  formData: FormData,
): Promise<LocalizationActionState> {
  await requireRole(["admin"]);

  const country = String(formData.get("default_country") ?? "");
  const language = String(formData.get("default_language") ?? "");
  const currency = String(formData.get("default_currency") ?? "");
  const dateFormat = String(formData.get("default_date_format") ?? "");
  const timeFormat = String(formData.get("default_time_format") ?? "");
  const timeZone = String(formData.get("default_time_zone") ?? "").trim();

  if (!COUNTRIES.includes(country as (typeof COUNTRIES)[number])) {
    return { error: "Select a supported country." };
  }

  if (!LANGUAGES.includes(language as (typeof LANGUAGES)[number])) {
    return { error: "Select a supported language." };
  }

  if (!CURRENCIES.includes(currency as (typeof CURRENCIES)[number])) {
    return { error: "Select a supported currency." };
  }

  if (!DATE_FORMATS.includes(dateFormat as (typeof DATE_FORMATS)[number])) {
    return { error: "Select a supported date format." };
  }

  if (!TIME_FORMATS.includes(timeFormat as (typeof TIME_FORMATS)[number])) {
    return { error: "Select a supported time format." };
  }

  if (!timeZone || timeZone.length > 100) {
    return { error: "Enter a valid time zone." };
  }

  try {
    new Intl.DateTimeFormat("en", { timeZone }).format(new Date());
  } catch {
    return { error: "Enter a valid time zone, such as Asia/Dubai." };
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("platform_localization_settings")
    .update({
      default_country: country,
      default_language: language,
      default_currency: currency,
      default_date_format: dateFormat,
      default_time_format: timeFormat,
      default_time_zone: timeZone,
      updated_at: new Date().toISOString(),
    })
    .eq("id", true);

  if (error) {
    console.error("Failed to save platform localization settings:", error);
    return { error: "Unable to save settings. Please try again." };
  }

  revalidatePath("/dashboard/admin/settings/localization");
  revalidatePath("/dashboard/settings/localization");
  revalidatePath("/dashboard");

  return { success: "Platform localization defaults saved successfully." };
}
