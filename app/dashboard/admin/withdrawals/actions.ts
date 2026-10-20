"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export async function updateWithdrawalStatus(formData: FormData) {
  await requireRole(["admin"]);

  const withdrawalId = String(formData.get("withdrawal_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const providerReference = String(
    formData.get("provider_reference") ?? "",
  ).trim();
  const failureReason = String(formData.get("failure_reason") ?? "").trim();

  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(withdrawalId)) {
    redirect("/dashboard/admin/withdrawals?result=invalid-id");
  }

  if (!["processing", "paid", "failed"].includes(status)) {
    redirect("/dashboard/admin/withdrawals?result=invalid-status");
  }

  if (status === "paid" && !providerReference) {
    redirect("/dashboard/admin/withdrawals?result=reference-required");
  }

  if (status === "failed" && !failureReason) {
    redirect("/dashboard/admin/withdrawals?result=reason-required");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("admin_update_withdrawal", {
    p_withdrawal_id: withdrawalId,
    p_status: status,
    ...(providerReference ? { p_provider_reference: providerReference } : {}),
    ...(failureReason ? { p_failure_reason: failureReason } : {}),
  });

  if (error) {
    console.error("Withdrawal status update failed:", error.message);
    redirect("/dashboard/admin/withdrawals?result=update-failed");
  }

  revalidatePath("/dashboard/admin/withdrawals");
  revalidatePath("/dashboard/worker/earnings");

  redirect("/dashboard/admin/withdrawals?result=updated");
}
