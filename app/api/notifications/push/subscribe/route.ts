import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type PushSubscriptionInput = {
  endpoint?: string;
  expirationTime?: number | null;
  keys?: {
    p256dh?: string;
    auth?: string;
  };
};

export async function POST(request: Request) {
  try {
    // Require an authenticated user.
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to enable push notifications." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      subscription?: PushSubscriptionInput;
    };

    const subscription = body.subscription;

    const endpoint = subscription?.endpoint;
    const p256dh = subscription?.keys?.p256dh;
    const authKey = subscription?.keys?.auth;

    if (
      typeof endpoint !== "string" ||
      typeof p256dh !== "string" ||
      typeof authKey !== "string" ||
      !endpoint.startsWith("https://") ||
      !p256dh ||
      !authKey
    ) {
      return NextResponse.json(
        { error: "Invalid browser push subscription." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    // Do not allow one account to take over another account's endpoint.
    const { data: existing, error: lookupError } = await admin
      .from("push_subscriptions")
      .select("id, user_id")
      .eq("endpoint", endpoint)
      .maybeSingle();

    if (lookupError) {
      console.error("Push subscription lookup error:", lookupError);

      return NextResponse.json(
        { error: "Unable to register this browser." },
        { status: 500 },
      );
    }

    if (existing && existing.user_id !== user.id) {
      return NextResponse.json(
        {
          error:
            "This browser subscription is already linked to another account.",
        },
        { status: 409 },
      );
    }

    const expirationTime = subscription.expirationTime;

    const { error: saveError } = await admin.from("push_subscriptions").upsert(
      {
        user_id: user.id,
        endpoint,
        p256dh_key: p256dh,
        auth_key: authKey,
        expiration_time:
          typeof expirationTime === "number"
            ? new Date(expirationTime).toISOString()
            : null,
        user_agent: request.headers.get("user-agent"),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" },
    );

    if (saveError) {
      console.error("Push subscription save error:", saveError);

      return NextResponse.json(
        { error: "Unable to save your push subscription." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Push notifications enabled for this browser.",
    });
  } catch (error) {
    console.error("Push subscription API error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please sign in to manage push notifications." },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      endpoint?: string;
    };

    if (
      typeof body.endpoint !== "string" ||
      !body.endpoint.startsWith("https://")
    ) {
      return NextResponse.json(
        { error: "Invalid push subscription endpoint." },
        { status: 400 },
      );
    }

    const admin = createAdminClient();

    const { error: deleteError } = await admin
      .from("push_subscriptions")
      .delete()
      .eq("endpoint", body.endpoint)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Push subscription delete error:", deleteError);

      return NextResponse.json(
        { error: "Unable to disable browser notifications." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Browser push notifications disabled.",
    });
  } catch (error) {
    console.error("Push subscription DELETE error:", error);

    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
