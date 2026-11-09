"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type ServiceAreaActionState = {
  error?: string;
  success?: string;
};

type ParentRecord = {
  id: string;
  parent_id: string | null;
  is_active: boolean;
};

const MAX_LEVELS = 3;

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function revalidateServiceAreas() {
  revalidatePath("/dashboard/admin/service-areas");
  revalidatePath("/dashboard/worker/service-areas");
}

/**
 * Returns the level of a location:
 * 1 = State
 * 2 = LGA
 * 3 = Area
 *
 * Also prevents circular relationships and invalid parent levels.
 */
async function validateParent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  parentId: string,
  currentAreaId?: string,
): Promise<string | null> {
  if (!parentId) {
    return null;
  }

  const visited = new Set<string>();
  let currentId: string | null = parentId;
  let parentLevel = 0;

  while (currentId) {
    if (currentId === currentAreaId) {
      return "A location cannot be placed underneath itself or one of its descendants.";
    }

    if (visited.has(currentId)) {
      return "The selected location belongs to an invalid hierarchy.";
    }

    visited.add(currentId);

    const parentResult = await supabase
      .from("service_areas")
      .select("id, parent_id, is_active")
      .eq("id", currentId)
      .maybeSingle();

    if (parentResult.error) {
      console.error(
        "Service area parent verification error:",
        parentResult.error,
      );
      return "Unable to verify the selected parent location.";
    }

    const parent = parentResult.data as ParentRecord | null;

    if (!parent) {
      return "The selected parent location does not exist.";
    }

    if (!parent.is_active) {
      return "You cannot add or move a location underneath an inactive parent.";
    }

    parentLevel++;

    if (parentLevel > MAX_LEVELS) {
      return "The selected parent belongs to an invalid hierarchy.";
    }

    currentId = parent.parent_id;
  }

  // A state can contain an LGA.
  // An LGA can contain an area.
  // An area cannot contain another location.
  if (parentLevel >= MAX_LEVELS) {
    return "You cannot add a location underneath an Area. The maximum hierarchy is State → LGA → Area.";
  }

  return null;
}

/**
 * Prevents moving a location if doing so would push its descendants
 * beyond the permitted three levels.
 */
async function validateSubtreeDepth(
  supabase: Awaited<ReturnType<typeof createClient>>,
  areaId: string,
  newLevel: number,
): Promise<string | null> {
  const queue: Array<{ id: string; level: number }> = [
    { id: areaId, level: newLevel },
  ];

  const visited = new Set<string>();

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (visited.has(current.id)) {
      return "This location has an invalid circular hierarchy.";
    }

    visited.add(current.id);

    const { data: children, error } = await supabase
      .from("service_areas")
      .select("id")
      .eq("parent_id", current.id);

    if (error) {
      console.error("Service area child validation error:", error);
      return "Unable to verify the location's existing child areas.";
    }

    for (const child of children ?? []) {
      const childLevel = current.level + 1;

      if (childLevel > MAX_LEVELS) {
        return "This change would create more than three location levels. Move or remove the affected child locations first.";
      }

      queue.push({
        id: child.id,
        level: childLevel,
      });
    }
  }

  return null;
}

/* =========================================================
   CREATE SERVICE AREA
========================================================= */

export async function createServiceArea(
  _previousState: ServiceAreaActionState,
  formData: FormData,
): Promise<ServiceAreaActionState> {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const name = getString(formData, "name");
  const parentId = getString(formData, "parentId");
  const isActive = formData.get("isActive") === "on";

  if (!name) {
    return { error: "Location name is required." };
  }

  const parentError = await validateParent(supabase, parentId);

  if (parentError) {
    return { error: parentError };
  }

  const { error } = await supabase.from("service_areas").insert({
    name,
    parent_id: parentId || null,
    is_active: isActive,
  });

  if (error) {
    console.error("Create service area error:", error);

    if (error.code === "23505") {
      return {
        error: "A location with this name already exists.",
      };
    }

    return { error: "Unable to create this location." };
  }

  revalidateServiceAreas();

  return { success: "Location created successfully." };
}

/* =========================================================
   UPDATE SERVICE AREA
========================================================= */

export async function updateServiceArea(
  _previousState: ServiceAreaActionState,
  formData: FormData,
): Promise<ServiceAreaActionState> {
  await requireRole(["admin"]);

  const supabase = await createClient();

  const id = getString(formData, "id");
  const name = getString(formData, "name");
  const parentId = getString(formData, "parentId");
  const isActive = formData.get("isActive") === "on";

  if (!id) {
    return { error: "Location ID is missing." };
  }

  if (!name) {
    return { error: "Location name is required." };
  }

  const { data: existingArea, error: existingError } = await supabase
    .from("service_areas")
    .select("id, parent_id")
    .eq("id", id)
    .maybeSingle();

  if (existingError || !existingArea) {
    console.error("Load service area error:", existingError);
    return { error: "This location could not be found." };
  }

  const parentError = await validateParent(supabase, parentId, id);

  if (parentError) {
    return { error: parentError };
  }

  // Determine the new level of this location.
  let newLevel = 1;

  if (parentId) {
    let currentId: string | null = parentId;

    while (currentId) {
      const parentLookup = await supabase
        .from("service_areas")
        .select("id, parent_id")
        .eq("id", currentId)
        .maybeSingle();

      if (parentLookup.error || !parentLookup.data) {
        return { error: "Unable to determine the new location level." };
      }

      const parentRecord = parentLookup.data as ParentRecord;

      newLevel++;
      currentId = parentRecord.parent_id;
    }
  }

  const subtreeError = await validateSubtreeDepth(supabase, id, newLevel);

  if (subtreeError) {
    return { error: subtreeError };
  }

  const { error } = await supabase
    .from("service_areas")
    .update({
      name,
      parent_id: parentId || null,
    })
    .eq("id", id);

  if (error) {
    console.error("Update service area error:", error);

    if (error.code === "23505") {
      return {
        error: "A location with this name already exists.",
      };
    }

    return { error: "Unable to update this location." };
  }

  revalidateServiceAreas();

  return { success: "Location updated successfully." };
}

/* =========================================================
   TOGGLE ACTIVE STATUS
========================================================= */

export async function toggleServiceArea(
  formData: FormData,
): Promise<ServiceAreaActionState> {
  await requireRole(["admin"]);

  const supabase = await createClient();
  const id = getString(formData, "id");

  if (!id) {
    return { error: "Location ID is missing." };
  }

  const { data, error } = await supabase.rpc("admin_toggle_service_area", {
    p_area_id: id,
  });

  if (error) {
    console.error("Toggle service area error:", error);

    return {
      error: error.message.includes("parent location")
        ? "Activate the parent location before activating this location."
        : "Unable to change this location's status.",
    };
  }

  revalidateServiceAreas();

  const result = data as {
    is_active?: boolean;
    affected_descendants?: number;
  } | null;

  const activated = result?.is_active === true;
  const affected = result?.affected_descendants ?? 0;

  if (activated) {
    return {
      success:
        affected > 0
          ? `Location activated. ${affected} descendant location(s) were also restored.`
          : "Location activated.",
    };
  }

  return {
    success:
      affected > 0
        ? `Location deactivated. ${affected} descendant location(s) were also deactivated.`
        : "Location deactivated.",
  };
}

/* =========================================================
   DELETE SERVICE AREA
========================================================= */

export async function deleteServiceArea(
  formData: FormData,
): Promise<ServiceAreaActionState> {
  await requireRole(["admin"]);

  const supabase = await createClient();
  const id = getString(formData, "id");

  if (!id) {
    return { error: "Location ID is missing." };
  }

  const { data: area, error: areaError } = await supabase
    .from("service_areas")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();

  if (areaError || !area) {
    console.error("Service area lookup error:", areaError);
    return { error: "Location not found." };
  }

  // A state or LGA with children cannot be deleted.
  const { count: childCount, error: childError } = await supabase
    .from("service_areas")
    .select("id", { count: "exact", head: true })
    .eq("parent_id", id);

  if (childError) {
    console.error("Check child locations error:", childError);
    return { error: "Unable to check this location's child entries." };
  }

  if ((childCount ?? 0) > 0) {
    return {
      error: "This location has child locations. Move or delete those first.",
    };
  }

  // Never delete worker assignments accidentally.
  const { count: assignmentCount, error: assignmentError } = await supabase
    .from("worker_service_areas")
    .select("worker_id", { count: "exact", head: true })
    .eq("service_area_id", id);

  if (assignmentError) {
    console.error("Check worker assignments error:", assignmentError);
    return {
      error: "Unable to check worker assignments for this location.",
    };
  }

  if ((assignmentCount ?? 0) > 0) {
    return {
      error:
        "Workers are assigned to this location. Deactivate it instead to preserve their assignments.",
    };
  }

  const { error } = await supabase.from("service_areas").delete().eq("id", id);

  if (error) {
    console.error("Delete service area error:", error);
    return { error: "Unable to delete this location." };
  }

  revalidateServiceAreas();

  return {
    success: `${area.name} was deleted successfully.`,
  };
}
