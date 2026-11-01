import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type CreateNotificationInput = {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  preference?:
    | "job_updates"
    | "message_notifications"
    | "payment_notifications";
  critical?: boolean;
  adminTitle?: string;
  adminMessage?: string;
  adminOnly?: boolean;
  notifyAdmins?: boolean;
  excludeUserIds?: string[];
};

export async function createNotification({
  userId,
  type,
  title,
  message,
  link = null,
  preference,
  critical = false,
  adminTitle,
  adminMessage,
  adminOnly = false,
  notifyAdmins = true,
  excludeUserIds = [],
}: CreateNotificationInput) {
  const admin = createAdminClient();

  try {
    // Find all active administrators.
    const { data: admins, error: adminsError } = await admin
      .from("profiles")
      .select("id")
      .in("role", ["admin", "super_admin"])
      .eq("is_active", true);

    if (adminsError) {
      console.error("Admin recipients lookup error:", adminsError);
    }

    const adminIds = (admins ?? []).map((item) => item.id);
    const adminIdSet = new Set(adminIds);

    // Include the original recipient unless this is an admin-only alert.
    const recipientIds = adminOnly
      ? [...new Set(adminIds)]
      : notifyAdmins
        ? [...new Set([userId, ...adminIds])]
        : [userId];

    if (recipientIds.length === 0) return;

    const excludedIds = new Set(excludeUserIds);

    const filteredRecipientIds = recipientIds.filter(
      (recipientId) => !excludedIds.has(recipientId),
    );

    // Check each recipient's notification preferences.
    if (preference && !critical) {
      const { data: settings, error: settingsError } = await admin
        .from("notification_settings")
        .select(
          "user_id, job_updates, message_notifications, payment_notifications",
        )
        .in("user_id", filteredRecipientIds);

      if (settingsError) {
        console.error("Notification settings lookup error:", settingsError);
        return;
      }

      const settingsByUser = new Map(
        (settings ?? []).map((setting) => [setting.user_id, setting]),
      );

      const allowedRecipients = filteredRecipientIds.filter((recipientId) => {
        // Administrators must always receive notifications.
        if (adminIdSet.has(recipientId)) return true;

        const recipientSettings = settingsByUser.get(recipientId);

        // No settings record means notifications are enabled by default.
        if (!recipientSettings) return true;

        return recipientSettings[preference] !== false;
      });

      filteredRecipientIds.length = 0;
      filteredRecipientIds.push(...allowedRecipients);
    }

    if (filteredRecipientIds.length === 0) return;

    // Give administrators separate wording where provided.
    const notifications = filteredRecipientIds.map((recipientId) => {
      const isAdmin = adminIdSet.has(recipientId);

      return {
        user_id: recipientId,
        type,
        title: isAdmin ? (adminTitle ?? title) : title,
        message: isAdmin ? (adminMessage ?? message) : message,
        link,
        is_read: false,
      };
    });

    const { error: insertError } = await admin
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      console.error("Notification creation error:", insertError);
    }
  } catch (error) {
    console.error("Create notification error:", error);
  }
}
