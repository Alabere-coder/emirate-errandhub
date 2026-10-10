import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  AlertCircle,
  Wrench,
  Wallet,
  Trash2,
  Pencil,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QuoteActions } from "@/components/dashboard/customer/quotes/quote-actions";
import { JobStatusCard } from "@/components/dashboard/customer/requests/job-status-card";
import { AssignedWorkerCard } from "@/components/dashboard/customer/requests/assigned-worker-card";
import { JobStatusTimeline } from "@/components/dashboard/customer/requests/job-status-timeline";
import { ChatBox } from "@/components/dashboard/shared/chat-box";
import {
  RequestMediaGallery,
  type RequestMediaItem,
} from "@/components/dashboard/shared/request-media-gallery";
import {
  JobMediaGallery,
  type JobMediaGalleryItem,
} from "@/components/dashboard/jobs/job-media-gallery";

type RequestDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
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

const mediaTypeLabels: Record<JobMedia["media_type"], string> = {
  before: "Before",
  during: "During",
  after: "After",
  proof: "Proof of completion",
  other: "Other",
};

type JobStatusHistoryItem = {
  id: string;
  status: string;
  note: string | null;
  changed_by: string | null;
  created_at: string;
};

function formatDate(value: string | null) {
  if (!value) return "Not specified";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string | null) {
  if (!value) return "Not specified";

  const [hours, minutes] = value.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return value;
  }

  const date = new Date();

  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(value: number | null, currency: string) {
  if (value === null) {
    return "Not specified";
  }

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    quoted: "Quoted",
    accepted: "Accepted",
    assigned: "Worker Assigned",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    rejected: "Rejected",
  };

  return labels[status] ?? (status.replaceAll("_", " ") || "Unknown");
}

function getStatusClassName(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";

    case "quoted":
      return "bg-blue-100 text-blue-800";

    case "accepted":
      return "bg-indigo-100 text-indigo-800";

    case "assigned":
      return "bg-purple-100 text-purple-800";

    case "in_progress":
      return "bg-orange-100 text-orange-800";

    case "completed":
      return "bg-green-100 text-green-800";

    case "cancelled":
    case "rejected":
      return "bg-red-100 text-red-800";

    default:
      return "bg-muted text-muted-foreground";
  }
}

export default async function CustomerRequestDetailsPage({
  params,
}: RequestDetailsPageProps) {
  const { user } = await requireRole(["customer"]);

  const { id } = await params;

  const supabase = await createClient();

  const { data: request, error } = await supabase
    .from("service_requests")
    .select(
      `
        id,
        customer_id,
        category_id,
        service_id,
        title,
        description,
        budget,
        currency,
        preferred_date,
        preferred_time,
        is_urgent,
        address,
        city,
        state,
        latitude,
        longitude,
        status,
        created_at,
        updated_at,
        service_categories (
          id,
          name,
          description
        ),
        services (
          id,
          name,
          description
        )
      `,
    )
    .eq("id", id)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Load customer request error:", error);

    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 pb-10">
        <Button variant="ghost" className="-ml-2 rounded-xl">
          <Link href="/dashboard/customer/requests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Link>
        </Button>

        <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
          <CardContent className="px-6 py-14 text-center sm:px-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <AlertCircle className="h-7 w-7" />
            </div>

            <h1 className="mt-5 text-xl font-bold tracking-tight text-slate-900">
              Unable to load request
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Something went wrong while loading this request.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    notFound();
  }

  const { data: requestMediaRows, error: mediaError } = await supabase
    .from("service_request_media")
    .select("id, file_url, file_type, created_at")
    .eq("request_id", request.id)
    .order("created_at", { ascending: true });

  if (mediaError) {
    console.error("Load request media error:", mediaError);
  }

  const requestMedia: RequestMediaItem[] = [];

  for (const media of requestMediaRows ?? []) {
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("request-media")
        .createSignedUrl(media.file_url, 60 * 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Create request media signed URL error:", {
        mediaId: media.id,
        path: media.file_url,
        error: signedUrlError,
      });

      continue;
    }

    requestMedia.push({
      ...media,
      signed_url: signedUrlData.signedUrl,
    });
  }

  const category = Array.isArray(request.service_categories)
    ? request.service_categories[0]
    : request.service_categories;

  const service = Array.isArray(request.services)
    ? request.services[0]
    : request.services;

  const { data: quotes, error: quotesError } = await supabase
    .from("quotes")
    .select(
      `
    id,
    amount,
    currency,
    message,
    estimated_duration_minutes,
    status,
    created_at,
    worker_id
  `,
    )
    .eq("request_id", request.id)
    .order("created_at", { ascending: true });

  if (quotesError) {
    console.error("Load customer quotes error:", quotesError);
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select(
      `
    id,
    quote_id,
    worker_id,
    agreed_amount,
    currency,
    status,
    scheduled_at,
    started_at,
    completed_at,
    created_at,
    updated_at,
    worker_profiles (
      id,
      user_id,
      bio,
      years_of_experience,
      starting_price,
      currency,
      verification_status,
      is_available
    )
  `,
    )
    .eq("request_id", request.id)
    .maybeSingle();

  if (jobError) {
    console.error("Customer job lookup error:", jobError);
  }

  let jobMedia: JobMedia[] = [];

  if (job?.id) {
    const { data: media, error: jobMediaError } = await supabase
      .from("job_media")
      .select(
        `
      id,
      file_url,
      file_type,
      media_type,
      uploaded_by,
      created_at
    `,
      )
      .eq("job_id", job.id)
      .order("created_at", { ascending: true });

    if (jobMediaError) {
      console.error("Load job media error:", jobMediaError);
    }

    for (const mediaItem of media ?? []) {
      const { data: signedUrlData, error: signedUrlError } =
        await supabase.storage
          .from("job-media")
          .createSignedUrl(mediaItem.file_url, 60 * 60);

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error("Create job media signed URL error:", {
          mediaId: mediaItem.id,
          path: mediaItem.file_url,
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
  }

  let assignedWorkerProfile = null;
  let assignedWorker = null;

  if (job?.worker_profiles) {
    const workerProfile = Array.isArray(job.worker_profiles)
      ? job.worker_profiles[0]
      : job.worker_profiles;

    assignedWorkerProfile = workerProfile;

    if (workerProfile?.user_id) {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(
          `
        id,
        first_name,
        last_name,
        avatar_url
      `,
        )
        .eq("id", workerProfile.user_id)
        .maybeSingle();

      if (profileError) {
        console.error("Assigned worker profile error:", profileError);
      }

      assignedWorker = profile;
    }
  }

  let conversation = null;
  let conversationMessages: Array<{
    id: string;
    message: string | null;
    sender_id: string;
    created_at: string;
  }> = [];

  if (job?.id) {
    const { data: conversationData, error: conversationError } = await supabase
      .from("conversations")
      .select("id")
      .eq("job_id", job.id)
      .maybeSingle();

    if (conversationError) {
      console.error("Conversation lookup error:", conversationError);
    }

    conversation = conversationData;

    if (conversation?.id) {
      const { data: messages, error: messagesError } = await supabase
        .from("messages")
        .select(
          `
          id,
          message,
          sender_id,
          created_at
        `,
        )
        .eq("conversation_id", conversation.id)
        .order("created_at", {
          ascending: true,
        });

      if (messagesError) {
        console.error("Messages lookup error:", messagesError);
      } else {
        conversationMessages = messages ?? [];
      }
    }
  }

  let jobStatusHistory: JobStatusHistoryItem[] = [];

  if (job?.id) {
    const { data: history, error: historyError } = await supabase
      .from("job_status_history")
      .select(
        `
        id,
        status,
        note,
        changed_by,
        created_at
      `,
      )
      .eq("job_id", job.id)
      .order("created_at", { ascending: true });

    if (historyError) {
      console.error("Load job status history error:", historyError);
    }

    jobStatusHistory = history ?? [];
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-10">
      {/* Back navigation */}
      <Button
        variant="ghost"
        className="-ml-2 rounded-xl text-slate-600 hover:bg-white hover:text-teal-700"
      >
        <Link href="/dashboard/customer/requests">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Link>
      </Button>

      {/* Request header */}
      <Card className="overflow-hidden rounded-2xl border-0 bg-slate-950 text-white shadow-lg shadow-slate-900/5">
        <CardContent className="relative p-6 sm:p-8">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full bg-teal-500/10 blur-3xl" />

          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="mb-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                  Request details
                </span>

                {request.is_urgent && (
                  <Badge
                    variant="destructive"
                    className="gap-1 rounded-full border border-red-300/20"
                  >
                    <AlertCircle className="h-3 w-3" />
                    Urgent
                  </Badge>
                )}
              </div>

              <h1 className="wrap-break-word text-2xl font-bold tracking-tight sm:text-3xl">
                {request.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-300">
                <span>{category?.name ?? "Service category"}</span>

                {service?.name && (
                  <>
                    <span className="text-slate-500">/</span>
                    <span>{service.name}</span>
                  </>
                )}
              </div>

              <p className="mt-4 text-sm text-slate-400">
                Request reference:{" "}
                <span className="font-mono text-slate-300">{request.id}</span>
              </p>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
              {request.status === "pending" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl border-white/20 bg-white/10 text-white hover:bg-white/20 hover:text-white"
                  >
                    <Link
                      href={`/dashboard/customer/requests/${request.id}/edit`}
                      className="flex items-center gap-2"
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Request
                    </Link>
                  </Button>

                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    // disabled
                    title="Delete will be enabled after the server action is implemented."
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Request
                  </Button>
                </div>
              )}
              <Badge
                className={`${getStatusClassName(request.status)} rounded-full border border-white/10 px-3 py-1.5`}
              >
                {getStatusLabel(request.status)}
              </Badge>

              <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 sm:min-w-48">
                <p className="text-xs font-medium text-slate-400">
                  Your budget
                </p>
                <p className="mt-1 text-xl font-bold text-white">
                  {formatCurrency(request.budget, request.currency)}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid items-start gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="min-w-0 space-y-6 lg:col-span-2">
          {/* Quotations */}
          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-white px-5 py-5 sm:px-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Quotations
                  </CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    Review the offers submitted for your request.
                  </p>
                </div>

                {quotes && quotes.length > 0 && (
                  <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-teal-50 px-2 text-sm font-bold text-teal-700">
                    {quotes.length}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              {quotesError ? (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive">
                    Unable to load quotations for this request.
                  </p>
                </div>
              ) : !quotes || quotes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-10 text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm ring-1 ring-slate-200">
                    <Wallet className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold text-slate-900">
                    No quotations yet
                  </h3>
                  <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                    Service providers have not submitted any quotations for this
                    request yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="overflow-hidden rounded-xl border border-slate-200 transition-colors hover:border-teal-200"
                    >
                      <div className="p-4 sm:p-5">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900">
                              Service Provider
                            </p>

                            <p className="mt-1 break-all font-mono text-xs text-slate-400">
                              {quote.worker_id}
                            </p>
                          </div>

                          <Badge
                            className={`w-fit rounded-full px-3 py-1 ${
                              quote.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : quote.status === "accepted"
                                  ? "bg-green-100 text-green-800"
                                  : quote.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {getStatusLabel(quote.status)}
                          </Badge>
                        </div>

                        <div className="mt-5 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              Quotation amount
                            </p>

                            <p className="mt-1 text-xl font-bold tracking-tight text-slate-900">
                              {formatCurrency(quote.amount, quote.currency)}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-slate-500">
                              Estimated duration
                            </p>

                            <p className="mt-1 text-sm font-semibold text-slate-800">
                              {quote.estimated_duration_minutes === null
                                ? "Not specified"
                                : quote.estimated_duration_minutes >= 60
                                  ? `${Math.floor(
                                      quote.estimated_duration_minutes / 60,
                                    )} hour${
                                      Math.floor(
                                        quote.estimated_duration_minutes / 60,
                                      ) === 1
                                        ? ""
                                        : "s"
                                    }${
                                      quote.estimated_duration_minutes % 60
                                        ? ` ${
                                            quote.estimated_duration_minutes %
                                            60
                                          } minutes`
                                        : ""
                                    }`
                                  : `${quote.estimated_duration_minutes} minute${
                                      quote.estimated_duration_minutes === 1
                                        ? ""
                                        : "s"
                                    }`}
                            </p>
                          </div>
                        </div>

                        {quote.message && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Provider message
                            </p>

                            <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm leading-6 text-slate-600">
                              {quote.message}
                            </p>
                          </div>
                        )}

                        <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                          Submitted{" "}
                          {new Intl.DateTimeFormat("en-NG", {
                            dateStyle: "medium",
                          }).format(new Date(quote.created_at))}
                        </div>
                      </div>

                      {quote.status === "pending" && (
                        <div className="border-t border-slate-100 bg-slate-50/70 p-4 sm:px-5">
                          <QuoteActions quoteId={quote.id} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Request details */}
          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <CardTitle className="text-lg font-bold text-slate-900">
                Request Details
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              <p className="whitespace-pre-wrap wrap-break-word text-sm leading-7 text-slate-600">
                {request.description}
              </p>
            </CardContent>
          </Card>

          {/* Request media */}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <RequestMediaGallery media={requestMedia} />
          </div>

          {/* Service information */}
          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <CardTitle className="text-lg font-bold text-slate-900">
                Service Information
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <Wrench className="h-5 w-5" />
                </div>

                <div className="min-w-0 pt-0.5">
                  <p className="text-xs font-medium text-slate-500">Category</p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {category?.name ?? "Not specified"}
                  </p>
                </div>
              </div>

              {service && (
                <div className="flex items-start gap-3 border-t border-slate-100 pt-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <Wrench className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 pt-0.5">
                    <p className="text-xs font-medium text-slate-500">
                      Specific service
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {service.name}
                    </p>

                    {service.description && (
                      <p className="mt-2 text-sm leading-6 text-slate-500">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Job tracking */}
          {job && (
            <>
              <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-6">
                  <CardTitle className="text-lg font-bold text-slate-900">
                    Job Tracking
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-5 sm:p-6">
                  <JobStatusCard
                    status={job.status}
                    agreedAmount={job.agreed_amount}
                    currency={job.currency}
                    scheduledAt={job.scheduled_at}
                    startedAt={job.started_at}
                    completedAt={job.completed_at}
                  />
                </CardContent>
              </Card>

              {job && <JobStatusTimeline history={jobStatusHistory} />}

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <AssignedWorkerCard
                  worker={assignedWorker}
                  workerProfile={assignedWorkerProfile}
                />
              </div>

              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
                <JobMediaGallery media={jobMedia} />
              </div>
            </>
          )}

          {/* Conversation */}
          {conversation && (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <ChatBox
                conversationId={conversation.id}
                currentUserId={user.id}
                initialMessages={conversationMessages}
              />
            </div>
          )}

          {/* Service location */}
          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 px-5 py-5 sm:px-6">
              <CardTitle className="text-lg font-bold text-slate-900">
                Service Location
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5 p-5 sm:p-6">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                  <MapPin className="h-5 w-5" />
                </div>

                <div className="min-w-0 pt-0.5">
                  <p className="text-xs font-medium text-slate-500">Address</p>

                  <p className="mt-1 wrap-break-word text-sm font-semibold leading-6 text-slate-800">
                    {request.address ?? "Not specified"}
                  </p>
                </div>
              </div>

              {(request.city || request.state) && (
                <div className="flex items-start gap-3 border-t border-slate-100 pt-5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <MapPin className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 pt-0.5">
                    <p className="text-xs font-medium text-slate-500">
                      City / State
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-800">
                      {[request.city, request.state].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5 lg:sticky lg:top-6">
          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 px-5 py-5">
              <CardTitle className="text-base font-bold text-slate-900">
                Schedule
              </CardTitle>
              <p className="text-sm text-slate-500">
                Your preferred service timing.
              </p>
            </CardHeader>

            <CardContent className="space-y-5 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                  <CalendarDays className="h-4 w-4" />
                </div>

                <div className="min-w-0 pt-0.5">
                  <p className="text-xs font-medium text-slate-500">
                    Preferred date
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatDate(request.preferred_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                  <Clock3 className="h-4 w-4" />
                </div>

                <div className="min-w-0 pt-0.5">
                  <p className="text-xs font-medium text-slate-500">
                    Preferred time
                  </p>

                  <p className="mt-1 text-sm font-semibold text-slate-900">
                    {formatTime(request.preferred_time)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-950 px-5 py-4 text-white">
              <CardTitle className="flex items-center gap-2 text-base font-bold">
                <Wallet className="h-4 w-4 text-teal-300" />
                Budget
              </CardTitle>
            </CardHeader>

            <CardContent className="p-5">
              <p className="text-xs font-medium text-slate-500">
                Estimated budget
              </p>

              <p className="mt-2 wrap-break-word text-2xl font-bold tracking-tight text-slate-900">
                {formatCurrency(request.budget, request.currency)}
              </p>
            </CardContent>
          </Card>

          <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 px-5 py-5">
              <CardTitle className="text-base font-bold text-slate-900">
                Request Information
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4 p-5 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-500">Request ID</p>

                <p className="mt-1 break-all font-mono text-xs leading-5 text-slate-700">
                  {request.id}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-medium text-slate-500">Created</p>

                <p className="mt-1 font-medium text-slate-800">
                  {new Intl.DateTimeFormat("en-NG", {
                    dateStyle: "medium",
                  }).format(new Date(request.created_at))}
                </p>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <p className="text-xs font-medium text-slate-500">
                  Last updated
                </p>

                <p className="mt-1 font-medium text-slate-800">
                  {new Intl.DateTimeFormat("en-NG", {
                    dateStyle: "medium",
                  }).format(new Date(request.updated_at))}
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-2xl border border-teal-100 bg-linear-to-br from-teal-50 to-white p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-teal-700 shadow-sm ring-1 ring-teal-100">
              <Wrench className="h-5 w-5" />
            </div>

            <h3 className="mt-4 text-sm font-bold text-slate-900">
              Your service, at a glance
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Review quotations, check your preferred schedule, and follow your
              job&apos;s progress from this page.
            </p>

            <Link
              href="/dashboard/customer/requests"
              className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-900"
            >
              <ArrowLeft className="h-4 w-4" />
              All my requests
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
