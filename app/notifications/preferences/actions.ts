"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type NotificationPreferencesState = {
  error?: string;
  success?: string;
};

const preferenceFields = [
  "email_notifications",
  "push_notifications",
  "sms_notifications",
  "job_updates",
  "message_notifications",
  "payment_notifications",
  "marketing_notifications",
] as const;

type PreferenceField = (typeof preferenceFields)[number];

export async function updateMyNotificationPreferences(
  _previousState: NotificationPreferencesState,
  formData: FormData,
): Promise<NotificationPreferencesState> {
  try {
    const currentUser = await requireRole(["customer", "worker"]);
    const supabase = await createClient();

    const preferences: Record<PreferenceField, boolean> = {} as Record<
      PreferenceField,
      boolean
    >;

    for (const field of preferenceFields) {
      const values = formData.getAll(field);

      if (
        values.length === 0 ||
        values.some((value) => value !== "true" && value !== "false")
      ) {
        return {
          error: `Invalid value for ${field.replaceAll("_", " ")}.`,
        };
      }

      preferences[field] = values.includes("true");
    }

    const { data: existing, error: lookupError } = await supabase
      .from("notification_settings")
      .select("user_id")
      .eq("user_id", currentUser.user.id)
      .maybeSingle();

    if (lookupError) {
      console.error("Notification preferences lookup error:", lookupError);
      return { error: "Unable to load your notification preferences." };
    }

    const { error } = existing
      ? await supabase
          .from("notification_settings")
          .update({
            ...preferences,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", currentUser.user.id)
      : await supabase.from("notification_settings").insert({
          user_id: currentUser.user.id,
          ...preferences,
        });

    if (error) {
      console.error("Notification preferences update error:", error);
      return { error: "Unable to save your preferences. Please try again." };
    }

    revalidatePath("/notifications");

    return { success: "Your notification preferences have been saved." };
  } catch (error) {
    console.error("Update notification preferences error:", error);

    return {
      error: "Something went wrong while saving your preferences.",
    };
  }
}
