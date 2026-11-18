import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  CheckCircle2,
  Clock3,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { updateWithdrawalStatus } from "./actions";

type WithdrawalStatus =
  | "pending"
  | "processing"
  | "paid"
  | "failed"
  | "cancelled";

type Withdrawal = {
  id: string;
  worker_id: string;
  amount: number | string;
  currency: string;
  status: WithdrawalStatus;
  payment_method: string | null;
  account_name: string | null;
  account_number: string | null;
  bank_name: string | null;
  bank_code: string | null;
  provider_reference: string | null;
  processed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
};

type SearchParams = Promise<{
  status?: string;
  result?: string;
}>;

const FILTERS = [
  { label: "All requests", value: "all" },
  { label: "Pending", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Paid", value: "paid" },
  { label: "Failed", value: "failed" },
  { label: "Cancelled", value: "cancelled" },
] as const;

const STATUS_STYLES: Record<WithdrawalStatus, string> = {
  pending:
    "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300",
  processing:
    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300",
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300",
  failed:
    "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300",
  cancelled:
    "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300",
};

function formatMoney(amount: number | string, currency: string) {
  const value = Number(amount);

  if (!Number.isFinite(value)) return `${currency} 0.00`;

  try {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString("en-NG", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

function formatDate(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Lagos",
  }).format(date);
}

function getResultMessage(result?: string) {
  switch (result) {
    case "updated":
      return {
        type: "success",
        message: "Withdrawal status updated successfully.",
      };
    case "invalid-id":
      return {
        type: "error",
        message: "The withdrawal ID is invalid.",
      };
    case "invalid-status":
      return {
        type: "error",
        message: "The selected withdrawal status is invalid.",
      };
    case "reference-required":
      return {
        type: "error",
        message: "Enter the payment reference before confirming payment.",
      };
    case "reason-required":
      return {
        type: "error",
        message: "Enter a reason before marking a withdrawal as failed.",
      };
    case "update-failed":
      return {
        type: "error",
        message:
          "The withdrawal could not be updated. It may have changed status or you may not have permission.",
      };
    default:
      return null;
  }
}

function getWorkerName(profile?: Profile) {
  if (!profile) return "Worker profile unavailable";

  const name = `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim();

  return name || "Worker profile unavailable";
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Clock3;
  iconClassName: string;
}) {
  return (
    <Card className="overflow-hidden border-border/70 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>

          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClassName}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="wrap-break-word text-sm font-medium">{children}</div>
    </div>
  );
}

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireRole(["admin"]);

  const params = await searchParams;
  const supabase = await createClient();

  const requestedStatus = params.status ?? "all";
  const validStatuses = FILTERS.map((filter) => filter.value);

  const activeStatus = validStatuses.includes(
    requestedStatus as (typeof validStatuses)[number],
  )
    ? requestedStatus
    : "all";

  let query = supabase
    .from("withdrawals")
    .select(
      "id, worker_id, amount, currency, status, payment_method, account_name, account_number, bank_name, bank_code, provider_reference, processed_at, failure_reason, created_at, updated_at",
    )
    .order("created_at", { ascending: false });

  if (activeStatus !== "all") {
    query = query.eq("status", activeStatus);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Admin withdrawals query failed:", error.message);
  }

  const withdrawals = (data ?? []) as Withdrawal[];

  const workerIds = [
    ...new Set(withdrawals.map((withdrawal) => withdrawal.worker_id)),
  ];

  let profilesById = new Map<string, Profile>();

  if (workerIds.length > 0) {
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, phone")
      .in("id", workerIds);

    if (profilesError) {
      console.error(
        "Withdrawal worker profiles query failed:",
        profilesError.message,
      );
    }

    profilesById = new Map(
      ((profiles ?? []) as Profile[]).map((profile) => [profile.id, profile]),
    );
  }

  const resultMessage = getResultMessage(params.result);

  const totalPending = withdrawals.filter(
    (withdrawal) => withdrawal.status === "pending",
  ).length;

  const totalProcessing = withdrawals.filter(
    (withdrawal) => withdrawal.status === "processing",
  ).length;

  const totalPaid = withdrawals.filter(
    (withdrawal) => withdrawal.status === "paid",
  ).length;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* Header */}
      <section className="relative overflow-hidden rounded-2xl border border-emerald-900/20 bg-linear-to-br from-emerald-950 via-emerald-900 to-emerald-800 p-6 text-white shadow-lg sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
                <Wallet className="h-3.5 w-3.5" />
                Financial operations
              </div>

              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Withdrawal Management
              </h1>

              <p className="mt-2 text-sm leading-6 text-emerald-100/80 sm:text-base">
                Review worker payout requests, manage transfer progress, and
                confirm completed payments.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3 rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10">
                <ShieldCheck className="h-5 w-5 text-emerald-100" />
              </div>
              <div>
                <p className="text-sm font-semibold">Manual processing</p>
                <p className="mt-0.5 text-xs text-emerald-100/75">
                  Admin-managed payouts
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Result feedback */}
      {resultMessage && (
        <div
          role="status"
          className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
            resultMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
              : "border-red-200 bg-red-50 text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
          }`}
        >
          {resultMessage.type === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          ) : (
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
          )}
          {resultMessage.message}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          Withdrawal requests could not be loaded. Please refresh the page or
          check the server logs.
        </div>
      )}

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Pending requests"
          value={totalPending}
          description="Awaiting processing"
          icon={Clock3}
          iconClassName="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
        />

        <StatCard
          title="Processing requests"
          value={totalProcessing}
          description="Transfers being handled"
          icon={RefreshCw}
          iconClassName="bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
        />

        <StatCard
          title="Paid requests"
          value={totalPaid}
          description="Successfully marked as paid"
          icon={Banknote}
          iconClassName="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
        />
      </section>

      {/* Filters */}
      <section className="space-y-3">
        <div>
          <h2 className="text-base font-semibold">Withdrawal requests</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Filter requests by their current processing status.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {FILTERS.map((filter) => {
            const isActive = activeStatus === filter.value;

            return (
              <Link
                key={filter.value}
                href={
                  filter.value === "all"
                    ? "/dashboard/admin/withdrawals"
                    : `/dashboard/admin/withdrawals?status=${filter.value}`
                }
                aria-current={isActive ? "page" : undefined}
                className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border-emerald-700 bg-emerald-700 text-white shadow-sm hover:bg-emerald-800"
                    : "border-border bg-card text-muted-foreground hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800 dark:hover:border-emerald-800 dark:hover:bg-emerald-950/30 dark:hover:text-emerald-300"
                }`}
              >
                {filter.label}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Withdrawal list */}
      {withdrawals.length === 0 ? (
        <Card className="overflow-hidden border-border/70 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              <Banknote className="h-7 w-7" />
            </div>

            <h2 className="mt-5 font-semibold">No withdrawal requests found</h2>

            <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
              Requests matching this filter will appear here when workers submit
              payout requests.
            </p>

            {activeStatus !== "all" && (
              <Button variant="outline" className="mt-5">
                <Link href="/dashboard/admin/withdrawals">
                  View all requests
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => {
            const profile = profilesById.get(withdrawal.worker_id);
            const workerName = getWorkerName(profile);

            return (
              <Card
                key={withdrawal.id}
                className="overflow-hidden border-border/70 shadow-sm transition-shadow hover:shadow-md"
              >
                <CardContent className="space-y-5 p-5 sm:p-6">
                  {/* Amount and status */}
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Withdrawal amount
                      </p>

                      <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">
                        {formatMoney(withdrawal.amount, withdrawal.currency)}
                      </p>

                      <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                        Request ID: {withdrawal.id}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold capitalize ${
                        STATUS_STYLES[withdrawal.status] ??
                        STATUS_STYLES.pending
                      }`}
                    >
                      {withdrawal.status}
                    </span>
                  </div>

                  {/* Worker and bank details */}
                  <div className="grid gap-5 rounded-xl border bg-muted/20 p-4 sm:grid-cols-2 xl:grid-cols-3">
                    <DetailItem label="Worker">
                      {workerName}
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">
                        {profile?.phone || "No phone number"}
                      </span>
                    </DetailItem>

                    <DetailItem label="Bank">
                      {withdrawal.bank_name || "Bank not provided"}
                      <span className="mt-1 block text-xs font-normal text-muted-foreground">
                        {withdrawal.bank_code
                          ? `Bank code: ${withdrawal.bank_code}`
                          : "Bank code unavailable"}
                      </span>
                    </DetailItem>

                    <DetailItem label="Account name">
                      {withdrawal.account_name || "Account name unavailable"}
                    </DetailItem>

                    <DetailItem label="Account number">
                      <span className="font-mono tracking-wide">
                        {withdrawal.account_number || "Not provided"}
                      </span>
                    </DetailItem>

                    <DetailItem label="Requested on">
                      {formatDate(withdrawal.created_at)}
                    </DetailItem>

                    <DetailItem label="Processed on">
                      {formatDate(withdrawal.processed_at)}
                    </DetailItem>
                  </div>

                  {withdrawal.payment_method && (
                    <DetailItem label="Payment method">
                      <span className="capitalize">
                        {withdrawal.payment_method.replaceAll("_", " ")}
                      </span>
                    </DetailItem>
                  )}

                  {withdrawal.provider_reference && (
                    <div className="rounded-lg border border-emerald-200/70 bg-emerald-50/50 p-3 dark:border-emerald-900/50 dark:bg-emerald-950/15">
                      <p className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                        Payment reference
                      </p>
                      <p className="mt-1 break-all font-mono text-sm text-emerald-900 dark:text-emerald-200">
                        {withdrawal.provider_reference}
                      </p>
                    </div>
                  )}

                  {withdrawal.failure_reason && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                      <p className="font-semibold">Failure reason</p>
                      <p className="mt-1 leading-6">
                        {withdrawal.failure_reason}
                      </p>
                    </div>
                  )}

                  {/* Pending action */}
                  {withdrawal.status === "pending" && (
                    <form
                      action={updateWithdrawalStatus}
                      className="space-y-3 border-t pt-5"
                    >
                      <input
                        type="hidden"
                        name="withdrawal_id"
                        value={withdrawal.id}
                      />
                      <input type="hidden" name="status" value="processing" />

                      <div>
                        <p className="font-semibold">Begin payout processing</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Review the worker and bank account details before
                          beginning the transfer.
                        </p>
                      </div>

                      <Button
                        type="submit"
                        size="sm"
                        className="bg-emerald-700 text-white hover:bg-emerald-800"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Start processing
                      </Button>
                    </form>
                  )}

                  {/* Processing actions */}
                  {withdrawal.status === "processing" && (
                    <div className="space-y-5 border-t pt-5">
                      <div>
                        <p className="font-semibold">Complete this payout</p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                          Confirm the bank transfer only after verifying that
                          the payment was successfully completed.
                        </p>
                      </div>

                      <form
                        action={updateWithdrawalStatus}
                        className="space-y-3 rounded-xl border border-emerald-200/70 bg-emerald-50/30 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/10"
                      >
                        <input
                          type="hidden"
                          name="withdrawal_id"
                          value={withdrawal.id}
                        />
                        <input type="hidden" name="status" value="paid" />

                        <div>
                          <label
                            htmlFor={`reference-${withdrawal.id}`}
                            className="mb-2 block text-sm font-medium"
                          >
                            Bank transfer reference
                          </label>

                          <input
                            id={`reference-${withdrawal.id}`}
                            name="provider_reference"
                            required
                            maxLength={200}
                            placeholder="Enter confirmed transfer reference"
                            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-emerald-600"
                          />
                        </div>

                        <Button
                          type="submit"
                          size="sm"
                          className="bg-emerald-700 text-white hover:bg-emerald-800"
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Confirm payment completed
                        </Button>
                      </form>

                      <form
                        action={updateWithdrawalStatus}
                        className="space-y-3 rounded-xl border border-red-200 p-4 dark:border-red-900/60"
                      >
                        <input
                          type="hidden"
                          name="withdrawal_id"
                          value={withdrawal.id}
                        />
                        <input type="hidden" name="status" value="failed" />

                        <div>
                          <p className="font-semibold text-red-700 dark:text-red-400">
                            Mark transfer as failed
                          </p>
                          <p className="mt-1 text-xs leading-5 text-muted-foreground">
                            Provide a clear reason for the unsuccessful
                            transfer.
                          </p>
                        </div>

                        <div>
                          <label
                            htmlFor={`failure-${withdrawal.id}`}
                            className="mb-2 block text-sm font-medium"
                          >
                            Reason for failure
                          </label>

                          <textarea
                            id={`failure-${withdrawal.id}`}
                            name="failure_reason"
                            required
                            maxLength={1000}
                            rows={3}
                            placeholder="Explain why the transfer failed"
                            className="w-full resize-y rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition-shadow placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-red-500"
                          />
                        </div>

                        <Button type="submit" variant="destructive" size="sm">
                          Mark as failed
                        </Button>
                      </form>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
