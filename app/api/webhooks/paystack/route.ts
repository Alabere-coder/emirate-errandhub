import { NextResponse } from "next/server";

import {
  verifyPaystackTransaction,
  verifyPaystackWebhookSignature,
} from "@/lib/payments/paystack";

// import { createNotification } from "@/lib/notifications/create-notification";
import { deliverPaymentNotifications } from "@/lib/notifications/payment-notification-delivery";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaystackWebhookEvent = {
  event?: string;
  data?: {
    reference?: string;
  };
};

type ReconciliationResult = {
  first_verification?: boolean;
  payment_complete?: boolean;
  verified_total?: number | string;
  full_amount?: number | string;
};

export async function POST(request: Request) {
  try {
    // Read the exact raw body before parsing JSON.
    const rawBody = await request.text();

    const signature = request.headers.get("x-paystack-signature");

    if (!verifyPaystackWebhookSignature(rawBody, signature)) {
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 },
      );
    }

    let event: PaystackWebhookEvent;

    try {
      event = JSON.parse(rawBody) as PaystackWebhookEvent;
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON payload" },
        { status: 400 },
      );
    }

    // We only reconcile successful charges here.
    if (event.event !== "charge.success") {
      return NextResponse.json({ received: true });
    }

    const reference = event.data?.reference;

    if (!reference) {
      return NextResponse.json(
        { error: "Missing transaction reference" },
        { status: 400 },
      );
    }

    // Independently verify the transaction with Paystack.
    const verified = await verifyPaystackTransaction(reference);

    if (verified.status !== "success" || verified.reference !== reference) {
      return NextResponse.json(
        { error: "Transaction verification failed" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Find the matching transaction in our database.
    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .select("id, payment_id, amount, currency")
      .eq("provider", "paystack")
      .eq("provider_reference", reference)
      .maybeSingle();

    if (transactionError) {
      console.error(
        "Paystack webhook transaction lookup failed:",
        transactionError,
      );

      return NextResponse.json(
        { error: "Transaction lookup failed" },
        { status: 500 },
      );
    }

    if (!transaction) {
      // A transaction not found in our database cannot be reconciled.
      // Return success to prevent repeated delivery of an unrelated event.
      console.warn("Paystack webhook reference not found:", reference);

      return NextResponse.json({ received: true });
    }

    // Validate the Paystack amount and currency against our transaction.
    const expectedAmount = Math.round(Number(transaction.amount) * 100);

    if (
      !Number.isSafeInteger(expectedAmount) ||
      expectedAmount <= 0 ||
      verified.amount !== expectedAmount ||
      verified.currency?.toUpperCase() !== transaction.currency?.toUpperCase()
    ) {
      console.error("Paystack webhook amount or currency mismatch:", {
        reference,
        expectedAmount,
        receivedAmount: verified.amount,
        expectedCurrency: transaction.currency,
        receivedCurrency: verified.currency,
      });

      return NextResponse.json(
        { error: "Transaction amount or currency mismatch" },
        { status: 400 },
      );
    }

    // Retrieve the payment details needed for the notification.
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("customer_id, amount, currency")
      .eq("id", transaction.payment_id)
      .maybeSingle();

    if (paymentError) {
      console.error("Paystack webhook payment lookup failed:", paymentError);

      return NextResponse.json(
        { error: "Payment lookup failed" },
        { status: 500 },
      );
    }

    if (!payment) {
      console.error(
        "Payment record not found for transaction:",
        transaction.id,
      );

      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 500 },
      );
    }

    // Reconcile the payment atomically.
    const { data: reconciliation, error: reconciliationError } =
      await supabase.rpc("reconcile_paystack_payment", {
        p_transaction_id: transaction.id,
        p_reference: reference,
        p_verified_at: verified.paid_at ?? new Date().toISOString(),
        p_metadata: {
          source: "paystack_webhook",
          event: event.event,
          channel: verified.channel,
          gateway_response: verified.gateway_response,
          paystack_transaction_id: verified.id,
        },
      });

    if (reconciliationError) {
      console.error(
        "Paystack webhook reconciliation failed:",
        reconciliationError,
      );

      return NextResponse.json(
        { error: "Payment reconciliation failed" },
        { status: 500 },
      );
    }

    // const result = reconciliation as ReconciliationResult;

    // Only the first successful reconciliation sends the notification.
    // The RPC locks the transaction and supplies this flag atomically.
    // if (result?.first_verification === true) {
    //   const currency = payment.currency;
    //   const verifiedTotal = Number(result.verified_total ?? 0);
    //   const fullAmount = Number(result.full_amount ?? payment.amount);

    //   const remainingBalance = Math.max(
    //     0,
    //     Math.round((fullAmount - verifiedTotal + Number.EPSILON) * 100) / 100,
    //   );

    //   const paymentComplete = result.payment_complete === true;

    //   await createNotification({
    //     userId: payment.customer_id,
    //     type: "payment_successful",
    //     title: "Payment received successfully",
    //     message: paymentComplete
    //       ? `Your payment of ${currency} ${Number(transaction.amount).toFixed(2)} has been verified. Your job is now fully paid.`
    //       : `Your payment of ${currency} ${Number(transaction.amount).toFixed(2)} has been verified. Your remaining balance is ${currency} ${remainingBalance.toFixed(2)}.`,
    //     adminTitle: paymentComplete
    //       ? "Customer payment completed"
    //       : "Customer payment received",
    //     adminMessage: paymentComplete
    //       ? `A customer has completed payment of ${currency} ${verifiedTotal.toFixed(2)} for a job.`
    //       : `A customer has made a payment of ${currency} ${Number(transaction.amount).toFixed(2)}. Remaining balance: ${currency} ${remainingBalance.toFixed(2)}.`,
    //     link: "/dashboard/customer/jobs",
    //     preference: "payment_notifications",
    //   });
    // }

    const result = reconciliation as ReconciliationResult;

    const verifiedTotal = Number(result?.verified_total);
    const fullAmount = Number(result?.full_amount);
    const paymentComplete = result?.payment_complete;

    if (
      typeof paymentComplete !== "boolean" ||
      !Number.isFinite(verifiedTotal) ||
      !Number.isFinite(fullAmount) ||
      fullAmount <= 0 ||
      verifiedTotal < 0 ||
      verifiedTotal > fullAmount
    ) {
      console.error(
        "Unexpected payment reconciliation result:",
        reconciliation,
      );

      return NextResponse.json(
        { error: "Payment reconciliation result is invalid" },
        { status: 500 },
      );
    }

    // Create or resume payment notification deliveries.
    // The delivery table prevents duplicate records and tracks retries.
    try {
      await deliverPaymentNotifications({
        transactionId: transaction.id,
        paymentComplete,
        verifiedTotal,
        fullAmount,
      });
    } catch (notificationError) {
      console.error(
        "Paystack webhook notification delivery failed:",
        notificationError,
      );
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);

    return NextResponse.json(
      { error: "Internal webhook error" },
      { status: 500 },
    );
  }
}

// import { NextResponse } from "next/server";

// import {
//   verifyPaystackTransaction,
//   verifyPaystackWebhookSignature,
// } from "@/lib/payments/paystack";

// import { createAdminClient } from "@/lib/supabase/admin";

// export const runtime = "nodejs";
// export const dynamic = "force-dynamic";

// type PaystackWebhookEvent = {
//   event?: string;
//   data?: {
//     reference?: string;
//   };
// };

// export async function POST(request: Request) {
//   try {
//     // Read the exact raw body before parsing JSON.
//     const rawBody = await request.text();

//     const signature = request.headers.get("x-paystack-signature");

//     if (!verifyPaystackWebhookSignature(rawBody, signature)) {
//       return NextResponse.json(
//         { error: "Invalid webhook signature" },
//         { status: 401 },
//       );
//     }

//     let event: PaystackWebhookEvent;

//     try {
//       event = JSON.parse(rawBody) as PaystackWebhookEvent;
//     } catch {
//       return NextResponse.json(
//         { error: "Invalid JSON payload" },
//         { status: 400 },
//       );
//     }

//     // We only reconcile successful charges here.
//     if (event.event !== "charge.success") {
//       return NextResponse.json({ received: true });
//     }

//     const reference = event.data?.reference;

//     if (!reference) {
//       return NextResponse.json(
//         { error: "Missing transaction reference" },
//         { status: 400 },
//       );
//     }

//     // Independently verify the transaction with Paystack.
//     const verified = await verifyPaystackTransaction(reference);

//     if (verified.status !== "success" || verified.reference !== reference) {
//       return NextResponse.json(
//         { error: "Transaction verification failed" },
//         { status: 400 },
//       );
//     }

//     const supabase = createAdminClient();

//     const { data: transaction, error: transactionError } = await supabase
//       .from("payment_transactions")
//       .select("id")
//       .eq("provider", "paystack")
//       .eq("provider_reference", reference)
//       .maybeSingle();

//     if (transactionError) {
//       console.error(
//         "Paystack webhook transaction lookup failed:",
//         transactionError,
//       );

//       return NextResponse.json(
//         { error: "Transaction lookup failed" },
//         { status: 500 },
//       );
//     }

//     if (!transaction) {
//       // A transaction not found in our database cannot be reconciled.
//       // Return success to prevent repeated delivery of an unrelated event.
//       console.warn("Paystack webhook reference not found:", reference);

//       return NextResponse.json({ received: true });
//     }

//     const { error: reconciliationError } = await supabase.rpc(
//       "reconcile_paystack_payment",
//       {
//         p_transaction_id: transaction.id,
//         p_reference: reference,
//         p_verified_at: verified.paid_at ?? new Date().toISOString(),
//         p_metadata: {
//           source: "paystack_webhook",
//           event: event.event,
//           channel: verified.channel,
//           gateway_response: verified.gateway_response,
//           paystack_transaction_id: verified.id,
//         },
//       },
//     );

//     if (reconciliationError) {
//       console.error(
//         "Paystack webhook reconciliation failed:",
//         reconciliationError,
//       );

//       return NextResponse.json(
//         { error: "Payment reconciliation failed" },
//         { status: 500 },
//       );
//     }

//     return NextResponse.json({ received: true });
//   } catch (error) {
//     console.error("Paystack webhook error:", error);

//     return NextResponse.json(
//       { error: "Internal webhook error" },
//       { status: 500 },
//     );
//   }
// }
