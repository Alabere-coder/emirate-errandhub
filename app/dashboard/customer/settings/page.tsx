import { redirect } from "next/navigation";
import { Bell, Settings } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";
import { NotificationPreferencesForm } from "@/app/notifications/preferences/notification-preferences-form";

export const dynamic = "force-dynamic";

const defaultPreferences = {
  email_notifications: true,
  push_notifications: true,
  sms_notifications: true,
  job_updates: true,
  message_notifications: true,
  payment_notifications: true,
  marketing_notifications: false,
};

export default async function CustomerSettingsPage() {
  const currentUser = await requireRole(["customer"]);
  const supabase = await createClient();

  const { data: settings, error } = await supabase
    .from("notification_settings")
    .select(
      "email_notifications, push_notifications, sms_notifications, job_updates, message_notifications, payment_notifications, marketing_notifications",
    )
    .eq("user_id", currentUser.user.id)
    .maybeSingle();

  if (error) {
    console.error("Customer notification settings error:", error);
    throw new Error("Unable to load your notification settings.");
  }

  const preferences = {
    ...defaultPreferences,
    ...(settings ?? {}),
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="h-6 w-6 text-emerald-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Settings
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Manage your account notification preferences.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Notification preferences
          </h2>
        </div>

        <NotificationPreferencesForm initialSettings={preferences} />
      </section>
    </div>
  );
}
