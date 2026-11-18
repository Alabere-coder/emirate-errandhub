import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  TicketPercent,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createDiscountCode } from "@/lib/actions/admin-discounts";

import { DiscountCodeForm } from "../discount-code-form";

export const dynamic = "force-dynamic";

export default async function NewDiscountCodePage() {
  await requireRole(["admin", "super_admin"]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-xl shadow-emerald-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/3 size-72 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner">
              <TicketPercent className="size-6" />
            </div>

            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
              Promotions management
            </p>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Create Discount Code
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-emerald-50/80 sm:text-base">
              Set up a promotional offer for your customers. Define the
              discount, usage limits, eligibility requirements, and validity
              period.
            </p>
          </div>

          <div className="hidden shrink-0 items-center justify-center rounded-3xl border border-white/15 bg-white/10 p-5 sm:flex">
            <TicketPercent
              className="size-16 text-emerald-100"
              strokeWidth={1.2}
            />
          </div>
        </div>
      </section>

      {/* Form introduction */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            Discount configuration
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Complete the details below to create your promotional code.
          </p>
        </div>

        <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="size-3.5" />
          Admin controlled
        </div>
      </div>

      {/* Form */}
      <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6 lg:p-8">
        <DiscountCodeForm
          action={createDiscountCode}
          submitLabel="Create Discount Code"
        />
      </div>
    </div>
  );
}
