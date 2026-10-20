"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
} from "@/lib/payments/paystack";

export type InitializePaymentResult = {
  error?: string;
  authorizationUrl?: string;
  reference?: string;
};

function toKobo(amountInNaira: number): number {
  return Math.round(amountInNaira * 100);
}

function roundNaira(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export async function initializeJobPayment(
  jobId: string,
): Promise<InitializePaymentResult> {
  try {
    if (
      typeof jobId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        jobId,
      )
    ) {
      return { error: "A valid job is required." };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { error: "Please sign in to make a payment." };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (
      !profile ||
      profile.role !== "customer" ||
      profile.is_active === false
    ) {
      return { error: "Only active customer accounts can make payments." };
    }

    if (!user.email) {
      return {
        error: "Your account needs an email address to make a payment.",
      };
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select(
        "id, customer_id, agreed_amount, currency, status, payment_plan, deposit_percentage, upfront_amount",
      )
      .eq("id", jobId)
      .eq("customer_id", user.id)
      .maybeSingle();

    if (jobError || !job) {
      return { error: "We couldn't find this job in your account." };
    }

    if (job.status !== "assigned" && job.status !== "completed") {
      return {
        error:
          "Payment is available only for assigned jobs or eligible completed jobs.",
      };
    }

    const totalAmount = Number(job.agreed_amount);
    const currency = String(job.currency || "").toUpperCase();

    if (
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0 ||
      currency !== "NGN"
    ) {
      return {
        error:
          "This job has an invalid amount or unsupported payment currency.",
      };
    }

    const admin = createAdminClient();

    // Keep the payment summary at the full agreed job price.
    const { data: existingPayment, error: paymentLookupError } = await admin
      .from("payments")
      .select("id, customer_id, amount, currency, status")
      .eq("job_id", job.id)
      .maybeSingle();

    if (paymentLookupError) {
      console.error("Payment lookup failed:", paymentLookupError);
      return { error: "Unable to prepare this payment. Please try again." };
    }

    let paymentId: string;

    if (existingPayment) {
      if (
        existingPayment.customer_id !== user.id ||
        Number(existingPayment.amount) !== totalAmount ||
        existingPayment.currency.toUpperCase() !== currency
      ) {
        return {
          error:
            "The payment record doesn't match this job. Please contact support.",
        };
      }

      if (existingPayment.status === "paid") {
        return { error: "This job has already been paid in full." };
      }

      paymentId = existingPayment.id;
    } else {
      const { data: newPayment, error: createPaymentError } = await admin
        .from("payments")
        .insert({
          job_id: job.id,
          customer_id: user.id,
          amount: totalAmount,
          currency,
          status: "pending",
          provider: "paystack",
          payment_method: "paystack",
        })
        .select("id")
        .single();

      if (createPaymentError || !newPayment) {
        console.error("Payment record creation failed:", createPaymentError);
        return {
          error: "Unable to prepare this payment. Please try again.",
        };
      }

      paymentId = newPayment.id;
    }

    const { data: transactions, error: transactionLookupError } = await admin
      .from("payment_transactions")
      .select("amount, currency")
      .eq("payment_id", paymentId)
      .eq("status", "successful")
      .not("verified_at", "is", null);

    if (transactionLookupError) {
      console.error("Transaction lookup failed:", transactionLookupError);
      return { error: "Unable to calculate your remaining balance." };
    }

    let amountAlreadyPaid = 0;

    for (const transaction of transactions ?? []) {
      if (transaction.currency.toUpperCase() !== currency) {
        return {
          error:
            "A payment record has a currency mismatch. Please contact support.",
        };
      }

      amountAlreadyPaid = roundNaira(
        amountAlreadyPaid + Number(transaction.amount),
      );
    }

    const remainingAmount = roundNaira(totalAmount - amountAlreadyPaid);

    if (remainingAmount <= 0) {
      return {
        error:
          "No additional payment is due. If your payment status looks incorrect, contact support.",
      };
    }

    let amountDue = remainingAmount;

    const transactionType = "charge" as const;

    if (job.payment_plan === "deposit_balance") {
      const depositAmount =
        job.upfront_amount != null
          ? roundNaira(Number(job.upfront_amount))
          : roundNaira((totalAmount * Number(job.deposit_percentage)) / 100);

      if (
        !Number.isFinite(depositAmount) ||
        depositAmount <= 0 ||
        depositAmount >= totalAmount
      ) {
        return {
          error:
            "This job's deposit settings are invalid. Please contact support.",
        };
      }

      if (amountAlreadyPaid < depositAmount) {
        amountDue = roundNaira(depositAmount - amountAlreadyPaid);
      } else {
        amountDue = remainingAmount;
      }
    } else if (job.payment_plan !== "full") {
      return { error: "This job has an unsupported payment plan." };
    }

    if (amountDue <= 0 || toKobo(amountDue) <= 0) {
      return { error: "The calculated payment amount is invalid." };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!appUrl) {
      console.error("NEXT_PUBLIC_APP_URL is not configured.");
      return { error: "Payment checkout is not configured yet." };
    }

    const callbackUrl = new URL(
      "/dashboard/customer/payments/callback",
      appUrl,
    ).toString();

    // Reuse or safely resolve an existing pending Paystack attempt.
    const { data: pendingTransaction, error: pendingLookupError } = await admin
      .from("payment_transactions")
      .select("id, amount, currency, provider_reference, metadata")
      .eq("payment_id", paymentId)
      .eq("provider", "paystack")
      .eq("status", "pending")
      .maybeSingle();

    if (pendingLookupError) {
      console.error("Pending transaction lookup failed:", pendingLookupError);
      return {
        error: "Unable to check your existing payment. Please try again.",
      };
    }

    if (pendingTransaction) {
      const metadata =
        pendingTransaction.metadata &&
        typeof pendingTransaction.metadata === "object" &&
        !Array.isArray(pendingTransaction.metadata)
          ? pendingTransaction.metadata
          : {};

      const authorizationUrl = metadata.authorization_url;

      // Reuse the existing checkout instead of creating another charge.
      if (typeof authorizationUrl === "string" && authorizationUrl) {
        if (
          Number(pendingTransaction.amount) !== amountDue ||
          pendingTransaction.currency.toUpperCase() !== currency
        ) {
          return {
            error:
              "An earlier payment attempt still needs to be resolved. Please contact support before starting another payment.",
          };
        }

        return {
          authorizationUrl,
          reference: pendingTransaction.provider_reference!,
        };
      }

      // No saved checkout URL: verify the reference before retrying.
      const pendingReference = pendingTransaction.provider_reference;

      if (!pendingReference || !/^EH-[a-f0-9]{32}$/i.test(pendingReference)) {
        return {
          error:
            "An earlier payment attempt needs review. Please contact support.",
        };
      }

      let verification;

      try {
        verification = await verifyPaystackTransaction(pendingReference);
      } catch (error) {
        console.error(
          "Existing Paystack attempt could not be verified:",
          error,
        );
        return {
          error:
            "We couldn't confirm your earlier payment attempt. Please try again later; don't start another payment yet.",
        };
      }

      if (verification.reference !== pendingReference) {
        return {
          error:
            "The payment reference could not be confirmed. Please contact support.",
        };
      }

      if (verification.status === "success") {
        if (
          verification.amount !== toKobo(Number(pendingTransaction.amount)) ||
          verification.currency.toUpperCase() !==
            pendingTransaction.currency.toUpperCase()
        ) {
          return {
            error:
              "The earlier payment amount could not be confirmed. Please contact support.",
          };
        }

        const { error: reconciliationError } = await admin.rpc(
          "reconcile_paystack_payment",
          {
            p_transaction_id: pendingTransaction.id,
            p_reference: pendingReference,
            p_verified_at: verification.paid_at
              ? new Date(verification.paid_at).toISOString()
              : new Date().toISOString(),
            p_metadata: {
              paystack_status: verification.status,
              gateway_response: verification.gateway_response,
              channel: verification.channel,
              verified_by: "initializeJobPayment",
            },
          },
        );

        if (reconciliationError) {
          console.error(
            "Existing payment reconciliation failed:",
            reconciliationError,
          );
          return {
            error:
              "Your earlier payment may have succeeded, but confirmation is incomplete. Please contact support before paying again.",
          };
        }

        return {
          error:
            "Your earlier payment has been verified. Refresh your payment page to check the remaining balance before continuing.",
        };
      }

      // Only explicitly failed or abandoned attempts may be retired here.
      if (
        verification.status !== "failed" &&
        verification.status !== "abandoned"
      ) {
        return {
          error:
            "Your earlier payment is still being processed. Please wait before trying again.",
        };
      }

      const { error: retireError } = await admin
        .from("payment_transactions")
        .update({
          status: "failed",
          metadata: {
            ...metadata,
            paystack_status: verification.status,
            resolved_before_retry: true,
          },
        })
        .eq("id", pendingTransaction.id)
        .eq("status", "pending");

      if (retireError) {
        console.error("Failed to resolve old transaction:", retireError);
        return {
          error:
            "Unable to safely resolve the earlier attempt. Please try again later.",
        };
      }
    }

    const reference = `EH-${crypto.randomUUID().replaceAll("-", "")}`;

    // Insert a pending attempt first. It is not considered paid until verified.
    const { data: transaction, error: createTransactionError } = await admin
      .from("payment_transactions")

      .insert({
        payment_id: paymentId,
        transaction_type: transactionType,
        amount: amountDue,
        currency,
        status: "pending",
        provider: "paystack",
        provider_reference: reference,
        metadata: {
          job_id: job.id,
          customer_id: user.id,
          payment_purpose:
            job.payment_plan === "deposit_balance"
              ? amountAlreadyPaid <
                (job.upfront_amount != null
                  ? roundNaira(Number(job.upfront_amount))
                  : roundNaira(
                      (totalAmount * Number(job.deposit_percentage)) / 100,
                    ))
                ? "deposit"
                : "balance"
              : "full",
        },
      })
      .select("id")
      .single();

    if (createTransactionError || !transaction) {
      console.error(
        "Transaction attempt creation failed:",
        createTransactionError,
      );

      // Another request may have created the pending checkout first.
      if (createTransactionError?.code === "23505") {
        return {
          error:
            "A payment attempt is already being prepared. Refresh the page in a moment before trying again.",
        };
      }

      return {
        error: "Unable to start your payment. Please try again.",
      };
    }

    let checkoutInitialized = false;

    try {
      const checkout = await initializePaystackTransaction({
        email: user.email,
        amountInKobo: toKobo(amountDue),
        currency,
        reference,
        callbackUrl,
      });

      checkoutInitialized = true;

      if (checkout.reference !== reference) {
        throw new Error("Paystack returned an unexpected reference.");
      }

      const { data: currentTransaction, error: metadataLookupError } =
        await admin
          .from("payment_transactions")
          .select("metadata")
          .eq("id", transaction.id)
          .single();

      if (metadataLookupError || !currentTransaction) {
        console.error("Checkout metadata lookup failed:", metadataLookupError);
        throw new Error("Unable to load checkout metadata.");
      }

      const { error: metadataError } = await admin
        .from("payment_transactions")
        .update({
          metadata: {
            ...(currentTransaction.metadata &&
            typeof currentTransaction.metadata === "object" &&
            !Array.isArray(currentTransaction.metadata)
              ? currentTransaction.metadata
              : {}),
            authorization_url: checkout.authorization_url,
            access_code: checkout.access_code,
          },
        })
        .eq("id", transaction.id)
        .eq("status", "pending");

      if (metadataError) {
        console.error("Checkout metadata update failed:", metadataError);
        throw new Error("Unable to save checkout details.");
      }

      return {
        authorizationUrl: checkout.authorization_url,
        reference,
      };
    } catch (error) {
      console.error("Paystack checkout handling failed:", error);

      // Paystack may already have created a usable transaction.
      // Keep it pending so it can be verified or recovered safely.
      if (checkoutInitialized) {
        return {
          error:
            "Paystack started the checkout, but we couldn't save its details. Please don't pay again yet. Refresh the page or contact support.",
        };
      }

      // Only mark failed when initialization itself did not succeed.
      const { error: failureUpdateError } = await admin
        .from("payment_transactions")
        .update({
          status: "failed",
          metadata: {
            job_id: job.id,
            customer_id: user.id,
            initialization_failed: true,
          },
        })
        .eq("id", transaction.id)
        .eq("status", "pending");

      if (failureUpdateError) {
        console.error(
          "Failed to record initialization failure:",
          failureUpdateError,
        );
      }

      return {
        error: "Paystack couldn't start checkout. Please try again.",
      };
    }
  } catch (error) {
    console.error("Initialize job payment error:", error);
    return { error: "Unable to initialize payment. Please try again." };
  }
}

export type VerifyPaymentResult = {
  success?: string;
  error?: string;
};

export async function verifyJobPayment(
  reference: string,
): Promise<VerifyPaymentResult> {
  try {
    if (
      typeof reference !== "string" ||
      !/^EH-[a-f0-9]{32}$/i.test(reference)
    ) {
      return { error: "The payment reference is invalid." };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        error: "Please sign in to verify your payment.",
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_active")
      .eq("id", user.id)
      .maybeSingle();

    if (
      !profile ||
      profile.role !== "customer" ||
      profile.is_active === false
    ) {
      return { error: "An active customer account is required." };
    }

    const admin = createAdminClient();

    const { data: transaction, error: transactionError } = await admin
      .from("payment_transactions")
      .select(
        "id, payment_id, amount, currency, status, provider, provider_reference, verified_at",
      )
      .eq("provider_reference", reference)
      .maybeSingle();

    if (transactionError || !transaction) {
      console.error("Payment transaction lookup failed:", transactionError);
      return { error: "We couldn't find this payment attempt." };
    }

    if (
      transaction.provider !== "paystack" ||
      transaction.provider_reference !== reference
    ) {
      return { error: "The payment reference does not match." };
    }

    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .select("id, job_id, customer_id, amount, currency, status")
      .eq("id", transaction.payment_id)
      .maybeSingle();

    if (paymentError || !payment || payment.customer_id !== user.id) {
      return {
        error: "This payment does not belong to your account.",
      };
    }

    if (
      transaction.status !== "pending" &&
      transaction.status !== "successful"
    ) {
      return {
        error:
          "This payment attempt cannot be verified. Please contact support if you were charged.",
      };
    }

    // Always verify against Paystack's API, never the callback URL alone.
    const verified = await verifyPaystackTransaction(reference);

    if (verified.reference !== reference || verified.status !== "success") {
      return {
        error:
          verified.status === "failed"
            ? "Paystack reports that this payment failed. If you were charged, contact support."
            : "Paystack has not confirmed this payment yet. Please try again shortly.",
      };
    }

    const expectedKobo = Math.round(Number(transaction.amount) * 100);
    const expectedCurrency = transaction.currency.toUpperCase();

    if (
      !Number.isSafeInteger(expectedKobo) ||
      expectedKobo <= 0 ||
      verified.amount !== expectedKobo ||
      verified.currency.toUpperCase() !== expectedCurrency ||
      payment.currency.toUpperCase() !== expectedCurrency
    ) {
      console.error("Paystack verification mismatch:", {
        reference,
        expectedKobo,
        receivedAmount: verified.amount,
        expectedCurrency,
        receivedCurrency: verified.currency,
      });

      return {
        error:
          "The verified payment details don't match our records. Please contact support.",
      };
    }

    // Reconcile the verified charge atomically in PostgreSQL.
    // This RPC locks the payment summary, prevents overpayment,
    // preserves existing transaction metadata, and marks the payment
    // summary paid only when the complete agreed amount is verified.
    const { data: reconciliation, error: reconciliationError } =
      await admin.rpc("reconcile_paystack_payment", {
        p_transaction_id: transaction.id,
        p_reference: reference,
        p_verified_at: verified.paid_at ?? new Date().toISOString(),
        p_metadata: {
          verified_by: "paystack_api",
          paystack_transaction_id: verified.id,
          paystack_channel: verified.channel,
          paystack_paid_at: verified.paid_at,
          gateway_response: verified.gateway_response,
        },
      });

    if (reconciliationError || !reconciliation) {
      console.error("Payment reconciliation failed:", {
        reference,
        jobId: payment.job_id,
        error: reconciliationError,
      });

      return {
        error:
          "Paystack confirmed your payment, but we couldn't safely finalize our records. Please contact support before paying again.",
      };
    }

    // The RPC returns JSON, so validate the values before using them.
    const result = reconciliation as {
      payment_complete?: boolean;
      verified_total?: number | string;
      full_amount?: number | string;
    };

    const totalVerified = Number(result.verified_total);
    const fullJobAmount = Number(result.full_amount);

    if (
      typeof result.payment_complete !== "boolean" ||
      !Number.isFinite(totalVerified) ||
      !Number.isFinite(fullJobAmount) ||
      fullJobAmount <= 0 ||
      totalVerified < 0 ||
      totalVerified > fullJobAmount
    ) {
      console.error("Unexpected payment reconciliation result:", {
        reference,
        reconciliation,
      });

      return {
        error:
          "Your payment was verified, but its final status needs review. Please contact support.",
      };
    }

    if (result.payment_complete) {
      return { success: "Your job has been paid in full." };
    }

    // A verified deposit or partial payment must not mark the full job paid.
    const remainingBalance =
      Math.round((fullJobAmount - totalVerified + Number.EPSILON) * 100) / 100;

    return {
      success: `Payment of ${expectedCurrency} ${Number(transaction.amount).toFixed(2)} verified. Your remaining balance is ${expectedCurrency} ${remainingBalance.toFixed(2)}.`,
    };
  } catch (error) {
    console.error("Verify job payment error:", error);

    return {
      error:
        "Unable to verify the payment right now. Please try again shortly.",
    };
  }
}

// export async function verifyJobPayment(
//   reference: string,
// ): Promise<VerifyPaymentResult> {
//   try {
//     if (
//       typeof reference !== "string" ||
//       !/^EH-[a-f0-9]{32}$/i.test(reference)
//     ) {
//       return { error: "The payment reference is invalid." };
//     }

//     const supabase = await createClient();

//     const {
//       data: { user },
//       error: authError,
//     } = await supabase.auth.getUser();

//     if (authError || !user) {
//       return {
//         error: "Please sign in to verify your payment.",
//       };
//     }

//     const { data: profile } = await supabase
//       .from("profiles")
//       .select("role, is_active")
//       .eq("id", user.id)
//       .maybeSingle();

//     if (
//       !profile ||
//       profile.role !== "customer" ||
//       profile.is_active === false
//     ) {
//       return { error: "An active customer account is required." };
//     }

//     const admin = createAdminClient();

//     const { data: transaction, error: transactionError } = await admin
//       .from("payment_transactions")
//       .select(
//         "id, payment_id, amount, currency, status, provider, provider_reference, verified_at",
//       )
//       .eq("provider_reference", reference)
//       .maybeSingle();

//     if (transactionError || !transaction) {
//       console.error("Payment transaction lookup failed:", transactionError);
//       return { error: "We couldn't find this payment attempt." };
//     }

//     if (
//       transaction.provider !== "paystack" ||
//       transaction.provider_reference !== reference
//     ) {
//       return { error: "The payment reference does not match." };
//     }

//     const { data: payment, error: paymentError } = await admin
//       .from("payments")
//       .select("id, job_id, customer_id, amount, currency, status")
//       .eq("id", transaction.payment_id)
//       .maybeSingle();

//     if (paymentError || !payment || payment.customer_id !== user.id) {
//       return {
//         error: "This payment does not belong to your account.",
//       };
//     }

//     if (
//       transaction.status !== "pending" &&
//       transaction.status !== "successful"
//     ) {
//       return {
//         error:
//           "This payment attempt cannot be verified. Please contact support if you were charged.",
//       };
//     }

//     // Always verify against Paystack's API, never the callback URL alone.
//     const verified = await verifyPaystackTransaction(reference);

//     if (verified.reference !== reference || verified.status !== "success") {
//       return {
//         error:
//           verified.status === "failed"
//             ? "Paystack reports that this payment failed. If you were charged, contact support."
//             : "Paystack has not confirmed this payment yet. Please try again shortly.",
//       };
//     }

//     const expectedKobo = Math.round(Number(transaction.amount) * 100);
//     const expectedCurrency = transaction.currency.toUpperCase();

//     if (
//       !Number.isSafeInteger(expectedKobo) ||
//       expectedKobo <= 0 ||
//       verified.amount !== expectedKobo ||
//       verified.currency.toUpperCase() !== expectedCurrency ||
//       payment.currency.toUpperCase() !== expectedCurrency
//     ) {
//       console.error("Paystack verification mismatch:", {
//         reference,
//         expectedKobo,
//         receivedAmount: verified.amount,
//         expectedCurrency,
//         receivedCurrency: verified.currency,
//       });

//       return {
//         error:
//           "The verified payment details don't match our records. Please contact support.",
//       };
//     }

//     if (transaction.status !== "successful" || !transaction.verified_at) {
//       const { data: updatedRows, error: updateError } = await admin
//         .from("payment_transactions")
//         .update({
//           status: "successful",
//           verified_at: new Date().toISOString(),
//           metadata: {
//             verified_by: "paystack_api",
//             paystack_transaction_id: verified.id,
//             paystack_channel: verified.channel,
//             paystack_paid_at: verified.paid_at,
//             gateway_response: verified.gateway_response,
//           },
//         })
//         .eq("id", transaction.id)
//         .eq("status", "pending")
//         .select("id");

//       if (updateError) {
//         console.error("Verified transaction update failed:", updateError);
//         return {
//           error:
//             "Payment was confirmed by Paystack, but we couldn't update our records. Please contact support before paying again.",
//         };
//       }

//       // If another request changed the record first, re-read it.
//       if (!updatedRows?.length) {
//         const { data: latest } = await admin
//           .from("payment_transactions")
//           .select("status, verified_at")
//           .eq("id", transaction.id)
//           .maybeSingle();

//         if (latest?.status !== "successful" || !latest.verified_at) {
//           return {
//             error:
//               "We couldn't safely finalize this payment. Please contact support.",
//           };
//         }
//       }
//     }

//     const { data: paidTransactions, error: paidTransactionsError } = await admin
//       .from("payment_transactions")
//       .select("amount, currency")
//       .eq("payment_id", payment.id)
//       //   .eq("status", "paid")
//       .eq("status", "successful")
//       .not("verified_at", "is", null);

//     if (paidTransactionsError) {
//       console.error(
//         "Paid transaction reconciliation failed:",
//         paidTransactionsError,
//       );
//       return {
//         error:
//           "Your payment was verified, but the final payment status could not be calculated. Please contact support.",
//       };
//     }

//     let totalVerified = 0;

//     for (const item of paidTransactions ?? []) {
//       if (item.currency.toUpperCase() !== expectedCurrency) {
//         return {
//           error:
//             "Payment records have a currency mismatch. Please contact support.",
//         };
//       }

//       totalVerified =
//         Math.round(
//           (totalVerified + Number(item.amount) + Number.EPSILON) * 100,
//         ) / 100;
//     }

//     const fullJobAmount = Number(payment.amount);

//     if (
//       !Number.isFinite(fullJobAmount) ||
//       fullJobAmount <= 0 ||
//       !Number.isFinite(totalVerified) ||
//       totalVerified > fullJobAmount
//     ) {
//       console.error("Payment total needs reconciliation:", {
//         jobId: payment.job_id,
//         totalVerified,
//         fullJobAmount,
//       });

//       return {
//         error:
//           "Your payment needs a reconciliation check. Please contact support.",
//       };
//     }

//     if (totalVerified === fullJobAmount) {
//       const { error: summaryError } = await admin
//         .from("payments")
//         .update({
//           status: "paid",
//           provider: "paystack",
//           provider_reference: reference,
//           paid_at: verified.paid_at ?? new Date().toISOString(),
//         })
//         .eq("id", payment.id)
//         .eq("customer_id", user.id);

//       if (summaryError) {
//         console.error("Payment summary update failed:", summaryError);
//         return {
//           error:
//             "Your payment was verified, but the final payment status could not be saved. Please contact support.",
//         };
//       }

//       return { success: "Your job has been paid in full." };
//     }

//     // A verified deposit or partial payment must not mark the full job paid.
//     return {
//       success: `Payment of ${expectedCurrency} ${Number(transaction.amount).toFixed(2)} verified. Your remaining balance is ${expectedCurrency} ${(fullJobAmount - totalVerified).toFixed(2)}.`,
//     };
//   } catch (error) {
//     console.error("Verify job payment error:", error);

//     return {
//       error:
//         "Unable to verify the payment right now. Please try again shortly.",
//     };
//   }
// }
