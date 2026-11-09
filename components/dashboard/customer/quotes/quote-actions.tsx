"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  acceptQuote,
  rejectQuote,
  type QuoteActionState,
} from "@/lib/actions/quotes";

import { Button } from "@/components/ui/button";

type QuoteActionsProps = {
  quoteId: string;
};

const initialState: QuoteActionState = {};

function SubmitButton({
  children,
  variant = "default",
}: {
  children: React.ReactNode;
  variant?: "default" | "outline";
}) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant={variant} disabled={pending}>
      {pending ? "Processing..." : children}
    </Button>
  );
}

export function QuoteActions({ quoteId }: QuoteActionsProps) {
  const [acceptState, acceptAction] = useActionState(acceptQuote, initialState);

  const [rejectState, rejectAction] = useActionState(rejectQuote, initialState);

  return (
    <div className="space-y-4">
      {acceptState.error && (
        <p className="text-sm text-destructive">{acceptState.error}</p>
      )}

      {acceptState.success && (
        <p className="text-sm text-green-600">{acceptState.success}</p>
      )}

      {rejectState.error && (
        <p className="text-sm text-destructive">{rejectState.error}</p>
      )}

      {rejectState.success && (
        <p className="text-sm text-muted-foreground">{rejectState.success}</p>
      )}

      <div className="space-y-4">
        {/* Reject quotation */}
        <form action={rejectAction} className="space-y-3">
          <input type="hidden" name="quote_id" value={quoteId} />

          <div>
            <label
              htmlFor={`rejection_reason_${quoteId}`}
              className="text-sm font-medium"
            >
              Reason for rejection
            </label>

            <textarea
              id={`rejection_reason_${quoteId}`}
              name="rejection_reason"
              required
              minLength={10}
              rows={3}
              placeholder="Please explain why you are rejecting this quotation..."
              className="mt-1.5 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring"
            />

            <p className="mt-1 text-xs text-muted-foreground">
              Please provide at least 10 characters so the worker understands
              why the quotation was rejected.
            </p>
          </div>

          <SubmitButton variant="outline">Reject quotation</SubmitButton>
        </form>

        {/* Accept quotation */}
        <form action={acceptAction}>
          <input type="hidden" name="quote_id" value={quoteId} />

          <SubmitButton>Accept quotation</SubmitButton>
        </form>
      </div>
    </div>
  );
}
