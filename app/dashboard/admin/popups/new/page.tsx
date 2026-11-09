import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { PopupCampaignForm } from "../popup-campaign-form";

export const dynamic = "force-dynamic";

export default async function NewPopupPage() {
  await requireRole(["admin", "super_admin"]);

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
          Create popup campaign
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Create a welcome message, announcement or promotion for visitors to
          Emirate ErrandHub.
        </p>
      </div>

      <div className="rounded-xl border bg-card p-5 sm:p-7">
        <PopupCampaignForm />
      </div>
    </div>
  );
}
