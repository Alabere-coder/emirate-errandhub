import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  BriefcaseBusiness,
  CalendarDays,
  CircleAlert,
  Clock3,
  Wallet,
} from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { Card, CardContent } from "@/components/ui/card";
import { requestWithdrawal } from "./actions";

type WorkerEarning = {
  id: string;
  job_id: string;
  gross_amount: number;
  commission_amount: number;
  net_amount: number;
  currency: string;
  status: string;
  available_at: string | null;
  created_at: string;
};

type WorkerWithdrawal = {
  id: string;
  amount: number;
  currency: string;
  status: string;
  bank_name: string | null;
  account_number: string | null;
  provider_reference: string | null;
  created_at: string;
  processed_at: string | null;
  failure_reason: string | null;
};

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(value: string | null) {
  if (!value) return "Not yet available";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusLabel(status: string) {
  switch (status.toLowerCase()) {
    case "available":
      return "Available";
    case "pending":
      return "Pending";
    case "processing":
      return "Processing";
    case "paid":
      return "Paid";
    case "failed":
      return "Failed";
    case "cancelled":
      return "Cancelled";
    case "held":
      return "On hold";
    default:
      return status.replaceAll("_", " ");
  }
}

function getStatusClass(status: string) {
  switch (status.toLowerCase()) {
    case "available":
    case "paid":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "processing":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "failed":
    case "cancelled":
      return "border-red-200 bg-red-50 text-red-800";
    default:
      return "border-muted bg-muted/50 text-muted-foreground";
  }
}

export default async function WorkerEarningsPage({
  searchParams,
}: {
  searchParams: Promise<{ withdrawal?: string }>;
}) {
  const { withdrawal } = await searchParams;
  const { user, supabase } = await requireRole(["worker"]);

  const { data: workerProfile, error: profileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Worker earnings profile lookup failed:", profileError);
  }

  if (!workerProfile) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Link
          href="/dashboard/worker"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <Card className="rounded-3xl">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <CircleAlert className="size-10 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-semibold">
              Worker profile not found
            </h1>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Your worker profile is not available yet. Please contact an
              administrator for assistance.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fetch earnings.
  const { data, error } = await supabase
    .from("worker_earnings")
    .select(
      "id, job_id, gross_amount, commission_amount, net_amount, currency, status, available_at, created_at",
    )
    .eq("worker_id", workerProfile.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Worker earnings query failed:", error);
  }

  const earnings = (data ?? []) as WorkerEarning[];

  // Fetch withdrawal history.
  const { data: withdrawalRows, error: withdrawalsError } = await supabase
    .from("withdrawals")

    .select(
      "id, amount, currency, status, bank_name, account_number, provider_reference, created_at, processed_at, failure_reason",
    )

    .eq("worker_id", workerProfile.id)
    .order("created_at", { ascending: false });

  if (withdrawalsError) {
    console.error("Worker withdrawals query failed:", withdrawalsError);
  }

  const withdrawals = (withdrawalRows ?? []) as WorkerWithdrawal[];

  // Find the worker's default payout account.
  const { data: defaultPayoutAccount, error: payoutAccountError } =
    await supabase
      .from("worker_payout_accounts")
      .select("id, bank_name, account_number")
      .eq("worker_id", workerProfile.id)
      .eq("is_default", true)
      .maybeSingle();

  if (payoutAccountError) {
    console.error("Default payout account lookup failed:", payoutAccountError);
  }

  // Display calculations for NGN withdrawals.
  const reservedWithdrawals = withdrawals
    .filter((item) =>
      ["pending", "processing", "paid"].includes(item.status.toLowerCase()),
    )
    .filter((item) => item.currency.toUpperCase() === "NGN")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const availableNairaEarnings = earnings
    .filter(
      (item) =>
        item.status.toLowerCase() === "available" &&
        item.currency.toUpperCase() === "NGN",
    )
    .reduce((sum, item) => sum + Number(item.net_amount), 0);

  const withdrawableBalance = Math.max(
    0,
    availableNairaEarnings - reservedWithdrawals,
  );

  const totalGross = earnings.reduce(
    (sum, earning) => sum + Number(earning.gross_amount),
    0,
  );

  const totalCommission = earnings.reduce(
    (sum, earning) => sum + Number(earning.commission_amount),
    0,
  );

  const availableEarnings = earnings
    .filter((earning) => earning.status.toLowerCase() === "available")
    .reduce((sum, earning) => sum + Number(earning.net_amount), 0);

  const pendingEarnings = earnings
    .filter((earning) => earning.status.toLowerCase() === "pending")
    .reduce((sum, earning) => sum + Number(earning.net_amount), 0);

  const currency =
    earnings.find((earning) => earning.currency)?.currency ?? "NGN";

  return (
    <div className="mx-auto max-w-7xl space-y-7">
      <Link
        href="/dashboard/worker"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      <section className="relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-8">
        <div className="absolute -right-12 -top-12 size-48 rounded-full bg-primary/5 blur-3xl" />

        <div className="relative flex items-start gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border bg-background text-primary">
            <Wallet className="size-7" />
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              My Earnings
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review your earnings, platform commission, withdrawal requests,
              and payouts released following customer confirmation and
              administrator approval.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-destructive" />
          <p>
            We couldn&apos;t load your earnings right now. Please refresh the
            page or try again later.
          </p>
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Available earnings
              </p>
              <Wallet className="size-5 text-emerald-600" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">
              {formatMoney(availableEarnings, currency)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Released earnings, after commission
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Pending earnings</p>
              <Clock3 className="size-5 text-amber-600" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">
              {formatMoney(pendingEarnings, currency)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Not yet released
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">Gross earnings</p>
              <Banknote className="size-5 text-primary" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">
              {formatMoney(totalGross, currency)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Before platform commission
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                Platform commission
              </p>
              <BriefcaseBusiness className="size-5 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight">
              {formatMoney(totalCommission, currency)}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Deducted from recorded earnings
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl">
          <CardContent className="space-y-5 p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-bold">Withdraw earnings</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Request a payout to your default saved bank account.
              </p>
            </div>

            <div className="rounded-xl border bg-muted/30 p-4">
              <p className="text-sm text-muted-foreground">
                Available to withdraw
              </p>
              <p className="mt-1 text-2xl font-bold">
                {formatMoney(withdrawableBalance, "NGN")}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                After pending, processing, and paid withdrawals are accounted
                for.
              </p>
            </div>

            {withdrawal === "submitted" && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                Your withdrawal request was submitted successfully. Payment has
                not necessarily been sent yet.
              </div>
            )}

            {withdrawal === "invalid-amount" && (
              <p role="alert" className="text-sm text-destructive">
                Enter a valid withdrawal amount.
              </p>
            )}

            {withdrawal === "insufficient-balance" && (
              <p role="alert" className="text-sm text-red-600">
                Your available balance is too low for this withdrawal. Refresh
                your earnings and try again.
              </p>
            )}

            {withdrawal === "profile-error" && (
              <p role="alert" className="text-sm text-destructive">
                Your worker profile could not be verified. Please try again
                later.
              </p>
            )}

            {withdrawal === "no-default-account" && (
              <div className="space-y-3 rounded-xl border p-4">
                <p className="text-sm">
                  You need a default payout account before requesting a
                  withdrawal.
                </p>
                <Link
                  href="/dashboard/worker/payout-account"
                  className="inline-flex text-sm font-semibold text-primary underline underline-offset-4"
                >
                  Set up your payout account
                </Link>
              </div>
            )}

            {withdrawal === "request-failed" && (
              <p role="alert" className="text-sm text-destructive">
                We couldn&apos;t submit your withdrawal. Your balance may be
                insufficient, or the request may have failed validation. Please
                check your balance and try again.
              </p>
            )}

            {payoutAccountError && (
              <p role="alert" className="text-sm text-destructive">
                We couldn&apos;t verify your default payout account. Please
                refresh the page or manage your payout accounts.
              </p>
            )}

            {defaultPayoutAccount ? (
              <>
                <div className="rounded-xl border p-4">
                  <p className="text-xs text-muted-foreground">
                    Default destination
                  </p>
                  <p className="mt-1 font-semibold">
                    {defaultPayoutAccount.bank_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Account ending in{" "}
                    {defaultPayoutAccount.account_number.slice(-4)}
                  </p>
                  <Link
                    href="/dashboard/worker/payout-account"
                    className="mt-2 inline-flex text-sm text-primary underline underline-offset-4"
                  >
                    Manage payout accounts
                  </Link>
                </div>

                <form action={requestWithdrawal} className="space-y-4">
                  <div className="space-y-2">
                    <label
                      htmlFor="withdrawal-amount"
                      className="text-sm font-medium"
                    >
                      Amount (₦)
                    </label>
                    <input
                      id="withdrawal-amount"
                      name="amount"
                      type="number"
                      min="0.01"
                      max={withdrawableBalance}
                      step="0.01"
                      required
                      disabled={
                        withdrawableBalance <= 0 || Boolean(payoutAccountError)
                      }
                      placeholder="Enter amount"
                      className="h-11 w-full rounded-xl border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={
                      withdrawableBalance <= 0 || Boolean(payoutAccountError)
                    }
                    className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Request withdrawal
                  </button>

                  <p className="text-xs leading-5 text-muted-foreground">
                    Submitting a request does not mean payment has been sent.
                    Withdrawals are subject to server-side balance validation
                    and processing.
                  </p>
                </form>
              </>
            ) : (
              !payoutAccountError && (
                <Link
                  href="/dashboard/worker/payout-account"
                  className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
                >
                  Add a payout account
                </Link>
              )
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardContent className="space-y-4 p-5 sm:p-6">
            <div>
              <h2 className="text-lg font-bold">Withdrawal history</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Track your previous payout requests.
              </p>
            </div>

            {withdrawalsError ? (
              <p className="text-sm text-destructive">
                Withdrawal history could not be loaded. Please refresh the page.
              </p>
            ) : withdrawals.length === 0 ? (
              <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                You haven&apos;t requested a withdrawal yet.
              </p>
            ) : (
              <div className="space-y-3">
                {withdrawals.map((item) => (
                  <div key={item.id} className="rounded-xl border p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">
                          {formatMoney(Number(item.amount), item.currency)}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {formatDate(item.created_at)}
                        </p>
                        {item.bank_name && (
                          <p className="mt-2 text-sm text-muted-foreground">
                            {item.bank_name}
                            {item.account_number
                              ? ` •••• ${item.account_number.slice(-4)}`
                              : ""}
                          </p>
                        )}
                      </div>

                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(item.status)}`}
                      >
                        {getStatusLabel(item.status)}
                      </span>
                    </div>

                    {item.failure_reason &&
                      item.status.toLowerCase() === "failed" && (
                        <p className="mt-3 text-sm text-destructive">
                          {item.failure_reason}
                        </p>
                      )}

                    {item.status.toLowerCase() === "paid" && (
                      <div className="mt-3 space-y-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
                        <p className="font-semibold">Payment completed</p>

                        {item.provider_reference && (
                          <p className="break-all">
                            <span className="font-medium">
                              Transfer reference:{" "}
                            </span>
                            {item.provider_reference}
                          </p>
                        )}

                        {item.processed_at && (
                          <p>
                            <span className="font-medium">Processed on: </span>
                            {formatDate(item.processed_at)}
                          </p>
                        )}
                      </div>
                    )}

                    {item.status.toLowerCase() === "failed" && (
                      <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
                        <p className="font-semibold">Withdrawal failed</p>

                        {item.failure_reason && (
                          <p className="mt-1">{item.failure_reason}</p>
                        )}

                        {item.processed_at && (
                          <p className="mt-2">
                            Processed on: {formatDate(item.processed_at)}
                          </p>
                        )}
                      </div>
                    )}

                    {["pending", "processing"].includes(
                      item.status.toLowerCase(),
                    ) &&
                      item.processed_at && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Processed: {formatDate(item.processed_at)}
                        </p>
                      )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Earnings history</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {earnings.length} {earnings.length === 1 ? "record" : "records"}{" "}
            found.
          </p>
        </div>

        {earnings.length === 0 ? (
          <Card className="rounded-3xl">
            <CardContent className="flex flex-col items-center px-6 py-12 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
                <Banknote className="size-7 text-muted-foreground" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">No earnings yet</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Your earnings records will appear here after an administrator
                approves the release for a completed, customer-confirmed job
                with verified full payment.
              </p>
              <Link
                href="/dashboard/worker/jobs/my"
                className="mt-5 inline-flex h-10 items-center justify-center rounded-xl border px-4 text-sm font-medium transition-colors hover:bg-muted"
              >
                View my jobs
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {earnings.map((earning) => (
              <Card key={earning.id} className="rounded-2xl">
                <CardContent className="space-y-5 p-5 sm:p-6">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Job reference
                      </p>
                      <p className="mt-1 break-all font-mono text-sm font-semibold">
                        {earning.job_id}
                      </p>
                      <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5" />
                        Recorded {formatDate(earning.created_at)}
                      </p>
                    </div>

                    <span
                      className={`inline-flex w-fit items-center rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(earning.status)}`}
                    >
                      {getStatusLabel(earning.status)}
                    </span>
                  </div>

                  <div className="grid gap-4 border-t pt-4 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Gross amount
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatMoney(
                          Number(earning.gross_amount),
                          earning.currency,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Platform commission
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatMoney(
                          Number(earning.commission_amount),
                          earning.currency,
                        )}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Your net earnings
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {formatMoney(
                          Number(earning.net_amount),
                          earning.currency,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="border-t pt-4 text-sm">
                    <p className="text-muted-foreground">
                      Available since:{" "}
                      <span className="font-medium text-foreground">
                        {formatDate(earning.available_at)}
                      </span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
