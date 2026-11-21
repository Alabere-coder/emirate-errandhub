import Link from "next/link";
import {
  TicketPercent,
  Plus,
  CalendarDays,
  Users,
  Tag,
  Sparkles,
  CheckCircle2,
  Clock3,
  Layers3,
  ShieldCheck,
} from "lucide-react";

import type { ElementType } from "react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DiscountCodeActions } from "./discount-code-actions";

export const dynamic = "force-dynamic";

type DiscountCode = {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percentage" | "fixed";
  discount_value: number;
  max_discount_amount: number | null;
  min_booking_amount: number;
  usage_limit: number | null;
  per_customer_limit: number | null;
  first_booking_only: boolean;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
};

type Redemption = {
  discount_code_id: string;
  status: string;
  expires_at: string | null;
};

function formatNaira(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDiscount(code: DiscountCode) {
  if (code.discount_type === "percentage") {
    return `${Number(code.discount_value)}% off`;
  }

  return `${formatNaira(Number(code.discount_value))} off`;
}

function getDiscountStatus(code: DiscountCode) {
  const now = new Date();

  if (!code.is_active) return "Inactive";

  if (code.starts_at && new Date(code.starts_at) > now) {
    return "Scheduled";
  }

  if (code.expires_at && new Date(code.expires_at) <= now) {
    return "Expired";
  }

  return "Active";
}

function getUsageCount(codeId: string, redemptions: Redemption[]) {
  const now = Date.now();

  return redemptions.filter((redemption) => {
    if (redemption.discount_code_id !== codeId) return false;

    if (redemption.status === "redeemed") return true;

    return (
      redemption.status === "reserved" &&
      redemption.expires_at !== null &&
      new Date(redemption.expires_at).getTime() > now
    );
  }).length;
}

function formatDate(value: string | null) {
  if (!value) return "No expiry date";

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function getStatusBadge(status: string) {
  switch (status) {
    case "Active":
      return (
        <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 dark:text-emerald-400">
          <CheckCircle2 className="mr-1.5 size-3.5" />
          Active
        </Badge>
      );

    case "Scheduled":
      return (
        <Badge className="border border-blue-500/20 bg-blue-500/10 text-blue-700 hover:bg-blue-500/10 dark:text-blue-400">
          <Clock3 className="mr-1.5 size-3.5" />
          Scheduled
        </Badge>
      );

    case "Expired":
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Expired
        </Badge>
      );

    default:
      return <Badge variant="secondary">Inactive</Badge>;
  }
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: number;
  description: string;
  icon: ElementType;
  iconClass: string;
}) {
  return (
    <Card className="relative overflow-hidden border-border shadow-sm">
      <div className="pointer-events-none absolute -right-5 -top-5 size-24 rounded-full bg-emerald-500/5 blur-2xl" />

      <CardContent className="relative flex items-center justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>

          <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-foreground">
            {value}
          </p>

          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>

        <div
          className={`flex size-12 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
        >
          <Icon className="size-6" />
        </div>
      </CardContent>
    </Card>
  );
}

export default async function AdminDiscountCodesPage() {
  await requireRole(["admin", "super_admin"]);

  const admin = createAdminClient() as any;

  const { data: discountCodes, error } = await admin
    .from("discount_codes")
    .select(
      "id, code, description, discount_type, discount_value, max_discount_amount, min_booking_amount, usage_limit, per_customer_limit, first_booking_only, starts_at, expires_at, is_active, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Discount codes lookup failed:", error);
    throw new Error("Unable to load discount codes.");
  }

  const codes = (discountCodes ?? []) as DiscountCode[];

  const { data: redemptions, error: redemptionError } = await admin
    .from("discount_redemptions")
    .select("discount_code_id, status, expires_at");

  if (redemptionError) {
    console.error("Discount redemption lookup failed:", redemptionError);
    throw new Error("Unable to load discount usage information.");
  }

  const redemptionRows = (redemptions ?? []) as Redemption[];

  const activeCount = codes.filter(
    (code) => getDiscountStatus(code) === "Active",
  ).length;

  const scheduledCount = codes.filter(
    (code) => getDiscountStatus(code) === "Scheduled",
  ).length;

  const totalRedemptions = redemptionRows.filter(
    (redemption) => redemption.status === "redeemed",
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-linear-to-br from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-8 text-white shadow-lg sm:px-8">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-1/3 size-64 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
              <Sparkles className="size-3.5" />
              Marketing & customer rewards
            </div>

            <div className="flex items-center gap-3">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                <TicketPercent className="size-6 text-emerald-100" />
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Discount Codes
              </h1>
            </div>

            <p className="mt-4 max-w-xl text-sm leading-6 text-emerald-50/75 sm:text-base">
              Create and manage promotional discounts, reward customers and
              track successful redemptions across Emirate ErrandHub.
            </p>

            <div className="mt-6 flex flex-wrap gap-3 text-sm text-emerald-50/80">
              <span className="inline-flex items-center gap-2">
                <Layers3 className="size-4" />
                {codes.length} total codes
              </span>

              <span className="hidden text-white/30 sm:inline">•</span>

              <span className="inline-flex items-center gap-2">
                <CheckCircle2 className="size-4" />
                {activeCount} active codes
              </span>
            </div>
          </div>

          <Link
            href="/dashboard/admin/discount-codes/new"
            className="relative inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-emerald-950 shadow-sm transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-900"
          >
            <Plus className="size-4" />
            Create Discount Code
          </Link>
        </div>
      </section>

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total codes"
          value={codes.length}
          description="All created discount codes"
          icon={Layers3}
          iconClass="bg-muted text-muted-foreground"
        />

        <StatCard
          title="Active codes"
          value={activeCount}
          description="Currently eligible for use"
          icon={CheckCircle2}
          iconClass="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />

        <StatCard
          title="Scheduled codes"
          value={scheduledCount}
          description="Waiting for their start date"
          icon={CalendarDays}
          iconClass="bg-blue-500/10 text-blue-600 dark:text-blue-400"
        />

        <StatCard
          title="Successful redemptions"
          value={totalRedemptions}
          description="Completed discount uses"
          icon={Users}
          iconClass="bg-violet-500/10 text-violet-600 dark:text-violet-400"
        />
      </section>

      {/* Discount code list */}
      <section className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">
              All discount codes
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Review discount values, usage limits and campaign restrictions.
            </p>
          </div>

          <Badge variant="outline" className="w-fit rounded-full px-3 py-1">
            {codes.length} {codes.length === 1 ? "code" : "codes"}
          </Badge>
        </div>

        {!codes.length ? (
          <Card className="overflow-hidden border-dashed border-border shadow-sm">
            <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
              <div className="mb-5 flex size-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TicketPercent className="size-8" />
              </div>

              <h3 className="text-lg font-semibold text-foreground">
                No discount codes yet
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Create your first promotional code to offer customers discounts
                on their bookings.
              </p>

              <Link
                href="/dashboard/admin/discount-codes/new"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:bg-emerald-600 dark:hover:bg-emerald-500"
              >
                <Plus className="size-4" />
                Create First Discount Code
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {codes.map((code) => {
              const status = getDiscountStatus(code);
              const usageCount = getUsageCount(code.id, redemptionRows);

              return (
                <Card
                  key={code.id}
                  className="overflow-hidden border-border shadow-sm transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-5 sm:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 flex-1 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <Tag className="size-4" />
                            </div>

                            <h3 className="text-lg font-bold tracking-wide text-foreground">
                              {code.code}
                            </h3>
                          </div>

                          {getStatusBadge(status)}
                        </div>

                        {code.description && (
                          <p className="text-sm leading-6 text-muted-foreground">
                            {code.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 dark:text-emerald-400">
                            <TicketPercent className="size-3.5" />
                            {formatDiscount(code)}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Users className="size-3.5" />
                            {usageCount}
                            {code.usage_limit !== null
                              ? ` / ${code.usage_limit} uses`
                              : " redemptions"}
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <CalendarDays className="size-3.5" />
                            {code.expires_at
                              ? `Expires ${formatDate(code.expires_at)}`
                              : "No expiry date"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-border pt-3 text-xs text-muted-foreground">
                          <span>
                            Minimum booking:{" "}
                            <span className="font-medium text-foreground">
                              {formatNaira(Number(code.min_booking_amount))}
                            </span>
                          </span>

                          {code.first_booking_only && (
                            <span className="inline-flex items-center gap-1">
                              <ShieldCheck className="size-3.5" />
                              First booking only
                            </span>
                          )}

                          {code.max_discount_amount !== null && (
                            <span>
                              Max discount:{" "}
                              <span className="font-medium text-foreground">
                                {formatNaira(Number(code.max_discount_amount))}
                              </span>
                            </span>
                          )}

                          {code.per_customer_limit !== null && (
                            <span>
                              Per-customer limit:{" "}
                              <span className="font-medium text-foreground">
                                {code.per_customer_limit}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-border pt-4 lg:border-0 lg:pt-0">
                        <Link
                          href={`/dashboard/admin/discount-codes/${code.id}/edit`}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        >
                          Edit
                        </Link>

                        <DiscountCodeActions
                          id={code.id}
                          isActive={code.is_active}
                        />
                      </div>
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
