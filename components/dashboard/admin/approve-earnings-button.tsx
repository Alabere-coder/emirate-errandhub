"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";

import {
  approveAndReleaseEarnings,
  type ReleaseEarningsState,
} from "@/lib/actions/admin-earnings";

import { Button } from "@/components/ui/button";

const initialState: ReleaseEarningsState = {};

function SubmitButton({ succeeded }: { succeeded: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending || succeeded}>
      {pending
        ? "Releasing earnings..."
        : succeeded
          ? "Earnings released"
          : "Approve and release earnings"}
    </Button>
  );
}

export default function ApproveEarningsButton({ jobId }: { jobId: string }) {
  const router = useRouter();

  const [state, formAction] = useActionState(
    approveAndReleaseEarnings,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <div className="space-y-3">
      <form action={formAction}>
        <input type="hidden" name="job_id" value={jobId} />
        <SubmitButton succeeded={Boolean(state.success)} />
      </form>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="text-sm text-emerald-600">
          {state.success}
        </p>
      )}
    </div>
  );
}
