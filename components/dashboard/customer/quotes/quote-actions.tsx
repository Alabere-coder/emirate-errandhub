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
    <div className="space-y-3">
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

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <form action={rejectAction}>
          <input type="hidden" name="quote_id" value={quoteId} />

          <SubmitButton variant="outline">Reject</SubmitButton>
        </form>

        <form action={acceptAction}>
          <input type="hidden" name="quote_id" value={quoteId} />

          <SubmitButton>Accept quotation</SubmitButton>
        </form>
      </div>
    </div>
  );
}
