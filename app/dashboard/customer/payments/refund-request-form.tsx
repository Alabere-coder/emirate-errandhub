"use client";

import { useActionState } from "react";
import { requestCustomerRefund, type RefundActionState } from "./actions";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const initialState: RefundActionState = {};

type RefundRequestFormProps = {
  paymentId: string;
  transactionId: string;
  transactionAmount: number;
  currency: string;
};

export default function RefundRequestForm({
  paymentId,
  transactionId,
  transactionAmount,
  currency,
}: RefundRequestFormProps) {
  const [state, formAction, isPending] = useActionState(
    requestCustomerRefund,
    initialState,
  );

  return (
    <form action={formAction} className="mt-4 space-y-4 border-t pt-4">
      <input type="hidden" name="paymentId" value={paymentId} />
      <input type="hidden" name="transactionId" value={transactionId} />

      <div className="space-y-2">
        <Label htmlFor={`refund-amount-${transactionId}`}>
          Refund amount ({currency})
        </Label>
        <Input
          id={`refund-amount-${transactionId}`}
          name="amount"
          type="number"
          min="0.01"
          max={transactionAmount}
          step="0.01"
          placeholder="Enter amount"
          required
        />
        <p className="text-xs text-muted-foreground">
          Maximum original transaction amount:{" "}
          {new Intl.NumberFormat("en-NG", {
            style: "currency",
            currency,
          }).format(transactionAmount)}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`refund-reason-${transactionId}`}>
          Reason for refund
        </Label>
        <Textarea
          id={`refund-reason-${transactionId}`}
          name="reason"
          placeholder="Explain why you are requesting a refund..."
          minLength={5}
          maxLength={2000}
          required
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="text-sm text-green-600">
          {state.success}
        </p>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? "Submitting..." : "Submit Refund Request"}
      </Button>
    </form>
  );
}
