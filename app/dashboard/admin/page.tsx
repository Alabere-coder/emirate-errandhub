import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Clock3,
  FileCheck2,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Users,
  Wrench,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RequestRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  city: string | null;
  customer_id: string;
  category_id: string;
};

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}

function statusStyle(status: string) {
  switch (status) {
    case "completed":
    case "approved":
    case "verified":
      return "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-400";

    case "pending":
    case "quoted":
      return "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400";

    case "cancelled":
    case "rejected":
      return "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400";

    case "assigned":
    case "accepted":
    case "in_progress":
      return "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-400";

    default:
      return "bg-muted text-muted-foreground ring-border";
  }
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

function MetricCard({
  title,
  value,
  description,
  icon: Icon,
  href,
  accent = "default",
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Users;
  href: string;
  accent?: "default" | "warning" | "success";
}) {
  const iconStyle = {
    default: "bg-primary/10 text-primary",
    warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
    success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  }[accent];

  return (
    <Link
      href={href}
      className="group rounded-2xl border border-border bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-6"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">
            {value.toLocaleString("en-NG")}
          </p>
        </div>

        <div
          className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
        >
          <Icon className="size-5" />
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{description}</p>
        <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
      </div>
    </Link>
  );
}

const quickActions = [
  {
    title: "Manage users",
    description: "View customers and service providers.",
    href: "/dashboard/admin/users",
    icon: Users,
  },
  {
    title: "Review workers",
    description: "Review submitted verification documents.",
    href: "/dashboard/admin/worker-verification",
    icon: ShieldCheck,
  },
  {
    title: "Manage services",
    description: "Maintain available service categories.",
    href: "/dashboard/admin/categories",
    icon: Wrench,
  },
  {
    title: "Requests and jobs",
    description: "Monitor service requests and assigned jobs.",
    href: "/dashboard/admin/requests",
    icon: ClipboardList,
  },
  {
    title: "Moderate reviews",
    description: "Review customer feedback and manage inappropriate reviews.",
    href: "/dashboard/admin/reviews",
    icon: Star,
  },
];

export default async function AdminDashboardPage() {
  const { profile } = await requireRole(["admin"]);
  const supabase = await createClient();

  const [
    customersResult,
    workersResult,
    pendingDocumentsResult,
    pendingRequestsResult,
    totalRequestsResult,
    activeJobsResult,
    completedJobsResult,
    pendingWorkersResult,
    recentRequestsResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "customer"),

    supabase
      .from("worker_profiles")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("worker_documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),

    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),

    supabase
      .from("service_requests")
      .select("id", { count: "exact", head: true }),

    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .in("status", ["assigned", "in_progress"]),

    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),

    supabase
      .from("worker_profiles")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "pending"),

    supabase
      .from("service_requests")
      .select("id, title, status, created_at, city, customer_id, category_id")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const queryResults = [
    ["customer count", customersResult.error],
    ["worker count", workersResult.error],
    ["pending documents", pendingDocumentsResult.error],
    ["pending requests", pendingRequestsResult.error],
    ["request count", totalRequestsResult.error],
    ["active jobs", activeJobsResult.error],
    ["completed jobs", completedJobsResult.error],
    ["pending worker verification", pendingWorkersResult.error],
    ["recent requests", recentRequestsResult.error],
  ] as const;

  for (const [name, error] of queryResults) {
    if (error) {
      console.error(`Admin dashboard ${name} query failed:`, error);
    }
  }

  const recentRequests = (recentRequestsResult.data ?? []) as RequestRow[];

  const customerIds = [
    ...new Set(recentRequests.map((request) => request.customer_id)),
  ];

  const categoryIds = [
    ...new Set(recentRequests.map((request) => request.category_id)),
  ];

  const [customersLookup, categoriesLookup] = await Promise.all([
    customerIds.length
      ? supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .in("id", customerIds)
      : Promise.resolve({ data: [], error: null }),

    categoryIds.length
      ? supabase
          .from("service_categories")
          .select("id, name")
          .in("id", categoryIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (customersLookup.error) {
    console.error(
      "Unable to load recent request customers:",
      customersLookup.error,
    );
  }

  if (categoriesLookup.error) {
    console.error(
      "Unable to load recent request categories:",
      categoriesLookup.error,
    );
  }

  const customerNames = new Map(
    (customersLookup.data ?? []).map((customer) => [
      customer.id,
      `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() ||
        "Customer",
    ]),
  );

  const categoryNames = new Map(
    (categoriesLookup.data ?? []).map((category) => [
      category.id,
      category.name,
    ]),
  );

  const firstName = profile?.first_name?.trim();
  const displayName = firstName || "Administrator";

  const metrics = [
    {
      title: "Customers",
      value: customersResult.count ?? 0,
      description: "Registered customer accounts",
      icon: Users,
      href: "/dashboard/admin/users",
      accent: "default" as const,
    },
    {
      title: "Service providers",
      value: workersResult.count ?? 0,
      description: "Worker profiles created",
      icon: BriefcaseBusiness,
      href: "/dashboard/admin/users",
      accent: "default" as const,
    },
    {
      title: "Pending documents",
      value: pendingDocumentsResult.count ?? 0,
      description: "Documents awaiting review",
      icon: FileCheck2,
      href: "/dashboard/admin/worker-verification",
      accent: "warning" as const,
    },
    {
      title: "Pending requests",
      value: pendingRequestsResult.count ?? 0,
      description: "Requests awaiting a response",
      icon: Clock3,
      href: "/dashboard/admin/jobs",
      accent: "warning" as const,
    },
    {
      title: "Active jobs",
      value: activeJobsResult.count ?? 0,
      description: "Assigned or in progress",
      icon: Activity,
      href: "/dashboard/admin/jobs",
      accent: "default" as const,
    },
    {
      title: "Completed jobs",
      value: completedJobsResult.count ?? 0,
      description: "Jobs marked as completed",
      icon: CheckCircle2,
      href: "/dashboard/admin/jobs",
      accent: "success" as const,
    },
  ];

  return (
    <main className="min-h-full bg-muted/30">
      <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
        {/* Welcome header */}
        <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white sm:p-8 lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-20 size-64 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 right-1/3 size-56 rounded-full bg-blue-400/10 blur-3xl" />

          <div className="relative flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200">
                <LayoutDashboard className="size-3.5" />
                Admin control centre
              </div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Welcome back, {displayName}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Here&apos;s an overview of your ErrandHub marketplace. Manage
                service providers, monitor requests, and keep daily operations
                moving.
              </p>
            </div>

            <Link
              href="/dashboard/admin/requests"
              className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              View requests
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>

        {/* Marketplace metrics */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              Marketplace overview
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Current totals from your database.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {metrics.map((metric) => (
              <MetricCard key={metric.title} {...metric} />
            ))}
          </div>
        </section>

        {/* Operations and shortcuts */}
        <section className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div className="min-w-0 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between gap-4 border-b border-border p-5 sm:p-6">
              <div>
                <h2 className="font-bold tracking-tight">Recent requests</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The latest service requests submitted by customers.
                </p>
              </div>

              <Link
                href="/dashboard/admin/requests"
                className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-primary hover:underline"
              >
                View all
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {recentRequestsResult.error ? (
              <div className="p-6 text-sm text-muted-foreground">
                Unable to load recent requests. Check the server logs and your
                Supabase permissions.
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-12 text-center">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-muted">
                  <ShoppingBag className="size-5 text-muted-foreground" />
                </div>
                <h3 className="mt-4 font-semibold">No requests yet</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  New customer requests will appear here.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {recentRequests.map((request) => (
                  <div
                    key={request.id}
                    className="flex flex-col gap-3 p-5 transition hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <ShoppingBag className="size-4" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">
                          {request.title}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {customerNames.get(request.customer_id) ?? "Customer"}
                          {" · "}
                          {categoryNames.get(request.category_id) ??
                            "Service request"}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {request.city || "Location not specified"}
                          {" · "}
                          {formatDate(request.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:justify-end">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset ${statusStyle(request.status)}`}
                      >
                        {formatStatus(request.status)}
                      </span>

                      <Link
                        href="/dashboard/admin/requests"
                        aria-label={`View requests including ${request.title}`}
                        className="rounded-lg p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                      >
                        <ArrowRight className="size-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Verification summary */}
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-bold tracking-tight">
                    Verification centre
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Keep provider onboarding moving.
                  </p>
                </div>

                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <ShieldCheck className="size-5" />
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <Link
                  href="/dashboard/admin/worker-verification"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition hover:border-primary/30 hover:bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-semibold">Pending documents</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Documents requiring admin review
                    </p>
                  </div>
                  <span className="text-xl font-bold tabular-nums">
                    {pendingDocumentsResult.count ?? 0}
                  </span>
                </Link>

                <Link
                  href="/dashboard/admin/worker-verification"
                  className="flex items-center justify-between gap-3 rounded-xl border border-border p-4 transition hover:border-primary/30 hover:bg-muted/30"
                >
                  <div>
                    <p className="text-sm font-semibold">
                      Workers awaiting verification
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Worker profiles still marked pending
                    </p>
                  </div>
                  <span className="text-xl font-bold tabular-nums">
                    {pendingWorkersResult.count ?? 0}
                  </span>
                </Link>
              </div>

              <Link
                href="/dashboard/admin/worker-verification"
                className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Review verification
                <ArrowRight className="size-4" />
              </Link>
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
              <h2 className="font-bold tracking-tight">Quick actions</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Jump straight to an admin task.
              </p>

              <div className="mt-4 space-y-2">
                {quickActions.map((action) => {
                  const Icon = action.icon;

                  return (
                    <Link
                      key={action.title}
                      href={action.href}
                      className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-muted/60"
                    >
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition group-hover:border-primary/20 group-hover:text-primary">
                        <Icon className="size-4" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold">{action.title}</p>
                        <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
                          {action.description}
                        </p>
                      </div>

                      <ArrowRight className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom summary */}
        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              <h2 className="font-bold tracking-tight">Marketplace activity</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalRequestsResult.count ?? 0} service requests recorded across
              the marketplace.
            </p>
          </div>

          <Link
            href="/dashboard/admin/requests"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold transition hover:bg-muted"
          >
            Manage requests and jobs
            <ArrowRight className="size-4" />
          </Link>
        </section>
      </div>
    </main>
  );
}
