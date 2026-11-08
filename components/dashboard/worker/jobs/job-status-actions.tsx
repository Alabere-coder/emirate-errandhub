"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";

import { completeJob, startJob, type JobActionState } from "@/lib/actions/jobs";

import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";

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
  const router = useRouter();

  const [startState, startAction] = useActionState(startJob, initialState);

  const [completeState, completeAction] = useActionState(
    completeJob,
    initialState,
  );

  // useEffect(() => {
  //   if (startState.success || completeState.success) {
  //     router.refresh();
  //   }
  // }, [startState.success, completeState.success, router]);

  useEffect(() => {
    if (startState.success) {
      toast.add({
        type: "success",
        description: startState.success,
      });
      router.refresh();
    }

    if (startState.error) {
      const message = startState.error.toLowerCase();

      toast.add({
        type: "error",
        description:
          message.includes("payment") ||
          message.includes("deposit") ||
          message.includes("balance")
            ? "You can start this job once the customer's upfront payment has been verified."
            : startState.error,
      });
    }
  }, [startState.success, startState.error, router]);

  useEffect(() => {
    if (completeState.success) {
      toast.add({
        type: "success",
        description: completeState.success,
      });
      router.refresh();
    }

    if (completeState.error) {
      toast.add({
        type: "error",
        description: completeState.error,
      });
    }
  }, [completeState.success, completeState.error, router]);

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
        <div className="space-y-3">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-medium text-amber-800">
              Verified upfront payment is required before you can start this
              job.
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-700">
              Please wait until the customer's required upfront payment has been
              successfully verified.
            </p>
          </div>

          <form action={startAction}>
            <input type="hidden" name="job_id" value={jobId} />
            <SubmitButton>Start Job</SubmitButton>
          </form>
        </div>
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

// "use client";

// import { useActionState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import { useFormStatus } from "react-dom";

// import { completeJob, startJob, type JobActionState } from "@/lib/actions/jobs";

// import { Button } from "@/components/ui/button";

// type JobStatusActionsProps = {
//   jobId: string;
//   status: string;
// };

// const initialState: JobActionState = {};

// function SubmitButton({ children }: { children: React.ReactNode }) {
//   const { pending } = useFormStatus();

//   return (
//     <Button type="submit" disabled={pending}>
//       {pending ? "Updating..." : children}
//     </Button>
//   );
// }

// export function JobStatusActions({ jobId, status }: JobStatusActionsProps) {
//   const router = useRouter();

//   const [startState, startAction] = useActionState(startJob, initialState);

//   const [completeState, completeAction] = useActionState(
//     completeJob,
//     initialState,
//   );

//   useEffect(() => {
//     if (startState.success || completeState.success) {
//       router.refresh();
//     }
//   }, [startState.success, completeState.success, router]);

//   return (
//     <div className="space-y-4">
//       {startState.error && (
//         <p className="text-sm text-destructive">{startState.error}</p>
//       )}

//       {startState.success && (
//         <p className="text-sm text-green-600">{startState.success}</p>
//       )}

//       {completeState.error && (
//         <p className="text-sm text-destructive">{completeState.error}</p>
//       )}

//       {completeState.success && (
//         <p className="text-sm text-green-600">{completeState.success}</p>
//       )}

//       {status === "assigned" && (
//         <form action={startAction}>
//           <input type="hidden" name="job_id" value={jobId} />

//           <SubmitButton>Start Job</SubmitButton>
//         </form>
//       )}

//       {status === "in_progress" && (
//         <form action={completeAction}>
//           <input type="hidden" name="job_id" value={jobId} />

//           <SubmitButton>Mark as Completed</SubmitButton>
//         </form>
//       )}

//       {status === "completed" && (
//         <p className="text-sm text-muted-foreground">
//           This job has been completed.
//         </p>
//       )}

//       {status === "cancelled" && (
//         <p className="text-sm text-muted-foreground">
//           This job has been cancelled.
//         </p>
//       )}
//     </div>
//   );
// }
