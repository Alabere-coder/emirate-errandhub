import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/email/send-notification-email";

type PaymentNotificationInput = {
  transactionId: string;
  paymentComplete: boolean;
  verifiedTotal: number;
  fullAmount: number;
};

type DeliveryRecord = {
  id: string;
  transaction_id: string;
  recipient_id: string;
  notification_type: string;
  title: string;
  message: string;
  link: string | null;
  in_app_status: string;
  email_status: string;
};

function roundNaira(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function getPaymentMessage(
  currency: string,
  transactionAmount: number,
  remainingBalance: number,
  paymentComplete: boolean,
) {
  return paymentComplete
    ? `Your payment of ${currency} ${transactionAmount.toFixed(2)} has been verified. Your job is now fully paid.`
    : `Your payment of ${currency} ${transactionAmount.toFixed(2)} has been verified. Your remaining balance is ${currency} ${remainingBalance.toFixed(2)}.`;
}

async function processInAppDelivery(
  admin: ReturnType<typeof createAdminClient>,
  delivery: DeliveryRecord,
) {
  const { data: claimed, error: claimError } = await admin.rpc(
    "claim_payment_notification_delivery",
    { p_delivery_id: delivery.id },
  );

  if (claimError) {
    console.error("Payment in-app notification claim failed:", claimError);
    return;
  }

  if (!claimed?.length) {
    return;
  }

  const { error: insertError } = await admin.from("notifications").insert({
    user_id: delivery.recipient_id,
    type: delivery.notification_type,
    title: delivery.title,
    message: delivery.message,
    link: delivery.link,
  });

  if (insertError) {
    console.error("Payment in-app notification insert failed:", insertError);

    const { error: updateError } = await admin
      .from("payment_notification_deliveries")
      .update({ in_app_status: "failed" })
      .eq("id", delivery.id)
      .eq("in_app_status", "processing");

    if (updateError) {
      console.error(
        "Payment in-app delivery failure status update failed:",
        updateError,
      );
    }

    return;
  }

  const { error: updateError } = await admin
    .from("payment_notification_deliveries")
    .update({ in_app_status: "sent" })
    .eq("id", delivery.id)
    .eq("in_app_status", "processing");

  if (updateError) {
    console.error(
      "Payment in-app delivery success status update failed:",
      updateError,
    );
  }
}

async function processEmailDelivery(
  admin: ReturnType<typeof createAdminClient>,
  delivery: DeliveryRecord,
) {
  if (delivery.email_status === "skipped" || delivery.email_status === "sent") {
    return;
  }

  const {
    data: { user },
    error: userError,
  } = await admin.auth.admin.getUserById(delivery.recipient_id);

  if (userError) {
    console.error("Payment notification recipient lookup failed:", userError);
    return;
  }

  const email = user?.email;

  if (!email) {
    const { error } = await admin
      .from("payment_notification_deliveries")
      .update({
        email_status: "skipped",
        last_email_error: "Recipient does not have an email address.",
      })
      .eq("id", delivery.id);

    if (error) {
      console.error("Could not skip payment notification email:", error);
    }

    return;
  }

  const { data: claimed, error: claimError } = await admin.rpc(
    "claim_payment_notification_email",
    { p_delivery_id: delivery.id },
  );

  if (claimError) {
    console.error("Payment email notification claim failed:", claimError);
    return;
  }

  if (!claimed?.length) {
    return;
  }

  const result = await sendNotificationEmail({
    to: email,
    title: delivery.title,
    message: delivery.message,
    link: delivery.link,
  });

  if (!result.success) {
    const { error: updateError } = await admin
      .from("payment_notification_deliveries")
      .update({
        email_status: "failed",
        last_email_error: result.error,
      })
      .eq("id", delivery.id)
      .eq("email_status", "processing");

    if (updateError) {
      console.error("Payment email failure status update failed:", updateError);
    }

    return;
  }

  const { error: updateError } = await admin
    .from("payment_notification_deliveries")
    .update({
      email_status: "sent",
      email_sent_at: new Date().toISOString(),
      last_email_error: null,
    })
    .eq("id", delivery.id)
    .eq("email_status", "processing");

  if (updateError) {
    console.error("Payment email success status update failed:", updateError);
  }
}

export async function deliverPaymentNotifications({
  transactionId,
  paymentComplete,
  verifiedTotal,
  fullAmount,
}: PaymentNotificationInput) {
  const admin = createAdminClient();

  // Load the verified transaction.
  const { data: transaction, error: transactionError } = await admin
    .from("payment_transactions")
    .select("id, payment_id, amount, currency, status")
    .eq("id", transactionId)
    .maybeSingle();

  if (transactionError || !transaction) {
    console.error(
      "Could not load payment transaction for notifications:",
      transactionError,
    );
    return;
  }

  if (transaction.status !== "successful") {
    console.warn(
      "Payment notifications skipped because the transaction is not successful:",
      transactionId,
    );
    return;
  }

  // Load the associated payment.
  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .select("id, customer_id, job_id, amount, currency")
    .eq("id", transaction.payment_id)
    .maybeSingle();

  if (paymentError || !payment) {
    console.error("Could not load payment for notifications:", paymentError);
    return;
  }

  // Find active administrators who should receive payment notifications.
  const { data: administrators, error: administratorsError } = await admin
    .from("profiles")
    .select("id")
    .in("role", ["admin", "super_admin"])
    .eq("is_active", true);

  if (administratorsError) {
    console.error(
      "Could not load payment notification administrators:",
      administratorsError,
    );
    return;
  }

  const currency = payment.currency || transaction.currency;
  const transactionAmount = Number(transaction.amount);
  const safeFullAmount = Number(fullAmount);
  const safeVerifiedTotal = Number(verifiedTotal);

  if (
    !Number.isFinite(transactionAmount) ||
    !Number.isFinite(safeFullAmount) ||
    !Number.isFinite(safeVerifiedTotal)
  ) {
    console.error("Invalid payment notification amounts:", transactionId);
    return;
  }

  const remainingBalance = roundNaira(
    Math.max(0, safeFullAmount - safeVerifiedTotal),
  );

  const customerMessage = getPaymentMessage(
    currency,
    transactionAmount,
    remainingBalance,
    paymentComplete,
  );

  const adminMessage = paymentComplete
    ? `A customer has completed payment of ${currency} ${safeVerifiedTotal.toFixed(2)} for job ${payment.job_id}.`
    : `A customer has made a payment of ${currency} ${transactionAmount.toFixed(2)} for job ${payment.job_id}. Remaining balance: ${currency} ${remainingBalance.toFixed(2)}.`;

  const recipients = [
    {
      userId: payment.customer_id,
      title: "Payment received successfully",
      message: customerMessage,
    },
    ...(administrators ?? [])
      .filter((administrator) => administrator.id !== payment.customer_id)
      .map((administrator) => ({
        userId: administrator.id,
        title: paymentComplete
          ? "Customer payment completed"
          : "Customer payment received",
        message: adminMessage,
      })),
  ];

  const deliveryRows = recipients.map((recipient) => ({
    transaction_id: transaction.id,
    recipient_id: recipient.userId,
    notification_type: "payment_successful",
    title: recipient.title,
    message: recipient.message,
    link: "/dashboard/customer/jobs",
  }));

  // Insert missing delivery records without replacing existing records.
  const { error: upsertError } = await admin
    .from("payment_notification_deliveries")
    .upsert(deliveryRows, {
      onConflict: "transaction_id,recipient_id,notification_type",
      ignoreDuplicates: true,
    });

  if (upsertError) {
    console.error(
      "Could not create payment notification delivery records:",
      upsertError,
    );
    return;
  }

  // Load both newly created and previously existing delivery records.
  const recipientIds = recipients.map((recipient) => recipient.userId);

  const { data: deliveries, error: deliveriesError } = await admin
    .from("payment_notification_deliveries")
    .select(
      "id, transaction_id, recipient_id, notification_type, title, message, link, in_app_status, email_status",
    )
    .eq("transaction_id", transaction.id)
    .eq("notification_type", "payment_successful")
    .in("recipient_id", recipientIds);

  if (deliveriesError || !deliveries) {
    console.error(
      "Could not load payment notification deliveries:",
      deliveriesError,
    );
    return;
  }

  // Process each recipient independently so one failure does not
  // prevent other recipients from receiving their notifications.
  for (const delivery of deliveries as DeliveryRecord[]) {
    await processInAppDelivery(admin, delivery);
    await processEmailDelivery(admin, delivery);
  }
}

export async function retryPendingPaymentNotificationEmails() {
  const admin = createAdminClient();

  const staleBefore = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const { data: deliveries, error } = await admin
    .from("payment_notification_deliveries")
    .select(
      "id, transaction_id, recipient_id, notification_type, title, message, link, in_app_status, email_status, email_claimed_at",
    )
    .in("email_status", ["pending", "failed", "processing"])
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("Could not load payment emails for retry:", error);
    return;
  }

  for (const delivery of deliveries ?? []) {
    if (
      delivery.email_status === "processing" &&
      (!delivery.email_claimed_at || delivery.email_claimed_at >= staleBefore)
    ) {
      continue;
    }

    try {
      await processEmailDelivery(admin, delivery);
    } catch (retryError) {
      console.error("Payment email retry failed:", delivery.id, retryError);
    }
  }
}
