"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/auth/require-role";

export type RefundActionState = {
  error?: string;
  success?: string;
  refundId?: string;
};

export async function requestCustomerRefund(
  _prevState: RefundActionState,
  formData: FormData,
): Promise<RefundActionState> {
  await requireRole(["customer"]);

  const paymentId = String(formData.get("paymentId") ?? "");
  const transactionId = String(formData.get("transactionId") ?? "");
  const amountValue = String(formData.get("amount") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();

  if (!paymentId || !transactionId) {
    return { error: "Invalid payment transaction." };
  }

  const amount = Number(amountValue);

  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Enter a valid refund amount." };
  }

  if (reason.length < 5 || reason.length > 2000) {
    return {
      error: "Your reason must contain between 5 and 2,000 characters.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Please sign in again to request a refund." };
  }

  const { data: refundId, error } = await supabase.rpc("request_refund", {
    p_payment_id: paymentId,
    p_transaction_id: transactionId,
    p_amount: amount,
    p_reason: reason,
  });

  if (error) {
    console.error("Refund request failed:", error);

    return {
      error: error.message.includes("remaining refundable balance")
        ? "The requested amount exceeds the remaining refundable balance."
        : error.message.includes("successful Paystack charges")
          ? "Only verified successful payments can be refunded."
          : "Unable to submit your refund request. Please check your details and try again.",
    };
  }

  revalidatePath("/dashboard/customer/payments");
  revalidatePath("/dashboard/customer/refunds");

  return {
    success: "Your refund request has been submitted successfully.",
    refundId,
  };
}
