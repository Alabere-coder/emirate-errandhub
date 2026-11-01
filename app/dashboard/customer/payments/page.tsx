import Link from "next/link";
import { CreditCard, ReceiptText } from "lucide-react";

import { requireRole } from "@/lib/auth/require-role";
import { getCurrentUser } from "@/lib/auth/get-user";
import { createClient } from "@/lib/supabase/server";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RefundRequestForm from "./refund-request-form";

export const dynamic = "force-dynamic";

type Payment = {
  id: string;
  job_id: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  status: string;
  provider: string | null;
  provider_reference: string | null;
  paid_at: string | null;
  created_at: string;
};

type PaymentTransaction = {
  id: string;
  payment_id: string;
  transaction_type: string;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  provider_reference: string | null;
  verified_at: string | null;
  created_at: string;
};

function formatAmount(amount: number, currency: string) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(date: string | null) {
  if (!date) return "Not available";

  return new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

function statusVariant(status: string) {
  switch (status.toLowerCase()) {
    case "paid":
    case "successful":
      return "default" as const;
    case "pending":
      return "secondary" as const;
    case "failed":
      return "destructive" as const;
    default:
      return "outline" as const;
  }
}

export default async function CustomerPaymentHistoryPage() {
  await requireRole(["customer"]);

  const currentUser = await getCurrentUser();

  if (!currentUser) {
    throw new Error("Unable to load your account.");
  }

  const supabase = await createClient();

  const { data: paymentData, error: paymentError } = await supabase
    .from("payments")
    .select(
      "id, job_id, amount, currency, payment_method, status, provider, provider_reference, paid_at, created_at",
    )
    .eq("customer_id", currentUser.user.id)
    .order("created_at", { ascending: false });

  if (paymentError) {
    console.error("Failed to load payment history:", paymentError);
    throw new Error("Unable to load your payment history.");
  }

  const payments = (paymentData ?? []) as Payment[];

  let transactions: PaymentTransaction[] = [];

  if (payments.length > 0) {
    const paymentIds = payments.map((payment) => payment.id);

    const { data: transactionData, error: transactionError } = await supabase
      .from("payment_transactions")
      .select(
        "id, payment_id, transaction_type, amount, currency, status, provider, provider_reference, verified_at, created_at",
      )
      .in("payment_id", paymentIds)
      .order("created_at", { ascending: false });

    if (transactionError) {
      console.error("Failed to load payment transactions:", transactionError);
      throw new Error("Unable to load payment transaction details.");
    }

    transactions = (transactionData ?? []) as PaymentTransaction[];
  }

  const transactionsByPayment = new Map<string, PaymentTransaction[]>();

  for (const transaction of transactions) {
    const existing = transactionsByPayment.get(transaction.payment_id) ?? [];

    existing.push(transaction);
    transactionsByPayment.set(transaction.payment_id, existing);
  }

  const transactionIds = transactions.map((transaction) => transaction.id);

  let existingRefunds: {
    transaction_id: string;
    amount: number;
    status: string;
  }[] = [];

  if (transactionIds.length > 0) {
    const { data: refundData, error: refundError } = await supabase
      .from("refunds")
      .select("transaction_id, amount, status")
      .in("transaction_id", transactionIds);

    if (refundError) {
      console.error("Failed to load refund requests:", refundError);
      throw new Error("Unable to load refund request details.");
    }

    existingRefunds = (refundData ?? []).map((refund) => ({
      transaction_id: refund.transaction_id,
      amount: Number(refund.amount),
      status: refund.status,
    }));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Payment History</h1>
        <p className="text-muted-foreground">
          View your payments, transaction details, and payment status.
        </p>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <CreditCard className="h-7 w-7 text-muted-foreground" />
            </div>

            <h2 className="text-lg font-semibold">No payments yet</h2>

            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Payments for your jobs will appear here when you make them.
            </p>

            <Link
              href="/dashboard/customer/jobs"
              className="mt-5 text-sm font-medium text-primary hover:underline"
            >
              View my jobs
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-5">
          {payments.map((payment) => {
            const paymentTransactions =
              transactionsByPayment.get(payment.id) ?? [];

            return (
              <Card key={payment.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <ReceiptText className="h-5 w-5 text-muted-foreground" />
                        Payment
                      </CardTitle>

                      <CardDescription>
                        Job reference: {payment.job_id}
                      </CardDescription>
                    </div>

                    <Badge variant={statusVariant(payment.status)}>
                      {payment.status.replaceAll("_", " ")}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Payment amount
                      </p>
                      <p className="font-semibold">
                        {formatAmount(Number(payment.amount), payment.currency)}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Payment provider
                      </p>
                      <p className="font-medium capitalize">
                        {payment.provider ?? "Not available"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm text-muted-foreground">
                        Payment date
                      </p>
                      <p className="font-medium">
                        {formatDate(payment.paid_at ?? payment.created_at)}
                      </p>
                    </div>
                  </div>

                  {payment.provider_reference && (
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Payment reference
                      </p>
                      <p className="break-all font-mono text-xs">
                        {payment.provider_reference}
                      </p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <h3 className="mb-3 font-semibold">Transactions</h3>

                    {paymentTransactions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No transaction details are available.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {paymentTransactions.map((transaction) => {
                          const reservedRefundAmount = existingRefunds
                            .filter(
                              (refund) =>
                                refund.transaction_id === transaction.id &&
                                [
                                  "requested",
                                  "under_review",
                                  "approved",
                                  "processing",
                                  "processed",
                                ].includes(refund.status),
                            )
                            .reduce(
                              (total, refund) => total + refund.amount,
                              0,
                            );

                          const remainingRefundableAmount = Math.max(
                            0,
                            Number(transaction.amount) - reservedRefundAmount,
                          );

                          const canRequestRefund =
                            transaction.transaction_type === "charge" &&
                            transaction.status === "successful" &&
                            transaction.provider === "paystack" &&
                            transaction.verified_at !== null &&
                            remainingRefundableAmount > 0;

                          return (
                            <div
                              key={transaction.id}
                              className="rounded-lg border p-4"
                            >
                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                  <p className="font-medium capitalize">
                                    {transaction.transaction_type.replaceAll(
                                      "_",
                                      " ",
                                    )}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(transaction.created_at)}
                                  </p>
                                </div>

                                <div className="flex items-center gap-3">
                                  <span className="font-semibold">
                                    {formatAmount(
                                      Number(transaction.amount),
                                      transaction.currency,
                                    )}
                                  </span>

                                  <Badge
                                    variant={statusVariant(transaction.status)}
                                  >
                                    {transaction.status.replaceAll("_", " ")}
                                  </Badge>
                                </div>
                              </div>

                              {transaction.provider_reference && (
                                <p className="mt-3 break-all text-xs text-muted-foreground">
                                  Reference: {transaction.provider_reference}
                                </p>
                              )}

                              {transaction.verified_at && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  Verified:{" "}
                                  {formatDate(transaction.verified_at)}
                                </p>
                              )}

                              {canRequestRefund && (
                                <RefundRequestForm
                                  paymentId={payment.id}
                                  transactionId={transaction.id}
                                  transactionAmount={remainingRefundableAmount}
                                  currency={transaction.currency}
                                />
                              )}

                              {!canRequestRefund &&
                                transaction.status === "successful" &&
                                transaction.verified_at !== null &&
                                reservedRefundAmount > 0 && (
                                  <p className="mt-3 text-sm text-muted-foreground">
                                    {remainingRefundableAmount > 0
                                      ? `Remaining refundable amount: ${formatAmount(
                                          remainingRefundableAmount,
                                          transaction.currency,
                                        )}`
                                      : "The full transaction amount is already reserved for refund."}
                                  </p>
                                )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
