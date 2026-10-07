import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Plus,
  Wrench,
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
  {
    label: string;
    className: string;
  }
> = {
  pending: {
    label: "Pending",
    className: "bg-yellow-100 text-yellow-800",
  },
  quoted: {
    label: "Quoted",
    className: "bg-blue-100 text-blue-800",
  },
  accepted: {
    label: "Accepted",
    className: "bg-indigo-100 text-indigo-800",
  },
  assigned: {
    label: "Worker Assigned",
    className: "bg-purple-100 text-purple-800",
  },
  in_progress: {
    label: "In Progress",
    className: "bg-orange-100 text-orange-800",
  },
  completed: {
    label: "Completed",
    className: "bg-green-100 text-green-800",
  },
  cancelled: {
    label: "Cancelled",
    className: "bg-gray-100 text-gray-700",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800",
  },
};

function formatDate(value: string | null) {
  if (!value) {
    return "Not specified";
  }

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string | null) {
  if (!value) {
    return "Not specified";
  }

  const [hours, minutes] = value.split(":").map(Number);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
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
  if (budget === null) {
    return "Budget not specified";
  }

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(budget);
  } catch {
    return `${currency} ${budget.toLocaleString()}`;
  }
}

function getStatusConfig(status: string) {
  const config = statusConfig[status as RequestStatus];

  if (config) {
    return config;
  }

  return {
    label: status ? status.replaceAll("_", " ") : "Unknown",
    className: "bg-gray-100 text-gray-700",
  };
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
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Requests</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            View and manage your service requests.
          </p>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="mb-4 h-10 w-10 text-destructive" />

            <h2 className="text-lg font-semibold">
              Unable to load your requests
            </h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Something went wrong while loading your service requests. Please
              try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Requests</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            View and manage the services you have requested.
          </p>
        </div>

        <Button>
          <Link href="/dashboard/customer/requests/new">
            <Plus className="mr-2 h-4 w-4" />
            New Request
          </Link>
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Total Requests</p>

            <p className="mt-2 text-2xl font-semibold">{requests.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Pending</p>

            <p className="mt-2 text-2xl font-semibold">
              {
                requests.filter((request) => request.status === "pending")
                  .length
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">In Progress</p>

            <p className="mt-2 text-2xl font-semibold">
              {
                requests.filter((request) => request.status === "in_progress")
                  .length
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-sm text-muted-foreground">Completed</p>

            <p className="mt-2 text-2xl font-semibold">
              {
                requests.filter((request) => request.status === "completed")
                  .length
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Requests */}
      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <Wrench className="h-7 w-7 text-muted-foreground" />
            </div>

            <h2 className="text-lg font-semibold">No service requests yet</h2>

            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              You haven't submitted any service requests yet. Create your first
              request and we'll help connect you with the right service
              provider.
            </p>

            <Button className="mt-6">
              <Link href="/dashboard/customer/requests/new">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Request
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => {
            const status = getStatusConfig(request.status);

            const category = Array.isArray(request.service_categories)
              ? request.service_categories[0]
              : request.service_categories;

            const service = Array.isArray(request.services)
              ? request.services[0]
              : request.services;

            return (
              <Card
                key={request.id}
                className="transition-shadow hover:shadow-sm"
              >
                <CardContent className="p-5 sm:p-6">
                  <div className="flex flex-col gap-5">
                    {/* Top */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold">
                            {request.title}
                          </h2>

                          {request.is_urgent && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Urgent
                            </Badge>
                          )}
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
                          <span>{category?.name ?? "Service category"}</span>

                          {service?.name && (
                            <>
                              <span>•</span>
                              <span>{service.name}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <Badge className={status.className}>{status.label}</Badge>
                    </div>

                    {/* Description */}
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {request.description}
                    </p>

                    {/* Details */}
                    <div className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div className="flex items-start gap-2">
                        <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Preferred date
                          </p>

                          <p className="mt-0.5 font-medium">
                            {formatDate(request.preferred_date)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Preferred time
                          </p>

                          <p className="mt-0.5 font-medium">
                            {formatTime(request.preferred_time)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                        <div>
                          <p className="text-xs text-muted-foreground">
                            Budget
                          </p>

                          <p className="mt-0.5 font-medium">
                            {formatBudget(request.budget, request.currency)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />

                        <div className="min-w-0">
                          <p className="text-xs text-muted-foreground">
                            Location
                          </p>

                          <p className="mt-0.5 truncate font-medium">
                            {request.city || request.state
                              ? [request.city, request.state]
                                  .filter(Boolean)
                                  .join(", ")
                              : "Not specified"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-muted-foreground">
                        Created{" "}
                        {new Intl.DateTimeFormat("en-NG", {
                          dateStyle: "medium",
                        }).format(new Date(request.created_at))}
                      </p>

                      <Button variant="outline" size="sm">
                        <Link
                          href={`/dashboard/customer/requests/${request.id}`}
                        >
                          View Request
                          <ArrowRight className="ml-2 h-4 w-4" />
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
    </div>
  );
}
