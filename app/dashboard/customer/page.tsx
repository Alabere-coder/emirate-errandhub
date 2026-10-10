import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Heart,
  Plus,
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

const statusStyles: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
  quoted: "bg-blue-50 text-blue-700 ring-blue-600/20",
  accepted: "bg-indigo-50 text-indigo-700 ring-indigo-600/20",
  assigned: "bg-violet-50 text-violet-700 ring-violet-600/20",
  in_progress: "bg-sky-50 text-sky-700 ring-sky-600/20",
  completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  cancelled: "bg-slate-100 text-slate-600 ring-slate-500/20",
  rejected: "bg-rose-50 text-rose-700 ring-rose-600/20",
};

function getStatusStyle(status: string) {
  return (
    statusStyles[status] ?? "bg-slate-100 text-slate-600 ring-slate-500/20"
  );
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function CustomerDashboardPage() {
  const { profile, supabase } = await requireRole(["customer"]);

  const firstName = profile.first_name || "there";

  const { data: requests, error: requestsError } = await supabase
    .from("service_requests")
    .select("id, title, status, created_at")
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

  const recentRequests = requests ?? [];
  const activeJobs = jobs ?? [];

  const pendingQuotes = recentRequests.filter(
    (request) => request.status === "quoted",
  ).length;

  const activeRequests = recentRequests.filter((request) =>
    ["pending", "quoted", "accepted", "assigned", "in_progress"].includes(
      request.status,
    ),
  ).length;

  const completedRequests = recentRequests.filter(
    (request) => request.status === "completed",
  ).length;

  return (
    <main className="min-h-screen bg-slate-50/80">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-9 lg:px-8">
        {/* Welcome banner */}
        <section className="relative isolate overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-sm sm:px-9 sm:py-10">
          <div
            aria-hidden="true"
            className="absolute -right-16 -top-28 -z-10 h-72 w-72 rounded-full bg-teal-400/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="absolute -bottom-36 right-1/3 -z-10 h-64 w-64 rounded-full bg-blue-500/15 blur-3xl"
          />

          <div className="relative flex flex-col gap-7 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                <span className="h-2 w-2 rounded-full bg-teal-400" />
                Your personal service hub
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome back, {firstName}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                What do you need help with today? Find trusted professionals,
                manage your requests, and keep your jobs on track.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/dashboard/customer/requests/new"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-400 px-5 text-sm font-semibold text-slate-950 transition hover:bg-teal-300"
                >
                  <Plus className="h-4 w-4" />
                  Request a service
                </Link>

                <Link
                  href="/services"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/20 px-5 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  Explore services
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="hidden shrink-0 sm:flex sm:h-24 sm:w-24 sm:items-center sm:justify-center sm:rounded-3xl sm:border sm:border-white/10 sm:bg-white/5">
              <BriefcaseBusiness className="h-11 w-11 text-teal-300" />
            </div>
          </div>
        </section>

        {/* Quick navigation */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Quick access
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Everything you need, just a click away.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardCard
              href="/services"
              icon={<Search className="h-5 w-5" />}
              title="Find a service"
              description="Discover services and professionals."
              accent="bg-teal-50 text-teal-700"
            />

            <DashboardCard
              href="/dashboard/customer/requests"
              icon={<ClipboardList className="h-5 w-5" />}
              title="My requests"
              description="Track requests and review quotations."
              accent="bg-blue-50 text-blue-700"
            />

            <DashboardCard
              href="/dashboard/customer/favorites"
              icon={<Heart className="h-5 w-5" />}
              title="Favorites"
              description="Return to your saved providers."
              accent="bg-rose-50 text-rose-700"
            />

            <DashboardCard
              href="/dashboard/customer/profile"
              icon={<UserRound className="h-5 w-5" />}
              title="My profile"
              description="Manage your account details."
              accent="bg-violet-50 text-violet-700"
            />
          </div>
        </section>

        {/* Overview */}
        <section className="mt-8">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              Your overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A snapshot of your latest activity.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <OverviewCard
              icon={<ClipboardList className="h-5 w-5" />}
              label="Recent active requests"
              value={activeRequests}
              description="From your latest five requests"
              accent="bg-blue-50 text-blue-700"
            />

            <OverviewCard
              icon={<Clock3 className="h-5 w-5" />}
              label="Quotes to review"
              value={pendingQuotes}
              description="Requests with quotations received"
              accent="bg-amber-50 text-amber-700"
            />

            <OverviewCard
              icon={<CheckCircle2 className="h-5 w-5" />}
              label="Recently completed"
              value={completedRequests}
              description="Completed among your latest five requests"
              accent="bg-emerald-50 text-emerald-700"
            />
          </div>
        </section>

        {/* Active jobs */}
        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Active jobs
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Keep up with the services currently underway.
              </p>
            </div>

            <Link
              href="/dashboard/customer/requests"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-slate-700 transition hover:text-teal-700"
            >
              View all requests
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {activeJobs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-9 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <BriefcaseBusiness className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">
                No active jobs right now
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                When a quotation is accepted and a job is assigned, you will see
                its progress here.
              </p>
              <Link
                href="/services"
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Explore services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              {activeJobs.map((job) => {
                const request = Array.isArray(job.service_requests)
                  ? job.service_requests[0]
                  : job.service_requests;

                return (
                  <Link
                    key={job.id}
                    href={`/dashboard/customer/requests/${job.request_id}`}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md sm:p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                        <BriefcaseBusiness className="h-5 w-5" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-slate-900 transition group-hover:text-teal-800">
                            {request?.title || "Service job"}
                          </h3>
                          <StatusBadge status={job.status} />
                        </div>

                        <p className="mt-2 text-lg font-semibold text-slate-900">
                          {job.currency}{" "}
                          {Number(job.agreed_amount).toLocaleString("en-NG")}
                        </p>

                        {job.scheduled_at && (
                          <p className="mt-3 flex items-center gap-2 text-sm text-slate-500">
                            <CalendarDays className="h-4 w-4 shrink-0" />
                            {formatDateTime(job.scheduled_at)}
                          </p>
                        )}

                        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-teal-700">
                          View job details
                          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent requests */}
        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight text-slate-900">
                Recent requests
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Follow your latest service requests and quotations.
              </p>
            </div>

            <Link
              href="/dashboard/customer/requests"
              className="inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-slate-700 transition hover:text-teal-700"
            >
              View all requests
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentRequests.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
                <ClipboardList className="h-7 w-7" />
              </div>

              <h3 className="mt-4 text-base font-semibold text-slate-900">
                Your next task starts here
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Tell us what you need help with and receive quotations from
                professionals who can get the job done.
              </p>

              <Link
                href="/dashboard/customer/requests/new"
                className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Create your first request
              </Link>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="divide-y divide-slate-100">
                {recentRequests.map((request) => (
                  <Link
                    key={request.id}
                    href={`/dashboard/customer/requests/${request.id}`}
                    className="group flex flex-col gap-3 p-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition group-hover:bg-teal-50 group-hover:text-teal-700">
                        <ClipboardList className="h-5 w-5" />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-900">
                          {request.title}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          Created {formatDate(request.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-4 pl-13 sm:pl-0">
                      <StatusBadge status={request.status} />
                      <ArrowRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-1 group-hover:text-teal-700" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Bottom call to action */}
        <section className="mt-10 overflow-hidden rounded-2xl border border-teal-100 bg-teal-50/70 p-6 sm:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-teal-800">
                Need a helping hand?
              </p>
              <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                Get your next task taken care of.
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Describe what you need, choose your preferred schedule and
                location, and receive quotations from professionals.
              </p>
            </div>

            <Link
              href="/dashboard/customer/requests/new"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
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
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}
        >
          {icon}
        </div>
        <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-600" />
      </div>

      <h3 className="mt-5 font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
    </Link>
  );
}

function OverviewCard({
  icon,
  label,
  value,
  description,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  description: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{label}</p>
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-500">{description}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const label =
    requestStatusLabels[status] ??
    jobStatusLabels[status] ??
    status.replaceAll("_", " ");

  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold capitalize ring-1 ring-inset ${getStatusStyle(status)}`}
    >
      {label}
    </span>
  );
}
