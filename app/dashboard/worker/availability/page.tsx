import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { WorkerAvailabilityForm } from "@/components/dashboard/worker/worker-availability-form";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

export default async function WorkerAvailabilityPage() {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const { data: workerProfile, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerError) {
    throw new Error("Unable to load your worker profile.");
  }

  if (!workerProfile) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6 lg:py-8">
        <Link
          href="/dashboard/worker"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to dashboard
        </Link>

        <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          <div className="h-1 bg-primary" />

          <div className="flex flex-col items-center px-5 py-12 text-center sm:px-10 sm:py-16">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <CalendarDays className="size-8" />
            </div>

            <h1 className="mt-5 text-xl font-bold tracking-tight sm:text-2xl">
              Your availability
            </h1>

            <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
              Your worker profile has not been created yet. Your application
              must be approved first.
            </p>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border bg-muted/30 px-4 py-2 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="size-4" />
              Worker profile required
            </div>
          </div>
        </section>
      </div>
    );
  }

  const { data: availability, error: availabilityError } = await supabase
    .from("worker_availability")
    .select(
      `
        id,
        day_of_week,
        start_time,
        end_time,
        is_available
      `,
    )
    .eq("worker_id", workerProfile.id)
    .order("day_of_week", { ascending: true });

  if (availabilityError) {
    throw new Error("Unable to load your availability.");
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:space-y-8 lg:py-8">
      <Link
        href="/dashboard/worker"
        className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to dashboard
      </Link>

      <section className="relative overflow-hidden rounded-2xl border bg-card shadow-sm">
        <div className="absolute inset-x-0 top-0 h-1 bg-primary" />

        <div className="relative flex flex-col gap-6 p-5 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary sm:size-14">
              <CalendarDays className="size-6 sm:size-7" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                Worker profile
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                Availability
              </h1>

              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                Set your regular working days and hours so your schedule
                reflects when you are available to accept jobs.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3 rounded-xl border bg-muted/20 p-4 lg:max-w-60">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-background text-primary shadow-sm">
              <Clock3 className="size-5" />
            </div>

            <div>
              <p className="text-sm font-semibold">Weekly schedule</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Configure your hours for all seven days.
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-px border-t bg-border sm:grid-cols-2">
          <div className="flex items-start gap-3 bg-card px-5 py-4 sm:px-8">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Choose your working days</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Mark the days when you can take on customer requests.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 bg-card px-5 py-4 sm:px-8">
            <Clock3 className="mt-0.5 size-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">Set your working hours</p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Choose a start and end time for each day.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold tracking-tight">
            Manage your schedule
          </h2>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">
            Update your availability whenever your working hours change.
          </p>
        </div>

        <WorkerAvailabilityForm
          workerId={workerProfile.id}
          days={DAYS}
          availability={availability ?? []}
        />
      </div>
    </div>
  );
}
