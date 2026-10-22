"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send } from "lucide-react";

import { sendSupportTicketMessage } from "../actions";
import { Button } from "@/components/ui/button";

const initialState: {
  error?: string;
  success?: string;
} = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      <Send className="mr-2 h-4 w-4" />
      {pending ? "Sending..." : "Send reply"}
    </Button>
  );
}

export function SupportReplyForm({ ticketId }: { ticketId: string }) {
  const [state, formAction] = useActionState(
    sendSupportTicketMessage,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="ticketId" value={ticketId} />

      <div className="space-y-2">
        <label htmlFor="message" className="text-sm font-medium">
          Your reply
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={1}
          maxLength={5000}
          rows={4}
          placeholder="Write your reply to the support team..."
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
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

      <SubmitButton />
    </form>
  );
}
