"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type ConfirmJobState = {
  error?: string;
  success?: string;
};

export async function confirmJobCompletion(
  _previousState: ConfirmJobState,
  formData: FormData,
): Promise<ConfirmJobState> {
  try {
    const { user } = await requireRole(["customer"]);
    const supabase = await createClient();
    const jobId = formData.get("job_id");

    if (typeof jobId !== "string" || !jobId) {
      return { error: "Job ID is required." };
    }

    const { data: job, error: lookupError } = await supabase
      .from("jobs")
      .select("id, request_id")
      .eq("id", jobId)
      .eq("customer_id", user.id)
      .maybeSingle();

    if (lookupError || !job) {
      return { error: "Unable to find this job." };
    }

    const { error } = await supabase.rpc("confirm_completed_job", {
      p_job_id: jobId,
    });

    if (error) {
      console.error("Customer job confirmation error:", error);
      return {
        error:
          "Unable to confirm completion. The job may not be completed or may already be confirmed.",
      };
    }

    revalidatePath(`/dashboard/customer/requests/${job.request_id}`);
    revalidatePath("/dashboard/customer/requests");
    revalidatePath(`/dashboard/worker/jobs/my/${jobId}`);
    revalidatePath("/dashboard/worker/jobs/my");

    return {
      success:
        "Job completion confirmed. Earnings still require payment verification and admin approval.",
    };
  } catch (error) {
    console.error("Confirm job action error:", error);
    return { error: "Unable to confirm job completion. Please try again." };
  }
}
