"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole, Wallet } from "lucide-react";

import {
  initializeJobPayment,
  type JobPaymentOption,
  type JobPaymentSummary,
} from "@/lib/actions/payments";

import { Button } from "@/components/ui/button";

type PayJobButtonProps = {
  jobId: string;
  paymentSummary: JobPaymentSummary;
};

const formatNaira = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 2,
  }).format(amount);

export function PayJobButton({ jobId, paymentSummary }: PayJobButtonProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountAlreadyPaid = paymentSummary.amountAlreadyPaid ?? 0;
  const remainingAmount = paymentSummary.remainingAmount ?? 0;
  const depositAmount = paymentSummary.depositAmount ?? 0;

  const depositDue = Math.max(0, depositAmount - amountAlreadyPaid);

  const paymentOptions: {
    value: JobPaymentOption;
    label: string;
    description: string;
    amount: number;
  }[] =
    paymentSummary.paymentPlan === "full"
      ? [
          {
            value: "full",
            label: "Pay in Full",
            description: "Pay the remaining job amount.",
            amount: remainingAmount,
          },
        ]
      : paymentSummary.depositPaid
        ? [
            {
              value: "balance",
              label: "Pay Remaining Balance",
              description: "Your required deposit has been paid.",
              amount: remainingAmount,
            },
          ]
        : [
            {
              value: "deposit",
              label: "Pay Deposit",
              description: "Pay the required upfront amount to proceed.",
              amount: depositDue,
            },
            {
              value: "full",
              label: "Pay in Full",
              description: "Settle the entire outstanding amount now.",
              amount: remainingAmount,
            },
          ];

  const [selectedOption, setSelectedOption] = useState<JobPaymentOption>(
    paymentSummary.paymentPlan === "deposit_balance" &&
      !paymentSummary.depositPaid
      ? "deposit"
      : paymentSummary.paymentPlan === "deposit_balance"
        ? "balance"
        : "full",
  );

  const selectedPayment = paymentOptions.find(
    (option) => option.value === selectedOption,
  );

  async function handlePayment() {
    if (loading || !selectedPayment || selectedPayment.amount <= 0) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await initializeJobPayment(jobId, selectedOption);

      if (result.error) {
        setError(result.error);
        return;
      }

      if (!result.authorizationUrl) {
        setError("Checkout could not be started. Please try again.");
        return;
      }

      window.location.assign(result.authorizationUrl);
    } catch {
      setError("Unable to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (remainingAmount <= 0) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-700">
        Payment complete. No outstanding balance remains.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {paymentOptions.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
              selectedOption === option.value
                ? "border-teal-600 bg-teal-50"
                : "border-slate-200 bg-white hover:border-teal-300"
            }`}
          >
            <input
              type="radio"
              name={`payment-option-${jobId}`}
              value={option.value}
              checked={selectedOption === option.value}
              onChange={() => setSelectedOption(option.value)}
              disabled={loading}
              className="mt-1 h-4 w-4 accent-teal-600"
            />

            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-slate-900">
                  {option.label}
                </span>
                <span className="font-bold text-teal-700">
                  {formatNaira(option.amount)}
                </span>
              </span>
              <span className="mt-1 block text-sm text-slate-500">
                {option.description}
              </span>
            </span>
          </label>
        ))}
      </div>

      <Button
        type="button"
        onClick={handlePayment}
        disabled={loading || !selectedPayment || selectedPayment.amount <= 0}
        className="w-full rounded-xl bg-teal-600 text-white hover:bg-teal-700"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Preparing secure checkout...
          </>
        ) : (
          <>
            <Wallet className="mr-2 h-4 w-4" />
            Continue to Paystack
          </>
        )}
      </Button>

      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <LockKeyhole className="h-3.5 w-3.5" />
        Secure checkout powered by Paystack
      </p>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive"
        >
          {error}
          <button
            type="button"
            onClick={() => router.refresh()}
            className="ml-2 font-semibold underline"
          >
            Refresh
          </button>
        </div>
      )}
    </div>
  );
}
