import Link from "next/link";

import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  ShieldX,
  ClipboardList,
  Scale,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  status?: string;
}>;

const FILTERS = [
  { label: "All disputes", value: "all" },
  { label: "Open", value: "open" },
  { label: "Under review", value: "under_review" },
  { label: "Resolved", value: "resolved" },
  { label: "Rejected", value: "rejected" },
  { label: "Closed", value: "closed" },
] as const;

type DisputeStatus =
  | "open"
  | "under_review"
  | "resolved"
  | "rejected"
  | "closed";

const STATUS_STYLES: Record<DisputeStatus, string> = {
  open: "border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400",
  under_review:
    "border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-400",
  resolved:
    "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  rejected: "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-400",
  closed: "border-border bg-muted text-muted-foreground",
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Africa/Lagos",
  }).format(date);
}

function SummaryCard({
  label,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ElementType;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>

          <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-foreground">
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>

        <div className={`rounded-xl p-3 ${iconClass}`}>
          <Icon className="size-5" />
        </div>
      </div>
    </div>
  );
}

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(["admin"]);

  const params = await searchParams;
  const supabase = createAdminClient();

  const requestedStatus = params.status ?? "all";
  const validStatuses = FILTERS.map((filter) => filter.value);

  const activeStatus = validStatuses.includes(
    requestedStatus as (typeof validStatuses)[number],
  )
    ? requestedStatus
    : "all";

  let query = supabase
    .from("disputes")
    .select(
      "id, job_id, opened_by, reason, description, status, resolution, created_at, resolved_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (activeStatus !== "all") {
    query = query.eq("status", activeStatus);
  }

  const { data: disputes, error } = await query;

  if (error) {
    console.error("Admin disputes query failed:", error.message);
    throw new Error("Unable to load disputes.");
  }

  const records = disputes ?? [];

  const counts = Object.fromEntries(
    FILTERS.map((filter) => [
      filter.value,
      filter.value === "all"
        ? records.length
        : records.filter((dispute) => dispute.status === filter.value).length,
    ]),
  );

  const openCount = records.filter(
    (dispute) => dispute.status === "open",
  ).length;

  const reviewingCount = records.filter(
    (dispute) => dispute.status === "under_review",
  ).length;

  const resolvedCount = records.filter(
    (dispute) => dispute.status === "resolved",
  ).length;

  const rejectedCount = records.filter(
    (dispute) => dispute.status === "rejected",
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-7 p-4 md:p-6">
      {/* Page header */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-lg md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 size-56 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
              <ShieldCheck className="size-3.5" />
              Administration / Trust & Safety
            </div>

            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
              Dispute management
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/80 md:text-base">
              Review issues reported by customers and workers, investigate
              disputes, and document your administrative decisions.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
            <div className="rounded-xl bg-white/10 p-3">
              <Scale className="size-6 text-emerald-200" />
            </div>

            <div>
              <p className="text-2xl font-bold tabular-nums">
                {records.length}
              </p>
              <p className="text-xs text-emerald-100/80">Matching disputes</p>
            </div>
          </div>
        </div>
      </section>

      {/* Administrative responsibility notice */}
      <div className="flex items-start gap-3 rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="mt-0.5 rounded-lg bg-blue-500/10 p-2 text-blue-700 dark:text-blue-400">
          <ShieldCheck className="size-4" />
        </div>

        <div>
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">
            Administrative review
          </p>

          <p className="mt-1 text-sm leading-6 text-blue-700/90 dark:text-blue-400/90">
            Payment refunds, earnings releases, and job status changes remain
            separate administrative decisions from dispute review.
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Open disputes"
          value={openCount}
          description="Awaiting investigation"
          icon={AlertTriangle}
          iconClass="bg-amber-500/10 text-amber-700 dark:text-amber-400"
        />

        <SummaryCard
          label="Under review"
          value={reviewingCount}
          description="Currently being investigated"
          icon={Clock3}
          iconClass="bg-blue-500/10 text-blue-700 dark:text-blue-400"
        />

        <SummaryCard
          label="Resolved"
          value={resolvedCount}
          description="Successfully resolved"
          icon={CheckCircle2}
          iconClass="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        />

        <SummaryCard
          label="Rejected"
          value={rejectedCount}
          description="Disputes not upheld"
          icon={ShieldX}
          iconClass="bg-red-500/10 text-red-700 dark:text-red-400"
        />
      </section>

      {/* Filters */}
      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            Dispute records
          </h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Filter disputes by their current status.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((filter) => {
            const isActive = activeStatus === filter.value;

            return (
              <Link
                key={filter.value}
                href={
                  filter.value === "all"
                    ? "/dashboard/admin/disputes"
                    : `/dashboard/admin/disputes?status=${filter.value}`
                }
                aria-current={isActive ? "page" : undefined}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground"
                }`}
              >
                {filter.label}

                <span
                  className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${
                    isActive
                      ? "bg-white/15 text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {counts[filter.value] ?? 0}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Dispute list */}
      {records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <ClipboardList className="size-7" />
          </div>

          <h3 className="mt-4 font-semibold text-foreground">
            No disputes found
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            There are no disputes matching this filter. New submissions will
            appear here when customers or workers report an issue.
          </p>

          {activeStatus !== "all" && (
            <Link
              href="/dashboard/admin/disputes"
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              View all disputes
              <ArrowRight className="size-4" />
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {records.map((dispute) => {
            const status = (
              STATUS_STYLES[dispute.status as DisputeStatus]
                ? dispute.status
                : "open"
            ) as DisputeStatus;

            return (
              <article
                key={dispute.id}
                className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <div className="space-y-4 p-4 md:p-5">
                  {/* Status and submission date */}
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${STATUS_STYLES[status]}`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        {formatStatus(dispute.status)}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        Submitted {formatDate(dispute.created_at)}
                      </span>
                    </div>

                    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                      <FileText className="size-3.5" />
                      Dispute record
                    </span>
                  </div>

                  {/* Reason and description */}
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">
                        {dispute.reason}
                      </h3>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                        {dispute.description}
                      </p>
                    </div>

                    <Link
                      href={`/dashboard/admin/disputes/${dispute.id}`}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      Review dispute
                      <ArrowRight className="size-4" />
                    </Link>
                  </div>

                  {/* References */}
                  <div className="grid gap-3 rounded-xl border border-border/70 bg-muted/40 p-4 sm:grid-cols-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        Job reference
                      </p>

                      <p className="mt-1 break-all font-mono text-xs text-foreground">
                        {dispute.job_id}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-medium text-muted-foreground">
                        Dispute reference
                      </p>

                      <p className="mt-1 break-all font-mono text-xs text-foreground">
                        {dispute.id}
                      </p>
                    </div>
                  </div>

                  {/* Recorded resolution */}
                  {dispute.resolution && (
                    <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="size-4" />
                        Recorded resolution
                      </div>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">
                        {dispute.resolution}
                      </p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Showing up to 500 disputes, ordered by most recently submitted.
      </p>
    </div>
  );
}
