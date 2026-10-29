"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type GeneralSettingsState = {
  error?: string;
  success?: string;
};

export async function updateGeneralSettings(
  _prevState: GeneralSettingsState,
  formData: FormData,
): Promise<GeneralSettingsState> {
  await requireRole(["super_admin"]);

  const platformName = String(formData.get("platformName") ?? "").trim();
  const platformDescription = String(
    formData.get("platformDescription") ?? "",
  ).trim();
  const supportEmail = String(formData.get("supportEmail") ?? "")
    .trim()
    .toLowerCase();
  const supportPhone = String(formData.get("supportPhone") ?? "").trim();

  const maintenanceMode = formData.get("maintenanceMode") === "on";

  if (!platformName) {
    return { error: "Platform name is required." };
  }

  if (platformName.length > 100) {
    return { error: "Platform name cannot exceed 100 characters." };
  }

  if (platformDescription.length > 500) {
    return { error: "Description cannot exceed 500 characters." };
  }

  if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
    return { error: "Enter a valid support email address." };
  }

  if (supportPhone.length > 30) {
    return { error: "Support phone number is too long." };
  }

  const supabase = await createClient();

  const { data: existing, error: readError } = await supabase
    .from("platform_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (readError) {
    console.error("General settings lookup error:", readError);
    return { error: "Unable to load platform settings." };
  }

  const values = {
    platform_name: platformName,
    platform_description: platformDescription || null,
    support_email: supportEmail || null,
    support_phone: supportPhone || null,
    is_maintenance_mode: maintenanceMode,
    updated_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase
        .from("platform_settings")
        .update(values)
        .eq("id", existing.id)
    : await supabase.from("platform_settings").insert(values);

  if (error) {
    console.error("General settings update error:", error);
    return { error: "Unable to save general settings." };
  }

  revalidatePath("/dashboard/admin/settings");
  revalidatePath("/");

  return { success: "General settings saved successfully." };
}
