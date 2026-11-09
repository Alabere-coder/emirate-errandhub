"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type WorkerServiceAreaActionState = {
  error?: string;
  success?: string;
};

type ServiceAreaRecord = {
  id: string;
  parent_id: string | null;
  is_active: boolean;
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
    return { error: "Your worker profile could not be identified." };
  }

  if (areaIds.some((areaId) => typeof areaId !== "string" || !areaId)) {
    return { error: "Invalid service area selection." };
  }

  const selectedAreaIds = [...new Set(areaIds as string[])];

  if (selectedAreaIds.length === 0) {
    return { error: "Please select at least one service area." };
  }

  const { data: workerProfile, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("id", workerId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerError || !workerProfile) {
    return {
      error: "Your worker profile could not be verified.",
    };
  }

  // Get the worker's existing assignments.
  const { data: existingAssignments, error: existingError } = await supabase
    .from("worker_service_areas")
    .select("service_area_id")
    .eq("worker_id", workerId);

  if (existingError) {
    return {
      error: "Unable to verify your existing service areas.",
    };
  }

  const existingIds = new Set(
    (existingAssignments ?? []).map((item) => item.service_area_id),
  );

  // Newly added locations must follow:
  // State -> LGA -> Area.
  // Existing assignments can remain selected during the transition.
  for (const areaId of selectedAreaIds) {
    if (existingIds.has(areaId)) {
      continue;
    }

    const areaResult = await supabase
      .from("service_areas")
      .select("id, parent_id, is_active")
      .eq("id", areaId)
      .maybeSingle();

    if (areaResult.error || !areaResult.data) {
      return {
        error: "One or more selected service areas are invalid.",
      };
    }

    const area: ServiceAreaRecord = areaResult.data;

    if (!area.is_active || !area.parent_id) {
      return {
        error: "Please select a valid Area or Community.",
      };
    }

    const lgaResult = await supabase
      .from("service_areas")
      .select("id, parent_id, is_active")
      .eq("id", area.parent_id)
      .maybeSingle();

    if (lgaResult.error || !lgaResult.data) {
      return {
        error: "The selected area's LGA could not be verified.",
      };
    }

    const lga: ServiceAreaRecord = lgaResult.data;

    if (!lga.is_active || !lga.parent_id) {
      return {
        error: "The selected area's LGA is inactive or invalid.",
      };
    }

    const stateResult = await supabase
      .from("service_areas")
      .select("id, parent_id, is_active")
      .eq("id", lga.parent_id)
      .maybeSingle();

    if (stateResult.error || !stateResult.data) {
      return {
        error: "The selected area's State could not be verified.",
      };
    }

    const state: ServiceAreaRecord = stateResult.data;

    if (!state.is_active || state.parent_id !== null) {
      return {
        error: "The selected area's State is inactive or invalid.",
      };
    }
  }

  // Remove previous assignments and save the complete selection.
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
    console.error("Save worker service areas error:", insertError);

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
