import Link from "next/link";
import { ArrowLeft, CheckCircle2, CreditCard, Wallet } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { Card, CardContent } from "@/components/ui/card";

import PayoutAccountForm from "./payout-account-form";

type SearchParams = Promise<{
  saved?: string;
  error?: string;
}>;

export default async function WorkerPayoutAccountPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { user, supabase } = await requireRole(["worker"]);
  const params = await searchParams;

  const { data: workerProfile, error: profileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    throw new Error("Unable to load your worker profile.");
  }

  if (!workerProfile) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Wallet className="size-4" />
          Worker finances
        </div>

        <Card className="rounded-2xl border-border bg-card">
          <CardContent className="flex flex-col items-center px-6 py-12 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-muted">
              <CreditCard className="size-7 text-muted-foreground" />
            </div>

            <h1 className="mt-4 text-xl font-semibold text-foreground">
              Worker profile not found
            </h1>

            <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Your worker profile could not be found. Please complete your
              worker profile before adding a payout account.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: accounts, error: accountsError } = await supabase
    .from("worker_payout_accounts")
    .select(
      "id,bank_name,bank_code,account_name,account_number,is_default,created_at",
    )
    .eq("worker_id", workerProfile.id)
    .order("created_at", { ascending: false });

  if (accountsError) {
    throw new Error("Unable to load your payout accounts.");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Page heading */}
      <section className="relative isolate overflow-hidden rounded-3xl bg-linear-to-br from-emerald-950 via-emerald-900 to-teal-800 p-6 text-white shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-teal-300/10 blur-3xl" />

        <div className="relative">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-emerald-200">
            <Wallet className="size-4" />
            Worker finances
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Payout account
              </h1>

              <p className="mt-2 max-w-xl text-sm leading-6 text-emerald-100/80">
                Manage the bank account you want to receive your earnings into.
              </p>
            </div>

            <Link
              href="/dashboard/worker/earnings"
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20"
            >
              <ArrowLeft className="size-4" />
              Back to earnings
            </Link>
          </div>
        </div>
      </section>

      {/* Success message */}
      {params.saved === "1" && (
        <div
          role="status"
          className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
        >
          <CheckCircle2 className="size-5 shrink-0" />
          <p>Your payout account was saved successfully.</p>
        </div>
      )}

      {/* Error message */}
      {params.error && (
        <div
          role="alert"
          className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {params.error}
        </div>
      )}

      {/* Saved accounts */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/50">
                <CreditCard className="size-4 text-emerald-700 dark:text-emerald-400" />
              </div>

              <h2 className="text-lg font-bold text-foreground">
                Saved bank accounts
              </h2>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Review your saved details or update an existing account.
            </p>
          </div>

          {accounts && accounts.length > 0 ? (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="rounded-xl border border-border bg-background p-4 transition-colors hover:border-primary/30 sm:p-5"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-muted">
                        <CreditCard className="size-5 text-muted-foreground" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold text-foreground">
                          {account.bank_name}
                        </p>

                        <p className="truncate text-sm text-muted-foreground">
                          {account.account_name}
                        </p>
                      </div>
                    </div>

                    {account.is_default && (
                      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300">
                        <CheckCircle2 className="size-3.5" />
                        Default
                      </span>
                    )}
                  </div>

                  <div className="mb-4 rounded-lg bg-muted/50 px-3 py-2.5">
                    <p className="text-xs text-muted-foreground">
                      Account number
                    </p>
                    <p className="mt-1 font-mono text-sm font-medium tracking-wider text-foreground">
                      ••••••{account.account_number.slice(-4)}
                    </p>
                  </div>

                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden">
                      <span>Edit bank details</span>
                      <span className="text-muted-foreground transition-transform group-open:rotate-180">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="size-4"
                          aria-hidden="true"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.22 7.22a.75.75 0 0 1 1.06 0L10 10.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 8.28a.75.75 0 0 1 0-1.06Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    </summary>

                    <div className="mt-5 border-t border-border pt-5">
                      <PayoutAccountForm
                        account={{
                          id: account.id,
                          bank_name: account.bank_name,
                          bank_code: account.bank_code,
                          account_name: account.account_name,
                          account_number: account.account_number,
                        }}
                      />
                    </div>
                  </details>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/20 px-6 py-10 text-center">
              <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
                <CreditCard className="size-6 text-muted-foreground" />
              </div>

              <p className="mt-3 font-semibold text-foreground">
                No payout account yet
              </p>

              <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted-foreground">
                Add your bank details below so they are available when
                withdrawals are enabled.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add a new account */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10">
                <CreditCard className="size-4 text-primary" />
              </div>

              <h2 className="text-lg font-bold text-foreground">
                Add a bank account
              </h2>
            </div>

            <p className="mt-2 text-sm text-muted-foreground">
              Select your bank and verify your account number before saving.
            </p>
          </div>

          <div className="border-t border-border pt-5">
            <PayoutAccountForm />
          </div>
        </CardContent>
      </Card>

      {/* Payout notice */}
      <div className="rounded-xl border border-border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-background">
            <Wallet className="size-4 text-primary" />
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">
              About payouts
            </p>

            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Saving a verified bank account does not initiate a withdrawal or
              transfer. Your earnings and withdrawal process remain separate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
