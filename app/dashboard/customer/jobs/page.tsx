import Link from "next/link";
import { BriefcaseBusiness, CalendarDays, UserRound } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type CustomerJob = {
  id: string;
  request_id: string;
  worker_id: string;
  agreed_amount: number;
  currency: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  status: string;
  created_at: string;
  service_requests: {
    title: string;
    description: string | null;
  } | null;
};

const STATUS_LABELS: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function getStatusVariant(status: string) {
  switch (status) {
    case "completed":
      return "default";

    case "cancelled":
      return "destructive";

    default:
      return "secondary";
  }
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "Not scheduled";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function CustomerJobsPage() {
  const { user, supabase } = await requireRole(["customer"]);

  const { data, error } = await supabase
    .from("jobs")
    .select(
      `
      id,
      request_id,
      worker_id,
      agreed_amount,
      currency,
      scheduled_at,
      started_at,
      completed_at,
      status,
      created_at,
      service_requests (
        title,
        description
      )
    `,
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load customer jobs error:", error);
  }

  const jobs = (data ?? []) as CustomerJob[];

  const activeJobs = jobs.filter(
    (job) => job.status === "assigned" || job.status === "in_progress",
  );

  const completedJobs = jobs.filter((job) => job.status === "completed");

  const cancelledJobs = jobs.filter((job) => job.status === "cancelled");

  function JobCard({ job }: { job: CustomerJob }) {
    return (
      <Card className="group overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <BriefcaseBusiness className="h-5 w-5" />
              </div>

              <div className="min-w-0 pt-0.5">
                <CardTitle className="text-base font-semibold leading-6 tracking-tight sm:text-lg">
                  {job.service_requests?.title ?? "Service Job"}
                </CardTitle>

                {job.service_requests?.description && (
                  <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {job.service_requests.description}
                  </p>
                )}

                <p className="mt-2 text-xs text-muted-foreground">
                  Job reference:{" "}
                  <span className="font-medium text-foreground/80">
                    {job.id.slice(0, 8).toUpperCase()}
                  </span>
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center">
              <Badge
                variant={getStatusVariant(job.status)}
                className="rounded-full px-3 py-1 text-xs font-medium"
              >
                {STATUS_LABELS[job.status] ?? job.status}
              </Badge>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <BriefcaseBusiness className="h-4 w-4" />
              </div>

              <p className="text-xs font-medium text-muted-foreground">
                Agreed amount
              </p>

              <p className="mt-1 wrap-break-word text-lg font-bold tracking-tight">
                {formatCurrency(job.agreed_amount, job.currency)}
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <CalendarDays className="h-4 w-4" />
              </div>

              <p className="text-xs font-medium text-muted-foreground">
                {job.status === "completed" ? "Completed on" : "Scheduled for"}
              </p>

              <p className="mt-1 text-sm font-semibold leading-6">
                {job.status === "completed"
                  ? formatDate(job.completed_at)
                  : formatDate(job.scheduled_at)}
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 sm:col-span-2 lg:col-span-1">
              <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                <UserRound className="h-4 w-4" />
              </div>

              <p className="text-xs font-medium text-muted-foreground">
                Service provider
              </p>

              <p className="mt-1 text-sm font-semibold">Assigned worker</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              Keep track of your service request and job details.
            </p>

            <Button className="w-full rounded-xl px-5 shadow-sm transition-all hover:shadow-md sm:w-auto">
              <Link href={`/dashboard/customer/requests/${job.request_id}`}>
                View Job Details
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  function EmptyState({
    title,
    description,
  }: {
    title: string;
    description: string;
  }) {
    return (
      <Card className="overflow-hidden rounded-2xl border border-dashed border-border bg-card shadow-none">
        <CardContent className="flex flex-col items-center px-6 py-12 text-center sm:py-14">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <BriefcaseBusiness className="h-7 w-7" />
          </div>

          <h3 className="text-base font-semibold tracking-tight">{title}</h3>

          <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 pb-10 sm:space-y-10">
      <section className="relative overflow-hidden rounded-3xl border border-border/60 bg-linear-to-br from-primary/10 via-card to-card p-6 shadow-sm sm:p-8 lg:p-10">
        <div className="pointer-events-none absolute -right-12 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 right-1/4 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-background/80 px-3 py-1.5 text-xs font-medium text-primary shadow-sm">
              <BriefcaseBusiness className="h-3.5 w-3.5" />
              Your service dashboard
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              My Jobs
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
              Manage your ongoing services, keep track of scheduled work, and
              revisit completed jobs — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:min-w-67.5 sm:gap-3">
            <div className="rounded-2xl border border-border/60 bg-background/80 p-3 text-center shadow-sm backdrop-blur sm:p-4">
              <p className="text-2xl font-bold tracking-tight">
                {activeJobs.length}
              </p>
              <p className="mt-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
                Active
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/80 p-3 text-center shadow-sm backdrop-blur sm:p-4">
              <p className="text-2xl font-bold tracking-tight">
                {completedJobs.length}
              </p>
              <p className="mt-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
                Completed
              </p>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/80 p-3 text-center shadow-sm backdrop-blur sm:p-4">
              <p className="text-2xl font-bold tracking-tight">{jobs.length}</p>
              <p className="mt-1 text-[11px] font-medium text-muted-foreground sm:text-xs">
                Total jobs
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-6 w-1 rounded-full bg-primary" />
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Active Jobs
              </h2>
            </div>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Jobs that have been assigned or are currently in progress.
            </p>
          </div>

          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
            {activeJobs.length} {activeJobs.length === 1 ? "job" : "jobs"}
          </Badge>
        </div>

        {activeJobs.length === 0 ? (
          <EmptyState
            title="No active jobs"
            description="You don't have any active jobs right now. Once a quotation is accepted and a job is assigned, it will appear here."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {activeJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4 sm:space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="h-6 w-1 rounded-full bg-emerald-500" />
              <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                Completed Jobs
              </h2>
            </div>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Review your finished services and their final details.
            </p>
          </div>

          <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
            {completedJobs.length} {completedJobs.length === 1 ? "job" : "jobs"}
          </Badge>
        </div>

        {completedJobs.length === 0 ? (
          <EmptyState
            title="No completed jobs yet"
            description="Your completed services will be collected here so you can easily revisit their details."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-2">
            {completedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {cancelledJobs.length > 0 && (
        <section className="space-y-4 sm:space-y-5">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-6 w-1 rounded-full bg-destructive" />
                <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                  Cancelled Jobs
                </h2>
              </div>

              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Review the details of jobs that were cancelled.
              </p>
            </div>

            <Badge variant="secondary" className="w-fit rounded-full px-3 py-1">
              {cancelledJobs.length}{" "}
              {cancelledJobs.length === 1 ? "job" : "jobs"}
            </Badge>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {cancelledJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
