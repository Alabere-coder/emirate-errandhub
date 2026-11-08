"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LockKeyhole, Wallet, Tag, X } from "lucide-react";

import {
  initializeJobPayment,
  type JobPaymentOption,
  type JobPaymentSummary,
} from "@/lib/actions/payments";

import {
  applyJobDiscountCode,
  removeJobDiscountCode,
} from "@/lib/actions/discounts";

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
  const [applyingDiscount, setApplyingDiscount] = useState(false);
  const [removingDiscount, setRemovingDiscount] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [discountMessage, setDiscountMessage] = useState<string | null>(null);
  const [discountInput, setDiscountInput] = useState("");

  const amountAlreadyPaid = paymentSummary.amountAlreadyPaid ?? 0;
  const remainingAmount = paymentSummary.remainingAmount ?? 0;
  const depositAmount =
    paymentSummary.depositAmount ??
    (paymentSummary.totalAmount ?? paymentSummary.originalAmount ?? 0) * 0.4;

  const originalAmount =
    paymentSummary.originalAmount ?? paymentSummary.totalAmount ?? 0;

  const totalAmount = paymentSummary.totalAmount ?? originalAmount;
  const discountAmount = paymentSummary.discountAmount ?? 0;
  const discountCode = paymentSummary.discountCode;

  const hasDiscount = discountAmount > 0;

  console.log("Job payment summary:", paymentSummary);
  console.log("Payment option conditions:", {
    hasDiscount,
    amountAlreadyPaid,
    paymentPlan: paymentSummary.paymentPlan,
    depositPaid: paymentSummary.depositPaid,
  });

  const depositDue = Math.max(0, depositAmount - amountAlreadyPaid);

  const [selectedOption, setSelectedOption] = useState<JobPaymentOption>(
    paymentSummary.paymentPlan === "deposit_balance"
      ? paymentSummary.depositPaid
        ? "balance"
        : "deposit"
      : "full",
  );

  useEffect(() => {
    if (hasDiscount) {
      setSelectedOption("full");
      return;
    }

    setSelectedOption(
      paymentSummary.paymentPlan === "deposit_balance"
        ? paymentSummary.depositPaid
          ? "balance"
          : "deposit"
        : "full",
    );
  }, [hasDiscount, paymentSummary.paymentPlan, paymentSummary.depositPaid]);

  const paymentOptions: {
    value: JobPaymentOption;
    label: string;
    description: string;
    amount: number;
  }[] = hasDiscount
    ? [
        {
          value: "full",
          label: "Pay in Full",
          description: "Pay the full discounted booking amount.",
          amount: remainingAmount,
        },
      ]
    : paymentSummary.paymentPlan === "deposit_balance" &&
        paymentSummary.depositPaid
      ? [
          {
            value: "balance",
            label: "Pay Remaining Balance",
            description: "Your required deposit has been paid.",
            amount: remainingAmount,
          },
        ]
      : paymentSummary.paymentPlan === "full" && amountAlreadyPaid > 0
        ? [
            {
              value: "full",
              label: "Pay in Full",
              description: "Pay the remaining job amount.",
              amount: remainingAmount,
            },
          ]
        : [
            {
              value: "deposit",
              label: "Pay 40% Deposit",
              description: "Pay 40% upfront and the remaining 60% later.",
              amount: depositDue,
            },
            {
              value: "full",
              label: "Pay in Full",
              description: "Settle the entire outstanding amount now.",
              amount: remainingAmount,
            },
          ];

  const selectedPayment = paymentOptions.find(
    (option) => option.value === selectedOption,
  );

  console.log("Available payment options:", paymentOptions);
  console.log("Selected option:", selectedOption);
  console.log("Selected payment:", selectedPayment);

  async function handleApplyDiscount() {
    if (applyingDiscount || removingDiscount || !discountInput.trim()) {
      return;
    }

    setApplyingDiscount(true);
    setDiscountError(null);
    setDiscountMessage(null);
    setError(null);

    try {
      const result = await applyJobDiscountCode(jobId, discountInput.trim());

      if (!result.success) {
        setDiscountError(result.error || "Unable to apply this discount code.");
        return;
      }

      setDiscountInput("");
      setDiscountMessage(
        `${result.code ?? "Discount code"} applied successfully.`,
      );

      router.refresh();
    } catch {
      setDiscountError(
        "Something went wrong while applying the discount code.",
      );
    } finally {
      setApplyingDiscount(false);
    }
  }

  async function handleRemoveDiscount() {
    if (removingDiscount || applyingDiscount) {
      return;
    }

    setRemovingDiscount(true);
    setDiscountError(null);
    setDiscountMessage(null);
    setError(null);

    try {
      const result = await removeJobDiscountCode(jobId);

      if (!result.success) {
        setDiscountError(result.error || "Unable to remove the discount code.");
        return;
      }

      setDiscountInput("");
      setDiscountMessage("Discount code removed successfully.");

      router.refresh();
    } catch {
      setDiscountError(
        "Something went wrong while removing the discount code.",
      );
    } finally {
      setRemovingDiscount(false);
    }
  }

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
    <div className="space-y-5">
      {/* Discount code */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="mb-3 flex items-center gap-2">
          <Tag className="h-4 w-4 text-teal-600" />
          <h3 className="font-semibold text-slate-900">Promotional discount</h3>
        </div>

        {hasDiscount && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-emerald-800">
                {discountCode || "Discount applied"}
              </p>
              <p className="text-xs text-emerald-700">
                You saved {formatNaira(discountAmount)}
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveDiscount}
              disabled={loading || applyingDiscount || removingDiscount}
              className="shrink-0 border-emerald-300 text-emerald-700 hover:bg-emerald-100"
            >
              {removingDiscount ? (
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
              ) : (
                <X className="mr-1 h-3.5 w-3.5" />
              )}
              Remove
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={discountInput}
            onChange={(event) => {
              setDiscountInput(event.target.value.toUpperCase());
              setDiscountError(null);
              setDiscountMessage(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                handleApplyDiscount();
              }
            }}
            placeholder="Enter discount code"
            disabled={loading || applyingDiscount || removingDiscount}
            maxLength={40}
            className="h-11 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 text-sm uppercase text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-100"
          />

          <Button
            type="button"
            onClick={handleApplyDiscount}
            disabled={
              loading ||
              applyingDiscount ||
              removingDiscount ||
              !discountInput.trim()
            }
            className="h-11 rounded-lg bg-teal-600 text-white hover:bg-teal-700"
          >
            {applyingDiscount ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Applying...
              </>
            ) : (
              "Apply code"
            )}
          </Button>
        </div>

        {discountError && (
          <p role="alert" className="mt-2 text-sm text-destructive">
            {discountError}
          </p>
        )}

        {discountMessage && (
          <p className="mt-2 text-sm font-medium text-emerald-700">
            {discountMessage}
          </p>
        )}
      </div>

      {/* Booking price breakdown */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <h3 className="mb-3 font-semibold text-slate-900">Payment summary</h3>

        <div className="space-y-2 text-sm">
          <div className="flex justify-between gap-3 text-slate-600">
            <span>Original booking amount</span>
            <span className="font-medium text-slate-900">
              {formatNaira(originalAmount)}
            </span>
          </div>

          {hasDiscount && (
            <div className="flex justify-between gap-3 text-emerald-700">
              <span>Discount{discountCode ? ` (${discountCode})` : ""}</span>
              <span className="font-semibold">
                -{formatNaira(discountAmount)}
              </span>
            </div>
          )}

          <div className="border-t border-slate-200 pt-3">
            <div className="flex justify-between gap-3">
              <span className="font-semibold text-slate-900">
                Customer payable amount
              </span>
              <span className="text-lg font-bold text-teal-700">
                {formatNaira(totalAmount)}
              </span>
            </div>
          </div>

          {amountAlreadyPaid > 0 && (
            <>
              <div className="flex justify-between gap-3 text-slate-600">
                <span>Amount already paid</span>
                <span>{formatNaira(amountAlreadyPaid)}</span>
              </div>

              <div className="flex justify-between gap-3 font-semibold text-slate-900">
                <span>Remaining balance</span>
                <span>{formatNaira(remainingAmount)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Payment options */}
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
              disabled={loading || applyingDiscount || removingDiscount}
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

      {/* Paystack checkout */}
      <Button
        type="button"
        onClick={handlePayment}
        disabled={
          loading ||
          applyingDiscount ||
          removingDiscount ||
          !selectedPayment ||
          selectedPayment.amount <= 0
        }
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
