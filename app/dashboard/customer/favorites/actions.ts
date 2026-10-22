"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function addFavoriteWorker(workerId: string) {
  const { user } = await requireRole(["customer"]);

  if (!UUID_REGEX.test(workerId)) {
    return { success: false, error: "Invalid worker." };
  }

  const supabase = await createClient();

  // Only allow customers to save verified worker profiles.
  const { data: worker, error: workerError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("id", workerId)
    .eq("verification_status", "verified")
    .maybeSingle();

  if (workerError || !worker) {
    return {
      success: false,
      error: "This verified worker could not be found.",
    };
  }

  const { error } = await supabase.from("favorite_workers").upsert(
    {
      customer_id: user.id,
      worker_id: workerId,
    },
    {
      onConflict: "customer_id,worker_id",
      ignoreDuplicates: true,
    },
  );

  if (error) {
    console.error("Failed to add favorite worker:", error);
    return {
      success: false,
      error: "Could not save this worker. Please try again.",
    };
  }

  revalidatePath("/dashboard/customer/favorites");
  revalidatePath("/dashboard/customer/workers");

  return { success: true };
}

export async function removeFavoriteWorker(workerId: string) {
  const { user } = await requireRole(["customer"]);

  if (!UUID_REGEX.test(workerId)) {
    return { success: false, error: "Invalid worker." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("favorite_workers")
    .delete()
    .eq("customer_id", user.id)
    .eq("worker_id", workerId);

  if (error) {
    console.error("Failed to remove favorite worker:", error);
    return {
      success: false,
      error: "Could not remove this worker. Please try again.",
    };
  }

  revalidatePath("/dashboard/customer/favorites");
  revalidatePath("/dashboard/customer/workers");

  return { success: true };
}
