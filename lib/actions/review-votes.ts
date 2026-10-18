"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export async function voteOnReview(
  reviewId: string,
  voteValue: 1 | -1 | null,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireRole(["customer"]);

    const validReviewId =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (!validReviewId.test(reviewId)) {
      return { success: false, error: "Invalid review." };
    }

    if (![1, -1, null].includes(voteValue)) {
      return { success: false, error: "Invalid vote." };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        success: false,
        error: "Please sign in to vote.",
      };
    }

    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("id, is_visible")
      .eq("id", reviewId)
      .maybeSingle();

    if (reviewError || !review) {
      return { success: false, error: "Review not found." };
    }

    if (!review.is_visible) {
      return {
        success: false,
        error: "You cannot vote on a hidden review.",
      };
    }

    if (voteValue === null) {
      const { error } = await supabase
        .from("review_votes")
        .delete()
        .eq("review_id", reviewId)
        .eq("voter_id", user.id);

      if (error) {
        console.error("Removing review vote failed:", error.code);
        return {
          success: false,
          error: "Unable to remove your vote.",
        };
      }
    } else {
      const { error } = await supabase.from("review_votes").upsert(
        {
          review_id: reviewId,
          voter_id: user.id,
          vote: voteValue,
        },
        {
          onConflict: "review_id,voter_id",
        },
      );

      if (error) {
        console.error("Saving review vote failed:", error.code);
        return {
          success: false,
          error: "Unable to save your vote.",
        };
      }
    }

    revalidatePath("/dashboard/customer/workers");
    revalidatePath("/dashboard/customer/workers/[id]", "page");

    return { success: true };
  } catch (error) {
    console.error("Review voting failed:", error);

    return {
      success: false,
      error: "Something went wrong. Please try again.",
    };
  }
}

// "use server";

// import { revalidatePath } from "next/cache";

// import { requireRole } from "@/lib/auth/require-role";
// import { createClient } from "@/lib/supabase/server";

// export async function voteOnReview(formData: FormData): Promise<void> {
//   await requireRole(["customer"]);

//   const reviewId = String(formData.get("review_id") ?? "").trim();
//   const voteValue = String(formData.get("vote") ?? "");

//   if (
//     !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
//       reviewId,
//     )
//   ) {
//     throw new Error("Invalid review.");
//   }

//   if (!["1", "-1", "remove"].includes(voteValue)) {
//     throw new Error("Invalid vote.");
//   }

//   const supabase = await createClient();

//   const {
//     data: { user },
//     error: authError,
//   } = await supabase.auth.getUser();

//   if (authError || !user) {
//     throw new Error("Please sign in to vote.");
//   }

//   const { data: review, error: reviewError } = await supabase
//     .from("reviews")
//     .select("id, customer_id, is_visible")
//     .eq("id", reviewId)
//     .maybeSingle();

//   if (reviewError || !review) {
//     throw new Error("Review not found.");
//   }

//   if (!review.is_visible) {
//     throw new Error("You cannot vote on a hidden review.");
//   }

//   // if (review.customer_id === user.id) {
//   //   throw new Error("You cannot vote on your own review.");
//   // }

//   if (voteValue === "remove") {
//     const { error } = await supabase
//       .from("review_votes")
//       .delete()
//       .eq("review_id", reviewId)
//       .eq("voter_id", user.id);

//     if (error) {
//       console.error("Removing review vote failed:", error.code);
//       throw new Error("Unable to remove your vote.");
//     }
//   } else {
//     const { error } = await supabase.from("review_votes").upsert(
//       {
//         review_id: reviewId,
//         voter_id: user.id,
//         vote: Number(voteValue),
//       },
//       {
//         onConflict: "review_id,voter_id",
//       },
//     );

//     if (error) {
//       console.error("Saving review vote failed:", error.code);
//       throw new Error("Unable to save your vote.");
//     }
//   }

//   revalidatePath("/dashboard/customer/workers");
//   revalidatePath("/dashboard/customer/workers/[id]", "page");
// }
