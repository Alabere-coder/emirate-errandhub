"use client";

import { useActionState } from "react";
import { RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

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
        <div className="flex items-center gap-2">
          <RefreshCw className="size-5 text-emerald-600 dark:text-emerald-400" />
          <CardTitle>Reconcile Paystack refund</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Retrieve the latest refund status from Paystack and compare it with
          the original payment before updating the local record.
        </p>

        {providerReference ? (
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-xs font-medium text-muted-foreground">
              Paystack refund ID
            </p>
            <p className="mt-1 break-all text-sm font-medium text-foreground">
              {providerReference}
            </p>
          </div>
        ) : (
          <div className="flex gap-3 rounded-lg border border-destructive/25 bg-destructive/10 p-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
            <p className="text-sm leading-relaxed text-destructive">
              No Paystack refund ID is saved. This request requires manual
              reconciliation. Do not retry the refund.
            </p>
          </div>
        )}

        {state.error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {state.error}
          </div>
        )}

        {state.success && (
          <div
            role="status"
            className="flex gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-700 dark:text-emerald-400"
          >
            <CheckCircle2 className="size-4 shrink-0" />
            {state.success}
          </div>
        )}

        {providerReference && (
          <form action={formAction}>
            <input type="hidden" name="refundId" value={refundId} />

            <Button
              type="submit"
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              <RefreshCw
                className={`mr-2 size-4 ${isPending ? "animate-spin" : ""}`}
              />
              {isPending ? "Checking Paystack..." : "Check refund status"}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
