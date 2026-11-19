import Link from "next/link";
import {
  ArrowLeft,
  ImagePlus,
  Megaphone,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { PopupCampaignForm } from "../popup-campaign-form";

export const dynamic = "force-dynamic";

export default async function NewPopupPage() {
  await requireRole(["admin", "super_admin"]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-lg shadow-emerald-950/10 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/3 size-64 rounded-full bg-teal-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-card/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
                <Sparkles className="size-3.5" />
                Popup campaign management
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Create a popup campaign
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/80 sm:text-base">
                Create a welcome message, announcement or promotion to engage
                visitors and customers on Emirate ErrandHub.
              </p>
            </div>

            <div className="hidden size-20 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-card/10 shadow-inner sm:flex">
              <Megaphone className="size-10 text-emerald-100" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px] lg:items-start">
        <section className="min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="border-b bg-muted/20 px-5 py-4 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ImagePlus className="size-5" />
              </div>

              <div>
                <h2 className="font-semibold tracking-tight">
                  Campaign information
                </h2>
                <p className="text-sm text-muted-foreground">
                  Configure the content, audience and display settings.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-7">
            <PopupCampaignForm />
          </div>
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-3 flex size-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="size-5" />
            </div>

            <h3 className="font-semibold">Before publishing</h3>

            <ul className="mt-3 space-y-3 text-sm leading-5 text-muted-foreground">
              <li className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                Use a clear title and concise description.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                Choose the audience that should see the popup.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                Set the display frequency to control repeat appearances.
              </li>
              <li className="flex gap-2">
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-500" />
                Check the image and button destination before activating.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5">
            <h3 className="text-sm font-semibold">Campaign visibility</h3>
            <p className="mt-2 text-sm leading-5 text-muted-foreground">
              Pay attention to the active status and campaign schedule. These
              determine when an eligible visitor can see the popup.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
