import Link from "next/link";
import {
  ArrowLeft,
  Megaphone,
  Sparkles,
  ShieldCheck,
  ImagePlus,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { MarketingCampaignForm } from "./marketing-campaign-form";

export const dynamic = "force-dynamic";

export default async function NewMarketingCampaignPage() {
  await requireRole(["admin", "super_admin"]);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Page header */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-linear-to-br from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-8 text-white shadow-lg sm:px-8">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-card/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
              <Sparkles className="h-3.5 w-3.5" />
              Marketing &amp; promotions
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Create a campaign
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/75 sm:text-base">
              Design a promotional banner or announcement to showcase services,
              communicate updates and highlight special offers across Emirate
              ErrandHub.
            </p>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-card/10 shadow-inner">
            <Megaphone className="h-8 w-8 text-emerald-100" />
          </div>
        </div>
      </section>

      {/* Form introduction */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <ImagePlus className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
          <h2 className="text-xl font-bold tracking-tight">Campaign details</h2>
        </div>

        <p className="text-sm leading-6 text-muted-foreground">
          Enter your campaign content, choose where it should appear, and
          configure its visibility and schedule.
        </p>
      </div>

      {/* Campaign form */}
      <section className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
        <div className="border-b border-border/60 bg-muted/20 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <Megaphone className="h-5 w-5" />
            </div>

            <div>
              <h3 className="font-semibold">Campaign configuration</h3>
              <p className="text-xs text-muted-foreground">
                Complete the information below to create your campaign.
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-7">
          <MarketingCampaignForm />
        </div>
      </section>
    </div>
  );
}
