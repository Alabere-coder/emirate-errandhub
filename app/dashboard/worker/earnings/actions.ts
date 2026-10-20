"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";

export async function requestWithdrawal(formData: FormData) {
  const amountValue = String(formData.get("amount") ?? "").trim();
  const amount = Number(amountValue);

  if (
    !amountValue ||
    !Number.isFinite(amount) ||
    amount <= 0 ||
    !/^\d+(\.\d{1,2})?$/.test(amountValue)
  ) {
    redirect("/dashboard/worker/earnings?withdrawal=invalid-amount");
  }

  const { user, supabase } = await requireRole(["worker"]);

  const { data: workerProfile, error: profileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError || !workerProfile) {
    redirect("/dashboard/worker/earnings?withdrawal=profile-error");
  }

  // The withdrawal must use the worker's saved default payout account.
  const { data: payoutAccount, error: accountError } = await supabase
    .from("worker_payout_accounts")
    .select("id")
    .eq("worker_id", workerProfile.id)
    .eq("is_default", true)
    .maybeSingle();

  if (accountError || !payoutAccount) {
    redirect("/dashboard/worker/earnings?withdrawal=no-default-account");
  }

  // The existing database RPC validates the balance, account ownership,
  // and creates the pending withdrawal.
  const { error: withdrawalError } = await supabase.rpc(
    "request_worker_withdrawal",
    {
      p_amount: amount,
      p_payout_account_id: payoutAccount.id,
    },
  );

  if (withdrawalError) {
    console.error("Withdrawal request failed:", withdrawalError);
    redirect("/dashboard/worker/earnings?withdrawal=request-failed");
  }

  revalidatePath("/dashboard/worker/earnings");
  revalidatePath("/dashboard/worker/payout-account");

  redirect("/dashboard/worker/earnings?withdrawal=submitted");
}
