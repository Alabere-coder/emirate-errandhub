import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  ShieldAlert,
  UserRound,
  BriefcaseBusiness,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  }).format(date);
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
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
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Button variant="ghost" className="-ml-3 mb-3">
          <Link href="/dashboard/admin/disputes">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to disputes
          </Link>
        </Button>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <ShieldAlert className="h-4 w-4" />
              Admin dispute review
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              {dispute.reason}
            </h1>

            <p className="mt-2 break-all font-mono text-xs text-slate-500">
              Dispute ID: {dispute.id}
            </p>
          </div>

          <span className="inline-flex w-fit rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium capitalize text-slate-700">
            {formatStatus(dispute.status)}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5" />
            Reported issue
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-slate-700">Reason</p>
            <p className="mt-1 text-sm text-slate-600">{dispute.reason}</p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {dispute.description}
            </p>
          </div>

          <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">Submitted</p>
              <p className="mt-1 text-sm">{formatDate(dispute.created_at)}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Last updated</p>
              <p className="mt-1 text-sm">{formatDate(dispute.updated_at)}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Opened by</p>
              <p className="mt-1 break-all font-mono text-xs">
                {dispute.opened_by}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Resolved at</p>
              <p className="mt-1 text-sm">{formatDate(dispute.resolved_at)}</p>
            </div>
          </div>

          {dispute.resolution && (
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-sm font-medium text-slate-700">
                Recorded resolution
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                {dispute.resolution}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dispute evidence</CardTitle>
          <p className="text-sm text-slate-500">
            Private evidence submitted by the dispute participants. Image links
            expire after five minutes.
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {disputeMediaError ? (
            <p role="alert" className="text-sm text-red-700">
              Evidence could not be loaded. Refresh the page and try again.
            </p>
          ) : evidence.length === 0 ? (
            <p className="text-sm text-slate-500">
              No evidence images have been attached to this dispute.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {evidence.map((item) => (
                <div
                  key={item.id}
                  className="space-y-3 rounded-xl border border-slate-200 p-3"
                >
                  {item.signedUrl && item.fileType.startsWith("image/") ? (
                    <a
                      href={item.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Open dispute evidence in a new tab"
                    >
                      <img
                        src={item.signedUrl}
                        alt="Evidence submitted for this dispute"
                        className="max-h-80 w-full rounded-lg object-contain"
                        loading="lazy"
                      />
                    </a>
                  ) : (
                    <p className="text-sm text-slate-500">
                      This evidence file could not be previewed.
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">
                      {item.fileType}
                    </span>
                    <span className="text-xs text-slate-500">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>

                  {item.signedUrl && (
                    <a
                      href={item.signedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-emerald-700 underline underline-offset-4"
                    >
                      Open full image
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5" />
            Related job
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs text-slate-500">Job reference</p>
            <p className="mt-1 break-all font-mono text-xs">{job.id}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Job status</p>
            <p className="mt-1 text-sm capitalize">
              {formatStatus(job.status)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Agreed amount</p>
            <p className="mt-1 text-sm font-semibold">
              {job.currency || "NGN"}{" "}
              {Number(job.agreed_amount).toLocaleString("en-NG", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Scheduled date</p>
            <p className="mt-1 flex items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 text-slate-400" />
              {formatDate(job.scheduled_at)}
            </p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Job started</p>
            <p className="mt-1 text-sm">{formatDate(job.started_at)}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Job completed</p>
            <p className="mt-1 text-sm">{formatDate(job.completed_at)}</p>
          </div>

          <div>
            <p className="text-xs text-slate-500">Request reference</p>
            <p className="mt-1 break-all font-mono text-xs">{job.request_id}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserRound className="h-5 w-5" />
            Job participants
          </CardTitle>
        </CardHeader>

        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Customer
            </p>
            <p className="mt-2 font-semibold text-slate-900">
              {participantName(customer)}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {customer?.phone || "No phone number"}
            </p>
            <p className="mt-2 break-all font-mono text-xs text-slate-400">
              {job.customer_id}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Worker
            </p>
            <p className="mt-2 font-semibold text-slate-900">
              {participantName(worker)}
            </p>
            <p className="mt-1 text-sm text-slate-600">
              {worker?.phone || "No phone number"}
            </p>
            <p className="mt-2 break-all font-mono text-xs text-slate-400">
              {workerProfile?.user_id ?? "Worker profile unavailable"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-amber-200 bg-amber-50/50 shadow-none">
        <CardContent className="p-4">
          <p className="font-semibold text-amber-950">
            {isFinal
              ? "This dispute is in a final state"
              : "Review before deciding"}
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-900">
            {isFinal
              ? "This page currently displays the recorded decision. No payment, earnings, or job changes are performed here."
              : "This page is currently read-only. The next step will add admin-only status changes and a required written resolution, without automatically changing the job or its payment."}
          </p>
        </CardContent>
      </Card>
      <DisputeDecisionForm
        disputeId={dispute.id}
        currentStatus={dispute.status}
      />
    </div>
  );
}
