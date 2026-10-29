import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const AVATAR_BUCKET = "avatars";

function isValidAvatarUrl(url: string, supabaseUrl: string) {
  try {
    const parsed = new URL(url);
    const expected = new URL(supabaseUrl);

    return (
      parsed.origin === expected.origin &&
      parsed.pathname.startsWith("/storage/v1/object/public/avatars/")
    );
  } catch {
    return false;
  }
}

export async function PATCH(request: Request) {
  try {
    const { user } = await requireRole(["admin"]);
    const body = await request.json();

    const avatarUrl = body?.avatarUrl;

    if (
      typeof avatarUrl !== "string" ||
      !isValidAvatarUrl(avatarUrl, process.env.NEXT_PUBLIC_SUPABASE_URL!)
    ) {
      return NextResponse.json(
        { error: "Invalid profile picture URL." },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Avatar profile update error:", error);

      return NextResponse.json(
        { error: "Unable to save profile picture." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Avatar update error:", error);

    return NextResponse.json(
      { error: "Unable to update profile picture." },
      { status: 500 },
    );
  }
}

export async function DELETE() {
  try {
    const { user } = await requireRole(["admin"]);
    const supabase = await createClient();

    const { error } = await supabase
      .from("profiles")
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    if (error) {
      console.error("Avatar removal error:", error);

      return NextResponse.json(
        { error: "Unable to remove profile picture." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Avatar removal error:", error);

    return NextResponse.json(
      { error: "Unable to remove profile picture." },
      { status: 500 },
    );
  }
}
