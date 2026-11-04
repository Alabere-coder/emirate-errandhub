import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { webpush, type BrowserPushPayload } from "@/lib/notifications/web-push";

type PushSubscriptionRow = {
  id: string;
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
};

export type BrowserPushResult = {
  status: "sent" | "failed" | "skipped";
  sent: number;
  failed: number;
  removed: number;
  error?: string;
};

function getPushErrorDetails(error: unknown) {
  if (typeof error !== "object" || error === null) {
    return {
      statusCode: undefined,
      message: "Unknown push delivery error.",
      body: undefined,
    };
  }

  const details = error as {
    statusCode?: number;
    message?: string;
    body?: string;
  };

  return {
    statusCode: details.statusCode,
    message: details.message || "Push delivery failed.",
    body: details.body,
  };
}

export async function sendBrowserPushNotification(
  userId: string,
  payload: BrowserPushPayload,
): Promise<BrowserPushResult> {
  const admin = createAdminClient();

  // Respect the user's push notification preference.
  const { data: settings, error: settingsError } = await admin
    .from("notification_settings")
    .select("push_notifications")
    .eq("user_id", userId)
    .maybeSingle();

  if (settingsError) {
    console.error("Push preference lookup failed:", settingsError);

    return {
      status: "failed",
      sent: 0,
      failed: 0,
      removed: 0,
      error: "Unable to check push notification preferences.",
    };
  }

  // If no preferences row exists, use the application's default (enabled).
  if (settings?.push_notifications === false) {
    return {
      status: "skipped",
      sent: 0,
      failed: 0,
      removed: 0,
    };
  }

  // Load all browsers registered by this user.
  const { data: subscriptions, error: subscriptionsError } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh_key, auth_key")
    .eq("user_id", userId);

  if (subscriptionsError) {
    console.error("Push subscription lookup failed:", subscriptionsError);

    return {
      status: "failed",
      sent: 0,
      failed: 0,
      removed: 0,
      error: "Unable to load browser subscriptions.",
    };
  }

  const rows = (subscriptions ?? []) as PushSubscriptionRow[];

  if (rows.length === 0) {
    return {
      status: "skipped",
      sent: 0,
      failed: 0,
      removed: 0,
    };
  }

  let sent = 0;
  let failed = 0;
  let removed = 0;

  for (const row of rows) {
    try {
      await webpush.sendNotification(
        {
          endpoint: row.endpoint,
          keys: {
            p256dh: row.p256dh_key,
            auth: row.auth_key,
          },
        },
        JSON.stringify(payload),
      );

      sent += 1;
    } catch (error) {
      const details = getPushErrorDetails(error);

      // 404 and 410 mean the browser subscription is no longer valid.
      if (details.statusCode === 404 || details.statusCode === 410) {
        const { error: deleteError } = await admin
          .from("push_subscriptions")
          .delete()
          .eq("id", row.id)
          .eq("user_id", userId);

        if (deleteError) {
          console.error(
            "Could not remove expired push subscription:",
            row.id,
            deleteError,
          );
          failed += 1;
        } else {
          removed += 1;
        }

        continue;
      }

      console.error("Browser push delivery failed:", {
        subscriptionId: row.id,
        statusCode: details.statusCode,
        message: details.message,
        body: details.body,
      });

      failed += 1;
    }
  }

  return {
    status: sent > 0 ? "sent" : failed > 0 ? "failed" : "skipped",
    sent,
    failed,
    removed,
  };
}
