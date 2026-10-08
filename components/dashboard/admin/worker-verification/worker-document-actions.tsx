"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  approveWorkerDocument,
  rejectWorkerDocument,
  type WorkerDocumentReviewState,
} from "@/lib/actions/worker-documents";

const initialState: WorkerDocumentReviewState = {};

function ApproveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "Approving..." : "Approve Document"}
    </button>
  );
}

function RejectButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
    >
      {pending ? "Rejecting..." : "Reject Document"}
    </button>
  );
}

export function WorkerDocumentActions({
  documentId,
  workerId,
}: {
  documentId: string;
  workerId: string;
}) {
  const [approveState, approveAction] = useActionState(
    approveWorkerDocument,
    initialState,
  );

  const [rejectState, rejectAction] = useActionState(
    rejectWorkerDocument,
    initialState,
  );

  return (
    <div className="space-y-4 border-t pt-4">
      <form action={approveAction}>
        <input type="hidden" name="document_id" value={documentId} />

        <input type="hidden" name="worker_id" value={workerId} />

        {approveState.error && (
          <p className="mb-3 text-sm text-destructive">{approveState.error}</p>
        )}

        <ApproveButton />
      </form>

      <form action={rejectAction} className="space-y-3">
        <input type="hidden" name="document_id" value={documentId} />

        <input type="hidden" name="worker_id" value={workerId} />

        <label className="block text-sm font-medium">Rejection reason</label>

        <textarea
          name="rejection_reason"
          required
          minLength={10}
          placeholder="Explain why this document cannot be accepted..."
          className="min-h-24 w-full rounded-lg border bg-background px-3 py-2 text-sm"
        />

        {rejectState.error && (
          <p className="text-sm text-destructive">{rejectState.error}</p>
        )}

        <RejectButton />
      </form>
    </div>
  );
}
