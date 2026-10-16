import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Clock3,
  Layers3,
  ShieldAlert,
  Users,
  XCircle,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

const requestStatuses = [
  { key: "pending", label: "Pending", color: "bg-amber-500" },
  { key: "quoted", label: "Quoted", color: "bg-blue-500" },
  { key: "accepted", label: "Accepted", color: "bg-indigo-500" },
  { key: "assigned", label: "Assigned", color: "bg-violet-500" },
  { key: "in_progress", label: "In progress", color: "bg-cyan-500" },
  { key: "completed", label: "Completed", color: "bg-emerald-500" },
  { key: "cancelled", label: "Cancelled", color: "bg-slate-400" },
  { key: "rejected", label: "Rejected", color: "bg-rose-500" },
] as const;

function formatStatus(status: string) {
  return status
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: "bg-amber-50 text-amber-700",
    quoted: "bg-blue-50 text-blue-700",
    accepted: "bg-indigo-50 text-indigo-700",
    assigned: "bg-violet-50 text-violet-700",
    in_progress: "bg-cyan-50 text-cyan-700",
    completed: "bg-emerald-50 text-emerald-700",
    cancelled: "bg-slate-100 text-slate-600",
    rejected: "bg-rose-50 text-rose-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        styles[status] ?? "bg-slate-100 text-slate-600"
      }`}
    >
      {formatStatus(status)}
    </span>
  );
}

export default async function AdminDashboardPage() {
  const { profile } = await requireRole(["admin"]);
  const supabase = await createClient();

  const [
    customersResult,
    workersResult,
    activeProfilesResult,
    inactiveProfilesResult,
    jobsResult,
    categoriesResult,
    pendingResult,
    quotedResult,
    acceptedResult,
    assignedResult,
    inProgressResult,
    completedResult,
    cancelledResult,
    rejectedResult,
    recentRequestsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer"),

    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "worker"),

    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),

    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("is_active", false),

    supabase.from("jobs").select("id", { count: "exact", head: true }),

    supabase
      .from("service_categories")
      .select("id", { count: "exact", head: true })
      .eq("is_active", true),

    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "quoted"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "assigned"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "cancelled"),
    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "rejected"),

    supabase
      .from("service_requests")
      .select("id, title, status, created_at, city")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const results = [
    customersResult,
    workersResult,
    activeProfilesResult,
    inactiveProfilesResult,
    jobsResult,
    categoriesResult,
    pendingResult,
    quotedResult,
    acceptedResult,
    assignedResult,
    inProgressResult,
    completedResult,
    cancelledResult,
    rejectedResult,
    recentRequestsResult,
  ];

  const hasError = results.some((result) => result.error);

  const totalRequests = [
    pendingResult,
    quotedResult,
    acceptedResult,
    assignedResult,
    inProgressResult,
    completedResult,
    cancelledResult,
    rejectedResult,
  ].reduce((sum, result) => sum + (result.count ?? 0), 0);

  const statuses = [
    { ...requestStatuses[0], count: pendingResult.count ?? 0 },
    { ...requestStatuses[1], count: quotedResult.count ?? 0 },
    { ...requestStatuses[2], count: acceptedResult.count ?? 0 },
    { ...requestStatuses[3], count: assignedResult.count ?? 0 },
    { ...requestStatuses[4], count: inProgressResult.count ?? 0 },
    { ...requestStatuses[5], count: completedResult.count ?? 0 },
    { ...requestStatuses[6], count: cancelledResult.count ?? 0 },
    { ...requestStatuses[7], count: rejectedResult.count ?? 0 },
  ];

  const overviewCards = [
    {
      title: "Customers",
      value: customersResult.count,
      description: "Registered customer accounts",
      icon: Users,
    },
    {
      title: "Workers",
      value: workersResult.count,
      description: "Registered service providers",
      icon: BriefcaseBusiness,
    },
    {
      title: "Service requests",
      value: totalRequests,
      description: "Requests across all statuses",
      icon: ClipboardList,
    },
    {
      title: "Jobs",
      value: jobsResult.count,
      description: "Jobs recorded on the platform",
      icon: Activity,
    },
  ];

  const pendingRequests = pendingResult.count ?? 0;
  const inProgressRequests = inProgressResult.count ?? 0;
  const completedRequests = completedResult.count ?? 0;

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        {/* Page heading */}
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">
              Administration / Overview
            </p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">
              Welcome, {profile.first_name || "Admin"}
            </h1>
            <p className="mt-2 text-slate-600">
              Monitor your marketplace, manage service activity, and keep
              operations running smoothly.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            <CheckCircle2 className="h-4 w-4" />
            Admin access
          </div>
        </section>

        {hasError && (
          <div
            role="alert"
            className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
          >
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <p className="font-semibold">
                Some dashboard data could not be loaded.
              </p>
              <p className="mt-1">
                Check the Supabase query errors and Row Level Security policies.
                A missing count may otherwise appear as zero.
              </p>
            </div>
          </div>
        )}

        {/* Main statistics */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Marketplace overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A snapshot of registered users and platform activity.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {overviewCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-3xl font-bold tracking-tight text-slate-900">
                      {card.value?.toLocaleString() ?? "—"}
                    </span>
                  </div>
                  <h3 className="mt-5 font-semibold text-slate-900">
                    {card.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {card.description}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* Operational indicators */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Clock3 className="h-4 w-4" />
              Pending requests
            </div>
            <p className="mt-3 text-2xl font-bold text-amber-600">
              {pendingResult.count?.toLocaleString() ?? "—"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Waiting for the next step
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Activity className="h-4 w-4" />
              In-progress requests
            </div>
            <p className="mt-3 text-2xl font-bold text-cyan-700">
              {inProgressRequests.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Currently being fulfilled
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <CheckCircle2 className="h-4 w-4" />
              Completed requests
            </div>
            <p className="mt-3 text-2xl font-bold text-emerald-700">
              {completedRequests.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">Marked as completed</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Layers3 className="h-4 w-4" />
              Active categories
            </div>
            <p className="mt-3 text-2xl font-bold text-slate-900">
              {categoriesResult.count?.toLocaleString() ?? "—"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Categories available to customers
            </p>
          </div>
        </section>

        {/* Status breakdown */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-slate-900">
              Request status breakdown
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              See how customer requests are distributed across their lifecycle.
            </p>
          </div>

          {totalRequests === 0 ? (
            <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">
              No requests to display yet.
            </p>
          ) : (
            <div className="space-y-5">
              {statuses.map((status) => {
                const percentage =
                  totalRequests > 0 ? (status.count / totalRequests) * 100 : 0;

                return (
                  <div key={status.key}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-sm font-medium text-slate-700">
                        {status.label}
                      </span>
                      <span className="text-sm tabular-nums text-slate-500">
                        {status.count.toLocaleString()}{" "}
                        <span className="text-slate-400">
                          ({percentage.toFixed(1)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${status.color}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent requests */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-200 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Recent service requests
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                The latest requests submitted by customers.
              </p>
            </div>

            <Link
              href="/dashboard/admin/requests"
              className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950"
            >
              View requests
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {recentRequestsResult.error ? (
            <p className="p-6 text-sm text-rose-600">
              Unable to load recent requests.
            </p>
          ) : !recentRequestsResult.data?.length ? (
            <div className="p-10 text-center">
              <ClipboardList className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 font-medium text-slate-700">
                No service requests yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                New customer requests will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-162.5 text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-medium">Request</th>
                    <th className="px-6 py-4 font-medium">Location</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentRequestsResult.data.map((request) => (
                    <tr key={request.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <p className="font-medium text-slate-900">
                          {request.title || "Untitled request"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {request.id.slice(0, 8)}
                        </p>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {request.city || "Not specified"}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-slate-500">
                        {formatDate(request.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Quick actions */}
        <section>
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Quick actions
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Shortcuts to common administration tasks.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/dashboard/admin/categories"
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Layers3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Manage categories
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Organize marketplace services.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
            </Link>

            <Link
              href="/dashboard/admin/requests"
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Review requests
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Monitor and review customer requests.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
            </Link>

            <Link
              href="/dashboard/admin/users"
              className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Manage users</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Review customer and worker accounts.
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" />
            </Link>

            <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">
                    Account activity
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeProfilesResult.count ?? "—"} active ·{" "}
                    {inactiveProfilesResult.count ?? "—"} inactive profiles
                  </p>
                </div>
              </div>
              <XCircle className="h-5 w-5 text-slate-400" />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
