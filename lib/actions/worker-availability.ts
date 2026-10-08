"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type WorkerAvailabilityActionState = {
  error?: string;
  success?: string;
};

type AvailabilityRow = {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
};

export async function updateWorkerAvailability(
  _previousState: WorkerAvailabilityActionState,
  formData: FormData,
): Promise<WorkerAvailabilityActionState> {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const workerId = formData.get("worker_id");

  if (typeof workerId !== "string" || !workerId) {
    return {
      error: "Your worker profile could not be identified.",
    };
  }

  // Verify ownership of the worker profile.
  const { data: workerProfile, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("id", workerId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerError) {
    return {
      error: "Unable to verify your worker profile.",
    };
  }

  if (!workerProfile) {
    return {
      error: "Your worker profile could not be verified.",
    };
  }

  const rows: AvailabilityRow[] = [];

  for (let day = 0; day <= 6; day++) {
    const available = formData.get(`available_${day}`) === "on";

    const startTime = formData.get(`start_${day}`);
    const endTime = formData.get(`end_${day}`);

    if (typeof startTime !== "string" || typeof endTime !== "string") {
      return {
        error: "Please provide valid availability times.",
      };
    }

    if (!available) {
      continue;
    }

    if (!startTime || !endTime) {
      return {
        error:
          "Please provide both start and end times for every available day.",
      };
    }

    if (startTime >= endTime) {
      return {
        error: "The ending time must be later than the starting time.",
      };
    }

    rows.push({
      day_of_week: day,
      start_time: startTime,
      end_time: endTime,
      is_available: true,
    });
  }

  if (rows.length === 0) {
    return {
      error: "Please select at least one available day.",
    };
  }

  // Replace the existing weekly schedule.
  const { error: deleteError } = await supabase
    .from("worker_availability")
    .delete()
    .eq("worker_id", workerId);

  if (deleteError) {
    return {
      error: "Unable to update your availability.",
    };
  }

  const insertRows = rows.map((row) => ({
    worker_id: workerId,
    day_of_week: row.day_of_week,
    start_time: row.start_time,
    end_time: row.end_time,
    is_available: row.is_available,
  }));

  const { error: insertError } = await supabase
    .from("worker_availability")
    .insert(insertRows);

  if (insertError) {
    return {
      error: "Unable to save your availability.",
    };
  }

  revalidatePath("/dashboard/worker/availability");
  revalidatePath("/dashboard/worker");

  return {
    success: "Your availability has been updated.",
  };
}
