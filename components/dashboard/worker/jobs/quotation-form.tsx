"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  createServiceQuotation,
  type ServiceQuotationActionState,
} from "@/lib/actions/service-quotations";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type QuotationFormProps = {
  serviceRequestId: string;
};

const initialState: ServiceQuotationActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit quotation"}
    </Button>
  );
}

export function QuotationForm({ serviceRequestId }: QuotationFormProps) {
  const [state, formAction] = useActionState(
    createServiceQuotation,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="service_request_id" value={serviceRequestId} />

      {state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-700">
          {state.success}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount">Quotation amount</Label>

        <Input
          id="amount"
          name="amount"
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 25000"
          required
        />

        <p className="text-xs text-muted-foreground">
          Enter the total amount you are charging for this job.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">Currency</Label>

        <select
          id="currency"
          name="currency"
          defaultValue="NGN"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="NGN">NGN — Nigerian Naira</option>
          <option value="USD">USD — US Dollar</option>
          <option value="GBP">GBP — British Pound</option>
          <option value="EUR">EUR — Euro</option>
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="message">
          Message <span className="text-muted-foreground">(optional)</span>
        </Label>

        <Textarea
          id="message"
          name="message"
          rows={4}
          placeholder="Explain what your quotation includes, materials, labour, or any other important details."
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="estimated_duration">
          Estimated duration
          <span className="text-muted-foreground"> (hours)</span>
        </Label>

        <Input
          id="estimated_duration"
          name="estimated_duration"
          type="number"
          min="0"
          step="0.5"
          placeholder="e.g. 3"
        />

        <p className="text-xs text-muted-foreground">
          How long do you expect the job to take?
        </p>
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
