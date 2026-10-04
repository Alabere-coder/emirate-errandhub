import Link from "next/link";

import {
  ArrowRight,
  BriefcaseBusiness,
  ClipboardList,
  Clock3,
  UserRound,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

const jobStatusLabels: Record<string, string> = {
  assigned: "Assigned",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

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

  let activeJobs: Array<{
    id: string;
    request_id: string;
    agreed_amount: number;
    currency: string;
    status: string;
    scheduled_at: string | null;
    service_requests:
      | {
          id: string;
          title: string;
        }
      | {
          id: string;
          title: string;
        }[]
      | null;
  }> = [];

  if (workerProfile) {
    const { data: jobs, error: jobsError } = await supabase
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
      .limit(5);

    if (jobsError) {
      console.error("Worker dashboard jobs error:", jobsError);
    } else {
      activeJobs = jobs ?? [];
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">Worker Dashboard</p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Welcome, {firstName}
          </h1>

          <p className="mt-2 text-slate-600">
            Find service requests, submit quotations, and manage your jobs.
          </p>
        </div>

        {/* Dashboard cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            href="/dashboard/worker/jobs"
            icon={<ClipboardList className="h-5 w-5" />}
            title="Available jobs"
            description="Browse customer requests and find jobs you can handle."
          />

          <DashboardCard
            href="/dashboard/worker/jobs"
            icon={<BriefcaseBusiness className="h-5 w-5" />}
            title="Submit quotations"
            description="Review customer requests and submit your quotation."
          />

          <DashboardCard
            href="/dashboard/worker/jobs/my"
            icon={<Clock3 className="h-5 w-5" />}
            title="My jobs"
            description="Manage jobs that have been assigned to you."
          />

          <DashboardCard
            href="/dashboard/worker/profile"
            icon={<UserRound className="h-5 w-5" />}
            title="My profile"
            description="Manage your worker profile and service information."
          />
        </div>

        {/* Active jobs */}
        {activeJobs.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Active Jobs
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Jobs currently assigned to you.
                </p>
              </div>

              <Link
                href="/dashboard/worker/jobs/my"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                View all
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {activeJobs.map((job) => {
                const request = Array.isArray(job.service_requests)
                  ? job.service_requests[0]
                  : job.service_requests;

                return (
                  <Link
                    key={job.id}
                    href={`/dashboard/worker/jobs/my/${job.id}`}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          {request?.title || "Service Job"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {job.currency}{" "}
                          {Number(job.agreed_amount).toLocaleString()}
                        </p>
                      </div>

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                        {jobStatusLabels[job.status] ??
                          job.status.replaceAll("_", " ")}
                      </span>
                    </div>

                    {job.scheduled_at && (
                      <p className="mt-4 text-sm text-slate-500">
                        Scheduled: {new Date(job.scheduled_at).toLocaleString()}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Main action */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            Find your next job
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Browse customer service requests, review the task details, and
            submit a quotation for jobs you are qualified to handle.
          </p>

          <Link
            href="/dashboard/worker/jobs"
            className="mt-5 inline-flex h-11 items-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Browse available jobs
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}

function DashboardCard({
  href,
  icon,
  title,
  description,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
        {icon}
      </div>

      <h2 className="mt-5 font-semibold text-slate-900">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </Link>
  );
}
