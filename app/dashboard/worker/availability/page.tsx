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
      <div className="rounded-xl border border-dashed p-6">
        <h1 className="text-xl font-semibold">Availability</h1>

        <p className="mt-2 text-sm text-muted-foreground">
          Your worker profile has not been created yet. Your application must be
          approved first.
        </p>
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Availability</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Set the days and hours when you are available to accept jobs.
        </p>
      </div>

      <WorkerAvailabilityForm
        workerId={workerProfile.id}
        days={DAYS}
        availability={availability ?? []}
      />
    </div>
  );
}
