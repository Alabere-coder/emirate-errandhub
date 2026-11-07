"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  initializePaystackTransaction,
  verifyPaystackTransaction,
} from "@/lib/payments/paystack";
// import { createNotification } from "@/lib/notifications/create-notification";
import { deliverPaymentNotifications } from "@/lib/notifications/payment-notification-delivery";

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

// export type JobPaymentSummary = {
//   error?: string;
//   paymentPlan?: "full" | "deposit_balance";
//   totalAmount?: number;
//   amountAlreadyPaid?: number;
//   remainingAmount?: number;
//   depositAmount?: number;
//   depositPaid?: boolean;
// };

export type JobPaymentSummary = {
  error?: string;
  paymentPlan?: "full" | "deposit_balance";

  // Original worker quotation
  originalAmount?: number;

  // Discount applied by the platform
  discountAmount?: number;
  discountCode?: string;

  // Amount the customer must pay
  totalAmount?: number;

  amountAlreadyPaid?: number;
  remainingAmount?: number;
  depositAmount?: number;
  depositPaid?: boolean;
};

export async function getJobPaymentSummary(
  jobId: string,
): Promise<JobPaymentSummary> {
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
      return { error: "Please sign in to view payment details." };
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      // .select(
      //   "id, customer_id, agreed_amount, currency, payment_plan, deposit_percentage, upfront_amount",
      // )
      .select(
        "id, customer_id, agreed_amount, customer_payable_amount, discount_code_id, discount_amount, currency, payment_plan, deposit_percentage, upfront_amount",
      )
      .eq("id", jobId)
      .eq("customer_id", user.id)
      .maybeSingle();

    if (jobError || !job) {
      return { error: "We couldn't find this job in your account." };
    }

    // const totalAmount = Number(job.agreed_amount);
    // const currency = String(job.currency || "").toUpperCase();

    // if (
    //   !Number.isFinite(totalAmount) ||
    //   totalAmount <= 0 ||
    //   currency !== "NGN"
    // ) {
    //   return { error: "This job has an invalid payment amount." };
    // }
    const originalAmount = Number(job.agreed_amount);
    const discountAmount = Number(job.discount_amount);
    const totalAmount = Number(job.customer_payable_amount);
    const currency = String(job.currency || "").toUpperCase();

    if (
      !Number.isFinite(originalAmount) ||
      originalAmount <= 0 ||
      !Number.isFinite(discountAmount) ||
      discountAmount < 0 ||
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0 ||
      roundNaira(originalAmount - discountAmount) !== totalAmount ||
      currency !== "NGN"
    ) {
      return { error: "This job has an invalid payment amount." };
    }

    const admin = createAdminClient();

    let discountCode: string | undefined;

    if (job.discount_code_id) {
      const { data: discount } = await admin
        .from("discount_codes")
        .select("code")
        .eq("id", job.discount_code_id)
        .maybeSingle();

      discountCode = discount?.code ?? undefined;
    }

    const { data: payment, error: paymentError } = await admin
      .from("payments")
      .select("id, customer_id, amount, currency")
      .eq("job_id", job.id)
      .maybeSingle();

    if (paymentError) {
      return { error: "Unable to load payment details." };
    }

    let amountAlreadyPaid = 0;

    if (payment) {
      if (
        payment.customer_id !== user.id ||
        Number(payment.amount) !== totalAmount ||
        payment.currency.toUpperCase() !== currency
      ) {
        return { error: "The payment record needs review." };
      }

      const { data: transactions, error: transactionError } = await admin
        .from("payment_transactions")
        .select("amount, currency")
        .eq("payment_id", payment.id)
        .eq("status", "successful")
        .not("verified_at", "is", null);

      if (transactionError) {
        return { error: "Unable to calculate your remaining balance." };
      }

      for (const transaction of transactions ?? []) {
        if (transaction.currency.toUpperCase() !== currency) {
          return { error: "A payment currency mismatch needs review." };
        }

        amountAlreadyPaid = roundNaira(
          amountAlreadyPaid + Number(transaction.amount),
        );
      }
    }

    const remainingAmount = roundNaira(totalAmount - amountAlreadyPaid);

    if (remainingAmount < 0) {
      return { error: "The payment total needs review." };
    }

    if (job.payment_plan === "full") {
      return {
        paymentPlan: "full",
        originalAmount,
        discountAmount,
        discountCode,
        totalAmount,
        amountAlreadyPaid,
        remainingAmount,
      };
    }

    if (job.payment_plan !== "deposit_balance") {
      return { error: "This job has an unsupported payment plan." };
    }

    const depositAmount =
      job.upfront_amount != null
        ? roundNaira(Number(job.upfront_amount))
        : roundNaira((totalAmount * Number(job.deposit_percentage)) / 100);

    if (
      !Number.isFinite(depositAmount) ||
      depositAmount <= 0 ||
      depositAmount >= totalAmount
    ) {
      return { error: "This job's deposit settings are invalid." };
    }

    return {
      paymentPlan: "deposit_balance",
      originalAmount,
      discountAmount,
      discountCode,
      totalAmount,
      amountAlreadyPaid,
      remainingAmount,
      depositAmount,
      depositPaid: amountAlreadyPaid >= depositAmount,
    };
  } catch (error) {
    console.error("Get job payment summary error:", error);
    return { error: "Unable to load payment details." };
  }
}

export type JobPaymentOption = "full" | "deposit" | "balance";

export async function initializeJobPayment(
  jobId: string,
  paymentOption: JobPaymentOption = "full",
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
        "id, customer_id, agreed_amount, customer_payable_amount, discount_code_id, discount_amount, currency, status, payment_plan, deposit_percentage, upfront_amount",
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

    const originalAmount = Number(job.agreed_amount);
    const discountAmount = Number(job.discount_amount);
    const totalAmount = Number(job.customer_payable_amount);
    const currency = String(job.currency || "").toUpperCase();

    if (
      !Number.isFinite(originalAmount) ||
      originalAmount <= 0 ||
      !Number.isFinite(discountAmount) ||
      discountAmount < 0 ||
      !Number.isFinite(totalAmount) ||
      totalAmount <= 0 ||
      roundNaira(originalAmount - discountAmount) !== totalAmount ||
      currency !== "NGN"
    ) {
      return {
        error:
          "This job has an invalid amount or unsupported payment currency.",
      };
    }

    const admin = createAdminClient();

    // Keep the payment summary at the full customer payable amount.
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

    // Preserve an existing deposit plan after the customer has started paying.
    if (paymentOption === "balance" && job.payment_plan !== "deposit_balance") {
      return {
        error: "A deposit payment plan is required before paying the balance.",
      };
    }

    const hasDiscount = job.discount_code_id !== null || discountAmount > 0;

    const selectedPaymentPlan = hasDiscount
      ? "full"
      : job.payment_plan === "deposit_balance"
        ? "deposit_balance"
        : paymentOption === "deposit"
          ? "deposit_balance"
          : "full";

    // Save the plan securely before starting checkout.
    const { error: planError } = await supabase.rpc("select_job_payment_plan", {
      p_job_id: job.id,
      p_payment_plan: selectedPaymentPlan,
    });

    if (planError) {
      console.error("Payment plan selection failed:", planError);

      return {
        error:
          planError.message ||
          "Unable to save your payment plan. Please try again.",
      };
    }

    let amountDue = remainingAmount;

    let paymentPurpose: "full" | "deposit" | "balance" = "full";

    if (selectedPaymentPlan === "deposit_balance") {
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

      if (paymentOption === "deposit") {
        if (amountAlreadyPaid >= depositAmount) {
          return { error: "Your required deposit has already been paid." };
        }

        amountDue = roundNaira(depositAmount - amountAlreadyPaid);
        paymentPurpose = "deposit";
      } else if (paymentOption === "balance") {
        if (amountAlreadyPaid < depositAmount) {
          return {
            error: "Please pay the required deposit before paying the balance.",
          };
        }

        amountDue = remainingAmount;
        paymentPurpose = "balance";
      } else if (paymentOption === "full") {
        amountDue = remainingAmount;
        paymentPurpose = "full";
      } else {
        return { error: "Invalid payment option." };
      }
    } else if (selectedPaymentPlan === "full") {
      if (paymentOption !== "full") {
        return {
          error: "This job only supports full payment.",
        };
      }

      amountDue = remainingAmount;
      paymentPurpose = "full";
    } else {
      return { error: "This job has an unsupported payment plan." };
    }

    const transactionType = "charge" as const;

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

    // Check the current payment gateway settings before creating a new charge.
    const { data: gatewaySettings, error: gatewaySettingsError } = await admin
      .from("payment_gateway_settings")
      .select("provider, environment, is_enabled")
      .eq("singleton", true)
      .maybeSingle();

    if (gatewaySettingsError) {
      console.error(
        "Payment gateway settings lookup failed:",
        gatewaySettingsError,
      );

      return {
        error: "Unable to verify payment configuration. Please try again.",
      };
    }

    if (!gatewaySettings) {
      return {
        error:
          "Payment gateway has not been configured. Please contact support.",
      };
    }

    if (!gatewaySettings.is_enabled) {
      return {
        error:
          "Online payments are temporarily unavailable. Please try again later.",
      };
    }

    if (gatewaySettings.provider !== "paystack") {
      return {
        error: "The selected payment provider is not yet supported.",
      };
    }

    if (gatewaySettings.environment !== "test") {
      return {
        error: "Live payments are not configured yet. Please contact support.",
      };
    }

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

      if (
        !Number.isFinite(Number(pendingTransaction.amount)) ||
        Number(pendingTransaction.amount) <= 0 ||
        verification.amount !== toKobo(Number(pendingTransaction.amount)) ||
        verification.currency.toUpperCase() !==
          pendingTransaction.currency.toUpperCase()
      ) {
        return {
          error:
            "The earlier payment details could not be confirmed. Please contact support.",
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

        const { data: reconciliation, error: reconciliationError } =
          await admin.rpc("reconcile_paystack_payment", {
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
          });

        if (reconciliationError || !reconciliation) {
          console.error(
            "Existing payment reconciliation failed:",
            reconciliationError,
          );

          return {
            error:
              "Your earlier payment may have succeeded, but confirmation is incomplete. Please contact support before paying again.",
          };
        }

        const result = reconciliation as {
          payment_complete?: boolean;
          verified_total?: number | string;
          full_amount?: number | string;
        };

        const verifiedTotal = Number(result.verified_total);
        const fullAmount = Number(result.full_amount);

        if (
          typeof result.payment_complete !== "boolean" ||
          !Number.isFinite(verifiedTotal) ||
          !Number.isFinite(fullAmount) ||
          fullAmount <= 0 ||
          verifiedTotal < 0 ||
          verifiedTotal > fullAmount
        ) {
          console.error(
            "Unexpected existing payment reconciliation result:",
            reconciliation,
          );

          return {
            error:
              "Your earlier payment was verified, but its final status needs review. Please contact support.",
          };
        }

        try {
          await deliverPaymentNotifications({
            transactionId: pendingTransaction.id,
            paymentComplete: result.payment_complete,
            verifiedTotal,
            fullAmount,
          });
        } catch (notificationError) {
          console.error(
            "Existing payment notification delivery failed:",
            notificationError,
          );
        }

        return {
          error:
            "Your earlier payment has been verified. Refresh your payment page to check the remaining balance before continuing.",
        };

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
        if (
          verification.status === "ongoing" &&
          typeof metadata.authorization_url === "string"
        ) {
          const savedCheckoutUrl = metadata.authorization_url;

          try {
            const checkoutUrl = new URL(savedCheckoutUrl);

            if (
              checkoutUrl.protocol === "https:" &&
              checkoutUrl.hostname === "checkout.paystack.com" &&
              Number(pendingTransaction.amount) === amountDue &&
              pendingTransaction.currency.toUpperCase() === currency
            ) {
              return {
                authorizationUrl: savedCheckoutUrl,
                reference: pendingReference,
              };
            }
          } catch {
            // Invalid saved checkout URL. Do not reuse it.
          }
        }

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
          payment_purpose: paymentPurpose,
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

    if (transaction.status === "failed") {
      return {
        error:
          "This payment attempt was not completed. You can safely start a new payment.",
      };
    }

    if (
      transaction.status !== "pending" &&
      transaction.status !== "successful"
    ) {
      return {
        error:
          "This payment attempt cannot be verified. Please contact support if you believe you were charged.",
      };
    }

    // Always verify against Paystack's API, never the callback URL alone.
    const verified = await verifyPaystackTransaction(reference);

    console.info("Paystack verification diagnostic:", {
      reference,
      status: verified.status,
      amount: verified.amount,
      currency: verified.currency,
      paid_at: verified.paid_at,
      channel: verified.channel,
      gateway_response: verified.gateway_response,
    });

    if (verified.reference !== reference) {
      return {
        error: "The verified payment reference does not match.",
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

    // Paystack explicitly confirmed that this attempt was not completed.
    if (verified.status === "failed" || verified.status === "abandoned") {
      if (transaction.status === "pending") {
        const { data: retiredTransaction, error: retireError } = await admin
          .from("payment_transactions")
          .update({ status: "failed" })
          .eq("id", transaction.id)
          .eq("status", "pending")
          .select("id")
          .maybeSingle();

        if (retireError || !retiredTransaction) {
          console.error(
            "Unable to retire failed Paystack attempt:",
            retireError,
          );

          return {
            error:
              "Paystack confirmed that this attempt was not completed, but its database status could not be updated. Please contact support.",
          };
        }
      }

      return {
        error:
          verified.status === "abandoned"
            ? "This payment attempt was abandoned and has been closed. You can safely start a new payment."
            : "Paystack confirmed that this payment failed. You can safely start a new payment.",
      };
    }

    if (verified.status !== "success") {
      return {
        error:
          "Paystack has not confirmed this payment yet. Please try again shortly.",
      };
    }

    // if (verified.reference !== reference || verified.status !== "success") {
    //   return {
    //     error:
    //       verified.status === "failed"
    //         ? "Paystack reports that this payment failed. If you were charged, contact support."
    //         : "Paystack has not confirmed this payment yet. Please try again shortly.",
    //   };
    // }

    // const expectedKobo = Math.round(Number(transaction.amount) * 100);
    // const expectedCurrency = transaction.currency.toUpperCase();

    // if (
    //   !Number.isSafeInteger(expectedKobo) ||
    //   expectedKobo <= 0 ||
    //   verified.amount !== expectedKobo ||
    //   verified.currency.toUpperCase() !== expectedCurrency ||
    //   payment.currency.toUpperCase() !== expectedCurrency
    // ) {
    //   console.error("Paystack verification mismatch:", {
    //     reference,
    //     expectedKobo,
    //     receivedAmount: verified.amount,
    //     expectedCurrency,
    //     receivedCurrency: verified.currency,
    //   });

    //   return {
    //     error:
    //       "The verified payment details don't match our records. Please contact support.",
    //   };
    // }

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
      first_verification?: boolean;
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

    // Notify the customer only on the first successful verification.

    // Create or resume payment notification deliveries after every
    // successful reconciliation. The delivery table prevents duplicates.
    try {
      await deliverPaymentNotifications({
        transactionId: transaction.id,
        paymentComplete: result.payment_complete,
        verifiedTotal: totalVerified,
        fullAmount: fullJobAmount,
      });
    } catch (notificationError) {
      console.error("Payment notification delivery failed:", notificationError);
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
