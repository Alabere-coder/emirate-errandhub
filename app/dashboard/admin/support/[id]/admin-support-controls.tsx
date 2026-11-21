"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { AlertCircle, CheckCircle2, Save, Send } from "lucide-react";

import { sendAdminSupportReply, updateSupportTicketStatus } from "./actions";

import { Button } from "@/components/ui/button";

type ActionState = {
  error?: string;
  success?: string;
};

const initialState: ActionState = {};

function ReplyButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      <Send className="mr-2 h-4 w-4" />
      {pending ? "Sending..." : "Send reply"}
    </Button>
  );
}

function StatusButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      <Save className="mr-2 h-4 w-4" />
      {pending ? "Saving..." : "Update status"}
    </Button>
  );
}

function ActionMessage({ state }: { state: ActionState }) {
  return (
    <>
      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{state.error}</p>
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{state.success}</p>
        </div>
      )}
    </>
  );
}

export function AdminSupportControls({
  ticketId,
  currentStatus,
}: {
  ticketId: string;
  currentStatus: string;
}) {
  const [replyState, replyAction] = useActionState(
    sendAdminSupportReply,
    initialState,
  );

  const [statusState, statusAction] = useActionState(
    updateSupportTicketStatus,
    initialState,
  );

  return (
    <div className="space-y-7">
      {/* Ticket status */}
      <form action={statusAction} className="space-y-4">
        <input type="hidden" name="ticketId" value={ticketId} />

        <div className="space-y-2">
          <label
            htmlFor="ticket-status"
            className="text-sm font-medium text-foreground"
          >
            Ticket status
          </label>

          <select
            id="ticket-status"
            name="status"
            required
            defaultValue={currentStatus}
            className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="waiting_for_user">Waiting for user</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>

          <p className="text-xs leading-5 text-muted-foreground">
            Choose the appropriate status to reflect the current progress of
            this support request.
          </p>
        </div>

        <ActionMessage state={statusState} />

        <StatusButton />
      </form>

      {/* Reply section */}
      <div className="border-t border-border pt-6">
        <div className="mb-4">
          <h3 className="font-semibold text-foreground">Reply to ticket</h3>

          <p className="mt-1 text-sm text-muted-foreground">
            Send a clear and helpful response to the requester.
          </p>
        </div>

        <form action={replyAction} className="space-y-4">
          <input type="hidden" name="ticketId" value={ticketId} />

          <div className="space-y-2">
            <label
              htmlFor="admin-message"
              className="text-sm font-medium text-foreground"
            >
              Message
            </label>

            <textarea
              id="admin-message"
              name="message"
              required
              minLength={1}
              maxLength={5000}
              rows={5}
              placeholder="Write a helpful response..."
              className="w-full resize-y rounded-lg border border-input bg-background px-3 py-3 text-sm leading-6 text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
            />

            <p className="text-right text-xs text-muted-foreground">
              Maximum 5,000 characters
            </p>
          </div>

          <ActionMessage state={replyState} />

          <ReplyButton />
        </form>
      </div>
    </div>
  );
}
