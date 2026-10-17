import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import AvailableJobsList from "./available-jobs-list";

const ASSIGNMENT_INACTIVE_STATUSES = [
  "cancelled",
  "canceled",
  "declined",
  "rejected",
  "withdrawn",
];

export default async function AvailableJobsPage() {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const { data: workerProfile, error: workerProfileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerProfileError) {
    console.error("Worker profile error:", workerProfileError);

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="font-semibold text-slate-900">
              Unable to load worker profile
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please refresh the page and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!workerProfile) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="font-semibold text-slate-900">
              Worker profile not found
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Complete your worker profile before viewing available jobs.
            </p>
            <Button className="mt-5">
              <Link href="/dashboard/worker/profile">
                Complete worker profile
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Only requests that are still open for quotations can be considered.
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
    .in("status", ["pending", "quoted"])
    .order("created_at", { ascending: false });

  if (jobsError) {
    console.error("Available jobs error:", jobsError);

    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Card>
          <CardContent className="py-10 text-center">
            <h2 className="font-semibold text-slate-900">
              Unable to load available jobs
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Please refresh the page. If the problem continues, try again
              later.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const candidateJobs = (jobs ?? []).map((job) => {
    const assignments = Array.isArray(job.service_request_workers)
      ? job.service_request_workers
      : job.service_request_workers
        ? [job.service_request_workers]
        : [];

    const activeAssignments = assignments.filter((assignment) => {
      const assignmentStatus = assignment.status?.toLowerCase() ?? "";

      return (
        assignment.worker_id &&
        !ASSIGNMENT_INACTIVE_STATUSES.includes(assignmentStatus)
      );
    });

    const assignmentForCurrentWorker = activeAssignments.find(
      (assignment) => assignment.worker_id === workerProfile.id,
    );

    return {
      ...job,
      activeAssignments,
      directAssignment: assignmentForCurrentWorker ?? null,
    };
  });

  // A request with an active worker assignment is no longer generally available.
  const availableJobs = candidateJobs.filter(
    (job) => job.activeAssignments.length === 0,
  );

  const normalizedJobs = availableJobs.map((job) => {
    const category = Array.isArray(job.service_categories)
      ? job.service_categories[0]
      : job.service_categories;

    const service = Array.isArray(job.services)
      ? job.services[0]
      : job.services;

    return {
      id: job.id,
      title: job.title,
      description: job.description,
      budget: job.budget,
      currency: job.currency || "NGN",
      status: job.status,
      is_urgent: job.is_urgent,
      preferred_date: job.preferred_date,
      preferred_time: job.preferred_time,
      city: job.city,
      state: job.state,
      created_at: job.created_at,
      category: category
        ? {
            id: category.id,
            name: category.name,
          }
        : null,
      service: service
        ? {
            id: service.id,
            name: service.name,
          }
        : null,
      directAssignment: job.directAssignment
        ? {
            id: job.directAssignment.id,
            status: job.directAssignment.status,
          }
        : null,
    };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section>
        <p className="text-sm font-semibold text-emerald-700">
          WORKER WORKSPACE
        </p>

        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          Available jobs
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
          Discover open customer requests that are still available for
          quotations. Requests already assigned to a worker are excluded.
        </p>
      </section>

      <AvailableJobsList jobs={normalizedJobs} />
    </div>
  );
}
