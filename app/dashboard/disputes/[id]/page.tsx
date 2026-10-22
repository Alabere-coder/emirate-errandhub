import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  ShieldAlert,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

function statusVariant(
  status: string,
): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "resolved":
      return "default";
    case "rejected":
      return "destructive";
    case "under_review":
      return "secondary";
    default:
      return "outline";
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

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Button variant="outline" size="sm">
        <Link href="/dashboard/disputes">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Disputes
        </Link>
      </Button>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Dispute details</h1>
          <Badge variant={statusVariant(dispute.status)}>
            {formatStatus(dispute.status)}
          </Badge>
        </div>

        <p className="break-all text-xs text-slate-500">
          Reference: {dispute.id}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reported issue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold">Reason</p>
            <p className="mt-1 text-sm text-slate-600">{dispute.reason}</p>
          </div>

          <div>
            <p className="text-sm font-semibold">Description</p>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-600">
              {dispute.description}
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <CalendarDays className="h-4 w-4" />
                Submitted
              </p>
              <p className="mt-1 text-sm font-medium">
                {formatDate(dispute.created_at)}
              </p>
            </div>

            <div className="rounded-lg bg-slate-50 p-3">
              <p className="flex items-center gap-2 text-xs text-slate-500">
                <ClipboardList className="h-4 w-4" />
                Last updated
              </p>
              <p className="mt-1 text-sm font-medium">
                {formatDate(dispute.updated_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dispute evidence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mediaError ? (
            <p role="alert" className="text-sm text-red-700">
              Evidence could not be loaded. Please refresh and try again.
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
                      This evidence image could not be previewed.
                    </p>
                  )}

                  <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                    <span>{item.fileType}</span>
                    <span>{formatDate(item.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            Status and resolution
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-semibold">Current status</p>
            <div className="mt-2">
              <Badge variant={statusVariant(dispute.status)}>
                {formatStatus(dispute.status)}
              </Badge>
            </div>
          </div>

          {dispute.resolution ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold">Admin resolution</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                {dispute.resolution}
              </p>

              {dispute.resolved_at && (
                <p className="mt-3 text-xs text-slate-500">
                  Recorded {formatDate(dispute.resolved_at)}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-500">
              Your dispute has not received a written resolution yet. Check this
              page again for updates as the admin reviews your case.
            </p>
          )}

          <p className="text-xs leading-5 text-slate-500">
            This page is read-only. Only an authorized admin can change the
            dispute status or record a resolution.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
