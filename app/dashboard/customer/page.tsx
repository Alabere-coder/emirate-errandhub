import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  ClipboardList,
  Heart,
  Search,
  UserRound,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";

const requestStatusLabels: Record<string, string> = {
  pending: "Pending",
  quoted: "Quotations received",
  accepted: "Accepted",
  assigned: "Worker assigned",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
  rejected: "Rejected",
};

const jobStatusLabels: Record<string, string> = {
  assigned: "Worker assigned",
  in_progress: "In progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default async function CustomerDashboardPage() {
  const { profile, supabase } = await requireRole(["customer"]);

  const firstName = profile.first_name || "there";

  const { data: requests, error: requestsError } = await supabase
    .from("service_requests")
    .select(
      `
      id,
      title,
      status,
      created_at
    `,
    )
    .eq("customer_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (requestsError) {
    console.error("Customer dashboard requests error:", requestsError);
  }

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
    .eq("customer_id", profile.id)
    .in("status", ["assigned", "in_progress"])
    .order("created_at", { ascending: false })
    .limit(5);

  if (jobsError) {
    console.error("Customer dashboard jobs error:", jobsError);
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-medium text-slate-500">
            Customer Dashboard
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
            Welcome, {firstName}
          </h1>

          <p className="mt-2 text-slate-600">
            Find trusted professionals and get help with your everyday tasks.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <DashboardCard
            href="/services"
            icon={<Search className="h-5 w-5" />}
            title="Find a service"
            description="Browse available services and professionals."
          />

          <DashboardCard
            href="/dashboard/customer/requests"
            icon={<ClipboardList className="h-5 w-5" />}
            title="My requests"
            description="View and manage your service requests."
          />

          <DashboardCard
            href="/dashboard/customer/favorites"
            icon={<Heart className="h-5 w-5" />}
            title="Favorites"
            description="View your saved service providers."
          />

          <DashboardCard
            href="/dashboard/customer/profile"
            icon={<UserRound className="h-5 w-5" />}
            title="My profile"
            description="Manage your account and personal details."
          />
        </div>

        {jobs && jobs.length > 0 && (
          <section className="mt-8">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Active Jobs
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Track your currently assigned service jobs.
                </p>
              </div>

              <Link
                href="/dashboard/customer/requests"
                className="text-sm font-medium text-slate-700 hover:text-slate-900"
              >
                View requests
              </Link>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {jobs.map((job) => {
                const request = Array.isArray(job.service_requests)
                  ? job.service_requests[0]
                  : job.service_requests;

                return (
                  <Link
                    key={job.id}
                    href={`/dashboard/customer/requests/${job.request_id}`}
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

                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-700">
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

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent Requests
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Keep track of your latest service requests.
              </p>
            </div>

            <Link
              href="/dashboard/customer/requests"
              className="text-sm font-medium text-slate-700 hover:text-slate-900"
            >
              View all
            </Link>
          </div>

          {!requests || requests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
              <ClipboardList className="mx-auto h-8 w-8 text-slate-400" />

              <h3 className="mt-3 font-semibold text-slate-900">
                No service requests yet
              </h3>

              <p className="mt-2 text-sm text-slate-500">
                Create your first request and start receiving quotations.
              </p>

              <Link
                href="/dashboard/customer/requests/new"
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Request a service
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="divide-y divide-slate-100">
                {requests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/dashboard/customer/requests/${request.id}`}
                    className="flex flex-col gap-3 p-5 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <h3 className="font-medium text-slate-900">
                        {request.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        Created{" "}
                        {new Date(request.created_at).toLocaleDateString()}
                      </p>
                    </div>

                    <span className="w-fit rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {requestStatusLabels[request.status] ??
                        request.status.replaceAll("_", " ")}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Need something done?
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Tell us what you need help with, choose your preferred schedule
                and location, and receive quotations from available
                professionals.
              </p>
            </div>

            <Link
              href="/dashboard/customer/requests/new"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 text-sm font-medium text-white transition hover:bg-slate-800"
            >
              Request a service
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
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
