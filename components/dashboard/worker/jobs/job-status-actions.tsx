"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { completeJob, startJob, type JobActionState } from "@/lib/actions/jobs";

import { Button } from "@/components/ui/button";

type JobStatusActionsProps = {
  jobId: string;
  status: string;
};

const initialState: JobActionState = {};

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Updating..." : children}
    </Button>
  );
}

export function JobStatusActions({ jobId, status }: JobStatusActionsProps) {
  const [startState, startAction] = useActionState(startJob, initialState);

  const [completeState, completeAction] = useActionState(
    completeJob,
    initialState,
  );

  return (
    <div className="space-y-4">
      {startState.error && (
        <p className="text-sm text-destructive">{startState.error}</p>
      )}

      {startState.success && (
        <p className="text-sm text-green-600">{startState.success}</p>
      )}

      {completeState.error && (
        <p className="text-sm text-destructive">{completeState.error}</p>
      )}

      {completeState.success && (
        <p className="text-sm text-green-600">{completeState.success}</p>
      )}

      {status === "assigned" && (
        <form action={startAction}>
          <input type="hidden" name="job_id" value={jobId} />

          <SubmitButton>Start Job</SubmitButton>
        </form>
      )}

      {status === "in_progress" && (
        <form action={completeAction}>
          <input type="hidden" name="job_id" value={jobId} />

          <SubmitButton>Mark as Completed</SubmitButton>
        </form>
      )}

      {status === "completed" && (
        <p className="text-sm text-muted-foreground">
          This job has been completed.
        </p>
      )}

      {status === "cancelled" && (
        <p className="text-sm text-muted-foreground">
          This job has been cancelled.
        </p>
      )}
    </div>
  );
}
