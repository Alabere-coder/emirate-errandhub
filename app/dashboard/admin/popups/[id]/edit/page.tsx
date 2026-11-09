import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { PopupCampaignForm } from "../../popup-campaign-form";

export const dynamic = "force-dynamic";

type PopupCampaign = {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  image_path: string | null;
  button_text: string | null;
  button_url: string | null;
  audience: string;
  frequency: string;
  starts_at: string | null;
  ends_at: string | null;
  priority: number;
  is_active: boolean;
};

export default async function EditPopupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireRole(["admin", "super_admin"]);

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: campaign, error } = await supabase
    .from("popup_campaigns")
    .select(
      "id, title, description, image_url, image_path, button_text, button_url, audience, frequency, starts_at, ends_at, priority, is_active",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Load popup campaign error:", error);
    throw new Error("Unable to load popup campaign.");
  }

  if (!campaign) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/dashboard/admin/popups"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to popups
        </Link>

        <h1 className="text-2xl font-bold tracking-tight">
          Edit popup campaign
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Update the popup message, audience, schedule and display settings.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 sm:p-7">
        <PopupCampaignForm campaign={campaign as PopupCampaign} />
      </div>
    </div>
  );
}
