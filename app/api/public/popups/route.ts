import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    let audience: string = "visitors";

    if (user) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      // Fail closed if an authenticated user's role cannot be verified.
      audience = profileError ? "unknown" : (profile?.role ?? "unknown");
    }

    const now = new Date().toISOString();

    const { data: campaigns, error } = await supabase
      .from("popup_campaigns")
      .select(
        `
          id,
          title,
          description,
          image_url,
          button_text,
          button_url,
          audience,
          frequency,
          priority,
          starts_at,
          ends_at,
          updated_at
        `,
      )
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${now}`)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to load popup campaigns:", error);

      return NextResponse.json(
        { error: "Unable to load popup campaigns." },
        { status: 500 },
      );
    }

    const eligibleCampaigns = (campaigns ?? []).filter((campaign) => {
      return campaign.audience === "everyone" || campaign.audience === audience;
    });

    return NextResponse.json(
      { campaigns: eligibleCampaigns },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    console.error("Public popup API error:", error);

    return NextResponse.json(
      { error: "Unable to load popup campaigns." },
      { status: 500 },
    );
  }
}
