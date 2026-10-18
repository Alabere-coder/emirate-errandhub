"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type ReportActionState = {
  success: boolean;
  message: string;
};

const initialError: ReportActionState = {
  success: false,
  message: "",
};

const allowedReasons = [
  "abusive",
  "fraudulent",
  "spam",
  "irrelevant",
  "other",
] as const;

export async function submitReviewReport(
  _previousState: ReportActionState,
  formData: FormData,
): Promise<ReportActionState> {
  await requireRole(["customer", "worker"]);

  const reviewId = String(formData.get("review_id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const details = String(formData.get("details") ?? "").trim();

  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      reviewId,
    )
  ) {
    return {
      success: false,
      message: "Invalid review. Please refresh the page and try again.",
    };
  }

  if (!allowedReasons.includes(reason as (typeof allowedReasons)[number])) {
    return {
      success: false,
      message: "Please select a valid reason for reporting this review.",
    };
  }

  if (details.length > 1000) {
    return {
      success: false,
      message: "Details must not exceed 1,000 characters.",
    };
  }

  const supabase = await createClient();

  const { data: authData, error: authError } = await supabase.auth.getUser();

  if (authError || !authData.user) {
    return {
      success: false,
      message: "Your session has expired. Please sign in again.",
    };
  }

  const { error } = await supabase.from("review_reports").insert({
    review_id: reviewId,
    reporter_id: authData.user.id,
    reason,
    details: details || null,
  });

  if (error) {
    console.error("Review report submission failed:", error.code);

    if (error.code === "23505") {
      return {
        success: false,
        message: "You have already reported this review.",
      };
    }

    if (error.code === "42501") {
      return {
        success: false,
        message:
          "This review cannot be reported, or you do not have permission to report it.",
      };
    }

    return {
      success: false,
      message: "We could not submit your report. Please try again.",
    };
  }

  revalidatePath("/dashboard/admin/review-reports");

  return {
    success: true,
    message: "Report submitted. An administrator will review it.",
  };
}
