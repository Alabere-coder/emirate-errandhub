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
      <div className="space-y-6">
        <Button variant="ghost">
          <Link href="/dashboard/customer/requests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Link>
        </Button>

        <Card>
          <CardContent className="py-12 text-center">
            <h1 className="text-lg font-semibold">Unable to load request</h1>

            <p className="mt-2 text-sm text-muted-foreground">
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
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Back */}
      <Button variant="ghost" className="-ml-2">
        <Link href="/dashboard/customer/requests">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Link>
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {request.title}
                </h1>

                {request.is_urgent && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Urgent
                  </Badge>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{category?.name ?? "Service category"}</span>

                {service?.name && (
                  <>
                    <span>•</span>
                    <span>{service.name}</span>
                  </>
                )}
              </div>
            </div>

            <Badge className={getStatusClassName(request.status)}>
              {getStatusLabel(request.status)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                Quotations
                {quotes && quotes.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({quotes.length})
                  </span>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent>
              {quotesError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4">
                  <p className="text-sm text-destructive">
                    Unable to load quotations for this request.
                  </p>
                </div>
              ) : !quotes || quotes.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <h3 className="font-medium">No quotations yet</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Service providers have not submitted any quotations for this
                    request yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {quotes.map((quote) => (
                    <div key={quote.id} className="rounded-xl border p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            Service Provider
                          </p>

                          <p className="mt-1 font-mono text-xs text-muted-foreground">
                            {quote.worker_id}
                          </p>
                        </div>

                        <Badge
                          className={
                            quote.status === "pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : quote.status === "accepted"
                                ? "bg-green-100 text-green-800"
                                : quote.status === "rejected"
                                  ? "bg-red-100 text-red-800"
                                  : "bg-muted text-muted-foreground"
                          }
                        >
                          {getStatusLabel(quote.status)}
                        </Badge>
                      </div>

                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <div>
                          <p className="text-xs text-muted-foreground">
                            Quotation amount
                          </p>

                          <p className="mt-1 text-xl font-semibold">
                            {formatCurrency(quote.amount, quote.currency)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Estimated duration
                          </p>

                          <p className="mt-1 text-sm font-medium">
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
                                          quote.estimated_duration_minutes % 60
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
                        <div className="mt-5">
                          <p className="text-xs text-muted-foreground">
                            Provider message
                          </p>

                          <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                            {quote.message}
                          </p>
                        </div>
                      )}

                      <div className="mt-5 text-xs text-muted-foreground">
                        Submitted{" "}
                        {new Intl.DateTimeFormat("en-NG", {
                          dateStyle: "medium",
                        }).format(new Date(quote.created_at))}
                      </div>

                      {quote.status === "pending" && (
                        <div className="mt-5">
                          <QuoteActions quoteId={quote.id} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {request.description}
              </p>
            </CardContent>
          </Card>

          <div>
            <RequestMediaGallery media={requestMedia} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex items-start gap-3">
                <Wrench className="mt-0.5 h-5 w-5 text-muted-foreground" />

                <div>
                  <p className="text-sm font-medium">Category</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {category?.name ?? "Not specified"}
                  </p>
                </div>
              </div>

              {service && (
                <div className="flex items-start gap-3">
                  <Wrench className="mt-0.5 h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="text-sm font-medium">Specific service</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {service.name}
                    </p>

                    {service.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {job && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Job Tracking</CardTitle>
                </CardHeader>

                <CardContent>
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

              <AssignedWorkerCard
                worker={assignedWorker}
                workerProfile={assignedWorkerProfile}
              />

              <div>
                <JobMediaGallery media={jobMedia} />
              </div>
            </>
          )}

          {conversation && (
            <ChatBox
              conversationId={conversation.id}
              currentUserId={user.id}
              initialMessages={conversationMessages}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle>Service Location</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />

                <div>
                  <p className="text-sm font-medium">Address</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.address ?? "Not specified"}
                  </p>
                </div>
              </div>

              {(request.city || request.state) && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="text-sm font-medium">City / State</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {[request.city, request.state].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 text-muted-foreground" />

                <div>
                  <p className="text-xs text-muted-foreground">
                    Preferred date
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {formatDate(request.preferred_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 text-muted-foreground" />

                <div>
                  <p className="text-xs text-muted-foreground">
                    Preferred time
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {formatTime(request.preferred_time)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-muted-foreground" />

                <div>
                  <p className="text-xs text-muted-foreground">
                    Estimated budget
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {formatCurrency(request.budget, request.currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Request ID</span>

                <span className="max-w-45 truncate font-mono text-xs">
                  {request.id}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Created</span>

                <span>
                  {new Intl.DateTimeFormat("en-NG", {
                    dateStyle: "medium",
                  }).format(new Date(request.created_at))}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Last updated</span>

                <span>
                  {new Intl.DateTimeFormat("en-NG", {
                    dateStyle: "medium",
                  }).format(new Date(request.updated_at))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
