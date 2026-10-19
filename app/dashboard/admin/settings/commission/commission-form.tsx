"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updatePlatformCommission } from "@/lib/actions/admin-commission";
import type { CommissionSettingsState } from "@/lib/actions/admin-commission";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CommissionSettingsState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving..." : "Save commission"}
    </Button>
  );
}

export default function CommissionForm({
  currentType,
  currentValue,
}: {
  currentType: "percentage" | "fixed";
  currentValue: number;
}) {
  const [state, formAction] = useActionState(
    updatePlatformCommission,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="commission_type">Commission type</Label>

        <select
          id="commission_type"
          name="commission_type"
          defaultValue={currentType}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="percentage">Percentage (%)</option>
          <option value="fixed">Fixed amount (₦)</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="commission_value">Commission value</Label>

        <Input
          id="commission_value"
          name="commission_value"
          type="number"
          min="0"
          max={currentType === "percentage" ? "100" : undefined}
          step="0.01"
          defaultValue={currentValue}
          required
        />

        <p className="text-sm text-muted-foreground">
          Percentage commission is calculated from the agreed job amount. Fixed
          commission is deducted as a fixed amount in the job's currency.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="text-sm text-emerald-600">
          {state.success}
        </p>
      )}

      <SubmitButton />
    </form>
  );
}
