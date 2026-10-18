"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export async function moderateReview(formData: FormData) {
  await requireRole(["admin"]);

  const reviewId = String(formData.get("review_id") ?? "").trim();

  const visibilityValue = String(formData.get("new_visibility") ?? "");

  const reason = String(formData.get("reason") ?? "").trim();

  if (!reviewId || !["true", "false"].includes(visibilityValue)) {
    throw new Error("Invalid review moderation request.");
  }

  if (reason.length < 5 || reason.length > 1000) {
    throw new Error(
      "The moderation reason must be between 5 and 1000 characters.",
    );
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("moderate_review", {
    p_review_id: reviewId,
    p_new_visibility: visibilityValue === "true",
    p_reason: reason,
  });

  if (error) {
    console.error("Review moderation failed:", error.message);
    throw new Error(
      "Unable to moderate this review. Please check your permissions and try again.",
    );
  }

  revalidatePath("/dashboard/admin/reviews");
  revalidatePath("/dashboard/customer/workers");
}
