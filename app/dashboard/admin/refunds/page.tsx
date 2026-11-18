import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CheckCircle2,
  Clock3,
  RefreshCcw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type Refund = {
  id: string;
  payment_id: string;
  transaction_id: string;
  customer_id: string;
  job_id: string;
  amount: number;
  currency: string;
  reason: string;
  admin_note: string | null;
  status: string;
  provider: string;
  provider_reference: string | null;
  requested_at: string;
  reviewed_at: string | null;
  processed_at: string | null;
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return "Not available";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(date));
}

function statusVariant(status: string) {
  switch (status) {
    case "processed":
      return "default" as const;
    case "requested":
    case "under_review":
      return "secondary" as const;
    case "rejected":
    case "failed":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: number;
  description: string;
  icon: LucideIcon;
  iconClass: string;
}) {
  return (
    <Card className="relative overflow-hidden border-border/60 shadow-sm">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-emerald-500/4 blur-2xl" />
      <CardContent className="relative flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>

        <div
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </CardContent>
    </Card>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`break-all text-sm font-medium ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

export default async function AdminRefundsPage() {
  await requireRole(["admin"]);

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("refunds")
    .select(
      "id, payment_id, transaction_id, customer_id, job_id, amount, currency, reason, admin_note, status, provider, provider_reference, requested_at, reviewed_at, processed_at",
    )
    .order("requested_at", { ascending: false });

  if (error) {
    console.error("Failed to load refunds:", error);
    throw new Error("Unable to load refund requests.");
  }

  const refunds = (data ?? []) as Refund[];

  const pendingCount = refunds.filter(
    (refund) =>
      refund.status === "requested" || refund.status === "under_review",
  ).length;

  const processingCount = refunds.filter(
    (refund) => refund.status === "approved" || refund.status === "processing",
  ).length;

  const processedCount = refunds.filter(
    (refund) => refund.status === "processed",
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-linear-to-br from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-8 text-white shadow-lg sm:px-8">
        <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
              <ShieldCheck className="h-3.5 w-3.5" />
              Finance &amp; payment operations
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Refund Management
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/75 sm:text-base">
              Review customer refund requests, monitor payment reversals, and
              keep track of refund processing.
            </p>
          </div>

          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner">
            <RefreshCcw className="h-8 w-8 text-emerald-100" />
          </div>
        </div>

        <div className="relative mt-7 flex flex-wrap gap-3 border-t border-white/15 pt-5 text-sm text-emerald-50/80">
          <span className="inline-flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            {refunds.length} total refund requests
          </span>
          <span className="hidden text-white/30 sm:inline">•</span>
          <span className="inline-flex items-center gap-2">
            <Clock3 className="h-4 w-4" />
            {pendingCount} awaiting review
          </span>
        </div>
      </section>

      {/* Summary */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Awaiting review"
          value={pendingCount}
          description="Requests requiring attention"
          icon={Clock3}
          iconClass="bg-amber-500/10 text-amber-600 dark:text-amber-400"
        />

        <StatCard
          title="Approved / Processing"
          value={processingCount}
          description="Refunds moving through processing"
          icon={Banknote}
          iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />

        <StatCard
          title="Successfully processed"
          value={processedCount}
          description="Completed refund requests"
          icon={CheckCircle2}
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
      </section>

      {/* Refund requests */}
      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Refund requests
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              All customer refund requests, ordered by submission date.
            </p>
          </div>

          <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
            {refunds.length} {refunds.length === 1 ? "request" : "requests"}
          </Badge>
        </div>

        {refunds.length === 0 ? (
          <Card className="overflow-hidden border-dashed shadow-sm">
            <CardContent className="flex flex-col items-center px-6 py-16 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <RefreshCcw className="h-8 w-8" />
              </div>

              <h3 className="text-lg font-semibold">No refund requests yet</h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
                Customer refund requests will appear here when they are
                submitted.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {refunds.map((refund) => (
              <Card
                key={refund.id}
                className="overflow-hidden border-border/60 shadow-sm transition-shadow hover:shadow-md"
              >
                <CardContent className="space-y-5 p-5 sm:p-6">
                  {/* Request heading */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                        <RefreshCcw className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <p className="font-semibold">Refund request</p>
                        <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                          {refund.id}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Submitted {formatDate(refund.requested_at)}
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={statusVariant(refund.status)}
                      className="w-fit shrink-0 capitalize"
                    >
                      {statusLabel(refund.status)}
                    </Badge>
                  </div>

                  {/* Amount and payment summary */}
                  <div className="grid gap-4 rounded-2xl border border-border/60 bg-muted/30 p-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Refund amount
                      </p>
                      <p className="mt-1 text-xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
                        {formatAmount(Number(refund.amount), refund.currency)}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Payment provider
                      </p>
                      <p className="mt-2 font-semibold capitalize">
                        {refund.provider.replaceAll("_", " ")}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Requested on
                      </p>
                      <p className="mt-2 text-sm font-medium">
                        {formatDate(refund.requested_at)}
                      </p>
                    </div>
                  </div>

                  {/* Customer reason */}
                  <div className="space-y-2">
                    <p className="text-sm font-semibold">Customer reason</p>
                    <div className="rounded-xl border border-border/60 bg-background p-4">
                      <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {refund.reason}
                      </p>
                    </div>
                  </div>

                  {/* Reference details */}
                  <div className="grid gap-x-6 gap-y-4 border-t border-border/60 pt-5 sm:grid-cols-2 lg:grid-cols-4">
                    <DetailItem
                      label="Customer ID"
                      value={refund.customer_id}
                      mono
                    />
                    <DetailItem label="Job ID" value={refund.job_id} mono />
                    <DetailItem
                      label="Payment ID"
                      value={refund.payment_id}
                      mono
                    />
                    <DetailItem
                      label="Transaction ID"
                      value={refund.transaction_id}
                      mono
                    />
                  </div>

                  {refund.provider_reference && (
                    <div className="rounded-xl bg-muted/40 px-4 py-3">
                      <DetailItem
                        label="Provider reference"
                        value={refund.provider_reference}
                        mono
                      />
                    </div>
                  )}

                  {/* Admin note */}
                  {refund.admin_note && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/4 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        Admin note
                      </p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {refund.admin_note}
                      </p>
                    </div>
                  )}

                  {/* Review action */}
                  <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-muted-foreground">
                      {refund.reviewed_at
                        ? `Reviewed ${formatDate(refund.reviewed_at)}`
                        : "Awaiting administrative review"}
                      {refund.processed_at
                        ? ` · Processed ${formatDate(refund.processed_at)}`
                        : ""}
                    </div>

                    <Link
                      href={`/dashboard/admin/refunds/${refund.id}`}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                    >
                      Review refund
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
