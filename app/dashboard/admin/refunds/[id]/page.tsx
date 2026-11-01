import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  FileText,
  UserRound,
  BriefcaseBusiness,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefundReviewForm } from "./refund-review-form";
import { ProcessRefundForm } from "./process-refund-form";
import { ReconcileRefundForm } from "./reconcile-refund-form";
import { RecoverRefundForm } from "./recover-refund-form";

export const dynamic = "force-dynamic";

type RefundPageProps = {
  params: Promise<{ id: string }>;
};

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusVariant(status: string) {
  switch (status) {
    case "processed":
      return "default";
    case "approved":
    case "processing":
      return "secondary";
    case "rejected":
    case "failed":
      return "destructive";
    default:
      return "outline";
  }
}

export default async function AdminRefundDetailsPage({
  params,
}: RefundPageProps) {
  await requireRole(["admin"]);

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: refund, error: refundError } = await supabase
    .from("refunds")
    .select(
      `
    id,
    payment_id,
    transaction_id,
    customer_id,
    job_id,
    amount,
    currency,
    reason,
    admin_note,
    status,
    provider,
    provider_reference,
    reconciliation_required,
    reconciliation_note,
    processing_attempts,
    requested_at,
    reviewed_by,
    reviewed_at,
    processed_at
  `,
    )
    .eq("id", id)
    .maybeSingle();

  if (refundError) {
    console.error("Admin refund details error:", refundError);
    throw new Error("Unable to load refund details.");
  }

  if (!refund) notFound();

  const [
    { data: payment },
    { data: transaction },
    { data: job },
    { data: customer },
    { data: reviewer },
  ] = await Promise.all([
    supabase
      .from("payments")
      .select(
        "id, amount, currency, payment_method, status, provider, provider_reference, paid_at, created_at",
      )
      .eq("id", refund.payment_id)
      .maybeSingle(),

    supabase
      .from("payment_transactions")
      .select(
        "id, transaction_type, amount, currency, status, provider, provider_reference, verified_at, created_at",
      )
      .eq("id", refund.transaction_id)
      .maybeSingle(),

    supabase
      .from("jobs")
      .select("id, status, agreed_amount")
      .eq("id", refund.job_id)
      .maybeSingle(),

    supabase
      .from("profiles")
      .select("id, first_name, last_name, phone, role")
      .eq("id", refund.customer_id)
      .maybeSingle(),

    refund.reviewed_by
      ? supabase
          .from("profiles")
          .select("id, first_name, last_name")
          .eq("id", refund.reviewed_by)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const customerName = customer
    ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim()
    : "Customer details unavailable";

  const reviewerName = reviewer
    ? `${reviewer.first_name ?? ""} ${reviewer.last_name ?? ""}`.trim()
    : "—";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/dashboard/admin/refunds"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to refunds
        </Link>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Refund Request
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review the refund request and its associated payment.
            </p>
          </div>

          <Badge variant={statusVariant(refund.status)}>
            {refund.status.replaceAll("_", " ")}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Refund information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Requested amount</p>
              <p className="text-2xl font-bold">
                {formatCurrency(Number(refund.amount), refund.currency)}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Reason</p>
              <p className="whitespace-pre-wrap text-sm leading-6">
                {refund.reason}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Admin note</p>
              <p className="whitespace-pre-wrap text-sm">
                {refund.admin_note || "No admin note has been added."}
              </p>
            </div>

            <div className="grid gap-3 border-t pt-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-muted-foreground">Refund ID</p>
                <p className="break-all text-xs">{refund.id}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Requested</p>
                <p className="text-sm">{formatDate(refund.requested_at)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reviewed by</p>
                <p className="text-sm">{reviewerName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Reviewed at</p>
                <p className="text-sm">{formatDate(refund.reviewed_at)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Processed at</p>
                <p className="text-sm">{formatDate(refund.processed_at)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              Customer information
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="font-medium">{customerName}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Email/Account ID</p>
              <p className="break-all text-sm">{refund.customer_id}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Phone</p>
              <p className="text-sm">{customer?.phone || "—"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BriefcaseBusiness className="h-5 w-5" />
              Related job
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Job ID</p>
              <p className="break-all text-sm">{refund.job_id}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Job status</p>
              <p className="text-sm">{job?.status || "Unavailable"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Agreed amount</p>
              <p className="text-sm">
                {job?.agreed_amount != null
                  ? formatCurrency(Number(job.agreed_amount), refund.currency)
                  : "—"}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Original payment
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Payment amount</p>
              <p className="text-lg font-semibold">
                {payment
                  ? formatCurrency(Number(payment.amount), payment.currency)
                  : "Payment unavailable"}
              </p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Payment status</p>
              <p className="text-sm">{payment?.status || "—"}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Payment provider</p>
              <p className="text-sm">{payment?.provider || refund.provider}</p>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Payment reference</p>
              <p className="break-all text-xs">
                {payment?.provider_reference || "—"}
              </p>
            </div>

            <div className="border-t pt-4">
              <p className="mb-2 text-sm font-medium">Charge transaction</p>

              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground">
                    Transaction ID
                  </p>
                  <p className="break-all text-xs">{refund.transaction_id}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Transaction status
                  </p>
                  <p className="text-sm">{transaction?.status || "—"}</p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Transaction amount
                  </p>
                  <p className="text-sm">
                    {transaction
                      ? formatCurrency(
                          Number(transaction.amount),
                          transaction.currency,
                        )
                      : "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">
                    Provider reference
                  </p>
                  <p className="break-all text-xs">
                    {transaction?.provider_reference || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Verified at</p>
                  <p className="text-sm">
                    {formatDate(transaction?.verified_at ?? null)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex items-start gap-3 py-4">
          <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Refund approval does not automatically transfer money. Paystack
            processing is a separate action requiring explicit administrator
            confirmation. Refund completion must be verified through
            reconciliation before the request is marked as processed.
          </p>
        </CardContent>
      </Card>

      <RefundReviewForm refundId={refund.id} status={refund.status} />
      {refund.reconciliation_required && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <FileText className="h-5 w-5" />
              Manual reconciliation required
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-3">
            <p className="text-sm">
              The Paystack refund outcome requires investigation. Do not retry
              this refund until its status has been confirmed in the Paystack
              dashboard.
            </p>

            {refund.reconciliation_note && (
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Investigation details
                </p>
                <p className="whitespace-pre-wrap text-sm">
                  {refund.reconciliation_note}
                </p>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              Processing attempts: {refund.processing_attempts}
            </p>
          </CardContent>
        </Card>
      )}
      <ProcessRefundForm
        refundId={refund.id}
        status={refund.status}
        amount={Number(refund.amount)}
        currency={refund.currency}
      />
      <ReconcileRefundForm
        refundId={refund.id}
        status={refund.status}
        provider={refund.provider}
        providerReference={refund.provider_reference}
      />
      <RecoverRefundForm
        refundId={refund.id}
        status={refund.status}
        provider={refund.provider}
        providerReference={refund.provider_reference}
      />
    </div>
  );
}
