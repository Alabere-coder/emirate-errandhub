"use client";

import { useActionState } from "react";

import {
  sendPublicSupportAdminReply,
  type PublicSupportReplyState,
} from "@/app/dashboard/admin/public-support/actions";

const initialState: PublicSupportReplyState = {};

export function PublicSupportReplyForm({ enquiryId }: { enquiryId: string }) {
  const [state, formAction, isPending] = useActionState(
    sendPublicSupportAdminReply,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="enquiryId" value={enquiryId} />

      <div className="space-y-2">
        <label
          htmlFor="reply-message"
          className="text-sm font-medium text-foreground"
        >
          Your response
        </label>

        <textarea
          id="reply-message"
          name="message"
          required
          minLength={10}
          maxLength={5000}
          rows={7}
          placeholder="Write your response to the visitor..."
          className="w-full rounded-lg border border-input bg-background px-3 py-3 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isPending}
        />

        <p className="text-xs text-muted-foreground">
          Your response will be sent to the visitor's email address. Maximum
          5,000 characters.
        </p>
      </div>

      {state.error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300"
        >
          {state.error}
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300"
        >
          {state.success}
        </div>
      )}

      {state.emailWarning && (
        <div
          role="alert"
          className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300"
        >
          {state.emailWarning}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Sending response..." : "Send response"}
        </button>
      </div>
    </form>
  );
}
