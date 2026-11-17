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
import { Button } from "@/components/ui/button";

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
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        icon: CheckCircle2,
      };
    case "rejected":
      return {
        label: "Rejected",
        className: "border-red-200 bg-red-50 text-red-700",
        icon: XCircle,
      };
    case "under_review":
      return {
        label: "Under review",
        className: "border-blue-200 bg-blue-50 text-blue-700",
        icon: Clock3,
      };
    case "closed":
      return {
        label: "Closed",
        className: "border-slate-200 bg-slate-100 text-slate-600",
        icon: ShieldCheck,
      };
    default:
      return {
        label: "Open",
        className: "border-amber-200 bg-amber-50 text-amber-700",
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
        <div className="relative overflow-hidden rounded-3xl border border-red-100 bg-linear-to-br from-white to-red-50/70 p-7 sm:p-9">
          <div className="relative z-10">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              My Disputes
            </h1>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
              We couldn't retrieve your dispute information at the moment.
              Please try again.
            </p>
          </div>
        </div>

        <Card className="rounded-2xl border-red-100 shadow-sm">
          <CardContent className="flex flex-col items-center gap-4 p-8 text-center">
            <AlertCircle className="h-9 w-9 text-red-500" />
            <p className="text-sm font-medium text-slate-700">
              Unable to load your disputes.
            </p>
            <Button
              variant="outline"
              className="rounded-xl flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
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
    <div className="mx-auto max-w-5xl p-2 space-y-8 pb-10">
      {/* Page header */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-linear-to-br from-white via-white to-emerald-50/80 p-6 shadow-sm sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-40 w-40 rounded-full bg-teal-100/40 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Support & Resolution Centre
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              My Disputes
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500 sm:text-base">
              Keep track of reported issues, monitor review progress, and view
              the decisions made by our support team.
            </p>
          </div>

          <Button
            variant="outline"
            className="h-10 shrink-0 rounded-xl border-slate-200 bg-white px-4 font-semibold shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5"
            >
              Back to dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {disputeList.length > 0 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Card className="group rounded-2xl border-slate-200/80 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Total disputes
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {disputeList.length}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  All your reported issues
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600 transition group-hover:bg-emerald-50 group-hover:text-emerald-700">
                <ClipboardList className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="group rounded-2xl border-amber-100 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-amber-600">
                  Awaiting resolution
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {openCount + reviewCount}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Open or under review
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                <Clock3 className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>

          <Card className="group rounded-2xl border-emerald-100 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
                  Resolved
                </p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
                  {resolvedCount}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Resolved or closed disputes
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Disputes list */}
      {disputeList.length === 0 ? (
        <Card className="overflow-hidden rounded-3xl border-slate-200 shadow-sm">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center sm:py-20">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-emerald-100 bg-linear-to-br from-emerald-50 to-teal-50 text-emerald-600 shadow-sm">
              <ShieldAlert className="h-9 w-9" />
            </div>

            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              No disputes yet
            </h2>

            <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
              You haven't reported any issues with your jobs. When you open a
              dispute, you can follow its progress and view any recorded
              resolution here.
            </p>

            <Button className="mt-6 h-11 rounded-xl bg-emerald-600 px-6 font-semibold text-white shadow-sm transition hover:bg-emerald-700">
              <Link href="/dashboard">
                Return to dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900">
                Dispute history
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Your reported issues and their latest updates
              </p>
            </div>

            <Badge
              variant="outline"
              className="rounded-full border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600"
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
                className="group overflow-hidden rounded-2xl border-slate-200/80 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <CardContent className="p-0">
                  <div className="p-5 sm:p-6">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-emerald-50 group-hover:text-emerald-700">
                          <BriefcaseBusiness className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="font-bold leading-6 text-slate-900">
                            {dispute.reason}
                          </h3>
                          <p className="mt-1 break-all text-xs text-slate-400">
                            Reference: {dispute.id}
                          </p>
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${status.className}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {status.label || formatStatus(dispute.status)}
                      </Badge>
                    </div>

                    <div className="mt-5 rounded-xl bg-slate-50/80 p-4">
                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-600">
                        {dispute.description}
                      </p>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-x-5 gap-y-2">
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                          Opened {formatDate(dispute.created_at)}
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                          <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
                          Updated {formatDate(dispute.updated_at)}
                        </span>
                      </div>

                      <Button
                        size="sm"
                        className="h-9 rounded-lg bg-emerald-600 px-4 font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                      >
                        <Link
                          href={`/dashboard/disputes/${dispute.id}`}
                          className="inline-flex items-center gap-1.5"
                        >
                          View details
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </Button>
                    </div>

                    {dispute.resolution && (
                      <div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-emerald-700" />
                          <p className="text-sm font-bold text-emerald-900">
                            Admin resolution
                          </p>
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-emerald-900/80">
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
