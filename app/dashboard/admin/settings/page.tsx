import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import CommissionForm from "./commission/commission-form";

export default async function AdminSettingsPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const { data: settings, error } = await supabase
    .from("commission_settings")
    .select("commission_type, commission_value, name, updated_at")
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("Failed to load commission settings:", error);

    throw new Error("Unable to load platform settings.");
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
