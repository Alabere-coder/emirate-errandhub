"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";

export type ReviewActionState = {
  error?: string;
  success?: string;
};

export async function submitReview(
  _previousState: ReviewActionState,
  formData: FormData,
): Promise<ReviewActionState> {
  const { user, supabase } = await requireRole(["customer"]);

  const jobId = String(formData.get("jobId") ?? "").trim();
  const rawRating = Number(formData.get("rating"));
  const comment = String(formData.get("comment") ?? "").trim();

  if (!jobId) {
    return { error: "The job reference is missing." };
  }

  if (!Number.isInteger(rawRating) || rawRating < 1 || rawRating > 5) {
    return { error: "Please select a rating from 1 to 5 stars." };
  }

  if (comment.length > 1000) {
    return {
      error: "Your review must be 1,000 characters or fewer.",
    };
  }

  // Verify that this job belongs to the customer.
  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, customer_id, worker_id, status")
    .eq("id", jobId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (jobError) {
    console.error("Review job lookup error:", jobError);
    return { error: "Unable to verify this job. Please try again." };
  }

  if (!job) {
    return { error: "This job was not found in your account." };
  }

  if (job.status !== "completed") {
    return { error: "You can only review a completed job." };
  }

  // Check whether the customer already has a review for this job.
  const { data: existingReview, error: reviewLookupError } = await supabase
    .from("reviews")
    .select("id")
    .eq("job_id", job.id)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (reviewLookupError) {
    console.error("Review lookup error:", reviewLookupError);
    return {
      error: "Unable to load your existing review. Please try again.",
    };
  }

  if (existingReview) {
    // Update only the rating and comment.
    // Do not change is_visible or any moderation fields.
    const { data: updatedReview, error: updateError } = await supabase
      .from("reviews")
      .update({
        rating: rawRating,
        comment: comment || null,
      })
      .eq("id", existingReview.id)
      .eq("job_id", job.id)
      .eq("customer_id", user.id)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Update review error:", updateError);
      return {
        error: "We couldn't update your review. Please try again.",
      };
    }

    if (!updatedReview) {
      return {
        error:
          "Your review could not be updated. Please check your permissions and try again.",
      };
    }
  } else {
    // Create a review only if one does not already exist.
    const { error: insertError } = await supabase.from("reviews").insert({
      job_id: job.id,
      customer_id: user.id,
      worker_id: job.worker_id,
      rating: rawRating,
      comment: comment || null,
    });

    if (insertError) {
      console.error("Submit review error:", insertError);

      if (insertError.code === "23505") {
        return {
          error: "A review already exists for this job. Refresh and try again.",
        };
      }

      return {
        error:
          "We couldn't submit your review. Please check your permissions and try again.",
      };
    }
  }

  revalidatePath("/dashboard/customer/jobs");
  revalidatePath(`/dashboard/customer/jobs/${jobId}/review`);

  return {
    success: existingReview
      ? "Your review has been updated successfully."
      : "Thank you! Your review has been submitted.",
  };
}

// "use server";

// import { revalidatePath } from "next/cache";

// import { requireRole } from "@/lib/auth/require-role";

// export type ReviewActionState = {
//   error?: string;
//   success?: string;
// };

// export async function submitReview(
//   _previousState: ReviewActionState,
//   formData: FormData,
// ): Promise<ReviewActionState> {
//   const { user, supabase } = await requireRole(["customer"]);

//   const jobId = String(formData.get("jobId") ?? "").trim();
//   const rawRating = Number(formData.get("rating"));
//   const comment = String(formData.get("comment") ?? "").trim();

//   if (!jobId) {
//     return { error: "The job reference is missing." };
//   }

//   if (!Number.isInteger(rawRating) || rawRating < 1 || rawRating > 5) {
//     return { error: "Please select a rating from 1 to 5 stars." };
//   }

//   if (comment.length > 1000) {
//     return { error: "Your review must be 1,000 characters or fewer." };
//   }

//   const { data: job, error: jobError } = await supabase
//     .from("jobs")
//     .select("id, customer_id, worker_id, status")
//     .eq("id", jobId)
//     .eq("customer_id", user.id)
//     .maybeSingle();

//   if (jobError) {
//     console.error("Review job lookup error:", jobError);
//     return { error: "Unable to verify this job. Please try again." };
//   }

//   if (!job) {
//     return { error: "This job was not found in your account." };
//   }

//   if (job.status !== "completed") {
//     return { error: "You can only review a completed job." };
//   }

//   const { data: existingReview, error: existingReviewError } = await supabase
//     .from("reviews")
//     .select("id")
//     .eq("job_id", jobId)
//     .maybeSingle();

//   if (existingReviewError) {
//     console.error("Review duplicate check error:", existingReviewError);
//     return { error: "Unable to check existing reviews. Please try again." };
//   }

//   if (existingReview) {
//     return { error: "You have already submitted a review for this job." };
//   }

//   const { error: insertError } = await supabase.from("reviews").insert({
//     job_id: job.id,
//     customer_id: user.id,
//     worker_id: job.worker_id,
//     rating: rawRating,
//     comment: comment || null,
//   });

//   if (insertError) {
//     console.error("Submit review error:", insertError);

//     if (insertError.code === "23505") {
//       return { error: "A review has already been submitted for this job." };
//     }

//     return {
//       error:
//         "We couldn't submit your review. Check your connection or permissions and try again.",
//     };
//   }

//   revalidatePath("/dashboard/customer/jobs");
//   revalidatePath(`/dashboard/customer/jobs/${jobId}/review`);

//   return { success: "Thank you! Your review has been submitted." };
// }
