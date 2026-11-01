"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  initiatePaystackRefund,
  verifyPaystackTransaction,
} from "@/lib/payments/paystack";

export type ProcessRefundState = {
  error?: string;
  success?: string;
};

export async function processApprovedRefund(
  _prevState: ProcessRefundState,
  formData: FormData,
): Promise<ProcessRefundState> {
  await requireRole(["admin"]);

  const refundId = String(formData.get("refundId") ?? "");

  if (!refundId) {
    return { error: "Invalid refund request." };
  }

  // Use the authenticated client for the admin-only claim RPC.
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Please sign in again." };
  }

  // Use the privileged client for server-side refund records.
  const admin = createAdminClient();

  const { data: refund, error: refundError } = await admin
    .from("refunds")
    .select(
      "id, payment_id, transaction_id, amount, currency, reason, status, provider, provider_reference",
    )
    .eq("id", refundId)
    .maybeSingle();

  if (refundError || !refund) {
    console.error("Refund lookup failed:", refundError);
    return { error: "Refund request could not be found." };
  }

  if (refund.status !== "approved") {
    return {
      error: "Only approved refunds can be processed.",
    };
  }

  if (refund.provider !== "paystack") {
    return {
      error: "This refund does not use the supported Paystack provider.",
    };
  }

  if (refund.provider_reference) {
    return {
      error: "A Paystack refund reference already exists for this request.",
    };
  }

  const [
    { data: payment, error: paymentError },
    { data: transaction, error: transactionError },
  ] = await Promise.all([
    admin
      .from("payments")
      .select("id, amount, currency, status, provider, provider_reference")
      .eq("id", refund.payment_id)
      .maybeSingle(),

    admin
      .from("payment_transactions")
      .select(
        "id, payment_id, transaction_type, amount, currency, status, provider, provider_reference, verified_at",
      )
      .eq("id", refund.transaction_id)
      .maybeSingle(),
  ]);

  if (paymentError || !payment) {
    console.error("Original payment lookup failed:", paymentError);
    return { error: "Original payment could not be verified." };
  }

  if (transactionError || !transaction) {
    console.error("Original transaction lookup failed:", transactionError);
    return { error: "Original transaction could not be verified." };
  }

  if (
    payment.status !== "paid" ||
    payment.provider !== "paystack" ||
    !payment.provider_reference
  ) {
    return {
      error: "The original payment is not a verified Paystack payment.",
    };
  }

  if (
    transaction.payment_id !== payment.id ||
    transaction.provider_reference !== payment.provider_reference ||
    transaction.transaction_type !== "charge" ||
    transaction.status !== "successful" ||
    transaction.provider !== "paystack" ||
    !transaction.verified_at
  ) {
    return {
      error: "The original charge transaction is not eligible for a refund.",
    };
  }

  if (Number(payment.amount) !== Number(transaction.amount)) {
    return {
      error:
        "The payment amount does not match the verified transaction amount.",
    };
  }

  if (
    transaction.currency !== payment.currency ||
    refund.currency !== payment.currency
  ) {
    return {
      error: "The payment and refund currencies do not match.",
    };
  }

  const refundAmount = Number(refund.amount);
  const paymentAmount = Number(payment.amount);
  const transactionAmount = Number(transaction.amount);

  if (
    !Number.isFinite(refundAmount) ||
    !Number.isFinite(paymentAmount) ||
    !Number.isFinite(transactionAmount) ||
    refundAmount <= 0 ||
    refundAmount > paymentAmount ||
    refundAmount > transactionAmount
  ) {
    return {
      error: "The refund amount is invalid or exceeds the original payment.",
    };
  }

  const amountInKobo = Math.round(refundAmount * 100);
  const paymentAmountInKobo = Math.round(paymentAmount * 100);

  if (
    !Number.isSafeInteger(amountInKobo) ||
    !Number.isSafeInteger(paymentAmountInKobo) ||
    Math.abs(refundAmount * 100 - amountInKobo) > 0.000001
  ) {
    return {
      error: "The refund amount cannot be represented safely in kobo.",
    };
  }

  // Verify the original transaction directly with Paystack.
  let verifiedPayment;

  try {
    verifiedPayment = await verifyPaystackTransaction(
      payment.provider_reference,
    );
  } catch (error) {
    console.error("Paystack transaction verification failed:", error);

    return {
      error:
        "Paystack could not verify the original payment. No refund was initiated.",
    };
  }

  if (
    verifiedPayment.status !== "success" ||
    verifiedPayment.reference !== payment.provider_reference ||
    verifiedPayment.amount !== paymentAmountInKobo ||
    verifiedPayment.currency !== payment.currency
  ) {
    return {
      error:
        "Paystack verification does not match the original payment. No refund was initiated.",
    };
  }

  // Atomically claim the approved refund before contacting Paystack.
  const { data: claimed, error: claimError } = await supabase.rpc(
    "claim_refund_for_processing",
    {
      p_refund_id: refund.id,
    },
  );

  if (claimError) {
    console.error("Refund claim failed:", claimError);
    return {
      error: "Unable to reserve this refund for processing.",
    };
  }

  if (!claimed) {
    return {
      error:
        "This refund has already been claimed or its status has changed. Refresh the page.",
    };
  }

  async function flagForReconciliation(refundId: string, note: string) {
    const { error } = await admin
      .from("refunds")
      .update({
        reconciliation_required: true,
        reconciliation_note: note,
        // updated_at: new Date().toISOString(),
      })
      .eq("id", refundId)
      .eq("status", "processing");

    if (error) {
      console.error("Could not flag refund for reconciliation:", {
        refundId,
        error,
      });
    }

    revalidatePath("/dashboard/admin/refunds");
    revalidatePath(`/dashboard/admin/refunds/${refundId}`);
  }

  // Once claimed, do not automatically release or retry it if the
  // provider outcome is uncertain. This prevents accidental duplicate refunds.
  try {
    const paystackRefund = await initiatePaystackRefund({
      transactionReference: payment.provider_reference,
      amountInKobo,
      customerNote: refund.reason.slice(0, 200),
      merchantNote: `Emirate ErrandHub refund ${refund.id}`,
    });

    if (
      !Number.isSafeInteger(paystackRefund.id) ||
      paystackRefund.id <= 0 ||
      Number(
        typeof paystackRefund.transaction === "object"
          ? paystackRefund.transaction?.id
          : paystackRefund.transaction,
      ) !== verifiedPayment.id ||
      paystackRefund.amount !== amountInKobo ||
      paystackRefund.currency !== refund.currency
    ) {
      console.error("Paystack refund response did not match the request:", {
        refundId: refund.id,
        paystackRefund,
        expectedTransaction: verifiedPayment.id,
        expectedAmount: amountInKobo,
        expectedCurrency: refund.currency,
      });

      await flagForReconciliation(
        refund.id,
        "Paystack returned an incomplete or mismatched refund response. Manual investigation required.",
      );

      return {
        error:
          "Paystack returned an incomplete or mismatched refund response. The refund remains in processing and requires manual reconciliation. Do not retry it.",
      };
    }

    // Store Paystack's refund ID in provider_reference.
    // Keep status as processing until completion is independently verified.
    const { data: updatedRefund, error: updateError } = await admin
      .from("refunds")
      .update({
        provider_reference: String(paystackRefund.id),
        // updated_at: new Date().toISOString(),
      })
      .eq("id", refund.id)
      .eq("status", "processing")
      .is("provider_reference", null)
      .select("id")
      .maybeSingle();

    if (updateError || !updatedRefund) {
      console.error("Could not save Paystack refund reference:", {
        updateError,
        paystackRefundId: paystackRefund.id,
      });

      await flagForReconciliation(
        refund.id,
        `Paystack returned refund ID ${paystackRefund.id}, but saving the reference failed. Do not retry. Investigate the provider transaction.`,
      );

      return {
        error:
          "Paystack returned a refund response, but its reference could not be saved. The refund remains in processing and requires reconciliation. Do not retry it.",
      };
    }

    revalidatePath("/dashboard/admin/refunds");
    revalidatePath(`/dashboard/admin/refunds/${refund.id}`);

    return {
      success:
        "Paystack accepted the refund request. It remains in processing until completion is verified.",
    };
  } catch (error) {
    console.error("Paystack refund request outcome is uncertain:", error);

    await flagForReconciliation(
      refund.id,
      "The Paystack refund request outcome is uncertain. Verify the provider dashboard before taking further action.",
    );

    return {
      error:
        "Paystack could not confirm the refund request outcome. The refund remains in processing for reconciliation. Do not retry it.",
    };
  }
}
