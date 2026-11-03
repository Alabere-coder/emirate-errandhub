import { NextResponse } from "next/server";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/email/send-notification-email";

export const dynamic = "force-dynamic";

export async function POST() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json(
      { error: "This test endpoint is only available in development." },
      { status: 404 },
    );
  }

  try {
    await requireRole(["admin"]);

    const testEmail = process.env.RESEND_TEST_EMAIL;

    if (!testEmail) {
      return NextResponse.json(
        { error: "RESEND_TEST_EMAIL is not configured." },
        { status: 500 },
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unable to identify the signed-in user." },
        { status: 401 },
      );
    }

    const admin = createAdminClient();

    // Create an in-app test notification for the signed-in admin.
    const { error: notificationError } = await admin
      .from("notifications")
      .insert({
        user_id: user.id,
        type: "email_integration_test",
        title: "ErrandHub notification email test",
        message:
          "This test confirms that the notification email integration is working.",
        link: "/dashboard/admin/settings",
        is_read: false,
      });

    if (notificationError) {
      console.error("Test notification creation error:", notificationError);

      return NextResponse.json(
        { error: "Unable to create the test notification." },
        { status: 500 },
      );
    }

    // Send the test email to the verified Resend account address.
    const emailResult = await sendNotificationEmail({
      to: testEmail,
      title: "ErrandHub notification email test",
      message:
        "Your notification email integration is working. This is a development-only test.",
      link: "/dashboard/admin/settings",
    });

    if (!emailResult.success) {
      console.error(
        "Test notification email delivery error:",
        emailResult.error,
      );

      return NextResponse.json({
        success: false,
        notificationCreated: true,
        emailSent: false,
        message:
          "The in-app notification was created, but the test email could not be delivered.",
      });
    }

    return NextResponse.json({
      success: true,
      notificationCreated: true,
      emailSent: true,
      message: `Test notification created and email sent to ${testEmail}.`,
    });
  } catch (error) {
    console.error("Test notification email error:", error);

    return NextResponse.json(
      { error: "Unable to complete the notification email test." },
      { status: 500 },
    );
  }
}
