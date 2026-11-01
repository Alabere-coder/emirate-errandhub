import { NextResponse } from "next/server";

import {
  verifyPaystackTransaction,
  verifyPaystackWebhookSignature,
} from "@/lib/payments/paystack";

import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PaystackWebhookEvent = {
  event?: string;
  data?: {
    reference?: string;
  };
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

    const { data: transaction, error: transactionError } = await supabase
      .from("payment_transactions")
      .select("id")
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

    const { error: reconciliationError } = await supabase.rpc(
      "reconcile_paystack_payment",
      {
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
      },
    );

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

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Paystack webhook error:", error);

    return NextResponse.json(
      { error: "Internal webhook error" },
      { status: 500 },
    );
  }
}
