import Link from "next/link";
import { notFound } from "next/navigation";

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
  if (amount === null) {
    return "Not specified";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDuration(minutes: number | null) {
  if (minutes === null) {
    return "Not specified";
  }

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

export default async function WorkerRequestDetailPage({
  params,
}: WorkerRequestPageProps) {
  const { id } = await params;

  const { user } = await requireRole(["worker"]);

  const supabase = await createClient();

  /*
   * =========================================================
   * GET CURRENT WORKER PROFILE
   * =========================================================
   *
   * quotes.worker_id and service_request_workers.worker_id
   * both use worker_profiles.id.
   *
   * auth.users.id is stored in worker_profiles.user_id.
   */

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

  /*
   * =========================================================
   * LOAD REQUEST
   * =========================================================
   */

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

  /*
   * =========================================================
   * CHECK DIRECT ASSIGNMENT
   * =========================================================
   */

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

  /*
   * =========================================================
   * REQUEST MEDIA
   * =========================================================
   */

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

  /*
   * =========================================================
   * LOAD THIS WORKER'S QUOTATION HISTORY
   * =========================================================
   *
   * A worker can now have multiple quotations:
   *
   * pending  -> active
   * accepted -> active
   * rejected -> history, can submit again
   * cancelled -> history
   */

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

  /*
   * The newest quotation is the first item because we ordered
   * by created_at descending.
   */

  const latestQuotation = quotationHistory[0] ?? null;

  /*
   * =========================================================
   * FIND ACTIVE QUOTATION
   * =========================================================
   */

  const activeQuotation =
    quotationHistory.find(
      (quotation) =>
        quotation.status === "pending" || quotation.status === "accepted",
    ) ?? null;

  /*
   * =========================================================
   * NORMALIZE RELATIONSHIPS
   * =========================================================
   */

  const category = Array.isArray(request.service_categories)
    ? request.service_categories[0]
    : request.service_categories;

  const service = Array.isArray(request.services)
    ? request.services[0]
    : request.services;

  /*
   * =========================================================
   * REQUEST STATE
   * =========================================================
   */

  const requestClosed =
    request.status === "completed" || request.status === "cancelled";

  const canSubmitQuotation = !requestClosed && !activeQuotation;

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" className="-ml-3">
            <Link href="/dashboard/worker/jobs">← Back to jobs</Link>
          </Button>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {request.title}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize">
              {formatStatus(request.status)}
            </span>

            {isDirectRequest && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Direct Request
              </span>
            )}

            {isDirectRequest && assignment?.status && (
              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium capitalize text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Assignment: {formatStatus(assignment.status)}
              </span>
            )}

            {request.is_urgent && (
              <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                Urgent request
              </span>
            )}
          </div>
        </div>
      </div>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
          {/* =================================================
              REQUEST DETAILS
          ================================================= */}

          <Card>
            <CardHeader>
              <CardTitle>Request details</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div>
                <p className="text-sm font-medium">Description</p>

                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                  {request.description}
                </p>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Category</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {category?.name ?? "Not specified"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium">Service</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {service?.name ?? "General service request"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium">Customer budget</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatCurrency(request.budget, request.currency)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium">Request status</p>

                  <p className="mt-1 text-sm capitalize text-muted-foreground">
                    {formatStatus(request.status)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* =================================================
              MEDIA
          ================================================= */}

          <RequestMediaGallery media={requestMedia} />

          {/* =================================================
              SCHEDULE
          ================================================= */}

          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium">Preferred date</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {formatDate(request.preferred_date)}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium">Preferred time</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.preferred_time || "Not specified"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* =================================================
              LOCATION
          ================================================= */}

          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>

            <CardContent>
              {request.address || request.city || request.state ? (
                <div className="space-y-1 text-sm text-muted-foreground">
                  {request.address && <p>{request.address}</p>}

                  {(request.city || request.state) && (
                    <p>
                      {[request.city, request.state].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Location has not been specified.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===================================================
            RIGHT COLUMN
        =================================================== */}

        <div className="space-y-6">
          {/* =================================================
              DIRECT ASSIGNMENT
          ================================================= */}

          {isDirectRequest && (
            <Card>
              <CardHeader>
                <CardTitle>Direct assignment</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This customer specifically selected you for this request.
                </p>

                {assignment?.status && (
                  <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3">
                    <span className="text-sm font-medium">
                      Assignment status
                    </span>

                    <span className="text-sm capitalize text-muted-foreground">
                      {formatStatus(assignment.status)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* =================================================
              LATEST QUOTATION
          ================================================= */}

          {latestQuotation && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {latestQuotation.status === "rejected"
                    ? "Latest quotation"
                    : "Your quotation"}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div>
                  <p className="text-2xl font-semibold">
                    {formatCurrency(
                      latestQuotation.amount,
                      latestQuotation.currency,
                    )}
                  </p>

                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    Status: {formatStatus(latestQuotation.status)}
                  </p>
                </div>

                {latestQuotation.message && (
                  <div>
                    <p className="text-sm font-medium">Message</p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {latestQuotation.message}
                    </p>
                  </div>
                )}

                {latestQuotation.estimated_duration_minutes !== null && (
                  <div>
                    <p className="text-sm font-medium">Estimated duration</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatDuration(
                        latestQuotation.estimated_duration_minutes,
                      )}
                    </p>
                  </div>
                )}

                {latestQuotation.status === "rejected" &&
                  latestQuotation.rejection_reason && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                      <p className="text-sm font-medium text-destructive">
                        Customer's reason for rejection
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                        {latestQuotation.rejection_reason}
                      </p>

                      {latestQuotation.rejected_at && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Rejected {formatDate(latestQuotation.rejected_at)}
                        </p>
                      )}
                    </div>
                  )}

                <p className="text-xs text-muted-foreground">
                  Submitted {formatDate(latestQuotation.created_at)}
                </p>
              </CardContent>
            </Card>
          )}

          {/* =================================================
              SUBMIT / RESUBMIT QUOTATION
          ================================================= */}

          {canSubmitQuotation ? (
            <Card>
              <CardHeader>
                <CardTitle>
                  {latestQuotation?.status === "rejected"
                    ? "Submit a new quotation"
                    : "Submit a quotation"}
                </CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {latestQuotation?.status === "rejected" && (
                  <p className="text-sm text-muted-foreground">
                    Your previous quotation was rejected. You can submit a new
                    quotation with an updated amount or proposal.
                  </p>
                )}

                <QuotationForm serviceRequestId={request.id} />
              </CardContent>
            </Card>
          ) : requestClosed ? (
            <Card>
              <CardHeader>
                <CardTitle>Quotation unavailable</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground">
                  This request is no longer accepting quotations.
                </p>
              </CardContent>
            </Card>
          ) : activeQuotation ? (
            <Card>
              <CardHeader>
                <CardTitle>Quotation already submitted</CardTitle>
              </CardHeader>

              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {activeQuotation.status === "accepted"
                    ? "Your quotation has been accepted. This request is now assigned to you."
                    : "Your quotation is awaiting the customer's response. You cannot submit another quotation until the current quotation is resolved."}
                </p>
              </CardContent>
            </Card>
          ) : null}

          {/* =================================================
              QUOTATION HISTORY
          ================================================= */}

          {quotationHistory.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Quotation history</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {quotationHistory.slice(1).map((quotation) => (
                  <div key={quotation.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">
                          {formatCurrency(quotation.amount, quotation.currency)}
                        </p>

                        <p className="mt-1 text-xs capitalize text-muted-foreground">
                          {formatStatus(quotation.status)}
                        </p>
                      </div>

                      <p className="text-xs text-muted-foreground">
                        {formatDate(quotation.created_at)}
                      </p>
                    </div>

                    {quotation.rejection_reason && (
                      <div className="mt-3 rounded-md bg-muted/50 p-3">
                        <p className="text-xs font-medium">Rejection reason</p>

                        <p className="mt-1 text-sm text-muted-foreground">
                          {quotation.rejection_reason}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
