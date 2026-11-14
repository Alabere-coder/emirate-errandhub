"use client";

import { useActionState } from "react";

import {
  retryPublicSupportReplyEmail,
  type PublicSupportReplyState,
} from "@/app/dashboard/admin/public-support/actions";

const initialState: PublicSupportReplyState = {};

export function PublicSupportRetryButton({ replyId }: { replyId: string }) {
  const [state, formAction, isPending] = useActionState(
    retryPublicSupportReplyEmail,
    initialState,
  );

  return (
    <form action={formAction} className="mt-3 space-y-3">
      <input type="hidden" name="replyId" value={replyId} />

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center justify-center rounded-lg border border-emerald-200 bg-white px-3 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Retrying email..." : "Retry email"}
      </button>

      {state.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="text-sm text-emerald-700">
          {state.success}
        </p>
      )}

      {state.emailWarning && (
        <p role="alert" className="text-sm text-amber-700">
          {state.emailWarning}
        </p>
      )}
    </form>
  );
}
