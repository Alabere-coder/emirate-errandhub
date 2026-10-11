"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  CalendarDays,
  CheckCircle2,
  CircleAlert,
  Clock3,
  Save,
  Sun,
} from "lucide-react";

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
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
    >
      {pending ? (
        <>
          <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          Saving schedule...
        </>
      ) : (
        <>
          <Save className="size-4" />
          Save availability
        </>
      )}
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

  const availableDays = days.filter((day) =>
    availability.some(
      (item) => item.day_of_week === day.value && item.is_available,
    ),
  ).length;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="worker_id" value={workerId} />

      <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="border-b bg-muted/20 px-5 py-6 sm:px-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <CalendarDays className="size-6" />
              </div>

              <div>
                <h2 className="text-lg font-bold tracking-tight sm:text-xl">
                  Weekly schedule
                </h2>

                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                  Choose the days you work and set your preferred start and end
                  times. Your schedule helps customers understand when you are
                  available.
                </p>
              </div>
            </div>

            <div className="flex w-fit shrink-0 items-center gap-2 rounded-full border bg-background px-3 py-2 text-sm">
              <CheckCircle2 className="size-4 text-primary" />
              <span className="font-semibold tabular-nums">
                {availableDays}
              </span>
              <span className="text-muted-foreground">
                {availableDays === 1 ? "day enabled" : "days enabled"}
              </span>
            </div>
          </div>
        </div>

        <div className="divide-y">
          {days.map((day) => {
            const existing = availability.find(
              (item) => item.day_of_week === day.value,
            );

            const isAvailable = existing?.is_available ?? false;
            const startTime = existing?.start_time?.slice(0, 5) ?? "08:00";
            const endTime = existing?.end_time?.slice(0, 5) ?? "18:00";

            return (
              <div
                key={day.value}
                className={`grid gap-5 p-5 transition-colors sm:p-6 md:grid-cols-[minmax(150px,0.8fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center ${
                  isAvailable ? "bg-primary/2.5" : "bg-card"
                }`}
              >
                <label className="flex cursor-pointer items-center gap-3">
                  <input
                    type="checkbox"
                    name={`available_${day.value}`}
                    defaultChecked={isAvailable}
                    className="size-4 shrink-0 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />

                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                      isAvailable
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Sun className="size-5" />
                  </span>

                  <span>
                    <span className="block text-sm font-semibold">
                      {day.label}
                    </span>
                    <span
                      className={`mt-1 block text-xs ${
                        isAvailable ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {isAvailable ? "Available" : "Unavailable"}
                    </span>
                  </span>
                </label>

                <label className="block min-w-0 space-y-2">
                  <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Clock3 className="size-3.5" />
                    Start time
                  </span>

                  <input
                    type="time"
                    name={`start_${day.value}`}
                    defaultValue={startTime}
                    className="h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                </label>

                <label className="block min-w-0 space-y-2">
                  <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Clock3 className="size-3.5" />
                    End time
                  </span>

                  <input
                    type="time"
                    name={`end_${day.value}`}
                    defaultValue={endTime}
                    className="h-11 w-full min-w-0 rounded-xl border border-input bg-background px-3 text-sm shadow-sm outline-none transition focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20"
                  />
                </label>
              </div>
            );
          })}
        </div>

        <div className="border-t bg-muted/20 px-5 py-4 sm:px-7">
          <p className="text-xs leading-5 text-muted-foreground">
            Select the checkbox beside a day to mark yourself as available. You
            can adjust the hours for each day individually.
          </p>
        </div>
      </section>

      {state.error && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" />
          <p className="leading-6">{state.error}</p>
        </div>
      )}

      {state.success && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm text-emerald-700 dark:text-emerald-400"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <p className="leading-6">{state.success}</p>
        </div>
      )}

      <div className="flex flex-col gap-3 rounded-2xl border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <p className="text-sm font-semibold">Keep your schedule updated</p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Save your changes when you finish adjusting your working hours.
          </p>
        </div>

        <SubmitButton />
      </div>
    </form>
  );
}
