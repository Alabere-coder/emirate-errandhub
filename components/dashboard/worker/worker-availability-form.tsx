"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  updateWorkerAvailability,
  type WorkerAvailabilityActionState,
} from "@/lib/actions/worker-availability";

type Day = {
  value: number;
  label: string;
};

type Availability = {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

type WorkerAvailabilityFormProps = {
  workerId: string;
  days: Day[];
  availability: Availability[];
};

const initialState: WorkerAvailabilityActionState = {};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "Saving..." : "Save Availability"}
    </button>
  );
}

export function WorkerAvailabilityForm({
  workerId,
  days,
  availability,
}: WorkerAvailabilityFormProps) {
  const [state, formAction] = useActionState(
    updateWorkerAvailability,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="worker_id" value={workerId} />

      <div className="overflow-hidden rounded-xl border bg-card">
        <div className="border-b p-6">
          <h2 className="text-lg font-semibold">Weekly Schedule</h2>

          <p className="mt-1 text-sm text-muted-foreground">
            Select the days you are available and set your working hours.
          </p>
        </div>

        <div className="divide-y">
          {days.map((day) => {
            const existing = availability.find(
              (item) => item.day_of_week === day.value,
            );

            const startTime = existing?.start_time?.slice(0, 5) ?? "08:00";
            const endTime = existing?.end_time?.slice(0, 5) ?? "18:00";

            return (
              <div
                key={day.value}
                className="grid gap-4 p-5 md:grid-cols-[180px_1fr_1fr]"
              >
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    name={`available_${day.value}`}
                    defaultChecked={existing?.is_available ?? false}
                    className="h-4 w-4"
                  />

                  <span className="font-medium">{day.label}</span>
                </label>

                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    Start time
                  </span>

                  <input
                    type="time"
                    name={`start_${day.value}`}
                    defaultValue={startTime}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-xs text-muted-foreground">
                    End time
                  </span>

                  <input
                    type="time"
                    name={`end_${day.value}`}
                    defaultValue={endTime}
                    className="w-full rounded-lg border bg-background px-3 py-2 text-sm"
                  />
                </label>
              </div>
            );
          })}
        </div>
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
