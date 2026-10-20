import Link from "next/link";
import { CheckCircle2, CreditCard, Wallet } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Payout account</h1>

        <Card>
          <CardContent className="p-6">
            Your worker profile could not be found. Please complete your worker
            profile before adding a payout account.
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Wallet className="size-4" />
            Worker finances
          </div>

          <h1 className="text-2xl font-bold tracking-tight">Payout account</h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Manage the bank account you want to receive your earnings into.
          </p>
        </div>

        <Button variant="outline">
          <Link href="/dashboard/worker/earnings">Back to earnings</Link>
        </Button>
      </div>

      {/* Success message */}
      {params.saved === "1" && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
        >
          <CheckCircle2 className="size-5 shrink-0" />
          Your payout account was saved successfully.
        </div>
      )}

      {/* Error message */}
      {params.error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          {params.error}
        </div>
      )}

      {/* Saved accounts */}
      <Card>
        <CardContent className="space-y-5 p-6">
          <div>
            <h2 className="text-lg font-semibold">Saved bank accounts</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Review your saved details or update an existing account.
            </p>
          </div>

          {accounts && accounts.length > 0 ? (
            <div className="space-y-4">
              {accounts.map((account) => (
                <div key={account.id} className="rounded-xl border p-4 sm:p-5">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-3">
                        <CreditCard className="size-5" />
                      </div>

                      <div>
                        <p className="font-semibold">{account.bank_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.account_name}
                        </p>
                      </div>
                    </div>

                    {account.is_default && (
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                        Default
                      </span>
                    )}
                  </div>

                  <p className="mb-4 text-sm text-muted-foreground">
                    Account number: ••••••{account.account_number.slice(-4)}
                  </p>

                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium underline underline-offset-4">
                      Edit bank details
                    </summary>

                    <div className="mt-5">
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
            <div className="rounded-xl border border-dashed p-6 text-center">
              <CreditCard className="mx-auto mb-3 size-8 text-muted-foreground" />

              <p className="font-medium">No payout account yet</p>

              <p className="mt-1 text-sm text-muted-foreground">
                Add your bank details below so they are available when
                withdrawals are enabled.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add a new account */}
      <Card>
        <CardContent className="space-y-5 p-6">
          <div>
            <h2 className="text-lg font-semibold">Add a bank account</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Select your bank and verify your account number before saving.
            </p>
          </div>

          <PayoutAccountForm />
        </CardContent>
      </Card>

      {/* Payout notice */}
      <div className="rounded-lg border p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">About payouts</p>
        <p className="mt-1">
          Saving a verified bank account does not initiate a withdrawal or
          transfer. Your earnings and withdrawal process remain separate.
        </p>
      </div>
    </div>
  );
}
