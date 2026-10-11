import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ArrowLeft,
  AlertTriangle,
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  History,
  MapPin,
  Tag,
  UserRoundCheck,
  XCircle,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { QuotationForm } from "@/components/dashboard/worker/jobs/quotation-form";

import {
  RequestMediaGallery,
  type RequestMediaItem,
} from "@/components/dashboard/shared/request-media-gallery";

type WorkerRequestPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(value: string | null) {
  if (!value) return "Not specified";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatCurrency(amount: number | null, currency: string) {
  if (amount === null) return "Not specified";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDuration(minutes: number | null) {
  if (minutes === null) return "Not specified";

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    return `${hours} hour${hours === 1 ? "" : "s"}${
      remainingMinutes
        ? ` ${remainingMinutes} minute${remainingMinutes === 1 ? "" : "s"}`
        : ""
    }`;
  }

  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

function StatusBadge({ status }: { status: string }) {
  const normalizedStatus = status.toLowerCase();

  const styles: Record<string, string> = {
    pending:
      "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
    quoted:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
    accepted:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    assigned:
      "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300",
    in_progress:
      "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-300",
    completed:
      "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
    rejected:
      "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-300",
    cancelled: "border-muted bg-muted text-muted-foreground",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium capitalize ${
        styles[normalizedStatus] ??
        "border-border bg-muted text-muted-foreground"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="size-5" />
      </div>

      <div className="min-w-0">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
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
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ElementType;
}) {
  return (
    <div className="min-w-0 rounded-xl border bg-background p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {Icon && <Icon className="size-4 shrink-0" />}
        <p className="text-xs font-medium">{label}</p>
      </div>

      <div className="mt-2 wrap-break-word text-sm font-medium leading-6">
        {value}
      </div>
    </div>
  );
}

export default async function WorkerRequestDetailPage({
  params,
}: WorkerRequestPageProps) {
  const { id } = await params;

  const { user } = await requireRole(["worker"]);

  const supabase = await createClient();

  // Get current worker profile.
  // worker_id references use worker_profiles.id.
  const { data: workerProfile, error: workerProfileError } = await supabase
    .from("worker_profiles")
    .select("id, verification_status, is_available")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerProfileError) {
    console.error("Worker profile lookup error:", workerProfileError);
  }

  if (!workerProfile) {
    notFound();
  }

  // Load request.
  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select(
      `
        id,
        title,
        description,
        budget,
        currency,
        status,
        is_urgent,
        preferred_date,
        preferred_time,
        address,
        city,
        state,
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
    .maybeSingle();

  if (requestError) {
    console.error("Worker request detail error:", requestError);
  }

  if (!request) {
    notFound();
  }

  // Check direct assignment.
  const { data: assignment, error: assignmentError } = await supabase
    .from("service_request_workers")
    .select(
      `
        id,
        worker_id,
        status,
        created_at,
        updated_at
      `,
    )
    .eq("request_id", request.id)
    .eq("worker_id", workerProfile.id)
    .maybeSingle();

  if (assignmentError) {
    console.error("Worker request assignment lookup error:", assignmentError);
  }

  const isDirectRequest = Boolean(assignment);

  // Load request media.
  let requestMedia: RequestMediaItem[] = [];

  const { data: media, error: mediaError } = await supabase
    .from("service_request_media")
    .select(
      `
        id,
        file_url,
        file_type,
        created_at
      `,
    )
    .eq("request_id", request.id)
    .order("created_at", { ascending: true });

  if (mediaError) {
    console.error("Worker request media lookup error:", mediaError);
  }

  for (const mediaItem of media ?? []) {
    const { data: signedUrlData, error: signedUrlError } =
      await supabase.storage
        .from("request-media")
        .createSignedUrl(mediaItem.file_url, 60 * 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error("Create request media signed URL error:", {
        mediaId: mediaItem.id,
        path: mediaItem.file_url,
        error: signedUrlError,
      });

      continue;
    }

    requestMedia.push({
      ...mediaItem,
      signed_url: signedUrlData.signedUrl,
    });
  }

  // Load this worker's quotation history.
  const { data: quotations, error: quotationsError } = await supabase
    .from("quotes")
    .select(
      `
        id,
        amount,
        currency,
        message,
        estimated_duration_minutes,
        status,
        rejection_reason,
        rejected_at,
        created_at,
        updated_at
      `,
    )
    .eq("request_id", request.id)
    .eq("worker_id", workerProfile.id)
    .order("created_at", { ascending: false });

  if (quotationsError) {
    console.error("Worker quotations lookup error:", quotationsError);
  }

  const quotationHistory = quotations ?? [];
  const latestQuotation = quotationHistory[0] ?? null;

  // Find active quotation.
  const activeQuotation =
    quotationHistory.find(
      (quotation) =>
        quotation.status === "pending" || quotation.status === "accepted",
    ) ?? null;

  // Normalize relationships.
  const category = Array.isArray(request.service_categories)
    ? request.service_categories[0]
    : request.service_categories;

  const service = Array.isArray(request.services)
    ? request.services[0]
    : request.services;

  // Preserve existing request state conditions.
  const requestClosed =
    request.status === "completed" || request.status === "cancelled";

  const canSubmitQuotation = !requestClosed && !activeQuotation;

  const locationParts = [request.city, request.state].filter(Boolean);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      {/* Page header */}
      <div className="space-y-5">
        <Button
          variant="ghost"
          className="-ml-3 w-fit gap-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/dashboard/worker/jobs">
            <ArrowLeft className="size-4" />
            Back to available jobs
          </Link>
        </Button>

        <div className="flex flex-col gap-5 rounded-2xl border bg-card p-5 shadow-sm sm:p-7 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={request.status} />

              {isDirectRequest && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <UserRoundCheck className="size-3.5" />
                  Direct request
                </span>
              )}

              {request.is_urgent && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                  <AlertTriangle className="size-3.5" />
                  Urgent
                </span>
              )}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Service request
              </p>

              <h1 className="mt-2 wrap-break-word text-2xl font-bold tracking-tight sm:text-3xl">
                {request.title}
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Review the customer's requirements, schedule, and location
                before preparing your quotation.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                Preferred date: {formatDate(request.preferred_date)}
              </span>

              {request.city && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="size-3.5" />
                  {request.city}
                </span>
              )}
            </div>
          </div>

          <div className="w-full shrink-0 rounded-xl border bg-muted/30 p-4 sm:w-auto sm:min-w-52">
            <p className="text-xs font-medium text-muted-foreground">
              Customer's budget
            </p>

            <p className="mt-2 text-2xl font-bold tracking-tight">
              {formatCurrency(request.budget, request.currency)}
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Customer's stated budget
            </p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
        {/* Left column */}
        <div className="min-w-0 space-y-6">
          {/* Request details */}
          <Card className="overflow-hidden rounded-2xl shadow-sm">
            <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
              <SectionHeading
                icon={FileText}
                title="Request details"
                description="Understand what the customer needs."
              />
            </CardHeader>

            <CardContent className="space-y-6 p-5 sm:p-6">
              <div>
                <h3 className="text-sm font-semibold">Description</h3>

                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                  {request.description || "No description provided."}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailItem
                  label="Category"
                  value={category?.name ?? "Not specified"}
                  icon={Tag}
                />

                <DetailItem
                  label="Service"
                  value={service?.name ?? "General service request"}
                  icon={BriefcaseBusiness}
                />

                <DetailItem
                  label="Request status"
                  value={<StatusBadge status={request.status} />}
                />

                <DetailItem
                  label="Preferred time"
                  value={request.preferred_time || "Not specified"}
                  icon={Clock3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Request media */}
          <Card className="overflow-hidden rounded-2xl shadow-sm">
            <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
              <SectionHeading
                icon={FileText}
                title="Photos and attachments"
                description="Visual details provided with this request."
              />
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              <RequestMediaGallery media={requestMedia} />
            </CardContent>
          </Card>

          {/* Schedule */}
          <Card className="overflow-hidden rounded-2xl shadow-sm">
            <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
              <SectionHeading
                icon={CalendarDays}
                title="Schedule"
                description="The customer's preferred timing."
              />
            </CardHeader>

            <CardContent className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
              <DetailItem
                label="Preferred date"
                value={formatDate(request.preferred_date)}
                icon={CalendarDays}
              />

              <DetailItem
                label="Preferred time"
                value={request.preferred_time || "Not specified"}
                icon={Clock3}
              />
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="overflow-hidden rounded-2xl shadow-sm">
            <CardHeader className="border-b bg-muted/20 px-5 py-5 sm:px-6">
              <SectionHeading
                icon={MapPin}
                title="Service location"
                description="Where the customer needs the service."
              />
            </CardHeader>

            <CardContent className="p-5 sm:p-6">
              {request.address || request.city || request.state ? (
                <div className="rounded-xl border bg-muted/20 p-4">
                  {request.address && (
                    <p className="text-sm font-medium leading-6">
                      {request.address}
                    </p>
                  )}

                  {locationParts.length > 0 && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {locationParts.join(", ")}
                    </p>
                  )}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed p-6 text-center">
                  <MapPin className="mx-auto size-7 text-muted-foreground/60" />

                  <p className="mt-3 text-sm font-medium">
                    Location not specified
                  </p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    The customer has not provided a service address.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="min-w-0 space-y-6 lg:sticky lg:top-6">
          {/* Direct assignment */}
          {isDirectRequest && (
            <Card className="overflow-hidden rounded-2xl border-primary/20 shadow-sm">
              <CardHeader className="border-b border-primary/10 bg-primary/5 px-5 py-5">
                <SectionHeading
                  icon={UserRoundCheck}
                  title="Direct assignment"
                  description="The customer specifically selected you."
                />
              </CardHeader>

              <CardContent className="p-5">
                {assignment?.status && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border bg-background p-4">
                    <span className="text-sm text-muted-foreground">
                      Assignment status
                    </span>

                    <StatusBadge status={assignment.status} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Latest quotation */}
          {latestQuotation && (
            <Card className="overflow-hidden rounded-2xl shadow-sm">
              <CardHeader className="border-b bg-muted/20 px-5 py-5">
                <SectionHeading
                  icon={Banknote}
                  title={
                    latestQuotation.status === "rejected"
                      ? "Latest quotation"
                      : "Your quotation"
                  }
                  description="Your most recently submitted proposal."
                />
              </CardHeader>

              <CardContent className="space-y-5 p-5">
                <div className="rounded-xl border bg-muted/20 p-4">
                  <p className="text-xs font-medium text-muted-foreground">
                    Quotation amount
                  </p>

                  <p className="mt-2 wrap-break-word text-2xl font-bold tracking-tight">
                    {formatCurrency(
                      latestQuotation.amount,
                      latestQuotation.currency,
                    )}
                  </p>

                  <div className="mt-3">
                    <StatusBadge status={latestQuotation.status} />
                  </div>
                </div>

                {latestQuotation.message && (
                  <div>
                    <h3 className="text-sm font-semibold">Your message</h3>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                      {latestQuotation.message}
                    </p>
                  </div>
                )}

                {latestQuotation.estimated_duration_minutes !== null && (
                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                      <Clock3 className="size-4 text-muted-foreground" />
                    </div>

                    <div>
                      <p className="text-sm font-medium">Estimated duration</p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {formatDuration(
                          latestQuotation.estimated_duration_minutes,
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {latestQuotation.status === "rejected" &&
                  latestQuotation.rejection_reason && (
                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                      <div className="flex items-start gap-2">
                        <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />

                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-destructive">
                            Reason for rejection
                          </p>

                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                            {latestQuotation.rejection_reason}
                          </p>

                          {latestQuotation.rejected_at && (
                            <p className="mt-3 text-xs text-muted-foreground">
                              Rejected on{" "}
                              {formatDate(latestQuotation.rejected_at)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                <p className="border-t pt-4 text-xs text-muted-foreground">
                  Submitted on {formatDate(latestQuotation.created_at)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Submit or resubmit quotation */}
          {canSubmitQuotation ? (
            <Card className="overflow-hidden rounded-2xl border-primary/20 shadow-sm">
              <CardHeader className="border-b bg-primary/5 px-5 py-5">
                <SectionHeading
                  icon={Banknote}
                  title={
                    latestQuotation?.status === "rejected"
                      ? "Submit a new quotation"
                      : "Prepare your quotation"
                  }
                  description="Provide your price and explain your proposal."
                />
              </CardHeader>

              <CardContent className="p-5">
                {latestQuotation?.status === "rejected" && (
                  <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
                    <p className="text-sm leading-6 text-amber-800 dark:text-amber-200">
                      Your previous quotation was rejected. You can submit a new
                      proposal with an updated amount or message.
                    </p>
                  </div>
                )}

                <QuotationForm serviceRequestId={request.id} />
              </CardContent>
            </Card>
          ) : requestClosed ? (
            <Card className="overflow-hidden rounded-2xl shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                    <XCircle className="size-5 text-muted-foreground" />
                  </div>

                  <div>
                    <h2 className="font-semibold">Quotation unavailable</h2>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      This request is no longer accepting quotations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : activeQuotation ? (
            <Card className="overflow-hidden rounded-2xl border-emerald-200 shadow-sm dark:border-emerald-900">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                    <CheckCircle2 className="size-5" />
                  </div>

                  <div>
                    <h2 className="font-semibold">
                      {activeQuotation.status === "accepted"
                        ? "Quotation accepted"
                        : "Quotation submitted"}
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      {activeQuotation.status === "accepted"
                        ? "Your quotation has been accepted. This request is now assigned to you."
                        : "Your quotation is awaiting the customer's response. You cannot submit another quotation until the current quotation is resolved."}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {/* Quotation history */}
          {quotationHistory.length > 1 && (
            <Card className="overflow-hidden rounded-2xl shadow-sm">
              <CardHeader className="border-b bg-muted/20 px-5 py-5">
                <SectionHeading
                  icon={History}
                  title="Quotation history"
                  description="Your previous proposals for this request."
                />
              </CardHeader>

              <CardContent className="space-y-3 p-5">
                {quotationHistory.slice(1).map((quotation) => (
                  <div
                    key={quotation.id}
                    className="rounded-xl border p-4 transition-colors hover:bg-muted/20"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="wrap-break-word text-lg font-semibold">
                          {formatCurrency(quotation.amount, quotation.currency)}
                        </p>

                        <div className="mt-2">
                          <StatusBadge status={quotation.status} />
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground sm:text-right">
                        {formatDate(quotation.created_at)}
                      </p>
                    </div>

                    {quotation.rejection_reason && (
                      <div className="mt-4 rounded-lg bg-muted/50 p-3">
                        <p className="text-xs font-semibold">
                          Rejection reason
                        </p>

                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                          {quotation.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Small request reference */}
          <div className="flex items-center gap-2 px-1 text-xs text-muted-foreground">
            <FileText className="size-3.5 shrink-0" />
            <span className="break-all">Request reference: {request.id}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
