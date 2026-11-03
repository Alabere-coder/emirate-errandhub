import { NextResponse } from "next/server";

import { sendNotificationEmail } from "@/lib/email/send-notification-email";
import { requireRole } from "@/lib/auth/require-role";

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
        {
          error:
            "Add RESEND_TEST_EMAIL to .env.local using your verified Resend account email.",
        },
        { status: 400 },
      );
    }

    const result = await sendNotificationEmail({
      to: testEmail,
      title: "Emirate ErrandHub email test",
      message:
        "Your Resend email integration is working. This is a development test, and no customer notification was triggered.",
      link: "/dashboard/admin/settings",
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error ?? "Email sending failed." },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test email accepted by Resend.",
      id: result.id,
    });
  } catch (error) {
    console.error("Test email endpoint error:", error);

    return NextResponse.json(
      { error: "Unable to send the test email." },
      { status: 500 },
    );
  }
}
