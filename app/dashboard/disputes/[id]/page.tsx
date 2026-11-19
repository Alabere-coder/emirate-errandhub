import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClipboardList,
  ShieldAlert,
  ShieldCheck,
  Clock3,
  AlertCircle,
  CheckCircle2,
  XCircle,
  FileImage,
  BriefcaseBusiness,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function statusStyles(status: string) {
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
        className: "  border-border bg-muted text-muted-foreground",
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

export default async function ParticipantDisputeDetailPage({
  params,
}: PageProps) {
  const { user, supabase } = await requireRole(["customer", "worker"]);
  const { id } = await params;

  if (!isValidUuid(id)) notFound();

  // RLS must restrict this query to disputes involving the signed-in user.
  const { data: dispute, error: disputeError } = await supabase
    .from("disputes")
    .select(
      "id, job_id, opened_by, reason, description, status, resolution, resolved_at, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (disputeError) {
    console.error("Participant dispute query failed:", disputeError.message);
    throw new Error("Unable to load this dispute.");
  }

  // Do not reveal whether a dispute belonging to someone else exists.
  if (!dispute) notFound();

  // Verify that this user is actually a participant in the related job.
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, customer_id, worker_id")
    .eq("id", dispute.job_id)
    .maybeSingle();

  if (jobError) {
    console.error("Participant dispute job query failed:", jobError.message);
    throw new Error("Unable to verify access to this dispute.");
  }

  if (!job) notFound();

  let isParticipant = job.customer_id === user.id;

  if (!isParticipant) {
    const { data: workerProfile, error: workerError } = await supabase
      .from("worker_profiles")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (workerError) {
      console.error("Participant worker lookup failed:", workerError.message);
      throw new Error("Unable to verify access to this dispute.");
    }

    isParticipant = !!workerProfile && workerProfile.id === job.worker_id;
  }

  if (!isParticipant) notFound();

  const { data: disputeMedia, error: mediaError } = await supabase
    .from("dispute_media")
    .select("id, file_url, file_type, created_at")
    .eq("dispute_id", dispute.id)
    .order("created_at", { ascending: false });

  if (mediaError) {
    console.error(
      "Participant dispute evidence query failed:",
      mediaError.message,
    );
  }

  const evidence = await Promise.all(
    (disputeMedia ?? []).map(async (media) => {
      if (!media.file_url.startsWith(`${dispute.id}/`)) {
        return {
          id: media.id,
          fileType: media.file_type,
          createdAt: media.created_at,
          signedUrl: null,
        };
      }

      const { data, error } = await supabase.storage
        .from("dispute-media")
        .createSignedUrl(media.file_url, 300);

      if (error) {
        console.error(
          "Participant evidence signing failed:",
          media.id,
          error.message,
        );
      }

      return {
        id: media.id,
        fileType: media.file_type,
        createdAt: media.created_at,
        signedUrl: data?.signedUrl ?? null,
      };
    }),
  );

  const status = statusStyles(dispute.status);
  const StatusIcon = status.icon;

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      {/* Navigation */}
      <Button
        variant="outline"
        size="sm"
        className="h-9 rounded-xl   border-border bg-card px-4 text-muted-foreground shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
      >
        <Link
          href="/dashboard/disputes"
          className="inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Disputes
        </Link>
      </Button>

      {/* Page header */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-linear-to-br from-white via-white to-emerald-50/80 p-6 shadow-sm sm:p-9">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-40 w-40 rounded-full bg-teal-100/40 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-100 bg-card text-emerald-700 shadow-sm">
            <ShieldAlert className="h-6 w-6" />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
                Support & Resolution Centre
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Dispute details
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Review your reported issue, submitted evidence, and the latest
                decision from our support team.
              </p>
            </div>

            <Badge
              variant="outline"
              className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold capitalize ${status.className}`}
            >
              <StatusIcon className="h-4 w-4" />
              {status.label || formatStatus(dispute.status)}
            </Badge>
          </div>

          <div className="mt-6 border-t border-emerald-100/80 pt-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Dispute reference
            </p>
            <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
              {dispute.id}
            </p>
          </div>
        </div>
      </div>

      {/* Reported issue */}
      <Card className="overflow-hidden rounded-2xl   border-border/80 shadow-sm">
        <div className="border-b   border-border bg-card px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Reported issue</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Details of the problem you submitted
              </p>
            </div>
          </div>
        </div>

        <CardContent className="space-y-6 p-5 sm:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Reason
            </p>
            <p className="mt-2 text-base font-semibold text-foreground">
              {dispute.reason}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Description
            </p>
            <div className="mt-2 rounded-xl bg-muted p-4 sm:p-5">
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {dispute.description}
              </p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border   border-border bg-card p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground/70">
                <CalendarDays className="h-4 w-4" />
                Submitted
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatDate(dispute.created_at)}
              </p>
            </div>

            <div className="rounded-xl border   border-border bg-card p-4">
              <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground/70">
                <ClipboardList className="h-4 w-4" />
                Last updated
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatDate(dispute.updated_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence */}
      <Card className="overflow-hidden rounded-2xl   border-border/80 shadow-sm">
        <div className="border-b   border-border bg-card px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <FileImage className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">Dispute evidence</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Images and supporting files submitted with your dispute
              </p>
            </div>
          </div>
        </div>

        <CardContent className="p-5 sm:p-6">
          {mediaError ? (
            <div
              role="alert"
              className="rounded-xl border border-red-100 bg-red-50 p-4"
            >
              <p className="text-sm font-medium text-red-700">
                Evidence could not be loaded. Please refresh and try again.
              </p>
            </div>
          ) : evidence.length === 0 ? (
            <div className="flex flex-col items-center rounded-2xl border border-dashed   border-border bg-muted/70 px-5 py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-card text-muted-foreground/70 shadow-sm">
                <FileImage className="h-6 w-6" />
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground">
                No evidence attached
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                No evidence images have been attached to this dispute.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {evidence.map((item) => (
                <div
                  key={item.id}
                  className="group overflow-hidden rounded-2xl border   border-border bg-card transition hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="flex min-h-48 items-center justify-center bg-muted p-3">
                    {item.signedUrl && item.fileType.startsWith("image/") ? (
                      <a
                        href={item.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Open dispute evidence in a new tab"
                        className="block w-full"
                      >
                        <img
                          src={item.signedUrl}
                          alt="Evidence submitted for this dispute"
                          className="max-h-80 w-full rounded-xl object-contain transition duration-300 group-hover:scale-[1.01]"
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <FileImage className="h-8 w-8 text-slate-300" />
                        <p className="text-xs text-muted-foreground">
                          This evidence image could not be previewed.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 border-t   border-border px-4 py-3">
                    <span className="text-xs font-medium text-muted-foreground">
                      {item.fileType}
                    </span>
                    <span className="text-xs text-muted-foreground/70">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status and resolution */}
      <Card className="overflow-hidden rounded-2xl   border-border/80 shadow-sm">
        <div className="border-b   border-border bg-card px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-bold text-foreground">
                Status and resolution
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Current progress and administrative decision
              </p>
            </div>
          </div>
        </div>

        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="rounded-xl border   border-border bg-muted/70 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70">
              Current status
            </p>
            <div className="mt-3">
              <Badge
                variant="outline"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold capitalize ${status.className}`}
              >
                <StatusIcon className="h-3.5 w-3.5" />
                {status.label || formatStatus(dispute.status)}
              </Badge>
            </div>
          </div>

          {dispute.resolution ? (
            <div className="rounded-2xl border border-emerald-200 bg-linear-to-br from-emerald-50/80 to-white p-5">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-emerald-900">
                    Admin resolution
                  </p>
                  <p className="text-xs text-emerald-700/70">
                    Official response from the support team
                  </p>
                </div>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground">
                {dispute.resolution}
              </p>

              {dispute.resolved_at && (
                <div className="mt-4 flex items-center gap-2 border-t border-emerald-100 pt-3 text-xs text-emerald-700/80">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Recorded {formatDate(dispute.resolved_at)}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
              <div className="flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-semibold text-blue-900">
                  Awaiting resolution
                </p>
              </div>
              <p className="mt-2 text-sm leading-6 text-blue-800/80">
                Your dispute has not received a written resolution yet. Check
                this page again for updates as the admin reviews your case.
              </p>
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl border   border-border bg-muted p-4">
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/70" />
            <p className="text-xs leading-6 text-muted-foreground">
              This page is read-only. Only an authorized admin can change the
              dispute status or record a resolution.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
