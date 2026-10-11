import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileText,
  Search,
  UserRound,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

const jobStatusLabels: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

type ActiveJob = {
  id: string;
  request_id: string;
  agreed_amount: number;
  currency: string;
  status: string;
  scheduled_at: string | null;
  service_requests:
    | { id: string; title: string }
    | { id: string; title: string }[]
    | null;
};

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 2,
    }).format(Number(amount) || 0);
  } catch {
    return `${currency || "NGN"} ${Number(amount || 0).toLocaleString()}`;
  }
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Date to be confirmed";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default async function WorkerDashboardPage() {
  const { user, profile, supabase } = await requireRole(["worker"]);
  const firstName = profile.first_name || "there";

  const { data: workerProfile, error: workerProfileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerProfileError) {
    console.error("Worker dashboard profile error:", workerProfileError);
  }

  let availableRequestsCount = 0;
  let quotationsCount = 0;
  let activeJobsCount = 0;
  let completedJobsCount = 0;
  let activeJobs: ActiveJob[] = [];

  if (workerProfile) {
    const [
      availableRequestsResult,
      quotationsResult,
      activeJobsResult,
      completedJobsResult,
      activeJobsListResult,
    ] = await Promise.all([
      supabase
        .from("service_requests")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),

      supabase
        .from("quotes")
        .select("id", { count: "exact", head: true })
        .eq("worker_id", workerProfile.id),

      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("worker_id", workerProfile.id)
        .in("status", ["assigned", "in_progress"]),

      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("worker_id", workerProfile.id)
        .eq("status", "completed"),

      supabase
        .from("jobs")
        .select(
          `
          id,
          request_id,
          agreed_amount,
          currency,
          status,
          scheduled_at,
          service_requests (
            id,
            title
          )
        `,
        )
        .eq("worker_id", workerProfile.id)
        .in("status", ["assigned", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    if (availableRequestsResult.error) {
      console.error(
        "Available requests count error:",
        availableRequestsResult.error,
      );
    } else {
      availableRequestsCount = availableRequestsResult.count ?? 0;
    }

    if (quotationsResult.error) {
      console.error("Worker quotations count error:", quotationsResult.error);
    } else {
      quotationsCount = quotationsResult.count ?? 0;
    }

    if (activeJobsResult.error) {
      console.error("Active jobs count error:", activeJobsResult.error);
    } else {
      activeJobsCount = activeJobsResult.count ?? 0;
    }

    if (completedJobsResult.error) {
      console.error("Completed jobs count error:", completedJobsResult.error);
    } else {
      completedJobsCount = completedJobsResult.count ?? 0;
    }

    if (activeJobsListResult.error) {
      console.error("Worker dashboard jobs error:", activeJobsListResult.error);
    } else {
      activeJobs = (activeJobsListResult.data ?? []) as ActiveJob[];
    }
  }

  const stats = [
    {
      title: "Available requests",
      value: availableRequestsCount,
      description: "Requests awaiting a worker",
      href: "/dashboard/worker/jobs",
      icon: Search,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
    {
      title: "My quotations",
      value: quotationsCount,
      description: "Quotations you have submitted",
      href: "/dashboard/worker/jobs",
      icon: FileText,
      iconClass: "bg-blue-50 text-blue-700",
    },
    {
      title: "Active jobs",
      value: activeJobsCount,
      description: "Assigned or in progress",
      href: "/dashboard/worker/jobs/my",
      icon: BriefcaseBusiness,
      iconClass: "bg-amber-50 text-amber-700",
    },
    {
      title: "Completed jobs",
      value: completedJobsCount,
      description: "Jobs marked completed",
      href: "/dashboard/worker/jobs/my",
      icon: CheckCircle2,
      iconClass: "bg-violet-50 text-violet-700",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome header */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-700">
              Worker workspace
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Welcome back, {firstName}!
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 sm:text-base">
              Find new opportunities, manage your quotations, and keep track of
              your jobs in one place.
            </p>
          </div>

          <Link
            href="/dashboard/worker/profile"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            <UserRound className="h-4 w-4" />
            My profile
          </Link>
        </section>

        {/* Primary action banner */}
        <section className="overflow-hidden rounded-2xl bg-emerald-950 p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-medium text-emerald-300">
                Your next opportunity starts here
              </p>

              <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Find work. Build your reputation.
              </h2>

              <p className="mt-3 text-sm leading-6 text-emerald-100/80 sm:text-base">
                Browse customer requests, review the task details, and submit
                quotations for jobs that match your services.
              </p>
            </div>

            <Link
              href="/dashboard/worker/jobs"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-50"
            >
              Browse available jobs
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {/* Summary statistics */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Your activity
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A quick overview of your work on Emirate ErrandHub.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;

              return (
                <Link
                  key={stat.title}
                  href={stat.href}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>

                    <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-emerald-700" />
                  </div>

                  <p className="mt-5 text-3xl font-bold tracking-tight text-slate-900">
                    {stat.value.toLocaleString()}
                  </p>

                  <h3 className="mt-1 text-sm font-semibold text-slate-800">
                    {stat.title}
                  </h3>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    {stat.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Active jobs */}
        <section>
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Active jobs
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep track of work assigned to you.
              </p>
            </div>

            <Link
              href="/dashboard/worker/jobs/my"
              className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {activeJobs.length > 0 ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {activeJobs.map((job) => {
                const request = Array.isArray(job.service_requests)
                  ? job.service_requests[0]
                  : job.service_requests;

                const inProgress = job.status === "in_progress";

                return (
                  <Link
                    key={job.id}
                    href={`/dashboard/worker/jobs/my/${job.id}`}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-200 hover:shadow-md sm:p-6"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                          Active job
                        </p>

                        <h3 className="mt-1 truncate font-semibold text-slate-900">
                          {request?.title || "Service job"}
                        </h3>

                        <p className="mt-2 text-lg font-bold text-slate-900">
                          {formatCurrency(job.agreed_amount, job.currency)}
                        </p>
                      </div>

                      <span
                        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                          inProgress
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            inProgress ? "bg-blue-600" : "bg-amber-500"
                          }`}
                        />
                        {jobStatusLabels[job.status] ??
                          job.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    {job.scheduled_at ? (
                      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
                        <CalendarClock className="h-4 w-4 shrink-0" />
                        <span>Scheduled: {formatDate(job.scheduled_at)}</span>
                      </div>
                    ) : (
                      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
                        <Clock3 className="h-4 w-4 shrink-0" />
                        <span>Schedule not set</span>
                      </div>
                    )}

                    <div className="mt-4 flex items-center justify-end gap-1 text-sm font-semibold text-emerald-700">
                      View job details
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <ClipboardList className="h-6 w-6" />
              </div>

              <h3 className="mt-4 font-semibold text-slate-900">
                No active jobs yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                When a customer accepts your quotation and a job is assigned to
                you, it will appear here.
              </p>

              <Link
                href="/dashboard/worker/jobs"
                className="mt-5 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white transition hover:bg-emerald-800"
              >
                Explore available jobs
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </section>

        {/* Quick links */}
        <section className="grid gap-4 sm:grid-cols-2">
          <Link
            href="/dashboard/worker/jobs"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-sm"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
              <Search className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">Explore requests</h3>
              <p className="mt-1 text-sm text-slate-500">
                Find work that matches your skills.
              </p>
            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
          </Link>

          <Link
            href="/dashboard/worker/profile"
            className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-sm"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
              <UserRound className="h-5 w-5" />
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-slate-900">
                Update your profile
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Keep your service information up to date.
              </p>
            </div>

            <ArrowRight className="h-4 w-4 shrink-0 text-slate-400" />
          </Link>
        </section>
      </div>
    </main>
  );
}
