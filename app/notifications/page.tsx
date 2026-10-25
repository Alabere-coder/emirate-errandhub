import { redirect } from "next/navigation";
import { Bell } from "lucide-react";

import { createClient } from "@/lib/supabase/server";
import { NotificationsList } from "./notifications-list";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: notifications, error } = await supabase
    .from("notifications")
    .select("id, type, title, message, link, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    throw new Error("Unable to load notifications.");
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      <div>
        <div className="flex items-center gap-2">
          <Bell className="h-6 w-6 text-emerald-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Notifications
          </h1>
        </div>

        <p className="mt-1 text-sm text-slate-500">
          Stay updated on your jobs, payments, messages, and account.
        </p>
      </div>

      <NotificationsList initialNotifications={notifications ?? []} />
    </div>
  );
}
