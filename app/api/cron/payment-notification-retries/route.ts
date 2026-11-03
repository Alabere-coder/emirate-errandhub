import { NextResponse } from "next/server";

import { retryPendingPaymentNotificationEmails } from "@/lib/notifications/payment-notification-delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET is not configured.");

    return NextResponse.json(
      { error: "Cron authentication is not configured." },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await retryPendingPaymentNotificationEmails();

    return NextResponse.json({
      success: true,
      message: "Payment email retry process completed.",
    });
  } catch (error) {
    console.error("Payment notification retry endpoint failed:", error);

    return NextResponse.json(
      { error: "Payment notification retry failed." },
      { status: 500 },
    );
  }
}
