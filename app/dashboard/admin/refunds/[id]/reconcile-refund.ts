"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";

import {
  fetchPaystackRefund,
  verifyPaystackTransaction,
} from "@/lib/payments/paystack";

export type ReconcileRefundState = {
  error?: string;
  success?: string;
};

function getPaystackTransactionDetails(
  transaction:
    | number
    | {
        id: number;
        reference?: string;
      },
) {
  if (typeof transaction === "number") {
    return {
      id: transaction,
      reference: null,
    };
  }

  return {
    id: transaction.id,
    reference: transaction.reference ?? null,
  };
}

export async function reconcilePaystackRefund(
  _prevState: ReconcileRefundState,
  formData: FormData,
): Promise<ReconcileRefundState> {
  await requireRole(["admin"]);

  const refundId = String(formData.get("refundId") ?? "").trim();

  if (!refundId) {
    return { error: "Invalid refund request." };
  }

  const admin = createAdminClient();

  const { data: refund, error: refundError } = await admin
    .from("refunds")
    // .select(
    //   "id, payment_id, transaction_id, amount, currency, status, provider, provider_reference",
    // )
    .select(
      "id, payment_id, transaction_id, customer_id, job_id, amount, currency, status, provider, provider_reference",
    )
    .eq("id", refundId)
    .maybeSingle();

  if (refundError || !refund) {
    console.error("Refund lookup failed:", refundError);
    return { error: "Refund request could not be found." };
  }

  if (refund.provider !== "paystack") {
    return { error: "This refund does not use Paystack." };
  }

  if (refund.status !== "processing") {
    return {
      error: "Only refunds currently processing can be reconciled.",
    };
  }

  if (!refund.provider_reference) {
    return {
      error:
        "No Paystack refund ID is saved. Manual reconciliation is required. Do not retry the refund.",
    };
  }

  const [
    { data: payment, error: paymentError },
    { data: transaction, error: transactionError },
  ] = await Promise.all([
    admin
      .from("payments")
      //   .select("id, amount, currency, status, provider, provider_reference")
      .select(
        "id, customer_id, job_id, amount, currency, status, provider, provider_reference",
      )
      .eq("id", refund.payment_id)
      .maybeSingle(),

    admin
      .from("payment_transactions")
      //   .select(
      //     "id, payment_id, transaction_type, amount, currency, status, provider, verified_at",
      //   )
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
    payment.customer_id !== refund.customer_id ||
    payment.job_id !== refund.job_id ||
    transaction.provider_reference !== payment.provider_reference ||
    transaction.payment_id !== payment.id ||
    transaction.transaction_type !== "charge" ||
    transaction.status !== "successful" ||
    transaction.provider !== "paystack" ||
    !transaction.verified_at
  ) {
    return {
      error:
        "The original charge transaction is not eligible for reconciliation.",
    };
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
    refund.currency !== payment.currency ||
    transaction.currency !== payment.currency
  ) {
    return {
      error:
        "The original payment, transaction, and refund currencies do not match.",
    };
  }

  const refundAmount = Number(refund.amount);
  const paymentAmount = Number(payment.amount);
  const transactionAmount = Number(transaction.amount);

  if (
    !Number.isFinite(refundAmount) ||
    !Number.isFinite(paymentAmount) ||
    !Number.isFinite(transactionAmount) ||
    refundAmount <= 0
  ) {
    return { error: "The stored refund or payment amount is invalid." };
  }

  const refundAmountInKobo = Math.round(refundAmount * 100);
  const paymentAmountInKobo = Math.round(paymentAmount * 100);
  const transactionAmountInKobo = Math.round(transactionAmount * 100);

  if (
    !Number.isSafeInteger(refundAmountInKobo) ||
    !Number.isSafeInteger(paymentAmountInKobo) ||
    !Number.isSafeInteger(transactionAmountInKobo) ||
    Math.abs(refundAmount * 100 - refundAmountInKobo) > 0.000001 ||
    paymentAmountInKobo !== transactionAmountInKobo ||
    refundAmountInKobo > paymentAmountInKobo
  ) {
    return {
      error: "The stored payment and refund amounts do not match safely.",
    };
  }

  // Verify the original charge directly with Paystack.
  let verifiedPayment;

  try {
    verifiedPayment = await verifyPaystackTransaction(
      payment.provider_reference,
    );
  } catch (error) {
    console.error("Original Paystack verification failed:", error);
    return {
      error:
        "Unable to verify the original Paystack payment. No status was changed.",
    };
  }

  if (
    !["success", "reversed"].includes(verifiedPayment.status) ||
    verifiedPayment.reference !== payment.provider_reference ||
    verifiedPayment.amount !== paymentAmountInKobo ||
    verifiedPayment.currency !== payment.currency
  ) {
    console.error("Paystack recovery verification mismatch:", {
      returnedStatus: verifiedPayment.status,
      expectedStatus: "success",
      returnedReference: verifiedPayment.reference,
      expectedReference: payment.provider_reference,
      returnedAmount: verifiedPayment.amount,
      expectedAmount: paymentAmountInKobo,
      returnedCurrency: verifiedPayment.currency,
      expectedCurrency: payment.currency,
    });

    return {
      error:
        "The original Paystack payment could not be verified. No reference was saved.",
    };
  }

  // Retrieve the refund from Paystack.
  let providerRefund;

  try {
    providerRefund = await fetchPaystackRefund(refund.provider_reference);
  } catch (error) {
    console.error("Paystack refund lookup failed:", error);
    return {
      error:
        "Unable to retrieve the refund status from Paystack. No database status was changed.",
    };
  }

  // Confirm that this is the exact refund for this payment.
  const providerTransaction = getPaystackTransactionDetails(
    providerRefund.transaction,
  );

  if (
    String(providerRefund.id) !== refund.provider_reference ||
    providerTransaction.id !== verifiedPayment.id ||
    (providerTransaction.reference !== null &&
      providerTransaction.reference !== payment.provider_reference) ||
    providerRefund.amount !== refundAmountInKobo ||
    providerRefund.currency !== refund.currency
  ) {
    console.error("Paystack refund details did not match:", {
      localRefundId: refund.id,
      localProviderReference: refund.provider_reference,
      providerRefundId: providerRefund.id,
      providerTransactionId: providerRefund.transaction,
      verifiedPaymentTransactionId: verifiedPayment.id,
      providerAmount: providerRefund.amount,
      expectedAmount: paymentAmountInKobo,
      providerCurrency: providerRefund.currency,
      expectedCurrency: refund.currency,
    });

    return {
      error:
        "The Paystack refund details do not match this request. No database status was changed.",
    };
  }

  let nextStatus: "processing" | "processed" | "failed";

  switch (providerRefund.status.toLowerCase()) {
    case "processed":
      nextStatus = "processed";
      break;

    case "failed":
      nextStatus = "failed";
      break;

    case "pending":
    case "processing":
      nextStatus = "processing";
      break;

    default:
      return {
        error: `Paystack returned an unrecognized refund status: ${providerRefund.status}. No database status was changed.`,
      };
  }

  const { data: updatedRefund, error: updateError } = await admin
    .from("refunds")
    .update({
      status: nextStatus,
      processed_at:
        nextStatus === "processed"
          ? (providerRefund.refunded_at ?? new Date().toISOString())
          : null,
      reconciliation_required: false,
      reconciliation_note: null,
      //   updated_at: new Date().toISOString(),
    })
    .eq("id", refund.id)
    .eq("status", "processing")
    .eq("provider_reference", refund.provider_reference)
    .select("id")
    .maybeSingle();

  if (updateError || !updatedRefund) {
    console.error("Refund reconciliation update failed:", updateError);

    return {
      error:
        "Paystack was checked, but the local refund record could not be updated. Refresh and investigate before taking further action.",
    };
  }

  revalidatePath("/dashboard/admin/refunds");
  revalidatePath(`/dashboard/admin/refunds/${refund.id}`);

  return {
    success:
      nextStatus === "processed"
        ? "Paystack confirmed that the refund has been processed."
        : nextStatus === "failed"
          ? "Paystack confirmed that the refund failed."
          : "The refund is still processing at Paystack.",
  };
}

export type RecoverRefundReferenceState = {
  error?: string;
  success?: string;
};

export async function recoverPaystackRefundReference(
  _prevState: RecoverRefundReferenceState,
  formData: FormData,
): Promise<RecoverRefundReferenceState> {
  await requireRole(["admin"]);

  const refundId = String(formData.get("refundId") ?? "").trim();
  const paystackRefundId = String(
    formData.get("paystackRefundId") ?? "",
  ).trim();

  if (!refundId || !/^\d+$/.test(paystackRefundId)) {
    return { error: "Enter a valid Paystack refund ID." };
  }

  const numericPaystackRefundId = Number(paystackRefundId);

  if (
    !Number.isSafeInteger(numericPaystackRefundId) ||
    numericPaystackRefundId <= 0
  ) {
    return { error: "Enter a valid Paystack refund ID." };
  }

  const normalizedPaystackRefundId = String(numericPaystackRefundId);

  const admin = createAdminClient();

  const { data: refund, error: refundError } = await admin
    .from("refunds")
    // .select(
    //   "id, payment_id, transaction_id, amount, currency, status, provider, provider_reference",
    // )
    .select(
      "id, payment_id, transaction_id, customer_id, job_id, amount, currency, status, provider, provider_reference",
    )
    .eq("id", refundId)
    .maybeSingle();

  if (refundError || !refund) {
    console.error("Refund recovery lookup failed:", refundError);
    return { error: "Refund request could not be found." };
  }

  if (
    refund.status !== "processing" ||
    refund.provider !== "paystack" ||
    refund.provider_reference
  ) {
    return {
      error:
        "Only processing Paystack refunds without a saved provider reference can be recovered.",
    };
  }

  const [
    { data: payment, error: paymentError },
    { data: transaction, error: transactionError },
  ] = await Promise.all([
    admin
      .from("payments")
      //   .select("id, amount, currency, status, provider, provider_reference")
      .select(
        "id, customer_id, job_id, amount, currency, status, provider, provider_reference",
      )
      .eq("id", refund.payment_id)
      .maybeSingle(),

    admin
      .from("payment_transactions")
      //   .select(
      //     "id, payment_id, transaction_type, amount, currency, status, provider, verified_at",
      //   )
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
    payment.customer_id !== refund.customer_id ||
    payment.job_id !== refund.job_id ||
    transaction.provider_reference !== payment.provider_reference ||
    transaction.payment_id !== payment.id ||
    transaction.transaction_type !== "charge" ||
    transaction.status !== "successful" ||
    transaction.provider !== "paystack" ||
    !transaction.verified_at ||
    payment.status !== "paid" ||
    payment.provider !== "paystack" ||
    !payment.provider_reference
  ) {
    return {
      error: "The original payment is not eligible for refund recovery.",
    };
  }

  if (
    refund.currency !== payment.currency ||
    transaction.currency !== payment.currency
  ) {
    return { error: "The payment and refund currencies do not match." };
  }

  const refundAmount = Number(refund.amount);
  const paymentAmount = Number(payment.amount);
  const transactionAmount = Number(transaction.amount);

  if (
    !Number.isFinite(refundAmount) ||
    !Number.isFinite(paymentAmount) ||
    !Number.isFinite(transactionAmount) ||
    refundAmount <= 0
  ) {
    return { error: "The stored refund or payment amount is invalid." };
  }

  const refundAmountInKobo = Math.round(refundAmount * 100);
  const paymentAmountInKobo = Math.round(paymentAmount * 100);
  const transactionAmountInKobo = Math.round(transactionAmount * 100);

  if (
    !Number.isSafeInteger(refundAmountInKobo) ||
    !Number.isSafeInteger(paymentAmountInKobo) ||
    !Number.isSafeInteger(transactionAmountInKobo) ||
    Math.abs(refundAmount * 100 - refundAmountInKobo) > 0.000001 ||
    paymentAmountInKobo !== transactionAmountInKobo ||
    refundAmountInKobo > paymentAmountInKobo
  ) {
    return {
      error: "The stored payment and refund amounts do not match safely.",
    };
  }

  try {
    const verifiedPayment = await verifyPaystackTransaction(
      payment.provider_reference,
    );
    console.log("Paystack recovery verification response:", {
      status: verifiedPayment.status,
      reference: verifiedPayment.reference,
      amount: verifiedPayment.amount,
      currency: verifiedPayment.currency,
      expectedReference: payment.provider_reference,
      expectedAmount: paymentAmountInKobo,
      expectedCurrency: refund.currency,
    });

    if (
      !["success", "reversed"].includes(verifiedPayment.status) ||
      verifiedPayment.reference !== payment.provider_reference ||
      verifiedPayment.amount !== paymentAmountInKobo ||
      verifiedPayment.currency !== payment.currency
    ) {
      return {
        error:
          "The original Paystack payment could not be verified. No reference was saved.",
      };
    }

    const providerRefund = await fetchPaystackRefund(paystackRefundId);

    const providerTransaction = getPaystackTransactionDetails(
      providerRefund.transaction,
    );

    const refundMatches = {
      refundIdMatches: String(providerRefund.id) === normalizedPaystackRefundId,
      transactionIdMatches: providerTransaction.id === verifiedPayment.id,
      transactionReferenceMatches:
        providerTransaction.reference === null ||
        providerTransaction.reference === payment.provider_reference,
      amountMatches: providerRefund.amount === refundAmountInKobo,
      currencyMatches: providerRefund.currency === refund.currency,
    };

    console.log("Paystack refund recovery diagnostics:", {
      ...refundMatches,
      returnedRefundId: providerRefund.id,
      expectedRefundId: normalizedPaystackRefundId,
      returnedTransactionId: providerTransaction.id,
      expectedTransactionId: verifiedPayment.id,
      returnedTransactionReference: providerTransaction.reference,
      expectedTransactionReference: payment.provider_reference,
      returnedAmount: providerRefund.amount,
      expectedAmount: paymentAmountInKobo,
      returnedCurrency: providerRefund.currency,
      expectedCurrency: refund.currency,
      returnedStatus: providerRefund.status,
    });

    if (Object.values(refundMatches).some((matches) => !matches)) {
      return {
        error:
          "That Paystack refund ID does not match this payment and refund request. No reference was saved.",
      };
    }

    if (
      !["processed", "failed", "pending", "processing"].includes(
        providerRefund.status.toLowerCase(),
      )
    ) {
      return {
        error:
          "Paystack returned an unrecognized refund status. No reference was saved.",
      };
    }

    const { data: updatedRefund, error: updateError } = await admin
      .from("refunds")
      .update({
        provider_reference: normalizedPaystackRefundId,
        reconciliation_note:
          "Paystack refund ID manually recovered and verified. Run the reconciliation check to confirm the latest status.",
        // updated_at: new Date().toISOString(),
      })
      .eq("id", refund.id)
      .eq("status", "processing")
      .is("provider_reference", null)
      .select("id")
      .maybeSingle();

    if (updateError || !updatedRefund) {
      console.error("Saving recovered refund reference failed:", updateError);

      return {
        error:
          "Paystack verified the refund, but its reference could not be saved. Refresh and investigate before taking further action.",
      };
    }

    revalidatePath("/dashboard/admin/refunds");
    revalidatePath(`/dashboard/admin/refunds/${refund.id}`);

    return {
      success:
        "Paystack refund ID verified and saved. Run the reconciliation check to confirm its latest status.",
    };
  } catch (error) {
    console.error("Paystack refund reference recovery failed:", error);

    return {
      error:
        "Unable to verify this refund with Paystack. No reference was saved.",
    };
  }
}
