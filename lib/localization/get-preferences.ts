import { requireRole } from "@/lib/auth/require-role";

export type LocalizationPreferences = {
  country: string;
  language: "en" | "ar";
  currency: string;
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  timeFormat: "12" | "24";
  timeZone: string;
};

function supportedLanguage(value: string): "en" | "ar" {
  return value === "ar" ? "ar" : "en";
}

function supportedDateFormat(
  value: string,
): "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD" {
  if (value === "MM/DD/YYYY" || value === "YYYY-MM-DD") {
    return value;
  }

  return "DD/MM/YYYY";
}

function supportedTimeFormat(value: string): "12" | "24" {
  return value === "24" ? "24" : "12";
}

export async function getUserLocalizationPreferences(): Promise<LocalizationPreferences> {
  const { user, supabase } = await requireRole(["customer", "worker", "admin"]);

  const [
    { data: platform, error: platformError },
    { data: personal, error: personalError },
  ] = await Promise.all([
    supabase
      .from("platform_localization_settings")
      .select(
        "default_country, default_language, default_currency, default_date_format, default_time_format, default_time_zone",
      )
      .eq("id", true)
      .single(),

    supabase
      .from("user_localization_preferences")
      .select(
        "country, language, display_currency, date_format, time_format, time_zone",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (platformError || !platform) {
    console.error(
      "Failed to load platform localization defaults:",
      platformError,
    );
    throw new Error("Unable to load platform localization defaults.");
  }

  if (personalError) {
    console.error(
      "Failed to load personal localization preferences:",
      personalError,
    );
    throw new Error("Unable to load personal localization preferences.");
  }

  return {
    country: personal?.country ?? platform.default_country,
    language: supportedLanguage(
      personal?.language ?? platform.default_language,
    ),
    currency: personal?.display_currency ?? platform.default_currency,
    dateFormat: supportedDateFormat(
      personal?.date_format ?? platform.default_date_format,
    ),
    timeFormat: supportedTimeFormat(
      personal?.time_format ?? platform.default_time_format,
    ),
    timeZone: personal?.time_zone ?? platform.default_time_zone,
  };
}
