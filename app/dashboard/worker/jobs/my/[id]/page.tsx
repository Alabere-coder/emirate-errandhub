import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Wallet,
  BriefcaseBusiness,
  AlertTriangle,
} from "lucide-react";

import { JobStatusActions } from "@/components/dashboard/worker/jobs/job-status-actions";
import { ChatBox } from "@/components/dashboard/shared/chat-box";
import { JobMediaUploader } from "@/components/dashboard/shared/job-media-uploader";
import {
  RequestMediaGallery,
  type RequestMediaItem,
} from "@/components/dashboard/shared/request-media-gallery";

type WorkerJobPageProps = {
  params: Promise<{ id: string }>;
};

type JobMedia = {
  id: string;
  file_url: string;
  file_type: string;
  media_type: "before" | "during" | "after" | "proof" | "other";
  uploaded_by: string;
  created_at: string;
  signed_url: string;
};

const statusLabels: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const mediaTypeLabels: Record<string, string> = {
  before: "Before",
  during: "During",
  after: "After",
  proof: "Proof of completion",
  other: "Other",
};

function formatStatus(status: string) {
  return (
    statusLabels[status] ??
    status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not recorded";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Date unavailable";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatCurrency(amount: number | null, currency: string | null) {
  if (amount === null) return "Amount unavailable";

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  } catch {
    return `${currency || "NGN"} ${Number(amount).toLocaleString("en-NG")}`;
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case "assigned":
      return "bg-blue-50 text-blue-700 ring-blue-600/20";
    case "in_progress":
      return "bg-amber-50 text-amber-700 ring-amber-600/20";
    case "completed":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    case "cancelled":
      return "bg-red-50 text-red-700 ring-red-600/20";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-600/20";
  }
}

export default async function WorkerJobDetailPage({
  params,
}: WorkerJobPageProps) {
  const { id } = await params;
  const { user, supabase } = await requireRole(["worker"]);

  const { data: workerProfile, error: workerProfileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerProfileError) {
    console.error("Worker profile lookup error:", workerProfileError);

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive">
              Unable to load your worker profile. Please try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!workerProfile) {
    notFound();
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .select(
      `
      id,
      request_id,
      quote_id,
      customer_id,
      worker_id,
      agreed_amount,
      currency,
      status,
      scheduled_at,
      started_at,
      completed_at,
      created_at,
      updated_at,
      service_requests (
        id,
        title,
        description,
        address,
        city,
        state,
        preferred_date,
        preferred_time,
        is_urgent
      )
    `,
    )
    .eq("id", id)
    .eq("worker_id", workerProfile.id)
    .maybeSingle();

  if (error) {
    console.error("Worker job lookup error:", error);

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive">
              Unable to load this job. Please try again.
            </p>
            <Button variant="outline" className="mt-4">
              <Link href="/dashboard/worker/jobs/my">Back to My Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!job) {
    notFound();
  }

  const request = Array.isArray(job.service_requests)
    ? job.service_requests[0]
    : job.service_requests;

  let requestMedia: RequestMediaItem[] = [];

  if (request?.id) {
    const { data: media, error: requestMediaError } = await supabase
      .from("service_request_media")
      .select("id, file_url, file_type, created_at")
      .eq("request_id", request.id)
      .order("created_at", { ascending: true });

    if (requestMediaError) {
      console.error("Load worker request media error:", requestMediaError);
    }

    for (const mediaItem of media ?? []) {
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("request-media")
          .createSignedUrl(mediaItem.file_url, 60 * 60);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error("Create worker request media signed URL error:", {
          mediaId: mediaItem.id,
          error: signedUrlError,
        });
        continue;
      }

      requestMedia.push({
        ...mediaItem,
        signed_url: signedUrlData.signedUrl,
      });
    }
  }

  let jobMedia: JobMedia[] = [];

  const { data: media, error: jobMediaError } = await supabase
    .from("job_media")
    .select("id, file_url, file_type, media_type, uploaded_by, created_at")
    .eq("job_id", job.id)
    .order("created_at", { ascending: true });

  if (jobMediaError) {
    console.error("Load worker job media error:", jobMediaError);
  }

  for (const mediaItem of media ?? []) {
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("job-media")
        .createSignedUrl(mediaItem.file_url, 60 * 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Create worker job media signed URL error:", {
        mediaId: mediaItem.id,
        error: signedUrlError,
      });
      continue;
    }

    jobMedia.push({
      ...mediaItem,
      media_type: mediaItem.media_type as JobMedia["media_type"],
      signed_url: signedUrlData.signedUrl,
    });
  }

  const status = formatStatus(job.status);

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .select("id")
    .eq("job_id", job.id)
    .maybeSingle();

  if (conversationError) {
    console.error("Conversation lookup error:", conversationError);
  }

  let conversationMessages: Array<{
    id: string;
    message: string | null;
    sender_id: string;
    created_at: string;
  }> = [];

  if (conversation?.id) {
    const { data: messages, error: messagesError } = await supabase
      .from("messages")
      .select("id, message, sender_id, created_at")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true });

    if (messagesError) {
      console.error("Messages lookup error:", messagesError);
    } else {
      conversationMessages = messages ?? [];
    }
  }

  const location = [request?.address, request?.city, request?.state]
    .filter(Boolean)
    .join(", ");

  const timeline = [
    {
      label: "Job assigned",
      date: job.created_at,
      completed: true,
      icon: BriefcaseBusiness,
    },
    {
      label: "Work started",
      date: job.started_at,
      completed: Boolean(job.started_at),
      icon: Clock3,
    },
    {
      label: "Job completed",
      date: job.completed_at,
      completed: Boolean(job.completed_at),
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <Button variant="ghost" className="-ml-3 mb-4">
          <Link href="/dashboard/worker/jobs/my">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My Jobs
          </Link>
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700">
              WORKER WORKSPACE
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
              {request?.title ?? "Service Job"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Review the request, manage your work, and communicate with the
              customer.
            </p>
          </div>

          <span
            className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-medium ring-1 ring-inset ${getStatusClasses(job.status)}`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Service Request</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {request?.is_urgent && (
                <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>This is an urgent service request.</span>
                </div>
              )}

              <div>
                <h2 className="text-sm font-semibold">Description</h2>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {request?.description || "No description provided."}
                </p>
              </div>

              <div className="grid gap-5 border-t pt-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-semibold">Service location</p>
                  <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{location || "Address not provided"}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold">Preferred schedule</p>
                  <div className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>
                      {request?.preferred_date || "Date not specified"}
                      {request?.preferred_time
                        ? ` · ${request.preferred_time}`
                        : ""}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <RequestMediaGallery media={requestMedia} />

          <Card>
            <CardHeader>
              <CardTitle>Job Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {timeline.map((item, index) => {
                  const Icon = item.icon;

                  return (
                    <div key={item.label} className="flex gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                          item.completed
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="min-w-0 flex-1 pt-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.date
                            ? formatDate(item.date)
                            : "Awaiting this step"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-5 sm:grid-cols-2">
                <div>
                  <dt className="text-sm text-muted-foreground">Job ID</dt>
                  <dd className="mt-1 break-all text-sm font-medium">
                    {job.id}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Request ID</dt>
                  <dd className="mt-1 break-all text-sm font-medium">
                    {job.request_id}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">Assigned</dt>
                  <dd className="mt-1 text-sm font-medium">
                    {formatDate(job.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-muted-foreground">
                    Last updated
                  </dt>
                  <dd className="mt-1 text-sm font-medium">
                    {formatDate(job.updated_at)}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>
                Job Media
                {jobMedia.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({jobMedia.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <JobMediaUploader jobId={job.id} />

              {jobMedia.length === 0 ? (
                <div className="rounded-lg border border-dashed p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    No photos or videos have been uploaded for this job yet.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {jobMedia.map((item) => {
                    const isVideo = item.file_type.startsWith("video/");

                    return (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-xl border bg-muted/20"
                      >
                        {isVideo ? (
                          <video
                            src={item.signed_url}
                            controls
                            preload="metadata"
                            className="aspect-video w-full object-cover"
                          />
                        ) : (
                          <a
                            href={item.signed_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block"
                          >
                            <img
                              src={item.signed_url}
                              alt={
                                mediaTypeLabels[item.media_type] ?? "Job media"
                              }
                              className="aspect-video w-full object-cover transition-opacity hover:opacity-90"
                            />
                          </a>
                        )}

                        <div className="border-t px-3 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium">
                              {mediaTypeLabels[item.media_type] ?? "Other"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatDate(item.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Agreed Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-50 p-3 text-emerald-700">
                  <Wallet className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-2xl font-bold tracking-tight">
                    {formatCurrency(job.agreed_amount, job.currency)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Agreed job amount
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Job Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <JobStatusActions jobId={job.id} status={job.status} />
            </CardContent>
          </Card>

          {conversation?.id && (
            <ChatBox
              conversationId={conversation.id}
              currentUserId={user.id}
              initialMessages={conversationMessages}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
