"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { CheckCircle2 } from "lucide-react";

import {
  confirmJobCompletion,
  type ConfirmJobState,
} from "@/lib/actions/customer-job-confirmation";

import { Button } from "@/components/ui/button";

const initialState: ConfirmJobState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-teal-700 text-white hover:bg-teal-800 sm:w-auto"
    >
      <CheckCircle2 className="mr-2 h-4 w-4" />
      {pending ? "Confirming..." : "Confirm Job Completion"}
    </Button>
  );
}

export function ConfirmJobCompletionButton({ jobId }: { jobId: string }) {
  const router = useRouter();

  const [state, formAction] = useActionState(
    confirmJobCompletion,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-teal-200 bg-teal-50 p-4">
        <p className="text-sm font-semibold text-teal-900">
          Has your service been completed satisfactorily?
        </p>
        <p className="mt-1 text-sm leading-6 text-teal-800">
          Confirm only after you have checked the completed work. This
          confirmation does not itself release payment to the service provider.
        </p>
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      {state.success && (
        <p role="status" className="text-sm text-green-700">
          {state.success}
        </p>
      )}

      {!state.success && (
        <form action={formAction}>
          <input type="hidden" name="job_id" value={jobId} />
          <SubmitButton />
        </form>
      )}
    </div>
  );
}
