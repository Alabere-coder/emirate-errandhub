"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type WorkerServiceAreaActionState = {
  error?: string;
  success?: string;
};

export async function updateWorkerServiceAreas(
  _previousState: WorkerServiceAreaActionState,
  formData: FormData,
): Promise<WorkerServiceAreaActionState> {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const workerId = formData.get("worker_id");
  const areaIds = formData.getAll("service_area_ids");

  if (typeof workerId !== "string" || !workerId) {
    return {
      error: "Your worker profile could not be identified.",
    };
  }

  if (areaIds.some((areaId) => typeof areaId !== "string" || !areaId)) {
    return {
      error: "Invalid service area selection.",
    };
  }

  const selectedAreaIds = [...new Set(areaIds as string[])];

  if (selectedAreaIds.length === 0) {
    return {
      error: "Please select at least one service area.",
    };
  }

  // Verify that this worker profile belongs to the logged-in user.
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

  // Make sure every selected area is active.
  const { data: validAreas, error: areasError } = await supabase
    .from("service_areas")
    .select("id")
    .in("id", selectedAreaIds)
    .eq("is_active", true);

  if (areasError) {
    return {
      error: "Unable to verify the selected service areas.",
    };
  }

  if (!validAreas || validAreas.length !== selectedAreaIds.length) {
    return {
      error: "One or more selected service areas are invalid or inactive.",
    };
  }

  // Replace the worker's existing service areas.
  const { error: deleteError } = await supabase
    .from("worker_service_areas")
    .delete()
    .eq("worker_id", workerId);

  if (deleteError) {
    return {
      error: "Unable to update your service areas.",
    };
  }

  const rows = selectedAreaIds.map((serviceAreaId) => ({
    worker_id: workerId,
    service_area_id: serviceAreaId,
  }));

  const { error: insertError } = await supabase
    .from("worker_service_areas")
    .insert(rows);

  if (insertError) {
    return {
      error: "Unable to save your service areas.",
    };
  }

  revalidatePath("/dashboard/worker/service-areas");
  revalidatePath("/dashboard/worker");

  return {
    success: "Your service areas have been updated.",
  };
}
