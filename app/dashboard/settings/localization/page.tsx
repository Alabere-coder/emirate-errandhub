import { Globe } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { PersonalLocalizationSettingsForm } from "./personal-localization-settings-form";

export const dynamic = "force-dynamic";

export default async function PersonalLocalizationSettingsPage() {
  const { user } = await requireRole(["customer", "worker"]);

  const admin = createAdminClient();

  const [
    { data: platform, error: platformError },
    { data: preferences, error: preferencesError },
    { data: timeZones, error: timeZonesError },
  ] = await Promise.all([
    admin
      .from("platform_localization_settings")
      .select(
        "default_country, default_language, default_currency, default_date_format, default_time_format, default_time_zone",
      )
      .eq("id", true)
      .single(),
    admin
      .from("user_localization_preferences")
      .select(
        "country, language, display_currency, date_format, time_format, time_zone",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("supported_time_zones")
      .select("time_zone, label")
      .eq("is_active", true)
      .order("label"),
  ]);

  if (platformError || !platform) {
    console.error(
      "Failed to load platform localization defaults:",
      platformError,
    );
    throw new Error("Unable to load localization settings.");
  }

  if (preferencesError) {
    console.error(
      "Failed to load personal localization preferences:",
      preferencesError,
    );
    throw new Error("Unable to load your localization preferences.");
  }

  if (timeZonesError) {
    console.error("Failed to load supported time zones:", timeZonesError);
    throw new Error("Unable to load supported time zones.");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg border p-3">
          <Globe className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Language and Regional Preferences
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Customize how Emirate ErrandHub displays regional information for
            your account. Leave a field on the platform default to inherit the
            administrator's setting.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <PersonalLocalizationSettingsForm
            platform={platform}
            preferences={preferences}
            timeZones={timeZones ?? []}
          />
        </CardContent>
      </Card>
    </div>
  );
}
