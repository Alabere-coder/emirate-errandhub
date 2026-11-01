"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type NotificationSettingsState = {
  error?: string;
  success?: string;
};

export type PlatformNotificationSettings = {
  default_email_notifications: boolean;
  default_push_notifications: boolean;
  default_sms_notifications: boolean;
  default_job_updates: boolean;
  default_message_notifications: boolean;
  default_payment_notifications: boolean;
  default_marketing_notifications: boolean;
  admin_email_notifications: boolean;
  admin_push_notifications: boolean;
  admin_sms_notifications: boolean;
  admin_job_updates: boolean;
  admin_message_notifications: boolean;
  admin_payment_notifications: boolean;
};

export async function updateNotificationSettings(
  _previousState: NotificationSettingsState,
  formData: FormData,
): Promise<NotificationSettingsState> {
  try {
    const currentUser = await requireRole(["admin"]);

    if (currentUser.profile.role !== "super_admin") {
      return {
        error: "Only super administrators can update notification settings.",
      };
    }

    const supabase = await createClient();

    const fields: (keyof PlatformNotificationSettings)[] = [
      "default_email_notifications",
      "default_push_notifications",
      "default_sms_notifications",
      "default_job_updates",
      "default_message_notifications",
      "default_payment_notifications",
      "default_marketing_notifications",
      "admin_email_notifications",
      "admin_push_notifications",
      "admin_sms_notifications",
      "admin_job_updates",
      "admin_message_notifications",
      "admin_payment_notifications",
    ];

    const settings: Partial<PlatformNotificationSettings> = {};

    for (const field of fields) {
      const values = formData.getAll(field);

      if (
        values.length === 0 ||
        values.some((value) => value !== "true" && value !== "false")
      ) {
        return {
          error: `Invalid value for ${field.replaceAll("_", " ")}.`,
        };
      }

      settings[field] = values.includes("true");
    }

    const { error } = await supabase
      .from("platform_notification_settings")
      .update({
        ...settings,
        updated_at: new Date().toISOString(),
        updated_by: currentUser.user.id,
      })
      .eq("id", "00000000-0000-0000-0000-000000000001");

    if (error) {
      console.error("Notification settings update error:", error);

      return {
        error: "Unable to save notification settings. Please try again.",
      };
    }

    revalidatePath("/dashboard/admin/settings");

    return {
      success: "Notification settings saved successfully.",
    };
  } catch (error) {
    console.error("Update notification settings error:", error);

    return {
      error: "Something went wrong while saving notification settings.",
    };
  }
}
