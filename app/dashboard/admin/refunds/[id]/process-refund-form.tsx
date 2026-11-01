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
          className="space-y-4"
        >
          <input type="hidden" name="refundId" value={refundId} />

          <div>
            <p className="text-sm text-muted-foreground">
              Amount to be refunded
            </p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("en-NG", {
                style: "currency",
                currency,
              }).format(amount)}
            </p>
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          {state.success && (
            <p className="text-sm text-green-600">{state.success}</p>
          )}

          <Button type="submit" variant="default" disabled={isPending}>
            {isPending ? "Contacting Paystack..." : "Initiate Paystack refund"}
          </Button>

          <p className="text-xs text-muted-foreground">
            This action contacts Paystack. Once submitted, an uncertain response
            must be reconciled before any retry. The refund will remain in
            processing until completion is verified.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
