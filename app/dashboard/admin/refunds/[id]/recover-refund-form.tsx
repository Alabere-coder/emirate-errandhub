"use client";

import { useActionState } from "react";
import { ShieldCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

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
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
          <CardTitle>Recover missing Paystack refund ID</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <p className="text-sm leading-relaxed text-muted-foreground">
          If Paystack created the refund but the application failed to save its
          ID, enter the ID from your Paystack dashboard. The ID will be verified
          before it is saved. This does not initiate another refund.
        </p>

        <div className="flex gap-3 rounded-lg border border-amber-500/25 bg-amber-500/10 p-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700 dark:text-amber-400" />
          <p className="text-sm leading-relaxed text-amber-800 dark:text-amber-300">
            Only enter a refund ID that you have confirmed belongs to this
            refund in your Paystack dashboard. Do not initiate another refund to
            recover a missing reference.
          </p>
        </div>

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

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="refundId" value={refundId} />

          <div className="space-y-2">
            <label
              htmlFor="paystackRefundId"
              className="text-sm font-medium text-foreground"
            >
              Paystack refund ID
            </label>

            <Input
              id="paystackRefundId"
              name="paystackRefundId"
              inputMode="numeric"
              pattern="[0-9]+"
              placeholder="Enter the refund ID"
              required
              disabled={isPending}
            />
          </div>

          <Button
            type="submit"
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            <ShieldCheck className="mr-2 size-4" />
            {isPending ? "Verifying with Paystack..." : "Verify and save ID"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
