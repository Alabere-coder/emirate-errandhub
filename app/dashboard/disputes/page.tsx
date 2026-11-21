import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  ShieldAlert,
  ShieldCheck,
  Clock3,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BriefcaseBusiness,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type DisputeStatus =
  | "open"
  | "under_review"
  | "resolved"
  | "rejected"
  | "closed";

type DisputeRow = {
  id: string;
  job_id: string;
  reason: string;
  description: string;
  status: DisputeStatus;
  resolution: string | null;
  created_at: string;
  updated_at: string;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function statusStyles(status: DisputeStatus) {
  switch (status) {
    case "resolved":
      return {
        label: "Resolved",
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300",
        icon: CheckCircle2,
      };

    case "rejected":
      return {
        label: "Rejected",
        className:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300",
        icon: XCircle,
      };

    case "under_review":
      return {
        label: "Under review",
        className:
          "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/70 dark:bg-blue-950/50 dark:text-blue-300",
        icon: Clock3,
      };

    case "closed":
      return {
        label: "Closed",
        className: "border-border bg-muted text-muted-foreground",
        icon: ShieldCheck,
      };

    default:
      return {
        label: "Open",
        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/70 dark:bg-amber-950/50 dark:text-amber-300",
        icon: AlertCircle,
      };
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function MyDisputesPage() {
  const { user, supabase } = await requireRole(["customer", "worker"]);

  const { data: disputes, error } = await supabase
    .from("disputes")
    .select(
      "id, job_id, reason, description, status, resolution, created_at, updated_at",
    )
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("My disputes query failed:", error.message);

    return (
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="relative overflow-hidden rounded-3xl border border-red-200 bg-card p-7 shadow-sm dark:border-red-900/70 sm:p-9">
          <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-red-500/5 blur-3xl" />

          <div className="relative z-10">
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <ShieldAlert className="size-6" />
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              My Disputes
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
              We couldn't retrieve your dispute information at the moment.
              Please try again.
            </p>
          </div>
        </div>

        <Card className="rounded-2xl border-red-200 bg-card shadow-sm dark:border-red-900/70">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-950/50 dark:text-red-400">
              <AlertCircle className="size-6" />
            </div>

            <p className="text-sm font-medium text-foreground">
              Unable to load your disputes.
            </p>

            <Link
              href="/dashboard"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground transition hover:bg-muted"
            >
              Back to dashboard
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const disputeList = (disputes ?? []) as DisputeRow[];

  const openCount = disputeList.filter(
    (dispute) => dispute.status === "open",
  ).length;

  const reviewCount = disputeList.filter(
    (dispute) => dispute.status === "under_review",
  ).length;

  const resolvedCount = disputeList.filter(
    (dispute) => dispute.status === "resolved" || dispute.status === "closed",
  ).length;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-2 pb-10">
      {/* Page header */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 p-6 shadow-sm sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-24 size-64 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 size-40 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-emerald-100">
              <ShieldCheck className="size-3.5" />
              Support & Resolution Centre
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              My Disputes
            </h1>

            <p className="mt-2 text-sm leading-6 text-emerald-100/80 sm:text-base">
              Keep track of reported issues, monitor review progress, and view
              the decisions made by our support team.
            </p>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-white/20"
          >
            Back to dashboard
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>

      {/* Summary cards */}
      {disputeList.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="group rounded-2xl border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total disputes
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  {disputeList.length}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  All your reported issues
                </p>
              </div>

              <div className="flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground transition group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:group-hover:bg-emerald-950/50 dark:group-hover:text-emerald-300">
                <ClipboardList className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="group rounded-2xl border-amber-200 bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-amber-900/70">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  Awaiting resolution
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  {openCount + reviewCount}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Open or under review
                </p>
              </div>

              <div className="flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <Clock3 className="size-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="group rounded-2xl border-emerald-200 bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-emerald-900/70">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  Resolved
                </p>

                <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
                  {resolvedCount}
                </p>

                <p className="mt-1 text-xs text-muted-foreground">
                  Resolved or closed disputes
                </p>
              </div>

              <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                <ShieldCheck className="size-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Disputes list */}
      {disputeList.length === 0 ? (
        <Card className="overflow-hidden rounded-3xl border-border bg-card shadow-sm">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center sm:py-20">
            <div className="mb-5 flex size-20 items-center justify-center rounded-3xl border border-emerald-200 bg-emerald-50 text-emerald-600 shadow-sm dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-400">
              <ShieldAlert className="size-9" />
            </div>

            <h2 className="text-xl font-bold tracking-tight text-foreground">
              No disputes yet
            </h2>

            <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
              You haven't reported any issues with your jobs. When you open a
              dispute, you can follow its progress and view any recorded
              resolution here.
            </p>

            <Link
              href="/dashboard"
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              Return to dashboard
              <ArrowRight className="size-4" />
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">
                Dispute history
              </h2>

              <p className="mt-1 text-xs text-muted-foreground">
                Your reported issues and their latest updates
              </p>
            </div>

            <Badge
              variant="outline"
              className="rounded-full border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground"
            >
              {disputeList.length}{" "}
              {disputeList.length === 1 ? "record" : "records"}
            </Badge>
          </div>

          {disputeList.map((dispute) => {
            const status = statusStyles(dispute.status);
            const StatusIcon = status.icon;

            return (
              <Card
                key={dispute.id}
                className="group overflow-hidden rounded-2xl border-border bg-card shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md dark:hover:border-emerald-900/70"
              >
                <CardContent className="p-0">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground transition group-hover:bg-emerald-50 group-hover:text-emerald-700 dark:group-hover:bg-emerald-950/50 dark:group-hover:text-emerald-300">
                          <BriefcaseBusiness className="size-5" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold leading-6 text-foreground">
                            {dispute.reason}
                          </h3>

                          <p className="mt-1 break-all text-xs text-muted-foreground">
                            Reference: {dispute.id}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${status.className}`}
                      >
                        <StatusIcon className="size-3.5" />
                        {status.label || formatStatus(dispute.status)}
                      </Badge>
                    </div>

                    <div className="mt-5 rounded-xl bg-muted/70 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                        {dispute.description}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-x-5 gap-y-2">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="size-3.5" />
                          Opened {formatDate(dispute.created_at)}
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <ClipboardList className="size-3.5" />
                          Updated {formatDate(dispute.updated_at)}
                        </span>
                      </div>

                      <Link
                        href={`/dashboard/disputes/${dispute.id}`}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        View details
                        <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>

                    {dispute.resolution && (
                      <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/70 dark:bg-emerald-950/30">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="size-4 text-emerald-700 dark:text-emerald-400" />

                          <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                            Admin resolution
                          </p>
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-emerald-900/80 dark:text-emerald-100/80">
                          {dispute.resolution}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
