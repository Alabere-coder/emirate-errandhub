import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  MapPin,
  AlertCircle,
  Wrench,
  Wallet,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type RequestDetailsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(value: string | null) {
  if (!value) return "Not specified";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

function formatTime(value: string | null) {
  if (!value) return "Not specified";

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

function formatCurrency(value: number | null, currency: string) {
  if (value === null) {
    return "Not specified";
  }

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    pending: "Pending",
    quoted: "Quoted",
    accepted: "Accepted",
    assigned: "Worker Assigned",
    in_progress: "In Progress",
    completed: "Completed",
    cancelled: "Cancelled",
    rejected: "Rejected",
  };

  return labels[status] ?? (status.replaceAll("_", " ") || "Unknown");
}

function getStatusClassName(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";

    case "quoted":
      return "bg-blue-100 text-blue-800";

    case "accepted":
      return "bg-indigo-100 text-indigo-800";

    case "assigned":
      return "bg-purple-100 text-purple-800";

    case "in_progress":
      return "bg-orange-100 text-orange-800";

    case "completed":
      return "bg-green-100 text-green-800";

    case "cancelled":
    case "rejected":
      return "bg-red-100 text-red-800";

    default:
      return "bg-muted text-muted-foreground";
  }
}

export default async function CustomerRequestDetailsPage({
  params,
}: RequestDetailsPageProps) {
  const { user } = await requireRole(["customer"]);

  const { id } = await params;

  const supabase = await createClient();

  const { data: request, error } = await supabase
    .from("service_requests")
    .select(
      `
        id,
        customer_id,
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
        latitude,
        longitude,
        status,
        created_at,
        updated_at,
        service_categories (
          id,
          name,
          description
        ),
        services (
          id,
          name,
          description
        )
      `,
    )
    .eq("id", id)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("Load customer request error:", error);

    return (
      <div className="space-y-6">
        <Button variant="ghost">
          <Link href="/dashboard/customer/requests">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requests
          </Link>
        </Button>

        <Card>
          <CardContent className="py-12 text-center">
            <h1 className="text-lg font-semibold">Unable to load request</h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Something went wrong while loading this request.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!request) {
    notFound();
  }

  const category = Array.isArray(request.service_categories)
    ? request.service_categories[0]
    : request.service_categories;

  const service = Array.isArray(request.services)
    ? request.services[0]
    : request.services;

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      {/* Back */}
      <Button variant="ghost" className="-ml-2">
        <Link href="/dashboard/customer/requests">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Requests
        </Link>
      </Button>

      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {request.title}
                </h1>

                {request.is_urgent && (
                  <Badge variant="destructive" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    Urgent
                  </Badge>
                )}
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{category?.name ?? "Service category"}</span>

                {service?.name && (
                  <>
                    <span>•</span>
                    <span>{service.name}</span>
                  </>
                )}
              </div>
            </div>

            <Badge className={getStatusClassName(request.status)}>
              {getStatusLabel(request.status)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Request Details</CardTitle>
            </CardHeader>

            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {request.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex items-start gap-3">
                <Wrench className="mt-0.5 h-5 w-5 text-muted-foreground" />

                <div>
                  <p className="text-sm font-medium">Category</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {category?.name ?? "Not specified"}
                  </p>
                </div>
              </div>

              {service && (
                <div className="flex items-start gap-3">
                  <Wrench className="mt-0.5 h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="text-sm font-medium">Specific service</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {service.name}
                    </p>

                    {service.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {service.description}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Location</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />

                <div>
                  <p className="text-sm font-medium">Address</p>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {request.address ?? "Not specified"}
                  </p>
                </div>
              </div>

              {(request.city || request.state) && (
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 h-5 w-5 text-muted-foreground" />

                  <div>
                    <p className="text-sm font-medium">City / State</p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {[request.city, request.state].filter(Boolean).join(", ")}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schedule</CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-0.5 h-5 w-5 text-muted-foreground" />

                <div>
                  <p className="text-xs text-muted-foreground">
                    Preferred date
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {formatDate(request.preferred_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-5 w-5 text-muted-foreground" />

                <div>
                  <p className="text-xs text-muted-foreground">
                    Preferred time
                  </p>

                  <p className="mt-1 text-sm font-medium">
                    {formatTime(request.preferred_time)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Budget</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-muted-foreground" />

                <div>
                  <p className="text-xs text-muted-foreground">
                    Estimated budget
                  </p>

                  <p className="mt-1 text-lg font-semibold">
                    {formatCurrency(request.budget, request.currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Request ID</span>

                <span className="max-w-[180px] truncate font-mono text-xs">
                  {request.id}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Created</span>

                <span>
                  {new Intl.DateTimeFormat("en-NG", {
                    dateStyle: "medium",
                  }).format(new Date(request.created_at))}
                </span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Last updated</span>

                <span>
                  {new Intl.DateTimeFormat("en-NG", {
                    dateStyle: "medium",
                  }).format(new Date(request.updated_at))}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
