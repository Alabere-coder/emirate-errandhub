"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type WorkerProfileActionState = {
  error?: string;
  success?: string;
};

function getString(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function getNumber(formData: FormData, name: string) {
  const value = getString(formData, name);

  if (!value) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function getBoolean(formData: FormData, name: string) {
  return formData.get(name) === "true";
}

export async function updateWorkerProfile(
  _previousState: WorkerProfileActionState,
  formData: FormData,
): Promise<WorkerProfileActionState> {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const bio = getString(formData, "bio");
  const yearsOfExperience = getNumber(formData, "years_of_experience");
  const startingPrice = getNumber(formData, "starting_price");
  const currency = getString(formData, "currency") || "NGN";
  const isAvailable = getBoolean(formData, "is_available");

  if (bio.length > 2000) {
    return {
      error: "Your bio cannot exceed 2000 characters.",
    };
  }

  if (
    yearsOfExperience === null ||
    !Number.isInteger(yearsOfExperience) ||
    yearsOfExperience < 0
  ) {
    return {
      error: "Please enter a valid number of years of experience.",
    };
  }

  if (startingPrice === null || startingPrice < 0) {
    return {
      error: "Please enter a valid starting price.",
    };
  }

  const allowedCurrencies = ["NGN", "USD", "GBP", "EUR"];

  if (!allowedCurrencies.includes(currency)) {
    return {
      error: "Please select a valid currency.",
    };
  }

  const { data: workerProfile, error: workerProfileError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (workerProfileError) {
    console.error("Worker profile lookup error:", workerProfileError);

    return {
      error: "Unable to load your worker profile.",
    };
  }

  if (!workerProfile) {
    return {
      error:
        "Your worker profile has not been created yet. Please contact an administrator.",
    };
  }

  const { error: updateError } = await supabase
    .from("worker_profiles")
    .update({
      bio: bio || null,
      years_of_experience: yearsOfExperience,
      starting_price: startingPrice,
      currency,
      is_available: isAvailable,
    })
    .eq("id", workerProfile.id)
    .eq("user_id", user.id);

  if (updateError) {
    console.error("Worker profile update error:", updateError);

    return {
      error: "Unable to update your worker profile. Please try again.",
    };
  }

  revalidatePath("/dashboard/worker/profile");
  revalidatePath("/dashboard/worker");
  revalidatePath(`/workers/${workerProfile.id}`);

  return {
    success: "Your worker profile has been updated successfully.",
  };
}
