"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export async function manageReviewReport(formData: FormData) {
  await requireRole(["admin"]);

  const reportId = String(formData.get("report_id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const notes = String(formData.get("admin_notes") ?? "").trim();

  const allowedStatuses = ["under_review", "resolved", "dismissed"];

  if (!reportId || !allowedStatuses.includes(status)) {
    throw new Error("Invalid report management request.");
  }

  if (notes.length > 1000) {
    throw new Error("Admin notes cannot exceed 1,000 characters.");
  }

  const supabase = await createClient();

  const { error } = await supabase.rpc("manage_review_report", {
    p_report_id: reportId,
    p_status: status,
    p_admin_notes: notes,
  });

  if (error) {
    console.error("Managing review report failed:", error.code);
    throw new Error("Unable to update this report. Please try again.");
  }

  revalidatePath("/dashboard/admin/review-reports");
  revalidatePath("/dashboard/admin/reviews");
  revalidatePath("/dashboard/customer/workers");
}
