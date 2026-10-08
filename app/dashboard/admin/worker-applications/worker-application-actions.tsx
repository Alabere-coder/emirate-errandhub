"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  approveWorkerApplication,
  rejectWorkerApplication,
  type WorkerApplicationActionState,
} from "@/lib/actions/worker-applications";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

const initialState: WorkerApplicationActionState = {};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Processing..." : children}
    </Button>
  );
}

export function WorkerApplicationActions({
  applicationId,
}: {
  applicationId: string;
}) {
  const [approveState, approveAction] = useActionState(
    approveWorkerApplication,
    initialState,
  );

  const [rejectState, rejectAction] = useActionState(
    rejectWorkerApplication,
    initialState,
  );

  return (
    <div className="space-y-6 border-t pt-6">
      {approveState.error && (
        <p className="text-sm text-destructive">{approveState.error}</p>
      )}

      {rejectState.error && (
        <p className="text-sm text-destructive">{rejectState.error}</p>
      )}

      {approveState.success && (
        <p className="text-sm text-green-600">{approveState.success}</p>
      )}

      {rejectState.success && (
        <p className="text-sm text-green-600">{rejectState.success}</p>
      )}

      <div>
        <h2 className="font-semibold">Approve application</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Approving this application will activate the worker profile.
        </p>

        <form action={approveAction} className="mt-4">
          <input type="hidden" name="application_id" value={applicationId} />

          <SubmitButton>Approve Application</SubmitButton>
        </form>
      </div>

      <div className="space-y-3">
        <div>
          <h2 className="font-semibold">Reject application</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Provide a reason so the applicant knows what needs to be improved.
          </p>
        </div>

        <form action={rejectAction} className="space-y-4">
          <input type="hidden" name="application_id" value={applicationId} />

          <div className="space-y-2">
            <Label htmlFor="rejection_reason">Rejection reason</Label>

            <Textarea
              id="rejection_reason"
              name="rejection_reason"
              required
              minLength={10}
              placeholder="Explain why this application cannot be approved yet."
            />
          </div>

          <SubmitButton>Reject Application</SubmitButton>
        </form>
      </div>
    </div>
  );
}
