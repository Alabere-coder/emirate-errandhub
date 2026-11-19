import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

import {
  ArrowLeft,
  AlertTriangle,
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  CheckCircle2,
  Clock3,
  CreditCard,
  FileText,
  RefreshCcw,
  ShieldCheck,
  UserRound,
  Wallet,
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

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(new Date(value));
}

function statusVariant(status: string) {
  switch (status) {
    case "processed":
      return "default" as const;
    case "approved":
    case "processing":
      return "secondary" as const;
    case "rejected":
    case "failed":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ");
}

function SectionCard({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={`overflow-hidden border-border/60 shadow-sm ${className}`}>
      <CardHeader className="border-b border-border/60 bg-muted/20 px-5 py-4 sm:px-6">
        <CardTitle className="flex items-center gap-3 text-base">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
            <Icon className="h-5 w-5" />
          </span>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 p-5 sm:p-6">{children}</CardContent>
    </Card>
  );
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p
        className={`break-all text-sm font-medium ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function InfoBanner({
  icon: Icon,
  title,
  children,
  variant = "default",
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
  variant?: "default" | "warning";
}) {
  const warning = variant === "warning";

  return (
    <div
      className={`flex items-start gap-3 rounded-2xl border p-4 ${
        warning
          ? "border-amber-500/30 bg-amber-500/6"
          : "border-emerald-500/20 bg-emerald-500/4"
      }`}
    >
      <span
        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          warning
            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
            : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>

      <div className="min-w-0">
        <p className="text-sm font-semibold">{title}</p>
        <div className="mt-1 text-sm leading-6 text-muted-foreground">
          {children}
        </div>
      </div>
    </div>
  );
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
    ? `${customer.first_name ?? ""} ${customer.last_name ?? ""}`.trim() ||
      "Customer details unavailable"
    : "Customer details unavailable";

  const reviewerName = reviewer
    ? `${reviewer.first_name ?? ""} ${reviewer.last_name ?? ""}`.trim() || "—"
    : "—";

  return (
    <div className="space-y-8">
      {/* Page header */}
      <section className="space-y-5">
        <div className="relative overflow-hidden rounded-3xl border border-emerald-900/10 bg-linear-to-br from-emerald-950 via-emerald-900 to-emerald-800 px-6 py-7 text-white shadow-lg sm:px-8">
          <div className="absolute -right-16 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
          <div className="absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-card/10 px-3 py-1.5 text-xs font-medium text-emerald-50">
                <ShieldCheck className="h-3.5 w-3.5" />
                Finance &amp; payment operations
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Refund Request
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-50/75">
                Review the customer&apos;s request, verify the original payment,
                and manage the refund workflow.
              </p>

              <p className="mt-4 break-all font-mono text-xs text-emerald-100/70">
                Reference: {refund.id}
              </p>
            </div>

            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-card/10">
                <RefreshCcw className="h-8 w-8 text-emerald-100" />
              </div>

              <Badge
                variant={statusVariant(refund.status)}
                className="w-fit border-white/20 px-3 py-1.5 text-sm capitalize"
              >
                {statusLabel(refund.status)}
              </Badge>
            </div>
          </div>

          <div className="relative mt-7 grid gap-4 border-t border-white/15 pt-5 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-100/60">
                Requested refund amount
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                {formatCurrency(Number(refund.amount), refund.currency)}
              </p>
            </div>

            <div className="sm:text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-100/60">
                Date requested
              </p>
              <p className="mt-2 text-sm font-medium text-emerald-50">
                {formatDate(refund.requested_at)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main information */}
      <section className="grid gap-5 xl:grid-cols-2">
        <SectionCard title="Refund information" icon={FileText}>
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/4 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Requested amount
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight text-emerald-700 dark:text-emerald-400">
              {formatCurrency(Number(refund.amount), refund.currency)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Customer reason</p>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
                {refund.reason}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Admin note</p>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-4">
              <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">
                {refund.admin_note || "No admin note has been added."}
              </p>
            </div>
          </div>

          <div className="grid gap-x-5 gap-y-4 border-t border-border/60 pt-5 sm:grid-cols-2">
            <DetailItem label="Refund ID" value={refund.id} mono />
            <DetailItem
              label="Requested"
              value={formatDate(refund.requested_at)}
            />
            <DetailItem label="Reviewed by" value={reviewerName} />
            <DetailItem
              label="Reviewed at"
              value={formatDate(refund.reviewed_at)}
            />
            <DetailItem
              label="Processed at"
              value={formatDate(refund.processed_at)}
            />
            <DetailItem label="Payment provider" value={refund.provider} />
          </div>
        </SectionCard>

        <SectionCard title="Customer information" icon={UserRound}>
          <div className="flex items-center gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
              <UserRound className="h-6 w-6" />
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold">{customerName}</p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {customer?.role || "Customer"}
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <DetailItem
              label="Customer account ID"
              value={refund.customer_id}
              mono
            />
            <DetailItem label="Phone number" value={customer?.phone || "—"} />
          </div>

          <div className="border-t border-border/60 pt-5">
            <p className="text-xs leading-6 text-muted-foreground">
              This account is the customer who submitted the refund request.
              Verify the associated payment and job before making a decision.
            </p>
          </div>
        </SectionCard>

        <SectionCard title="Related job" icon={BriefcaseBusiness}>
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold">Associated service job</p>
              <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                {refund.job_id}
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <DetailItem
              label="Job status"
              value={job?.status || "Unavailable"}
            />
            <DetailItem
              label="Agreed amount"
              value={
                job?.agreed_amount != null
                  ? formatCurrency(Number(job.agreed_amount), refund.currency)
                  : "—"
              }
            />
            <DetailItem label="Job ID" value={refund.job_id} mono />
          </div>
        </SectionCard>

        <SectionCard title="Original payment" icon={CreditCard}>
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Original payment amount
            </p>
            <p className="mt-2 text-2xl font-bold tracking-tight">
              {payment
                ? formatCurrency(Number(payment.amount), payment.currency)
                : "Payment unavailable"}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {payment && (
                <Badge variant="outline" className="capitalize">
                  {payment.status.replaceAll("_", " ")}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {payment?.provider || refund.provider}
              </span>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <DetailItem
              label="Payment method"
              value={payment?.payment_method || "—"}
            />
            <DetailItem
              label="Paid at"
              value={formatDate(payment?.paid_at ?? null)}
            />
            <DetailItem
              label="Payment reference"
              value={payment?.provider_reference || "—"}
              mono
            />
            <DetailItem label="Payment ID" value={refund.payment_id} mono />
          </div>

          <div className="border-t border-border/60 pt-5">
            <div className="mb-4 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold">Charge transaction</p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <DetailItem
                label="Transaction ID"
                value={refund.transaction_id}
                mono
              />
              <DetailItem
                label="Transaction type"
                value={transaction?.transaction_type || "—"}
              />
              <DetailItem
                label="Transaction status"
                value={transaction?.status || "—"}
              />
              <DetailItem
                label="Transaction amount"
                value={
                  transaction
                    ? formatCurrency(
                        Number(transaction.amount),
                        transaction.currency,
                      )
                    : "—"
                }
              />
              <DetailItem
                label="Provider reference"
                value={transaction?.provider_reference || "—"}
                mono
              />
              <DetailItem
                label="Verified at"
                value={formatDate(transaction?.verified_at ?? null)}
              />
              <DetailItem
                label="Transaction created"
                value={formatDate(transaction?.created_at ?? null)}
              />
            </div>
          </div>
        </SectionCard>
      </section>

      {/* Processing guidance */}
      <InfoBanner icon={ShieldCheck} title="Refund processing safeguards">
        Refund approval does not automatically transfer money. Paystack
        processing is a separate action requiring explicit administrator
        confirmation. Refund completion must be verified through reconciliation
        before the request is marked as processed.
      </InfoBanner>

      {/* Reconciliation warning */}
      {refund.reconciliation_required && (
        <Card className="overflow-hidden border-amber-500/40 shadow-sm">
          <CardHeader className="border-b border-amber-500/20 bg-amber-500/6 px-5 py-4 sm:px-6">
            <CardTitle className="flex items-center gap-3 text-base text-amber-700 dark:text-amber-400">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10">
                <AlertTriangle className="h-5 w-5" />
              </span>
              Manual reconciliation required
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 p-5 sm:p-6">
            <p className="text-sm leading-6 text-muted-foreground">
              The Paystack refund outcome requires investigation. Do not retry
              this refund until its status has been confirmed in the Paystack
              dashboard.
            </p>

            {refund.reconciliation_note && (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/4 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                  Investigation details
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
                  {refund.reconciliation_note}
                </p>
              </div>
            )}

            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <RefreshCcw className="h-4 w-4" />
              Processing attempts: {refund.processing_attempts}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Refund actions */}
      <section className="space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-700 dark:text-emerald-400" />
            <h2 className="text-xl font-bold tracking-tight">Refund actions</h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the review, processing, reconciliation and recovery steps for
            this refund request.
          </p>
        </div>

        <div className="space-y-5">
          <RefundReviewForm refundId={refund.id} status={refund.status} />

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
      </section>

      <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
        <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
        <p className="text-xs leading-6 text-muted-foreground">
          Keep a record of every administrative decision. Always verify the
          payment provider&apos;s refund outcome before considering a refund
          complete. If the provider&apos;s status is uncertain, investigate and
          reconcile before attempting recovery.
        </p>
      </div>
    </div>
  );
}
