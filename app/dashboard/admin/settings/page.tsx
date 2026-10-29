import { requireRole } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import CommissionForm from "./commission/commission-form";
import GeneralSettingsForm from "./general/general-settings-form";
import PlatformLogoUpload from "./general/platform-logo-upload";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  await requireRole(["admin"]);

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Unable to load the current admin account.");
  }

  const supabase = await createClient();

  const [
    { data: settings, error: settingsError },
    { data: platform, error: platformError },
  ] = await Promise.all([
    supabase
      .from("commission_settings")
      .select("commission_type, commission_value, name, updated_at")
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("platform_settings")
      .select(
        "platform_name, platform_description, support_email, support_phone, is_maintenance_mode, platform_logo_url",
      )
      .limit(1)
      .maybeSingle(),
  ]);

  if (settingsError) {
    console.error("Failed to load commission settings:", settingsError);
    throw new Error("Unable to load platform commission settings.");
  }

  if (platformError) {
    console.error("Failed to load general settings:", platformError);
    throw new Error("Unable to load general platform settings.");
  }

  const currentType =
    settings?.commission_type === "fixed" ? "fixed" : "percentage";

  const currentValue = Number(settings?.commission_value ?? 20);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Platform Settings</h1>
        <p className="text-muted-foreground">
          Manage platform-wide configuration for Emirate ErrandHub.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>
            Manage the platform identity and public support contact details.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <PlatformLogoUpload
            initialLogoUrl={platform?.platform_logo_url ?? ""}
            canEdit={currentUser.profile.role === "super_admin"}
          />

          <GeneralSettingsForm
            platformName={platform?.platform_name ?? "Emirate ErrandHub"}
            platformDescription={
              platform?.platform_description ?? "Services made easier."
            }
            supportEmail={platform?.support_email ?? ""}
            supportPhone={platform?.support_phone ?? ""}
            isMaintenanceMode={platform?.is_maintenance_mode ?? false}
            canEdit={currentUser.profile.role === "super_admin"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Platform Commission</CardTitle>
          <CardDescription>
            Configure the commission deducted from completed jobs before worker
            earnings become available.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              Current active commission
            </p>

            <p className="mt-1 text-2xl font-semibold">
              {currentType === "percentage"
                ? `${currentValue}%`
                : `₦${currentValue.toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`}
            </p>
          </div>

          <CommissionForm
            currentType={currentType}
            currentValue={currentValue}
          />
        </CardContent>
      </Card>
    </div>
  );
}
