import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("notifications")
    .select("id, type, title, message, link, is_read, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Failed to fetch notifications:", error);

    return NextResponse.json(
      { error: "Unable to fetch notifications." },
      { status: 500 },
    );
  }

  const unreadCount = data.filter(
    (notification) => !notification.is_read,
  ).length;

  return NextResponse.json({
    notifications: data,
    unreadCount,
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { notificationId?: string; markAll?: boolean };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  let query = supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (body.markAll === true) {
    // Mark all unread notifications as read.
  } else if (
    typeof body.notificationId === "string" &&
    UUID_REGEX.test(body.notificationId)
  ) {
    query = query.eq("id", body.notificationId);
  } else {
    return NextResponse.json(
      { error: "A valid notification ID or markAll flag is required." },
      { status: 400 },
    );
  }

  const { error } = await query;

  if (error) {
    console.error("Failed to update notification:", error);

    return NextResponse.json(
      { error: "Unable to update notification." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { notificationId?: string; deleteAll?: boolean };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  if (body.deleteAll === true) {
    const { data, error } = await supabase
      .from("notifications")
      .delete()
      .eq("user_id", user.id)
      .select("id");

    if (error) {
      console.error("Failed to delete all notifications:", error);

      return NextResponse.json(
        { error: "Unable to clear notifications." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      deletedCount: data.length,
    });
  }

  if (
    typeof body.notificationId !== "string" ||
    !UUID_REGEX.test(body.notificationId)
  ) {
    return NextResponse.json(
      { error: "A valid notification ID or deleteAll flag is required." },
      { status: 400 },
    );
  }

  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", body.notificationId)
    .eq("user_id", user.id);

  if (error) {
    console.error("Failed to delete notification:", error);

    return NextResponse.json(
      { error: "Unable to delete notification." },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true });
}

// import { NextResponse } from "next/server";

// import { createClient } from "@/lib/supabase/server";

// export async function GET() {
//   const supabase = await createClient();

//   const {
//     data: { user },
//     error: authError,
//   } = await supabase.auth.getUser();

//   if (authError || !user) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const { data, error } = await supabase
//     .from("notifications")
//     .select("id, type, title, message, link, is_read, created_at")
//     .eq("user_id", user.id)
//     .order("created_at", { ascending: false })
//     .limit(50);

//   if (error) {
//     console.error("Failed to fetch notifications:", error);

//     return NextResponse.json(
//       { error: "Unable to fetch notifications." },
//       { status: 500 },
//     );
//   }

//   const unreadCount = data.filter(
//     (notification) => !notification.is_read,
//   ).length;

//   return NextResponse.json({
//     notifications: data,
//     unreadCount,
//   });
// }

// export async function PATCH(request: Request) {
//   const supabase = await createClient();

//   const {
//     data: { user },
//     error: authError,
//   } = await supabase.auth.getUser();

//   if (authError || !user) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   let body: { notificationId?: string; markAll?: boolean };

//   try {
//     body = await request.json();
//   } catch {
//     return NextResponse.json(
//       { error: "Invalid request body." },
//       { status: 400 },
//     );
//   }

//   let query = supabase
//     .from("notifications")
//     .update({ is_read: true })
//     .eq("user_id", user.id)
//     .eq("is_read", false);

//   if (body.markAll === true) {
//     // Mark all unread notifications as read.
//   } else if (
//     typeof body.notificationId === "string" &&
//     /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
//       body.notificationId,
//     )
//   ) {
//     query = query.eq("id", body.notificationId);
//   } else {
//     return NextResponse.json(
//       { error: "A valid notification ID or markAll flag is required." },
//       { status: 400 },
//     );
//   }

//   const { error } = await query;

//   if (error) {
//     console.error("Failed to update notification:", error);

//     return NextResponse.json(
//       { error: "Unable to update notification." },
//       { status: 500 },
//     );
//   }

//   return NextResponse.json({ success: true });
// }
