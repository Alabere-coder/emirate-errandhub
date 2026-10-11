import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import {
  Briefcase,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  PlayCircle,
} from "lucide-react";

const statusLabels: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function formatStatus(status: string) {
  return (
    statusLabels[status] ??
    status.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())
  );
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";

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

export default async function WorkerMyJobsPage() {
  const { user, supabase } = await requireRole(["worker"]);

  const { data: workerProfile, error: workerProfileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerProfileError) {
    console.error("Worker profile lookup error:", workerProfileError);

    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold">My Jobs</h1>

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
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold">My Jobs</h1>
          <p className="text-muted-foreground">
            Jobs assigned to you will appear here.
          </p>
        </div>

        <Card>
          <CardContent className="py-10 text-center">
            <Briefcase className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

            <h2 className="font-semibold">Worker profile not found</h2>

            <p className="mt-2 text-sm text-muted-foreground">
              Complete your worker profile before managing jobs.
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

  const { data: jobs, error } = await supabase
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
    .eq("worker_id", workerProfile.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Worker jobs error:", error);

    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-2xl font-semibold">My Jobs</h1>
          <p className="text-muted-foreground">
            Manage the service jobs assigned to you.
          </p>
        </div>

        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-destructive">Unable to load your jobs.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Please refresh the page and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allJobs = jobs ?? [];

  const assignedCount = allJobs.filter(
    (job) => job.status === "assigned",
  ).length;

  const inProgressCount = allJobs.filter(
    (job) => job.status === "in_progress",
  ).length;

  const completedCount = allJobs.filter(
    (job) => job.status === "completed",
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-700">
            WORKER WORKSPACE
          </p>

          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            My Jobs
          </h1>

          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Keep track of your assignments and manage your service jobs.
          </p>
        </div>

        <Button>
          <Link href="/dashboard/worker/jobs">
            <Briefcase className="mr-2 h-4 w-4" />
            Browse Available Jobs
          </Link>
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-slate-100 p-3">
              <Briefcase className="h-5 w-5 text-slate-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total jobs</p>
              <p className="text-2xl font-bold">{allJobs.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-blue-50 p-3">
              <Clock3 className="h-5 w-5 text-blue-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Assigned</p>
              <p className="text-2xl font-bold">{assignedCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-amber-50 p-3">
              <PlayCircle className="h-5 w-5 text-amber-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">In progress</p>
              <p className="text-2xl font-bold">{inProgressCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-xl bg-emerald-50 p-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{completedCount}</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Your assignments</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            View job details, locations, schedules, and agreed prices.
          </p>
        </div>

        {allJobs.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />

              <h3 className="text-lg font-semibold">No assigned jobs yet</h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                When a customer accepts one of your quotations, the resulting
                job will appear here.
              </p>

              <Button className="mt-6">
                <Link href="/dashboard/worker/jobs">Browse Available Jobs</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {allJobs.map((job) => {
              const request = Array.isArray(job.service_requests)
                ? job.service_requests[0]
                : job.service_requests;

              return (
                <Card
                  key={job.id}
                  className="transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium capitalize ring-1 ring-inset ${getStatusClasses(job.status)}`}
                          >
                            {formatStatus(job.status)}
                          </span>

                          {request?.is_urgent && (
                            <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                              Urgent
                            </span>
                          )}
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {request?.title ?? "Service Job"}
                          </h3>

                          <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                            {request?.description || "No description provided."}
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
                          {(request?.city ||
                            request?.state ||
                            request?.address) && (
                            <div className="flex items-start gap-2">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                              <span>
                                {[request.address, request.city, request.state]
                                  .filter(Boolean)
                                  .join(", ")}
                              </span>
                            </div>
                          )}

                          <div className="flex items-start gap-2">
                            <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" />
                            <span>{formatDate(job.scheduled_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-start gap-3 border-t pt-4 lg:min-w-52 lg:items-end lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                        <p className="text-xl font-bold text-slate-900">
                          {formatCurrency(job.agreed_amount, job.currency)}
                        </p>

                        <Button>
                          <Link href={`/dashboard/worker/jobs/my/${job.id}`}>
                            View Job
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
      </section>
    </div>
  );
}
