import type { ElementType, ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  ShieldAlert,
  UserRound,
  BriefcaseBusiness,
  CheckCircle2,
  FileImage,
  ImageIcon,
  Hash,
  Phone,
  Wallet,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import DisputeDecisionForm from "./dispute-decision-form";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

type DisputeStatus =
  | "open"
  | "under_review"
  | "resolved"
  | "rejected"
  | "closed";

const STATUS_STYLES: Record<DisputeStatus, string> = {
  open: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-400",
  under_review:
    "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-400",
  resolved:
    "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400",
  rejected:
    "border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400",
  closed: "border-border bg-muted text-muted-foreground",
};

function isValidUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not recorded";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function getStatusStyle(status: string) {
  return (
    STATUS_STYLES[status as DisputeStatus] ??
    "border-border bg-muted text-muted-foreground"
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
        <Icon className="size-5" />
      </div>

      <div>
        <h2 className="font-semibold tracking-tight text-foreground">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>

      <div
        className={`mt-1.5 text-sm text-foreground ${
          mono ? "break-all font-mono text-xs" : "font-medium"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export default async function AdminDisputeDetailPage({ params }: PageProps) {
  await requireRole(["admin"]);

  const { id } = await params;

  if (!isValidUuid(id)) notFound();

  const supabase = createAdminClient();

  const { data: dispute, error: disputeError } = await supabase
    .from("disputes")
    .select(
      "id, job_id, opened_by, reason, description, status, resolution, resolved_by, resolved_at, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (disputeError) {
    console.error("Admin dispute detail query failed:", disputeError.message);
    throw new Error("Unable to load this dispute.");
  }

  if (!dispute) notFound();

  const { data: disputeMedia, error: disputeMediaError } = await supabase
    .from("dispute_media")
    .select("id, file_url, file_type, created_at")
    .eq("dispute_id", dispute.id)
    .order("created_at", { ascending: false });

  if (disputeMediaError) {
    console.error(
      "Admin dispute evidence query failed:",
      disputeMediaError.message,
    );
  }

  const evidence = await Promise.all(
    (disputeMedia ?? []).map(async (media) => {
      // Never sign a path that belongs to a different dispute.
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
          "Admin dispute evidence signing failed:",
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

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(
      "id, request_id, customer_id, worker_id, agreed_amount, currency, status, scheduled_at, started_at, completed_at, created_at",
    )
    .eq("id", dispute.job_id)
    .maybeSingle();

  if (jobError) {
    console.error("Admin dispute job query failed:", jobError.message);
    throw new Error("Unable to load the related job.");
  }

  if (!job) notFound();

  const [customerResult, workerResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, first_name, last_name, phone, role")
      .eq("id", job.customer_id)
      .maybeSingle(),

    supabase
      .from("worker_profiles")
      .select("id, user_id")
      .eq("id", job.worker_id)
      .maybeSingle(),
  ]);

  if (customerResult.error || workerResult.error) {
    console.error(
      "Admin dispute participants query failed:",
      customerResult.error ?? workerResult.error,
    );

    throw new Error("Unable to load the job participants.");
  }

  const workerProfile = workerResult.data;

  const workerUserResult = workerProfile
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name, phone, role")
        .eq("id", workerProfile.user_id)
        .maybeSingle()
    : { data: null, error: null };

  if (workerUserResult.error) {
    console.error(
      "Admin dispute worker profile query failed:",
      workerUserResult.error.message,
    );

    throw new Error("Unable to load the worker's information.");
  }

  const customer = customerResult.data;
  const worker = workerUserResult.data;

  const participantName = (
    profile: {
      first_name: string | null;
      last_name: string | null;
    } | null,
  ) =>
    `${profile?.first_name ?? ""} ${profile?.last_name ?? ""}`.trim() ||
    "Name unavailable";

  const isFinal = ["resolved", "rejected", "closed"].includes(dispute.status);

  return (
    <div className="mx-auto max-w-6xl space-y-7 p-4 md:p-6">
      {/* Page header */}
      <section className="relative overflow-hidden rounded-3xl bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-lg md:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-1/3 size-56 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
              <ShieldCheck className="size-3.5" />
              Trust & Safety
            </span>

            <span className="text-xs text-emerald-100/60">
              Admin dispute review
            </span>
          </div>

          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
                {dispute.reason}
              </h1>

              <p className="mt-3 text-sm text-emerald-100/75">
                Review the reported issue, supporting evidence, and related
                transaction details.
              </p>

              <div className="mt-4 inline-flex max-w-full items-center gap-2 rounded-lg border border-white/10 bg-black/10 px-3 py-2">
                <Hash className="size-3.5 shrink-0 text-emerald-200" />

                <span className="break-all font-mono text-xs text-emerald-100/80">
                  {dispute.id}
                </span>
              </div>
            </div>

            <span
              className={`inline-flex w-fit shrink-0 items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold capitalize ${getStatusStyle(dispute.status)}`}
            >
              <span className="size-1.5 rounded-full bg-current" />
              {formatStatus(dispute.status)}
            </span>
          </div>
        </div>
      </section>

      {/* Reported issue */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/30 p-5 md:p-6">
          <SectionHeading
            icon={ClipboardList}
            title="Reported issue"
            description="Original complaint and administrative record."
          />
        </div>

        <div className="space-y-5 p-5 md:p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Reason
            </p>

            <p className="mt-2 text-base font-semibold text-foreground">
              {dispute.reason}
            </p>
          </div>

          <div className="rounded-xl bg-muted/50 p-4 md:p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Description
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-foreground/90">
              {dispute.description}
            </p>
          </div>

          <div className="grid gap-5 border-t border-border pt-5 sm:grid-cols-2 lg:grid-cols-4">
            <DetailItem
              label="Submitted"
              value={formatDate(dispute.created_at)}
            />

            <DetailItem
              label="Last updated"
              value={formatDate(dispute.updated_at)}
            />

            <DetailItem label="Opened by" value={dispute.opened_by} mono />

            <DetailItem
              label="Resolved at"
              value={formatDate(dispute.resolved_at)}
            />
          </div>

          {dispute.resolution && (
            <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 p-4 dark:border-emerald-900/40 dark:bg-emerald-950/10">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-800 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                Recorded resolution
              </div>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground/90">
                {dispute.resolution}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Evidence */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/30 p-5 md:p-6">
          <SectionHeading
            icon={FileImage}
            title="Dispute evidence"
            description="Private files submitted by the dispute participants."
          />

          <p className="mt-3 text-xs text-muted-foreground">
            Signed evidence links expire after five minutes.
          </p>
        </div>

        <div className="p-5 md:p-6">
          {disputeMediaError ? (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-400"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />

              <p>
                Evidence could not be loaded. Refresh the page and try again.
              </p>
            </div>
          ) : evidence.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-5 py-10 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <ImageIcon className="size-6" />
              </div>

              <p className="mt-3 font-medium text-foreground">
                No evidence attached
              </p>

              <p className="mt-1 text-sm text-muted-foreground">
                No evidence files have been submitted for this dispute.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {evidence.map((item) => (
                <div
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-border bg-background"
                >
                  <div className="flex min-h-48 items-center justify-center bg-muted/40 p-3">
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
                          className="max-h-80 w-full rounded-lg object-contain"
                          loading="lazy"
                        />
                      </a>
                    ) : (
                      <div className="flex flex-col items-center gap-2 text-center">
                        <FileImage className="size-9 text-muted-foreground/60" />

                        <p className="text-xs text-muted-foreground">
                          This evidence file could not be previewed.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="max-w-full break-all text-xs font-medium text-muted-foreground">
                        {item.fileType}
                      </span>

                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </span>
                    </div>

                    {item.signedUrl && (
                      <a
                        href={item.signedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400"
                      >
                        Open full image
                        <ArrowUpRight className="size-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Related job */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/30 p-5 md:p-6">
          <SectionHeading
            icon={BriefcaseBusiness}
            title="Related job"
            description="Job information associated with this dispute."
          />
        </div>

        <div className="space-y-5 p-5 md:p-6">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <DetailItem label="Job reference" value={job.id} mono />

            <DetailItem
              label="Job status"
              value={
                <span className="capitalize">{formatStatus(job.status)}</span>
              }
            />

            <DetailItem
              label="Agreed amount"
              value={
                <span className="inline-flex items-center gap-2">
                  <Wallet className="size-4 text-emerald-700 dark:text-emerald-400" />
                  {job.currency || "NGN"}{" "}
                  {Number(job.agreed_amount).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              }
            />

            <DetailItem
              label="Scheduled date"
              value={
                <span className="inline-flex items-center gap-2">
                  <CalendarDays className="size-4 text-muted-foreground" />
                  {formatDate(job.scheduled_at)}
                </span>
              }
            />

            <DetailItem
              label="Job started"
              value={formatDate(job.started_at)}
            />

            <DetailItem
              label="Job completed"
              value={formatDate(job.completed_at)}
            />

            <DetailItem label="Request reference" value={job.request_id} mono />
          </div>
        </div>
      </section>

      {/* Participants */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/30 p-5 md:p-6">
          <SectionHeading
            icon={UserRound}
            title="Job participants"
            description="Customer and worker associated with this job."
          />
        </div>

        <div className="grid gap-4 p-5 md:grid-cols-2 md:p-6">
          {/* Customer */}
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                <UserRound className="size-5" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Customer
                </p>

                <p className="mt-1 font-semibold text-foreground">
                  {participantName(customer)}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-border pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-4" />
                {customer?.phone || "No phone number"}
              </div>

              <p className="break-all font-mono text-xs text-muted-foreground">
                {job.customer_id}
              </p>
            </div>
          </div>

          {/* Worker */}
          <div className="rounded-2xl border border-border bg-background p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                <BriefcaseBusiness className="size-5" />
              </div>

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Worker
                </p>

                <p className="mt-1 font-semibold text-foreground">
                  {participantName(worker)}
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3 border-t border-border pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="size-4" />
                {worker?.phone || "No phone number"}
              </div>

              <p className="break-all font-mono text-xs text-muted-foreground">
                {workerProfile?.user_id ?? "Worker profile unavailable"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Administrative notice */}
      <section
        className={`rounded-2xl border p-5 ${
          isFinal
            ? "border-emerald-200/70 bg-emerald-50/50 dark:border-emerald-900/40 dark:bg-emerald-950/10"
            : "border-amber-200/70 bg-amber-50/60 dark:border-amber-900/40 dark:bg-amber-950/10"
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 rounded-xl p-2 ${
              isFinal
                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400"
                : "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
            }`}
          >
            {isFinal ? (
              <CheckCircle2 className="size-5" />
            ) : (
              <ShieldAlert className="size-5" />
            )}
          </div>

          <div>
            <h3
              className={`font-semibold ${
                isFinal
                  ? "text-emerald-950 dark:text-emerald-300"
                  : "text-amber-950 dark:text-amber-300"
              }`}
            >
              {isFinal
                ? "This dispute is in a final state"
                : "Review before deciding"}
            </h3>

            <p
              className={`mt-1 text-sm leading-6 ${
                isFinal
                  ? "text-emerald-900/80 dark:text-emerald-400/90"
                  : "text-amber-900/80 dark:text-amber-400/90"
              }`}
            >
              {isFinal
                ? "This page currently displays the recorded decision. No payment, earnings, or job changes are performed here."
                : "Review the submitted information and evidence carefully before making a decision. Dispute decisions do not automatically change the job or its payment."}
            </p>
          </div>
        </div>
      </section>

      {/* Decision form */}
      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-muted/30 p-5 md:p-6">
          <SectionHeading
            icon={ShieldCheck}
            title="Administrative decision"
            description="Review and manage the dispute using the controls below."
          />
        </div>

        <div className="p-5 md:p-6">
          <DisputeDecisionForm
            disputeId={dispute.id}
            currentStatus={dispute.status}
          />
        </div>
      </section>
    </div>
  );
}
