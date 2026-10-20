import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  Clock3,
  RefreshCw,
  ShieldCheck,
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
  pending: "bg-amber-100 text-amber-800",
  processing: "bg-blue-100 text-blue-800",
  paid: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
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
  }).format(date);
}

function maskAccountNumber(value: string | null) {
  if (!value) return "Not provided";

  const digits = value.replace(/\s/g, "");

  if (digits.length <= 4) return "••••";

  return `••••${digits.slice(-4)}`;
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
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button variant="ghost" size="sm">
            <Link href="/dashboard/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to dashboard
            </Link>
          </Button>

          <h1 className="mt-3 text-2xl font-bold tracking-tight">
            Withdrawal Management
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            Review and manage worker payout requests.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Manual payout processing
        </div>
      </div>

      {resultMessage && (
        <div
          className={`rounded-lg border p-4 text-sm ${
            resultMessage.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {resultMessage.message}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          Withdrawal requests could not be loaded. Please refresh the page or
          check the server logs.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-amber-100 p-3 text-amber-700">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending requests</p>
              <p className="text-2xl font-bold">{totalPending}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-blue-100 p-3 text-blue-700">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Processing requests
              </p>
              <p className="text-2xl font-bold">{totalProcessing}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <div className="rounded-lg bg-emerald-100 p-3 text-emerald-700">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Paid requests</p>
              <p className="text-2xl font-bold">{totalPaid}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button
            key={filter.value}
            variant={activeStatus === filter.value ? "default" : "outline"}
            size="sm"
          >
            <Link
              href={
                filter.value === "all"
                  ? "/dashboard/admin/withdrawals"
                  : `/dashboard/admin/withdrawals?status=${filter.value}`
              }
            >
              {filter.label}
            </Link>
          </Button>
        ))}
      </div>

      {withdrawals.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Banknote className="mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="font-semibold">No withdrawal requests found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Requests matching this filter will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {withdrawals.map((withdrawal) => {
            const profile = profilesById.get(withdrawal.worker_id);

            const workerName = profile
              ? `${profile.first_name ?? ""} ${profile.last_name ?? ""}`.trim()
              : "";

            return (
              <Card key={withdrawal.id}>
                <CardContent className="space-y-5 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Withdrawal amount
                      </p>
                      <p className="text-2xl font-bold">
                        {formatMoney(withdrawal.amount, withdrawal.currency)}
                      </p>
                      <p className="mt-1 break-all text-xs text-muted-foreground">
                        Request ID: {withdrawal.id}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                        STATUS_STYLES[withdrawal.status] ??
                        STATUS_STYLES.pending
                      }`}
                    >
                      {withdrawal.status}
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Worker</p>
                      <p className="font-medium">
                        {workerName || "Worker profile unavailable"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {profile?.phone || "No phone number"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Bank account
                      </p>
                      <p className="font-medium">
                        {withdrawal.bank_name || "Bank not provided"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {withdrawal.account_name || "Account name unavailable"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {/* {maskAccountNumber(withdrawal.account_number)} */}
                        {withdrawal.account_number}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Requested on
                      </p>
                      <p className="font-medium">
                        {formatDate(withdrawal.created_at)}
                      </p>
                      {withdrawal.processed_at && (
                        <p className="mt-1 text-sm text-muted-foreground">
                          Processed: {formatDate(withdrawal.processed_at)}
                        </p>
                      )}
                    </div>
                  </div>

                  {withdrawal.payment_method && (
                    <p className="text-sm text-muted-foreground">
                      Payment method: {withdrawal.payment_method}
                    </p>
                  )}

                  {withdrawal.provider_reference && (
                    <p className="break-all text-sm">
                      <span className="text-muted-foreground">
                        Payment reference:{" "}
                      </span>
                      {withdrawal.provider_reference}
                    </p>
                  )}

                  {withdrawal.failure_reason && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
                      <span className="font-semibold">Failure reason: </span>
                      {withdrawal.failure_reason}
                    </div>
                  )}

                  {withdrawal.status === "pending" && (
                    <form
                      action={updateWithdrawalStatus}
                      className="border-t pt-4"
                    >
                      <input
                        type="hidden"
                        name="withdrawal_id"
                        value={withdrawal.id}
                      />
                      <input type="hidden" name="status" value="processing" />
                      <p className="mb-3 text-sm text-muted-foreground">
                        Review the destination details before beginning the
                        transfer.
                      </p>
                      <Button type="submit" size="sm">
                        Start processing
                      </Button>
                    </form>
                  )}

                  {withdrawal.status === "processing" && (
                    <div className="space-y-4 border-t pt-4">
                      <form
                        action={updateWithdrawalStatus}
                        className="space-y-3"
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
                            className="mb-1 block text-sm font-medium"
                          >
                            Bank transfer reference
                          </label>
                          <input
                            id={`reference-${withdrawal.id}`}
                            name="provider_reference"
                            required
                            maxLength={200}
                            placeholder="Enter confirmed transfer reference"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                          />
                        </div>

                        <Button type="submit" size="sm">
                          Confirm payment completed
                        </Button>
                      </form>

                      <form
                        action={updateWithdrawalStatus}
                        className="space-y-3 rounded-lg border border-red-200 p-3"
                      >
                        <input
                          type="hidden"
                          name="withdrawal_id"
                          value={withdrawal.id}
                        />
                        <input type="hidden" name="status" value="failed" />

                        <div>
                          <label
                            htmlFor={`failure-${withdrawal.id}`}
                            className="mb-1 block text-sm font-medium"
                          >
                            Reason for failure
                          </label>
                          <textarea
                            id={`failure-${withdrawal.id}`}
                            name="failure_reason"
                            required
                            maxLength={1000}
                            rows={2}
                            placeholder="Explain why the transfer failed"
                            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
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
