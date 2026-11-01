import Link from "next/link";
import { ArrowRight, RefreshCcw } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type Refund = {
  id: string;
  payment_id: string;
  transaction_id: string;
  customer_id: string;
  job_id: string;
  amount: number;
  currency: string;
  reason: string;
  admin_note: string | null;
  status: string;
  provider: string;
  provider_reference: string | null;
  requested_at: string;
  reviewed_at: string | null;
  processed_at: string | null;
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return "Not available";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function statusVariant(status: string) {
  switch (status) {
    case "processed":
      return "default" as const;
    case "requested":
    case "under_review":
      return "secondary" as const;
    case "rejected":
    case "failed":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export default async function AdminRefundsPage() {
  await requireRole(["admin"]);

  const admin = createAdminClient();

  const { data, error } = await admin
    .from("refunds")
    .select(
      "id, payment_id, transaction_id, customer_id, job_id, amount, currency, reason, admin_note, status, provider, provider_reference, requested_at, reviewed_at, processed_at",
    )
    .order("requested_at", { ascending: false });

  if (error) {
    console.error("Failed to load refunds:", error);
    throw new Error("Unable to load refund requests.");
  }

  const refunds = (data ?? []) as Refund[];

  const pendingCount = refunds.filter(
    (refund) =>
      refund.status === "requested" || refund.status === "under_review",
  ).length;

  const processingCount = refunds.filter(
    (refund) => refund.status === "approved" || refund.status === "processing",
  ).length;

  const processedCount = refunds.filter(
    (refund) => refund.status === "processed",
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Refund Management</h1>
        <p className="text-muted-foreground">
          Review customer refund requests and monitor their progress.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Awaiting review</CardDescription>
            <CardTitle className="text-2xl">{pendingCount}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Approved / Processing</CardDescription>
            <CardTitle className="text-2xl">{processingCount}</CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Successfully processed</CardDescription>
            <CardTitle className="text-2xl">{processedCount}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {refunds.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <RefreshCcw className="mb-4 h-8 w-8 text-muted-foreground" />
            <h2 className="font-semibold">No refund requests yet</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Customer refund requests will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {refunds.map((refund) => (
            <Card key={refund.id}>
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Refund request
                    </p>
                    <p className="break-all font-mono text-xs">{refund.id}</p>
                  </div>

                  <Badge variant={statusVariant(refund.status)}>
                    {refund.status.replaceAll("_", " ")}
                  </Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Refund amount
                    </p>
                    <p className="text-lg font-semibold">
                      {formatAmount(Number(refund.amount), refund.currency)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">
                      Payment provider
                    </p>
                    <p className="font-medium capitalize">{refund.provider}</p>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground">Requested</p>
                    <p className="font-medium">
                      {formatDate(refund.requested_at)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <p className="text-sm font-medium">Customer reason</p>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {refund.reason}
                  </p>
                </div>

                <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <p className="break-all">Customer ID: {refund.customer_id}</p>
                  <p className="break-all">Job ID: {refund.job_id}</p>
                  <p className="break-all">Payment ID: {refund.payment_id}</p>
                  <p className="break-all">
                    Transaction ID: {refund.transaction_id}
                  </p>
                </div>

                <div className="flex justify-end border-t pt-4">
                  <Link
                    href={`/dashboard/admin/refunds/${refund.id}`}
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                  >
                    Review refund
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
