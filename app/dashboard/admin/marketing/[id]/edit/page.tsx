import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { MarketingEditForm } from "./marketing-edit-form";

export const dynamic = "force-dynamic";

export default async function EditMarketingCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "super_admin"]);

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: campaign, error } = await supabase
    .from("marketing_campaigns")
    .select(
      "id, title, subtitle, image_url, button_text, button_url, placement, is_active, starts_at, ends_at, sort_order",
    )
    .eq("id", id)
    .single();

  if (error || !campaign) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard/admin/marketing"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to marketing
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">
          Edit marketing campaign
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Update your campaign details and promotional banner.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 sm:p-7">
        <MarketingEditForm campaign={campaign} />
      </div>
    </div>
  );
}
