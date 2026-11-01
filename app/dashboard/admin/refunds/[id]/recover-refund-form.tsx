"use client";

import { useActionState } from "react";

import {
  recoverPaystackRefundReference,
  type RecoverRefundReferenceState,
} from "./reconcile-refund";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const initialState: RecoverRefundReferenceState = {};

type RecoverRefundFormProps = {
  refundId: string;
  status: string;
  provider: string;
  providerReference: string | null;
};

export function RecoverRefundForm({
  refundId,
  status,
  provider,
  providerReference,
}: RecoverRefundFormProps) {
  const [state, formAction, isPending] = useActionState(
    recoverPaystackRefundReference,
    initialState,
  );

  if (provider !== "paystack" || status !== "processing" || providerReference) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recover missing Paystack refund ID</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          If Paystack created the refund but the application failed to save its
          ID, enter the ID from your Paystack dashboard. The ID will be verified
          before it is saved. This does not initiate another refund.
        </p>

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        {state.success && (
          <p className="text-sm text-green-600">{state.success}</p>
        )}

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="refundId" value={refundId} />

          <div className="space-y-2">
            <label htmlFor="paystackRefundId" className="text-sm font-medium">
              Paystack refund ID
            </label>

            <Input
              id="paystackRefundId"
              name="paystackRefundId"
              inputMode="numeric"
              pattern="[0-9]+"
              placeholder="Enter the refund ID"
              required
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? "Verifying with Paystack..." : "Verify and save ID"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
