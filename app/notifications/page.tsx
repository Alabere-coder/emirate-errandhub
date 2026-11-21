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
      {/* Page heading */}
      <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Bell className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Notifications
              </h1>

              <p className="mt-0.5 text-sm text-muted-foreground">
                Your latest updates
              </p>
            </div>
          </div>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Stay updated on your jobs, payments, messages, and account.
          </p>
        </div>
      </div>

      <NotificationsList initialNotifications={notifications ?? []} />
    </div>
  );
}
