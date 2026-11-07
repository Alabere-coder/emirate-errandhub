import Link from "next/link";
import { TicketPercent, Plus, CalendarDays, Users, Tag } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <TicketPercent className="h-6 w-6 text-emerald-600" />
            <h1 className="text-2xl font-bold tracking-tight">
              Discount Codes
            </h1>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Create and manage promotional discounts for Emirate ErrandHub
            customers.
          </p>
        </div>

        <Button>
          <Link
            href="/dashboard/admin/discount-codes/new"
            className="flex items-center"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Discount Code
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Discount Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{codes.length}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Codes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-emerald-600">{activeCount}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Successful Redemptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalRedemptions}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Discount Codes</CardTitle>
        </CardHeader>

        <CardContent>
          {!codes.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TicketPercent className="mb-4 h-12 w-12 text-muted-foreground" />

              <h3 className="text-lg font-semibold">No discount codes yet</h3>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Create your first promotional code to offer customers discounts
                on their bookings.
              </p>

              <Button className="mt-5">
                <Link
                  href="/dashboard/admin/discount-codes/new"
                  className="flex items-center"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Discount Code
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {codes.map((code) => {
                const status = getDiscountStatus(code);
                const usageCount = getUsageCount(code.id, redemptionRows);

                return (
                  <div
                    key={code.id}
                    className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold tracking-wide">{code.code}</h3>

                        <Badge
                          variant={
                            status === "Active"
                              ? "default"
                              : status === "Scheduled"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {status}
                        </Badge>
                      </div>

                      {code.description && (
                        <p className="text-sm text-muted-foreground">
                          {code.description}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-medium text-emerald-700">
                          <Tag className="h-3.5 w-3.5" />
                          {formatDiscount(code)}
                        </span>

                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5" />
                          {usageCount}
                          {code.usage_limit !== null
                            ? ` / ${code.usage_limit}`
                            : " redemptions"}
                        </span>

                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-3.5 w-3.5" />
                          {code.expires_at
                            ? `Expires ${new Date(
                                code.expires_at,
                              ).toLocaleDateString()}`
                            : "No expiry date"}
                        </span>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Minimum booking:{" "}
                        {formatNaira(Number(code.min_booking_amount))}
                        {code.first_booking_only && " · First booking only"}
                        {code.max_discount_amount !== null &&
                          ` · Max discount ${formatNaira(
                            Number(code.max_discount_amount),
                          )}`}
                      </div>

                      {code.per_customer_limit !== null && (
                        <p className="text-xs text-muted-foreground">
                          Limit per customer: {code.per_customer_limit}
                        </p>
                      )}
                    </div>

                    {/* <div className="flex shrink-0 items-center gap-2">
                      <Button variant="outline" size="sm">
                        <Link
                          href={`/dashboard/admin/discount-codes/${code.id}/edit`}
                        >
                          Manage
                        </Link>
                      </Button>
                    </div> */}
                    <div className="flex flex-row shrink-0 items-start gap-2">
                      <Button variant="outline" size="sm">
                        <Link
                          href={`/dashboard/admin/discount-codes/${code.id}/edit`}
                        >
                          Edit
                        </Link>
                      </Button>

                      <DiscountCodeActions
                        id={code.id}
                        isActive={code.is_active}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
