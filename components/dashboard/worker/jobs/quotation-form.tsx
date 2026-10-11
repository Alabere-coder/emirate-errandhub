"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Banknote,
  Clock3,
  FileText,
  MessageSquareText,
  Send,
} from "lucide-react";

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
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full gap-2 rounded-xl font-semibold shadow-sm transition sm:w-auto sm:min-w-48"
    >
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          Submitting quotation...
        </>
      ) : (
        <>
          <Send className="size-4" />
          Submit quotation
        </>
      )}
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

      {/* Feedback */}
      {state.error && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <span className="mt-0.5 size-2 shrink-0 rounded-full bg-destructive" />
          <p>{state.error}</p>
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="flex gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <span className="mt-0.5 size-2 shrink-0 rounded-full bg-emerald-500" />
          <p>{state.success}</p>
        </div>
      )}

      {/* Price and currency */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Banknote className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Your quotation</h3>
            <p className="text-xs text-muted-foreground">
              Set the price for the requested service.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <div className="space-y-2">
            <Label htmlFor="amount">Total amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 25000"
              required
              className="h-12 rounded-xl text-base font-medium"
            />
            <p className="text-xs text-muted-foreground">
              Include the total amount you will charge for this job.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <select
              id="currency"
              name="currency"
              defaultValue="NGN"
              className="flex h-12 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none transition focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            >
              <option value="NGN">NGN — Naira</option>
              <option value="USD">USD — US Dollar</option>
              <option value="GBP">GBP — British Pound</option>
              <option value="EUR">EUR — Euro</option>
            </select>
          </div>
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Duration */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Clock3 className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Estimated duration</h3>
            <p className="text-xs text-muted-foreground">
              Give the customer an idea of how long the work will take.
            </p>
          </div>
        </div>

        <div className="max-w-xs space-y-2">
          <Label htmlFor="estimated_duration">
            Duration{" "}
            <span className="font-normal text-muted-foreground">(hours)</span>
          </Label>
          <Input
            id="estimated_duration"
            name="estimated_duration"
            type="number"
            min="0"
            step="0.5"
            placeholder="e.g. 3"
            className="h-11 rounded-xl"
          />
        </div>
      </section>

      <div className="border-t border-border" />

      {/* Message */}
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <MessageSquareText className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Message to customer</h3>
            <p className="text-xs text-muted-foreground">
              Explain what your quotation covers.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="message">
            Additional details{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Textarea
            id="message"
            name="message"
            rows={4}
            placeholder="Describe labour, materials, transport costs, or anything else the customer should know."
            className="min-h-28 resize-y rounded-xl"
          />
        </div>
      </section>

      {/* Submission */}
      <div className="flex flex-col gap-3 rounded-xl bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-2">
          <FileText className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="text-xs leading-5 text-muted-foreground">
            Review your price and details before submitting. The customer can
            review your quotation before deciding.
          </p>
        </div>

        <SubmitButton />
      </div>
    </form>
  );
}
