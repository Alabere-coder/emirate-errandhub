import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Megaphone } from "lucide-react";

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
      <div className="space-y-3">
        <Link
          href="/dashboard/admin/marketing"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to marketing
        </Link>

        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Megaphone className="size-5" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Edit marketing campaign
            </h1>

            <p className="mt-1 text-sm text-muted-foreground">
              Update your campaign details and promotional banner.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-7">
        <MarketingEditForm campaign={campaign} />
      </div>
    </div>
  );
}
