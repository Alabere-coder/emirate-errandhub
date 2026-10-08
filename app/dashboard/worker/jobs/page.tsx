import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function formatCurrency(amount: number | null, currency: string) {
  if (amount === null) return "No budget specified";

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default async function AvailableJobsPage() {
  const { user } = await requireRole(["worker"]);

  const supabase = await createClient();

  /*
   * =========================================================
   * GET CURRENT WORKER PROFILE
   * =========================================================
   *
   * worker_profiles.id is the ID used by:
   * - service_request_workers.worker_id
   * - quotes.worker_id
   * - jobs.worker_id
   *
   * It is NOT the same as auth.users.id.
   */

  const { data: workerProfile, error: workerProfileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerProfileError) {
    console.error("Worker profile error:", workerProfileError);
  }

  if (!workerProfile) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-lg font-semibold">Worker profile not found</h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Your worker profile could not be found. Please complete your
              worker profile before viewing available jobs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  /*
   * =========================================================
   * LOAD SERVICE REQUESTS
   * =========================================================
   */

  const { data: jobs, error: jobsError } = await supabase
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
        city,
        state,
        created_at,

        service_categories (
          id,
          name
        ),

        services (
          id,
          name
        ),

        service_request_workers (
          id,
          worker_id,
          status
        )
      `,
    )
    .order("created_at", { ascending: false });

  if (jobsError) {
    console.error("Available jobs error:", jobsError);
  }

  /*
   * =========================================================
   * PREPARE JOB LIST
   * =========================================================
   *
   * We keep marketplace requests available here.
   *
   * We also detect whether the current worker was directly
   * assigned to each request.
   */

  const availableJobs = (jobs ?? []).map((job) => {
    const assignments = Array.isArray(job.service_request_workers)
      ? job.service_request_workers
      : job.service_request_workers
        ? [job.service_request_workers]
        : [];

    const assignment = assignments.find(
      (item) => item.worker_id === workerProfile.id,
    );

    return {
      ...job,
      directAssignment: assignment ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Available Jobs
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Browse customer requests and submit quotations for jobs you can
          handle.
        </p>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {(workerProfileError || jobsError) && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-destructive">
              Unable to load available jobs.
            </p>
          </CardContent>
        </Card>
      )}

      {/* =====================================================
          EMPTY STATE
      ===================================================== */}

      {!jobsError && availableJobs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-lg font-semibold">No available jobs</h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              There are currently no customer requests available for quotation.
            </p>
          </CardContent>
        </Card>
      )}

      {/* =====================================================
          JOB LIST
      ===================================================== */}

      {availableJobs.length > 0 && (
        <div className="grid gap-4">
          {availableJobs.map((job) => {
            const category = Array.isArray(job.service_categories)
              ? job.service_categories[0]
              : job.service_categories;

            const service = Array.isArray(job.services)
              ? job.services[0]
              : job.services;

            const isDirectRequest = job.directAssignment !== null;

            return (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    {/* =================================================
                        JOB INFORMATION
                    ================================================= */}

                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">{job.title}</h2>

                        {isDirectRequest && (
                          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                            Direct Request
                          </span>
                        )}

                        {job.is_urgent && (
                          <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                            Urgent
                          </span>
                        )}

                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs capitalize">
                          {formatStatus(job.status)}
                        </span>

                        {isDirectRequest && job.directAssignment?.status && (
                          <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-medium capitalize text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                            Assignment:{" "}
                            {formatStatus(job.directAssignment.status)}
                          </span>
                        )}
                      </div>

                      <p className="line-clamp-2 text-sm text-muted-foreground">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                        {category?.name && (
                          <span>
                            <span className="text-muted-foreground">
                              Category:
                            </span>{" "}
                            {category.name}
                          </span>
                        )}

                        {service?.name && (
                          <span>
                            <span className="text-muted-foreground">
                              Service:
                            </span>{" "}
                            {service.name}
                          </span>
                        )}

                        <span>
                          <span className="text-muted-foreground">
                            Customer budget:
                          </span>{" "}
                          {formatCurrency(job.budget, job.currency)}
                        </span>
                      </div>

                      {(job.city || job.state) && (
                        <p className="text-sm text-muted-foreground">
                          Location:{" "}
                          {[job.city, job.state].filter(Boolean).join(", ")}
                        </p>
                      )}

                      {(job.preferred_date || job.preferred_time) && (
                        <p className="text-sm text-muted-foreground">
                          Preferred:
                          {job.preferred_date &&
                            ` ${formatDate(job.preferred_date)}`}
                          {job.preferred_time && ` at ${job.preferred_time}`}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Posted {formatDate(job.created_at)}
                      </p>
                    </div>

                    {/* =================================================
                        ACTION
                    ================================================= */}

                    <div className="shrink-0">
                      <Button>
                        <Link href={`/dashboard/worker/jobs/${job.id}`}>
                          View job
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
