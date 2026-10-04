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
  await requireRole(["worker"]);

  const supabase = await createClient();

  const { data: jobs, error } = await supabase
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
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Available jobs error:", error);
  }

  const availableJobs = jobs ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Available Jobs
        </h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Browse customer requests and submit quotations for jobs you can
          handle.
        </p>
      </div>

      {error && (
        <Card>
          <CardContent className="py-6">
            <p className="text-sm text-destructive">
              Unable to load available jobs.
            </p>
          </CardContent>
        </Card>
      )}

      {!error && availableJobs.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-lg font-semibold">No available jobs</h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              There are currently no customer requests available for quotation.
            </p>
          </CardContent>
        </Card>
      )}

      {availableJobs.length > 0 && (
        <div className="grid gap-4">
          {availableJobs.map((job) => {
            const category = Array.isArray(job.service_categories)
              ? job.service_categories[0]
              : job.service_categories;

            const service = Array.isArray(job.services)
              ? job.services[0]
              : job.services;

            return (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-semibold">{job.title}</h2>

                        {job.is_urgent && (
                          <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-medium text-destructive">
                            Urgent
                          </span>
                        )}

                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs capitalize">
                          {formatStatus(job.status)}
                        </span>
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

                      <p className="text-xs text-muted-foreground">
                        Posted {formatDate(job.created_at)}
                      </p>
                    </div>

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
