import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/email/send-notification-email";

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

const criticalNotificationTypes = new Set([
  "payment_successful",
  "dispute_opened",
  "dispute_under_review",
  "support_admin_reply",
  "support_status_updated",
  "support_ticket_reply",
]);

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
  try {
    const admin = createAdminClient();

    const isCritical = critical || criticalNotificationTypes.has(type);

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

    // Determine notification recipients.
    const recipientIds = adminOnly
      ? [...new Set(adminIds)]
      : notifyAdmins
        ? [...new Set([userId, ...adminIds])]
        : [userId];

    if (recipientIds.length === 0) return;

    const excludedIds = new Set(excludeUserIds);

    let filteredRecipientIds = recipientIds.filter(
      (recipientId) => !excludedIds.has(recipientId),
    );

    if (filteredRecipientIds.length === 0) return;

    // Load recipient preferences.
    const { data: settings, error: settingsError } = await admin
      .from("notification_settings")
      .select(
        "user_id, email_notifications, job_updates, message_notifications, payment_notifications",
      )
      .in("user_id", filteredRecipientIds);

    if (settingsError) {
      console.error("Notification settings lookup error:", settingsError);

      // Preserve the previous behavior for category-filtered notifications.
      if (preference) return;
    }

    const settingsByUser = new Map(
      (settings ?? []).map((setting) => [setting.user_id, setting]),
    );

    // Respect activity preferences unless the notification is critical.
    if (preference && !isCritical) {
      filteredRecipientIds = filteredRecipientIds.filter((recipientId) => {
        // Administrators always receive in-app alerts.
        if (adminIdSet.has(recipientId)) return true;

        const recipientSettings = settingsByUser.get(recipientId);

        // Missing preferences default to enabled.
        if (!recipientSettings) return true;

        return recipientSettings[preference] !== false;
      });
    }

    if (filteredRecipientIds.length === 0) return;

    // Prepare in-app notifications.
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

    // Insert in-app notifications first.
    const { error: insertError } = await admin
      .from("notifications")
      .insert(notifications);

    if (insertError) {
      console.error("Notification creation error:", insertError);
      return;
    }

    // Do not attempt email delivery if preferences could not be loaded.
    if (settingsError) return;

    // Select recipients allowed to receive email.
    const emailRecipientIds = filteredRecipientIds.filter((recipientId) => {
      if (isCritical) return true;

      const recipientSettings = settingsByUser.get(recipientId);

      // Missing preference records default to enabled.
      return recipientSettings?.email_notifications !== false;
    });

    if (emailRecipientIds.length === 0) return;

    // Send emails independently so one failure does not affect other recipients.
    const emailResults = await Promise.allSettled(
      emailRecipientIds.map(async (recipientId) => {
        const { data, error } = await admin.auth.admin.getUserById(recipientId);

        if (error) {
          console.error(
            `Unable to retrieve email for notification recipient ${recipientId}:`,
            error,
          );
          return;
        }

        const email = data.user?.email;

        if (!email) {
          console.error(
            `No email address found for notification recipient ${recipientId}.`,
          );
          return;
        }

        const isAdmin = adminIdSet.has(recipientId);

        const result = await sendNotificationEmail({
          to: email,
          title: isAdmin ? (adminTitle ?? title) : title,
          message: isAdmin ? (adminMessage ?? message) : message,
          link,
        });

        if (!result.success) {
          console.error(
            `Email notification failed for ${recipientId}:`,
            result.error,
          );
        }
      }),
    );

    emailResults.forEach((result) => {
      if (result.status === "rejected") {
        console.error("Unexpected email notification error:", result.reason);
      }
    });
  } catch (error) {
    console.error("Create notification error:", error);
  }
}

// import "server-only";

// import { createAdminClient } from "@/lib/supabase/admin";
// import { sendNotificationEmail } from "@/lib/email/send-notification-email";

// type CreateNotificationInput = {
//   userId: string;
//   type: string;
//   title: string;
//   message: string;
//   link?: string | null;
//   preference?:
//     | "job_updates"
//     | "message_notifications"
//     | "payment_notifications";
//   critical?: boolean;
//   adminTitle?: string;
//   adminMessage?: string;
//   adminOnly?: boolean;
//   notifyAdmins?: boolean;
//   excludeUserIds?: string[];
// };

// const criticalNotificationTypes = new Set([
//   "payment_successful",
//   "dispute_opened",
//   "dispute_under_review",
//   "support_admin_reply",
//   "support_status_updated",
//   "support_ticket_reply",
// ]);

// export async function createNotification({
//   userId,
//   type,
//   title,
//   message,
//   link = null,
//   preference,
//   critical = false,
//   adminTitle,
//   adminMessage,
//   adminOnly = false,
//   notifyAdmins = true,
//   excludeUserIds = [],
// }: CreateNotificationInput) {
//   const admin = createAdminClient();

//   try {
//     // Find all active administrators.
//     const { data: admins, error: adminsError } = await admin
//       .from("profiles")
//       .select("id")
//       .in("role", ["admin", "super_admin"])
//       .eq("is_active", true);

//     if (adminsError) {
//       console.error("Admin recipients lookup error:", adminsError);
//     }

//     const adminIds = (admins ?? []).map((item) => item.id);
//     const adminIdSet = new Set(adminIds);

//     // Include the original recipient unless this is an admin-only alert.
//     const recipientIds = adminOnly
//       ? [...new Set(adminIds)]
//       : notifyAdmins
//         ? [...new Set([userId, ...adminIds])]
//         : [userId];

//     if (recipientIds.length === 0) return;

//     const excludedIds = new Set(excludeUserIds);

//     const filteredRecipientIds = recipientIds.filter(
//       (recipientId) => !excludedIds.has(recipientId),
//     );

//     // Check each recipient's notification preferences.
//     const isCritical = critical || criticalNotificationTypes.has(type);

//     if (preference && !isCritical) {
//       const { data: settings, error: settingsError } = await admin
//         .from("notification_settings")
//         .select(
//           "user_id, job_updates, message_notifications, payment_notifications",
//         )
//         .in("user_id", filteredRecipientIds);

//       if (settingsError) {
//         console.error("Notification settings lookup error:", settingsError);
//         return;
//       }

//       const settingsByUser = new Map(
//         (settings ?? []).map((setting) => [setting.user_id, setting]),
//       );

//       const allowedRecipients = filteredRecipientIds.filter((recipientId) => {
//         // Administrators must always receive notifications.
//         if (adminIdSet.has(recipientId)) return true;

//         const recipientSettings = settingsByUser.get(recipientId);

//         // No settings record means notifications are enabled by default.
//         if (!recipientSettings) return true;

//         return recipientSettings[preference] !== false;
//       });

//       filteredRecipientIds.length = 0;
//       filteredRecipientIds.push(...allowedRecipients);
//     }

//     if (filteredRecipientIds.length === 0) return;

//     // Give administrators separate wording where provided.
//     const notifications = filteredRecipientIds.map((recipientId) => {
//       const isAdmin = adminIdSet.has(recipientId);

//       return {
//         user_id: recipientId,
//         type,
//         title: isAdmin ? (adminTitle ?? title) : title,
//         message: isAdmin ? (adminMessage ?? message) : message,
//         link,
//         is_read: false,
//       };
//     });

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
