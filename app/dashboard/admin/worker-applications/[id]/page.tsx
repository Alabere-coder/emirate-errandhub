import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  Phone,
  ShieldCheck,
  ShieldX,
  UserRound,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { WorkerApplicationActions } from "../worker-application-actions";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "long",
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

export default async function WorkerApplicationReviewPage({
  params,
}: PageProps) {
  await requireRole(["admin"]);

  const { id } = await params;

  const supabase = await createClient();

  const { data: application, error } = await supabase
    .from("worker_applications")
    .select(
      `
      id,
      user_id,
      status,
      application_note,
      rejection_reason,
      reviewed_by,
      reviewed_at,
      created_at
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Load worker application error:", error);
  }

  if (!application) {
    notFound();
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
      id,
      first_name,
      last_name,
      phone,
      avatar_url,
      role,
      is_active
    `,
    )
    .eq("id", application.user_id)
    .maybeSingle();

  if (profileError) {
    console.error("Load applicant profile error:", profileError);
  }

  const applicantName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
    "Unnamed Applicant";

  const statusStyle = getStatusStyle(application.status);
  const StatusIcon = statusStyle.icon;

  return (
    <div className="mx-auto max-w-5xl space-y-7">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-lg shadow-emerald-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-white/10">
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt={applicantName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound className="h-7 w-7 text-white" />
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
                <ShieldCheck className="h-4 w-4" />
                Applicant Review
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {applicantName}
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/80">
                Review this applicant&apos;s information and decide whether they
                can become a service provider on Emirate ErrandHub.
              </p>
            </div>
          </div>

          <div
            className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold ${statusStyle.className}`}
          >
            <StatusIcon className="h-4 w-4" />
            {statusStyle.label}
          </div>
        </div>

        <div className="relative mt-7 flex flex-wrap gap-3 border-t border-white/15 pt-5">
          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-xs text-emerald-100/70">Application status</p>
            <p className="mt-1 font-semibold capitalize">
              {application.status.replaceAll("_", " ")}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/10 px-4 py-3">
            <p className="text-xs text-emerald-100/70">Date submitted</p>
            <p className="mt-1 font-semibold">
              {formatDate(application.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Applicant information */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <UserRound className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-foreground">
              Applicant Information
            </h2>
            <p className="text-xs text-muted-foreground">
              Personal details associated with this application
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Full Name
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {applicantName}
            </p>
          </div>

          <div>
            <p className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              Phone Number
            </p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {profile?.phone ?? "No phone number"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Account Role
            </p>
            <p className="mt-2 text-sm font-semibold capitalize text-foreground">
              {profile?.role?.replaceAll("_", " ") ?? "Unavailable"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Account Status
            </p>
            <span
              className={`mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                profile?.is_active
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-400"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              {profile?.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </div>

      {/* Application statement */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
            <FileText className="h-5 w-5" />
          </div>

          <div>
            <h2 className="font-semibold text-foreground">
              Application Statement
            </h2>
            <p className="text-xs text-muted-foreground">
              Why the applicant wants to become a worker
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-border bg-muted/30 p-5">
          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/80">
            {application.application_note ||
              "No application statement provided."}
          </p>
        </div>
      </div>

      {/* Previous rejection reason */}
      {application.rejection_reason && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 shadow-sm dark:border-red-900 dark:bg-red-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400">
              <ShieldX className="h-5 w-5" />
            </div>

            <div>
              <h2 className="font-semibold text-red-800 dark:text-red-400">
                Previous Rejection Reason
              </h2>
              <p className="text-xs text-red-700/70 dark:text-red-400/70">
                Feedback recorded for this application
              </p>
            </div>
          </div>

          <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-red-800/90 dark:text-red-300">
            {application.rejection_reason}
          </p>
        </div>
      )}

      {/* Review actions */}
      {application.status === "pending" ? (
        <div className="overflow-hidden rounded-2xl border border-emerald-200 bg-card shadow-sm dark:border-emerald-900">
          <div className="border-b border-border bg-emerald-50/70 p-6 dark:bg-emerald-950/20">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                <ShieldCheck className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-semibold text-foreground">
                  Review Decision
                </h2>
                <p className="text-xs text-muted-foreground">
                  Approve or reject this worker application.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <WorkerApplicationActions applicationId={application.id} />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-muted/30 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                This application has already been reviewed.
              </p>

              {application.reviewed_at && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Reviewed on {formatDate(application.reviewed_at)}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <div className="flex justify-end border-t border-border pt-5">
        <Link
          href="/dashboard/admin/worker-applications"
          className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-primary"
        >
          Return to Applications
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
