"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";

export type PersonalLocalizationActionState = {
  error?: string;
  success?: string;
};

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

export async function savePersonalLocalizationPreferences(
  _previousState: PersonalLocalizationActionState,
  formData: FormData,
): Promise<PersonalLocalizationActionState> {
  const { user, supabase } = await requireRole(["customer", "worker"]);

  const country = String(formData.get("country") ?? "");
  const language = String(formData.get("language") ?? "");
  const currency = String(formData.get("display_currency") ?? "");
  const dateFormat = String(formData.get("date_format") ?? "");
  const timeFormat = String(formData.get("time_format") ?? "");
  const timeZone = String(formData.get("time_zone") ?? "");

  if (country && !COUNTRIES.includes(country as (typeof COUNTRIES)[number])) {
    return { error: "Select a supported country or use the platform default." };
  }

  if (language && !LANGUAGES.includes(language as (typeof LANGUAGES)[number])) {
    return {
      error: "Select a supported language or use the platform default.",
    };
  }

  if (
    currency &&
    !CURRENCIES.includes(currency as (typeof CURRENCIES)[number])
  ) {
    return {
      error: "Select a supported currency or use the platform default.",
    };
  }

  if (
    dateFormat &&
    !DATE_FORMATS.includes(dateFormat as (typeof DATE_FORMATS)[number])
  ) {
    return {
      error: "Select a supported date format or use the platform default.",
    };
  }

  if (
    timeFormat &&
    !TIME_FORMATS.includes(timeFormat as (typeof TIME_FORMATS)[number])
  ) {
    return {
      error: "Select a supported time format or use the platform default.",
    };
  }

  if (timeZone) {
    const { data: zone, error: zoneError } = await supabase
      .from("supported_time_zones")
      .select("time_zone")
      .eq("time_zone", timeZone)
      .eq("is_active", true)
      .maybeSingle();

    if (zoneError) {
      console.error("Failed to validate personal time zone:", zoneError);
      return { error: "Unable to validate the selected time zone." };
    }

    if (!zone) {
      return { error: "Select an active supported time zone." };
    }
  }

  const { error } = await supabase.from("user_localization_preferences").upsert(
    {
      user_id: user.id,
      country: country || null,
      language: language || null,
      display_currency: currency || null,
      date_format: dateFormat || null,
      time_format: timeFormat || null,
      time_zone: timeZone || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  if (error) {
    console.error("Failed to save personal localization preferences:", error);
    return { error: "Unable to save your preferences. Please try again." };
  }

  revalidatePath("/dashboard/settings/localization");
  revalidatePath("/dashboard");

  return { success: "Your localization preferences have been saved." };
}
