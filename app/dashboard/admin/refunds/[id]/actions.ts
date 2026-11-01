"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type RefundReviewState = {
  error?: string;
  success?: string;
};

export async function reviewRefund(
  _prevState: RefundReviewState,
  formData: FormData,
): Promise<RefundReviewState> {
  await requireRole(["admin"]);

  const refundId = String(formData.get("refundId") ?? "");
  const decision = String(formData.get("decision") ?? "");
  const adminNote = String(formData.get("adminNote") ?? "").trim();

  if (!refundId) {
    return { error: "Invalid refund request." };
  }

  if (!["under_review", "approved", "rejected"].includes(decision)) {
    return { error: "Invalid review decision." };
  }

  if (adminNote.length > 2000) {
    return { error: "Admin note must not exceed 2,000 characters." };
  }

  if (decision === "rejected" && adminNote.length < 5) {
    return {
      error:
        "Please provide a reason of at least 5 characters before rejecting.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Please sign in again." };
  }

  const { data, error } = await supabase
    .from("refunds")
    .update({
      status: decision,
      admin_note: adminNote || null,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", refundId)
    .in("status", ["requested", "under_review"])
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Refund review failed:", error);
    return { error: "Unable to update this refund. Please try again." };
  }

  if (!data) {
    return {
      error:
        "This refund has already been reviewed or its status has changed. Refresh the page.",
    };
  }

  revalidatePath("/dashboard/admin/refunds");
  revalidatePath(`/dashboard/admin/refunds/${refundId}`);

  return {
    success:
      decision === "under_review"
        ? "Refund marked as under review."
        : decision === "approved"
          ? "Refund approved. It has not been paid yet."
          : "Refund request rejected.",
  };
}
