"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  updateWorkerServiceAreas,
  type WorkerServiceAreaActionState,
} from "@/lib/actions/worker-service-areas";

type ServiceArea = {
  id: string;
  name: string;
  parent_id: string | null;
  is_active: boolean;
};

type WorkerServiceAreaFormProps = {
  workerId: string;
  serviceAreas: ServiceArea[];
  selectedAreaIds: string[];
};

const initialState: WorkerServiceAreaActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving..." : "Save Service Areas"}
    </button>
  );
}

export function WorkerServiceAreaForm({
  workerId,
  serviceAreas,
  selectedAreaIds,
}: WorkerServiceAreaFormProps) {
  const [state, formAction] = useActionState(
    updateWorkerServiceAreas,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="worker_id" value={workerId} />

      <div className="rounded-xl border bg-card p-6">
        <div className="mb-5">
          <h2 className="text-lg font-semibold">Areas You Serve</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Select all areas where you are willing to accept jobs.
          </p>
        </div>

        {serviceAreas.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No active service areas are currently available.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {serviceAreas.map((area) => (
              <label
                key={area.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-4 transition hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  name="service_area_ids"
                  value={area.id}
                  defaultChecked={selectedAreaIds.includes(area.id)}
                  className="h-4 w-4"
                />

                <span className="font-medium">{area.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      {state.error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {state.success && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-700">
          {state.success}
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
