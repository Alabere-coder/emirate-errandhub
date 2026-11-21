"use client";

import { useActionState } from "react";
import type { FormEvent } from "react";

import {
  processApprovedRefund,
  type ProcessRefundState,
} from "./process-refund";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: ProcessRefundState = {};

type ProcessRefundFormProps = {
  refundId: string;
  status: string;
  amount: number;
  currency: string;
};

export function ProcessRefundForm({
  refundId,
  status,
  amount,
  currency,
}: ProcessRefundFormProps) {
  const [state, formAction, isPending] = useActionState(
    processApprovedRefund,
    initialState,
  );

  if (status !== "approved") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Paystack processing</CardTitle>
        </CardHeader>

        <CardContent>
          <p className="text-sm text-muted-foreground">
            {status === "processing"
              ? "This refund has already entered processing. Do not submit it again."
              : "Only approved refunds can be submitted to Paystack."}
          </p>
        </CardContent>
      </Card>
    );
  }

  function confirmProcessing(event: FormEvent<HTMLFormElement>) {
    const confirmed = window.confirm(
      `You are about to initiate a Paystack refund of ${currency} ${amount.toLocaleString()}. This action may transfer money back to the customer. Continue?`,
    );

    if (!confirmed) {
      event.preventDefault();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Process approved refund</CardTitle>
      </CardHeader>

      <CardContent>
        <form
          action={formAction}
          onSubmit={confirmProcessing}
          className="space-y-5"
        >
          <input type="hidden" name="refundId" value={refundId} />

          <div className="rounded-xl border border-border bg-muted/40 p-4">
            <p className="text-sm text-muted-foreground">
              Amount to be refunded
            </p>

            <p className="mt-1 text-2xl font-bold tracking-tight text-foreground">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency,
              }).format(amount)}
            </p>
          </div>

          {state.error && (
            <div
              role="alert"
              className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
            >
              {state.error}
            </div>
          )}

          {state.success && (
            <div
              role="status"
              className="rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400"
            >
              {state.success}
            </div>
          )}

          <Button
            type="submit"
            variant="default"
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? "Contacting Paystack..." : "Initiate Paystack refund"}
          </Button>

          <div className="flex gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3">
            <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
              This action contacts Paystack. Once submitted, an uncertain
              response must be reconciled before any retry. The refund will
              remain in processing until completion is verified.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
