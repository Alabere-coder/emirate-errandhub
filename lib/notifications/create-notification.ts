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
};

export async function createNotification({
  userId,
  type,
  title,
  message,
  link = null,
  preference,
  adminOnly = false,
}: CreateNotificationInput & { adminOnly?: boolean }) {
  try {
    const admin = createAdminClient();

    const { data: admins, error: adminsError } = await admin
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("is_active", true);

    if (adminsError) {
      console.error("Admin notification recipients lookup error:", adminsError);
      return;
    }

    const adminIds = (admins ?? []).map((adminUser) => adminUser.id);

    const recipientIds = adminOnly
      ? [...new Set(adminIds)]
      : [...new Set([userId, ...adminIds])];

    if (recipientIds.length === 0) return;

    if (preference) {
      const { data: settings, error: settingsError } = await admin
        .from("notification_settings")
        .select(
          "user_id, job_updates, message_notifications, payment_notifications",
        )
        .in("user_id", recipientIds);

      if (settingsError) {
        console.error("Notification settings lookup error:", settingsError);
        return;
      }

      const settingsByUser = new Map(
        (settings ?? []).map((setting) => [setting.user_id, setting]),
      );

      const allowedRecipients = recipientIds.filter((recipientId) => {
        const recipientSettings = settingsByUser.get(recipientId);

        if (!recipientSettings) return true;

        return recipientSettings[preference] !== false;
      });

      recipientIds.length = 0;
      recipientIds.push(...allowedRecipients);
    }

    if (recipientIds.length === 0) return;

    const notifications = recipientIds.map((recipientId) => ({
      user_id: recipientId,
      type,
      title,
      message,
      link,
      is_read: false,
    }));

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

// export async function createNotification({
//   userId,
//   type,
//   title,
//   message,
//   link = null,
//   preference,
// }: CreateNotificationInput) {
//   try {
//     const admin = createAdminClient();

//     // Find every active administrator.
//     const { data: admins, error: adminsError } = await admin
//       .from("profiles")
//       .select("id")
//       .eq("role", "admin")
//       .eq("is_active", true);

//     if (adminsError) {
//       console.error("Admin notification recipients lookup error:", adminsError);
//     }

//     // Include the original recipient and all active administrators.
//     // Set removes duplicates when the original recipient is an admin.
//     const recipientIds = [
//       ...new Set([userId, ...(admins ?? []).map((adminUser) => adminUser.id)]),
//     ];

//     // Check each recipient's notification preferences.
//     if (preference) {
//       const { data: settings, error: settingsError } = await admin
//         .from("notification_settings")
//         .select(
//           "user_id, job_updates, message_notifications, payment_notifications",
//         )
//         .in("user_id", recipientIds);

//       if (settingsError) {
//         console.error("Notification settings lookup error:", settingsError);
//         return;
//       }

//       const settingsByUser = new Map(
//         (settings ?? []).map((setting) => [setting.user_id, setting]),
//       );

//       const allowedRecipients = recipientIds.filter((recipientId) => {
//         const recipientSettings = settingsByUser.get(recipientId);

//         // No settings record means notifications are enabled by default.
//         if (!recipientSettings) return true;

//         return recipientSettings[preference] !== false;
//       });

//       recipientIds.length = 0;
//       recipientIds.push(...allowedRecipients);
//     }

//     if (recipientIds.length === 0) return;

//     // Insert one notification per recipient.
//     const notifications = recipientIds.map((recipientId) => ({
//       user_id: recipientId,
//       type,
//       title,
//       message,
//       link,
//       is_read: false,
//     }));

//     const { error: insertError } = await admin
//       .from("notifications")
//       .insert(notifications);

//     if (insertError) {
//       console.error("Notification creation error:", insertError);
//     }
//   } catch (error) {
//     console.error("Create notification error:", error);
//   }
// }
