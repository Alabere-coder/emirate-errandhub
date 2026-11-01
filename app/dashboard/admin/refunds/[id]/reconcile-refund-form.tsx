"use client";

import { useActionState } from "react";

import {
  reconcilePaystackRefund,
  type ReconcileRefundState,
} from "./reconcile-refund";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialState: ReconcileRefundState = {};

type ReconcileRefundFormProps = {
  refundId: string;
  status: string;
  provider: string;
  providerReference: string | null;
};

export function ReconcileRefundForm({
  refundId,
  status,
  provider,
  providerReference,
}: ReconcileRefundFormProps) {
  const [state, formAction, isPending] = useActionState(
    reconcilePaystackRefund,
    initialState,
  );

  if (provider !== "paystack" || status !== "processing") {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reconcile Paystack refund</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Retrieve the latest refund status from Paystack and compare it with
          the original payment before updating the local record.
        </p>

        {providerReference ? (
          <p className="text-sm">**Paystack refund ID:** {providerReference}</p>
        ) : (
          <p className="text-sm text-destructive">
            No Paystack refund ID is saved. This request requires manual
            reconciliation. Do not retry the refund.
          </p>
        )}

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}

        {state.success && (
          <p className="text-sm text-green-600">{state.success}</p>
        )}

        {providerReference && (
          <form action={formAction}>
            <input type="hidden" name="refundId" value={refundId} />

            <Button type="submit" disabled={isPending}>
              {isPending ? "Checking Paystack..." : "Check refund status"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
