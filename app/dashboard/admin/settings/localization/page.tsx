import { Globe, Languages, Clock, Banknote, CalendarDays } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { LocalizationSettingsForm } from "./localization-settings-form";

export const dynamic = "force-dynamic";

export default async function AdminLocalizationSettingsPage() {
  await requireRole(["admin"]);

  const supabase = createAdminClient();

  const { data: settings, error } = await supabase
    .from("platform_localization_settings")
    .select(
      "default_country, default_language, default_currency, default_date_format, default_time_format, default_time_zone",
    )
    .eq("id", true)
    .single();

  const { data: timeZones, error: timeZonesError } = await supabase
    .from("supported_time_zones")
    .select("time_zone, label")
    .eq("is_active", true)
    .order("label");

  if (timeZonesError) {
    console.error("Failed to load supported time zones:", timeZonesError);
    throw new Error("Unable to load supported time zones.");
  }

  if (error || !settings) {
    console.error("Failed to load localization settings:", error);
    throw new Error("Unable to load localization settings.");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-start gap-3">
        <div className="rounded-lg border p-3">
          <Globe className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Localization Settings
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Configure the default country, language, currency, date and time
            formats for Emirate ErrandHub.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Platform defaults</CardTitle>
        </CardHeader>
        <CardContent>
          <LocalizationSettingsForm
            settings={settings}
            timeZones={timeZones ?? []}
          />
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Languages className="h-4 w-4" />
              Languages
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            English and Arabic are supported as language options. Complete
            Arabic translations and right-to-left layout will be implemented
            separately.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Banknote className="h-4 w-4" />
              Currency display
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Currency settings control display preferences only. They do not
            change payment processing, job prices stored in the database, or
            worker payouts.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="h-4 w-4" />
              Date formats
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Choose how dates are displayed across the application.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="h-4 w-4" />
              Time zone
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The default time zone determines regional time display. Booking
            timestamps should remain stored as UTC.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
