"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Send, Save } from "lucide-react";

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
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="text-sm text-green-600">
          {state.success}
        </p>
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
    <div className="space-y-6">
      <form action={statusAction} className="space-y-4">
        <input type="hidden" name="ticketId" value={ticketId} />

        <div className="space-y-2">
          <label htmlFor="ticket-status" className="text-sm font-medium">
            Ticket status
          </label>
          <select
            id="ticket-status"
            name="status"
            required
            defaultValue={currentStatus}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="open">Open</option>
            <option value="in_progress">In progress</option>
            <option value="waiting_for_user">Waiting for user</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        <ActionMessage state={statusState} />
        <StatusButton />
      </form>

      <div className="border-t pt-6">
        <h3 className="mb-4 font-semibold">Reply to ticket</h3>

        <form action={replyAction} className="space-y-4">
          <input type="hidden" name="ticketId" value={ticketId} />

          <div className="space-y-2">
            <label htmlFor="admin-message" className="text-sm font-medium">
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
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          </div>

          <ActionMessage state={replyState} />
          <ReplyButton />
        </form>
      </div>
    </div>
  );
}
