"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type WorkerCategoryActionState = {
  error?: string;
  success?: string;
};

export async function updateWorkerCategories(
  _previousState: WorkerCategoryActionState,
  formData: FormData,
): Promise<WorkerCategoryActionState> {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const workerId = formData.get("worker_id");
  const categoryIds = formData.getAll("category_ids");

  if (typeof workerId !== "string" || !workerId) {
    return {
      error: "Your worker profile could not be identified.",
    };
  }

  if (
    categoryIds.some(
      (categoryId) => typeof categoryId !== "string" || !categoryId,
    )
  ) {
    return {
      error: "Invalid service category selection.",
    };
  }

  const selectedCategoryIds = categoryIds as string[];

  if (selectedCategoryIds.length === 0) {
    return {
      error: "Please select at least one service category.",
    };
  }

  /*
   * Make sure the worker ID actually belongs to the
   * currently authenticated worker.
   */
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

  /*
   * Make sure all selected categories are active categories.
   */
  const { data: validCategories, error: categoriesError } = await supabase
    .from("service_categories")
    .select("id")
    .in("id", selectedCategoryIds)
    .eq("is_active", true);

  if (categoriesError) {
    return {
      error: "Unable to verify the selected categories.",
    };
  }

  if (
    !validCategories ||
    validCategories.length !== selectedCategoryIds.length
  ) {
    return {
      error: "One or more selected categories are invalid or inactive.",
    };
  }

  /*
   * Replace the worker's existing category selections.
   */
  const { error: deleteError } = await supabase
    .from("worker_categories")
    .delete()
    .eq("worker_id", workerId);

  if (deleteError) {
    return {
      error: "Unable to update your service categories.",
    };
  }

  const rows = selectedCategoryIds.map((categoryId) => ({
    worker_id: workerId,
    category_id: categoryId,
  }));

  const { error: insertError } = await supabase
    .from("worker_categories")
    .insert(rows);

  if (insertError) {
    return {
      error: "Unable to save your service categories.",
    };
  }

  revalidatePath("/dashboard/worker/categories");
  revalidatePath("/dashboard/worker");

  return {
    success: "Your service categories have been updated.",
  };
}
