import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  Wrench,
  ClipboardList,
  CheckCircle2,
  Timer,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RequestStatus =
  | "pending"
  | "quoted"
  | "accepted"
  | "assigned"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "rejected";

const statusConfig: Record<
  RequestStatus,
  { label: string; className: string }
> = {
  pending: {
    label: "Pending",
    className: "border border-amber-200 bg-amber-50 text-amber-800",
  },
  quoted: {
    label: "Quotation received",
    className: "border border-blue-200 bg-blue-50 text-blue-800",
  },
  accepted: {
    label: "Quote accepted",
    className: "border border-indigo-200 bg-indigo-50 text-indigo-800",
  },
  assigned: {
    label: "Worker assigned",
    className: "border border-violet-200 bg-violet-50 text-violet-800",
  },
  in_progress: {
    label: "In progress",
    className: "border border-orange-200 bg-orange-50 text-orange-800",
  },
  completed: {
    label: "Completed",
    className: "border border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  cancelled: {
    label: "Cancelled",
    className: "border border-slate-200 bg-slate-100 text-slate-700",
  },
  rejected: {
    label: "Rejected",
    className: "border border-red-200 bg-red-50 text-red-800",
  },
};

function formatDate(value: string | null) {
  if (!value) return "Not specified";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "Not specified";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(date);
}

function formatTime(value: string | null) {
  if (!value) return "Not specified";

  const [hours, minutes] = value.split(":").map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return value;
  }

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);

  return new Intl.DateTimeFormat("en-NG", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatBudget(budget: number | null, currency: string) {
  if (budget === null) return "Budget not specified";

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(budget);
  } catch {
    return `${currency} ${budget.toLocaleString("en-NG")}`;
  }
}

function getStatusConfig(status: string) {
  return (
    statusConfig[status as RequestStatus] ?? {
      label: status ? status.replaceAll("_", " ") : "Unknown",
      className: "border border-slate-200 bg-slate-100 text-slate-700",
    }
  );
}

function formatCreatedDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "recently";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(date);
}

export default async function CustomerRequestsPage() {
  const { user } = await requireRole(["customer"]);
  const supabase = await createClient();

  const { data: requests, error } = await supabase
    .from("service_requests")
    .select(
      `
        id,
        category_id,
        service_id,
        title,
        description,
        budget,
        currency,
        preferred_date,
        preferred_time,
        is_urgent,
        address,
        city,
        state,
        status,
        created_at,
        updated_at,
        service_categories (
          id,
          name
        ),
        services (
          id,
          name
        )
      `,
    )
    .eq("customer_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Load customer requests error:", error);

    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div>
          <p className="text-sm font-semibold text-teal-700">
            CUSTOMER DASHBOARD
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            My Requests
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            View and manage the services you have requested.
          </p>
        </div>

        <Card className="rounded-2xl border-red-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center px-5 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <AlertCircle className="h-7 w-7 text-red-600" />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Unable to load your requests
            </h2>

            <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
              Something went wrong while loading your service requests. Please
              refresh the page and try again.
            </p>

            <Button className="mt-6 rounded-xl bg-teal-700 hover:bg-teal-800">
              <Link href="/dashboard/customer/requests">Try again</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const requestList = requests ?? [];

  const totalRequests = requestList.length;
  const pendingCount = requestList.filter(
    (request) => request.status === "pending",
  ).length;
  const activeCount = requestList.filter((request) =>
    ["accepted", "assigned", "in_progress"].includes(request.status),
  ).length;
  const completedCount = requestList.filter(
    (request) => request.status === "completed",
  ).length;

  const summary = [
    {
      label: "Total requests",
      value: totalRequests,
      description: "All requests submitted",
      icon: ClipboardList,
      iconClass: "bg-slate-100 text-slate-700",
    },
    {
      label: "Awaiting response",
      value: pendingCount,
      description: "Waiting for quotations",
      icon: Clock3,
      iconClass: "bg-amber-50 text-amber-700",
    },
    {
      label: "Active jobs",
      value: activeCount,
      description: "Accepted or in progress",
      icon: Timer,
      iconClass: "bg-blue-50 text-blue-700",
    },
    {
      label: "Completed",
      value: completedCount,
      description: "Successfully completed",
      icon: CheckCircle2,
      iconClass: "bg-emerald-50 text-emerald-700",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-6 sm:px-6 lg:px-8">
      {/* Page header */}
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-8 text-white shadow-sm sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-teal-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-semibold text-teal-300">
              <ClipboardList className="h-3.5 w-3.5" />
              CUSTOMER DASHBOARD
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              My Requests
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Keep track of your service requests, review their status, and
              manage the next steps from one place.
            </p>
          </div>

          <Button className="relative min-h-11 rounded-xl bg-teal-500 px-5 font-semibold text-slate-950 shadow-sm transition hover:bg-teal-400">
            <Link
              href="/dashboard/customer/requests/new"
              className="flex items-center gap-1"
            >
              <Plus className="mr-2 h-4 w-4" />
              New request
            </Link>
          </Button>
        </div>
      </section>

      {/* Summary cards */}
      <section aria-label="Request summary">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900">Request overview</h2>
          <p className="mt-1 text-sm text-slate-500">
            A quick summary of your service activity.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => {
            const Icon = item.icon;

            return (
              <Card
                key={item.label}
                className="rounded-2xl border-slate-200 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md"
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-slate-500">
                        {item.label}
                      </p>
                      <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
                        {item.value}
                      </p>
                    </div>

                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.iconClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-500">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Requests list */}
      <section>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Your service requests
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {totalRequests === 1
                ? "You have submitted 1 request."
                : `You have submitted ${totalRequests} requests.`}
            </p>
          </div>
        </div>

        {requestList.length === 0 ? (
          <Card className="overflow-hidden rounded-3xl border-dashed border-slate-300 shadow-sm">
            <CardContent className="flex flex-col items-center px-5 py-16 text-center sm:py-20">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-teal-700 ring-1 ring-teal-100">
                <Wrench className="h-8 w-8" />
              </div>

              <h3 className="mt-6 text-xl font-bold text-slate-900">
                No service requests yet
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">
                When you need help with a task, create a service request here.
                You can describe the work, provide your location, and review
                quotations from workers.
              </p>

              <Button className="mt-6 min-h-11 rounded-xl bg-teal-700 px-5 font-semibold text-white hover:bg-teal-800">
                <Link href="/dashboard/customer/requests/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Create your first request
                </Link>
              </Button>

              <Link
                href="/services"
                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition-colors hover:text-teal-700"
              >
                Explore services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {requestList.map((request) => {
              const status = getStatusConfig(request.status);

              const category = Array.isArray(request.service_categories)
                ? request.service_categories[0]
                : request.service_categories;

              const service = Array.isArray(request.services)
                ? request.services[0]
                : request.services;

              const location = [request.city, request.state]
                .filter(Boolean)
                .join(", ");

              return (
                <Card
                  key={request.id}
                  className="group overflow-hidden rounded-2xl border-slate-200 shadow-sm transition duration-200 hover:border-teal-200 hover:shadow-md"
                >
                  <CardContent className="p-5 sm:p-6">
                    {/* Title and status */}
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 gap-4">
                        <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700 sm:flex">
                          <Wrench className="h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-900 sm:text-lg">
                              {request.title}
                            </h3>

                            {request.is_urgent && (
                              <Badge
                                variant="destructive"
                                className="gap-1 rounded-full px-2.5"
                              >
                                <AlertCircle className="h-3 w-3" />
                                Urgent
                              </Badge>
                            )}
                          </div>

                          <p className="mt-1.5 text-sm text-slate-500">
                            {category?.name ?? "Service category"}
                            {service?.name && (
                              <>
                                <span className="mx-2 text-slate-300">/</span>
                                <span className="font-medium text-slate-700">
                                  {service.name}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      <Badge
                        className={`w-fit rounded-full px-3 py-1 font-semibold ${status.className}`}
                      >
                        {status.label}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="mt-5 line-clamp-2 text-sm leading-6 text-slate-600">
                      {request.description || "No description provided."}
                    </p>

                    {/* Request details */}
                    <div className="mt-5 grid gap-4 border-t border-slate-100 pt-5 sm:grid-cols-2 xl:grid-cols-4">
                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                          <CalendarDays className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-500">
                            Preferred date
                          </p>
                          <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-800">
                            {formatDate(request.preferred_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-700">
                          <Clock3 className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-500">
                            Preferred time
                          </p>
                          <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-800">
                            {formatTime(request.preferred_time)}
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                          <ClipboardList className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-500">
                            Budget
                          </p>
                          <p className="mt-1 wrap-break-word text-sm font-semibold text-slate-800">
                            {formatBudget(request.budget, request.currency)}
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-0 items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-700">
                          <MapPin className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-500">
                            Location
                          </p>
                          <p
                            className="mt-1 wrap-break-word text-sm font-semibold text-slate-800"
                            title={
                              request.address || location || "Not specified"
                            }
                          >
                            {location || request.address || "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-slate-500">
                        Submitted {formatCreatedDate(request.created_at)}
                      </p>

                      <Button
                        variant="outline"
                        className="min-h-10 rounded-xl border-slate-300 font-semibold transition-colors hover:border-teal-600 hover:bg-teal-50 hover:text-teal-800"
                      >
                        <Link
                          href={`/dashboard/customer/requests/${request.id}`}
                          className="flex items-center gap-1"
                        >
                          View request
                          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      </Button>
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
