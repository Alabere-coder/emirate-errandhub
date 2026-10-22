import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  open: "bg-amber-100 text-amber-800",
  under_review: "bg-blue-100 text-blue-800",
  resolved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  closed: "bg-slate-100 text-slate-700",
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
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

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <ShieldCheck className="h-4 w-4" />
            Administration
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
            Dispute management
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Review issues reported by customers and workers. Payment refunds,
            earnings releases, and job status changes remain separate
            administrative decisions.
          </p>
        </div>

        <Card className="shrink-0 border-slate-200 shadow-none">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Matching disputes</p>
              <p className="text-2xl font-bold text-slate-900">
                {records.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const isActive = activeStatus === filter.value;

          return (
            <Button
              key={filter.value}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className="rounded-full"
            >
              <Link
                href={
                  filter.value === "all"
                    ? "/dashboard/admin/disputes"
                    : `/dashboard/admin/disputes?status=${filter.value}`
                }
              >
                {filter.label}
                <span className="ml-1 opacity-75">
                  {counts[filter.value] ?? 0}
                </span>
              </Link>
            </Button>
          );
        })}
      </div>

      {records.length === 0 ? (
        <Card className="border-dashed shadow-none">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
              <AlertTriangle className="h-6 w-6" />
            </div>

            <h2 className="mt-4 font-semibold text-slate-900">
              No disputes found
            </h2>

            <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
              There are no disputes matching this filter. New submissions will
              appear here when customers or workers report an issue.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.map((dispute) => {
            const status = (
              STATUS_STYLES[dispute.status as DisputeStatus]
                ? dispute.status
                : "open"
            ) as DisputeStatus;

            return (
              <Card key={dispute.id} className="border-slate-200 shadow-sm">
                <CardContent className="space-y-4 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}
                        >
                          {formatStatus(dispute.status)}
                        </span>

                        <span className="text-xs text-slate-500">
                          Submitted {formatDate(dispute.created_at)}
                        </span>
                      </div>

                      <h2 className="mt-3 text-lg font-semibold text-slate-900">
                        {dispute.reason}
                      </h2>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                        {dispute.description}
                      </p>
                    </div>

                    <Button variant="outline" className="shrink-0">
                      <Link
                        href={`/dashboard/admin/disputes/${dispute.id}`}
                        className="flex"
                      >
                        Review dispute
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  <div className="grid gap-3 border-t border-slate-100 pt-4 text-sm sm:grid-cols-2">
                    <div>
                      <p className="text-xs text-slate-500">Job reference</p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-700">
                        {dispute.job_id}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-slate-500">
                        Dispute reference
                      </p>
                      <p className="mt-1 break-all font-mono text-xs text-slate-700">
                        {dispute.id}
                      </p>
                    </div>
                  </div>

                  {dispute.resolution && (
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-medium text-slate-500">
                        Recorded resolution
                      </p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                        {dispute.resolution}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
