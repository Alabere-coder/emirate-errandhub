import Link from "next/link";

import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldCheck,
  ShieldX,
  Users,
  UserRound,
  Phone,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(date));
}

function getStatusStyle(status: string) {
  switch (status) {
    case "approved":
      return {
        label: "Approved",
        icon: CheckCircle2,
        className:
          "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400",
      };

    case "rejected":
      return {
        label: "Rejected",
        icon: ShieldX,
        className:
          "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-400",
      };

    default:
      return {
        label: status.replaceAll("_", " "),
        icon: Clock3,
        className:
          "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400",
      };
  }
}

export default async function AdminWorkerApplicationsPage() {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const { data: applications, error } = await supabase
    .from("worker_applications")
    .select(
      `
      id,
      user_id,
      status,
      application_note,
      rejection_reason,
      reviewed_at,
      created_at,
      profiles!worker_applications_user_id_fkey (
        first_name,
        last_name,
        phone
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load worker applications error:", error);
  }

  const applicationList = applications ?? [];

  const totalApplications = applicationList.length;

  const pendingApplications = applicationList.filter(
    (application) => application.status === "pending",
  ).length;

  const approvedApplications = applicationList.filter(
    (application) => application.status === "approved",
  ).length;

  const rejectedApplications = applicationList.filter(
    (application) => application.status === "rejected",
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      {/* Page header */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-lg shadow-emerald-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
              <ShieldCheck className="h-4 w-4" />
              Administration
            </div>

            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Worker Applications
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-emerald-100/80">
              Review applications from people who want to become service
              providers on Emirate ErrandHub.
            </p>
          </div>

          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 shadow-inner">
            <BriefcaseBusiness className="h-7 w-7 text-white" />
          </div>
        </div>

        <div className="relative mt-7 flex flex-wrap gap-3 border-t border-white/15 pt-5">
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-xs text-emerald-100/70">Total applications</p>
            <p className="mt-1 text-2xl font-bold">{totalApplications}</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-xs text-emerald-100/70">Awaiting review</p>
            <p className="mt-1 text-2xl font-bold">{pendingApplications}</p>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              All Applications
            </p>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground">
              <Users className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            {totalApplications}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Applications received
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">Pending</p>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock3 className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            {pendingApplications}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Awaiting your review
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Approved
            </p>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            {approvedApplications}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Successful applications
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              Rejected
            </p>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <ShieldX className="h-5 w-5" />
            </div>
          </div>

          <p className="mt-4 text-3xl font-bold tracking-tight text-foreground">
            {rejectedApplications}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">
            Unsuccessful applications
          </p>
        </div>
      </div>

      {/* Applications list */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">
              Application Records
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Review applicant information and submitted application notes.
            </p>
          </div>

          <span className="inline-flex w-fit items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            {totalApplications}{" "}
            {totalApplications === 1 ? "application" : "applications"}
          </span>
        </div>

        {applicationList.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <BriefcaseBusiness className="h-8 w-8" />
            </div>

            <h3 className="mt-5 font-semibold text-foreground">
              No Worker Applications
            </h3>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              New worker applications will appear here when people apply to
              become service providers.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {applicationList.map((application) => {
              const profile = Array.isArray(application.profiles)
                ? application.profiles[0]
                : application.profiles;

              const workerName =
                [profile?.first_name, profile?.last_name]
                  .filter(Boolean)
                  .join(" ") || "Unnamed Applicant";

              const statusStyle = getStatusStyle(application.status);
              const StatusIcon = statusStyle.icon;

              return (
                <div
                  key={application.id}
                  className="p-5 transition-colors hover:bg-muted/30 sm:p-6"
                >
                  <div className="flex flex-col gap-5">
                    {/* Applicant heading */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <UserRound className="h-6 w-6" />
                        </div>

                        <div>
                          <h3 className="font-semibold text-foreground">
                            {workerName}
                          </h3>

                          {profile?.phone && (
                            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                              <Phone className="h-3.5 w-3.5" />
                              {profile.phone}
                            </p>
                          )}

                          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            Applied {formatDate(application.created_at)}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${statusStyle.className}`}
                      >
                        <StatusIcon className="h-3.5 w-3.5" />
                        {statusStyle.label}
                      </span>
                    </div>

                    {/* Application note */}
                    <div className="rounded-xl border border-border bg-muted/30 p-4">
                      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        Application Note
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground/80">
                        {application.application_note ||
                          "No application note provided."}
                      </p>
                    </div>

                    {/* Rejection reason */}
                    {application.rejection_reason && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
                        <div className="flex items-center gap-2 text-sm font-semibold text-red-700 dark:text-red-400">
                          <ShieldX className="h-4 w-4" />
                          Rejection Reason
                        </div>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-red-700/80 dark:text-red-400/80">
                          {application.rejection_reason}
                        </p>
                      </div>
                    )}

                    {/* Review action */}
                    <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
                      {application.reviewed_at ? (
                        <p className="text-xs text-muted-foreground">
                          Reviewed {formatDate(application.reviewed_at)}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground">
                          Awaiting application review
                        </p>
                      )}

                      <Link
                        href={`/dashboard/admin/worker-applications/${application.id}`}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      >
                        Review Application
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
