import Link from "next/link";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { QuotationForm } from "@/components/dashboard/worker/jobs/quotation-form";

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

export default async function WorkerRequestDetailPage({
  params,
}: WorkerRequestPageProps) {
  const { id } = await params;

  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

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

  const { data: quotation, error: quotationError } = await supabase
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
    updated_at
  `,
    )
    .eq("request_id", request.id)
    .eq("worker_id", user.id)
    .maybeSingle();

  if (quotationError) {
    console.error("Worker quotation lookup error:", quotationError);
  }

  const category = Array.isArray(request.service_categories)
    ? request.service_categories[0]
    : request.service_categories;

  const service = Array.isArray(request.services)
    ? request.services[0]
    : request.services;

  const requestClosed =
    request.status === "completed" || request.status === "cancelled";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" className="-ml-3">
            <Link href="/dashboard/worker/jobs">← Back to requests</Link>
          </Button>

          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            {request.title}
          </h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-3 py-1 text-xs capitalize">
              {formatStatus(request.status)}
            </span>

            {request.is_urgent && (
              <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                Urgent request
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <div className="space-y-6">
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

        <div className="space-y-6">
          {quotation ? (
            <Card>
              <CardHeader>
                <CardTitle>Your quotation</CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div>
                  <p className="text-2xl font-semibold">
                    {formatCurrency(quotation.amount, quotation.currency)}
                  </p>

                  <p className="mt-1 text-xs capitalize text-muted-foreground">
                    Status: {formatStatus(quotation.status)}
                  </p>
                </div>

                {quotation.message && (
                  <div>
                    <p className="text-sm font-medium">Message</p>

                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">
                      {quotation.message}
                    </p>
                  </div>
                )}

                {quotation.estimated_duration_minutes !== null && (
                  <div>
                    <p className="text-sm font-medium">Estimated duration</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {quotation.estimated_duration_minutes >= 60
                        ? `${Math.floor(quotation.estimated_duration_minutes / 60)} hour${
                            Math.floor(
                              quotation.estimated_duration_minutes / 60,
                            ) === 1
                              ? ""
                              : "s"
                          }${
                            quotation.estimated_duration_minutes % 60
                              ? ` ${quotation.estimated_duration_minutes % 60} minutes`
                              : ""
                          }`
                        : `${quotation.estimated_duration_minutes} minute${
                            quotation.estimated_duration_minutes === 1
                              ? ""
                              : "s"
                          }`}
                    </p>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Submitted {formatDate(quotation.created_at)}
                </p>
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
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Submit a quotation</CardTitle>
              </CardHeader>

              <CardContent>
                <QuotationForm serviceRequestId={request.id} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
