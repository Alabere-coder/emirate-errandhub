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
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <CardTitle className="text-lg">
                {job.service_requests?.title ?? "Service Job"}
              </CardTitle>

              {job.service_requests?.description && (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                  {job.service_requests.description}
                </p>
              )}
            </div>

            <Badge variant={getStatusVariant(job.status)}>
              {STATUS_LABELS[job.status] ?? job.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-3">
              <BriefcaseBusiness className="mt-0.5 h-4 w-4 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">Agreed amount</p>
                <p className="font-medium">
                  {formatCurrency(job.agreed_amount, job.currency)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">
                  {job.status === "completed" ? "Completed" : "Scheduled"}
                </p>

                <p className="font-medium">
                  {job.status === "completed"
                    ? formatDate(job.completed_at)
                    : formatDate(job.scheduled_at)}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <UserRound className="mt-0.5 h-4 w-4 text-muted-foreground" />

              <div>
                <p className="text-xs text-muted-foreground">Worker</p>

                <p className="font-medium">Assigned worker</p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Button>
              <Link href={`/dashboard/customer/requests/${job.request_id}`}>
                View Job
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My Jobs</h1>

        <p className="mt-1 text-muted-foreground">
          Track your active jobs and view your completed jobs.
        </p>
      </div>

      {/* Active Jobs */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Active Jobs</h2>

          <p className="text-sm text-muted-foreground">
            Jobs that have been assigned or are currently in progress.
          </p>
        </div>

        {activeJobs.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="font-medium">No active jobs</p>

              <p className="mt-1 text-sm text-muted-foreground">
                You do not have any active jobs right now.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {activeJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* Completed Jobs */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Completed Jobs</h2>

          <p className="text-sm text-muted-foreground">
            Your completed service jobs and their final details.
          </p>
        </div>

        {completedJobs.length === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="font-medium">No completed jobs yet</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Completed jobs will appear here.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {completedJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

      {/* Cancelled Jobs */}
      {cancelledJobs.length > 0 && (
        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold">Cancelled Jobs</h2>

            <p className="text-sm text-muted-foreground">
              Jobs that were cancelled.
            </p>
          </div>

          <div className="space-y-4">
            {cancelledJobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
