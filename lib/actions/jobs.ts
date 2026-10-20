"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type JobActionState = {
  error?: string;
  success?: string;
};

function isValidJobId(value: FormDataEntryValue | null): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export async function startJob(
  _previousState: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  try {
    await requireRole(["worker"]);
    const supabase = await createClient();

    const jobId = formData.get("job_id");

    if (!isValidJobId(jobId)) {
      return { error: "A valid job ID is required." };
    }

    const { error } = await supabase.rpc("start_assigned_job", {
      p_job_id: jobId,
    });

    if (error) {
      console.error("Start job RPC error:", error);

      const message = error.message.toLowerCase();

      if (
        message.includes("payment") ||
        message.includes("deposit") ||
        message.includes("balance")
      ) {
        return {
          error: error.message,
        };
      }

      if (message.includes("no longer available")) {
        return {
          error: "This job is no longer available to start.",
        };
      }

      return {
        error: "Unable to start this job. Please refresh and try again.",
      };
    }

    revalidatePath(`/dashboard/worker/jobs/my/${jobId}`);
    revalidatePath("/dashboard/worker/jobs/my");

    return { success: "Job started successfully." };
  } catch (error) {
    console.error("Start job action error:", error);
    return { error: "Unable to start this job. Please try again." };
  }
}

export async function completeJob(
  _previousState: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  try {
    await requireRole(["worker"]);
    const supabase = await createClient();

    const jobId = formData.get("job_id");

    if (!isValidJobId(jobId)) {
      return { error: "A valid job ID is required." };
    }

    // Fetch the request ID for page revalidation.
    const { data: job, error: lookupError } = await supabase
      .from("jobs")
      .select("id, request_id")
      .eq("id", jobId)
      .maybeSingle();

    if (lookupError || !job) {
      if (lookupError) {
        console.error("Complete job lookup error:", lookupError);
      }

      return { error: "Unable to find this job." };
    }

    const { error } = await supabase.rpc("complete_in_progress_job", {
      p_job_id: jobId,
    });

    if (error) {
      console.error("Complete job RPC error:", error);
      return {
        error: "Unable to complete this job. It may no longer be in progress.",
      };
    }

    revalidatePath(`/dashboard/worker/jobs/my/${jobId}`);
    revalidatePath("/dashboard/worker/jobs/my");
    revalidatePath(`/dashboard/customer/requests/${job.request_id}`);

    return { success: "Job completed successfully." };
  } catch (error) {
    console.error("Complete job action error:", error);
    return { error: "Unable to complete this job. Please try again." };
  }
}

// export async function startJob(
//   _previousState: JobActionState,
//   formData: FormData,
// ): Promise<JobActionState> {
//   const { user } = await requireRole(["worker"]);
//   const supabase = await createClient();

//   const jobId = formData.get("job_id");

//   if (typeof jobId !== "string" || !jobId) {
//     return {
//       error: "Job ID is required.",
//     };
//   }

//   const { data: workerProfile } = await supabase
//     .from("worker_profiles")
//     .select("id")
//     .eq("user_id", user.id)
//     .maybeSingle();

//   if (!workerProfile) {
//     return {
//       error: "Your worker profile could not be found.",
//     };
//   }

//   const { data: job, error: jobError } = await supabase
//     .from("jobs")
//     .select("id, status")
//     .eq("id", jobId)
//     .eq("worker_id", workerProfile.id)
//     .maybeSingle();

//   if (jobError) {
//     console.error("Start job lookup error:", jobError);
//     return {
//       error: "Unable to load this job.",
//     };
//   }

//   if (!job) {
//     return {
//       error: "Job not found.",
//     };
//   }

//   if (job.status !== "assigned") {
//     return {
//       error: "Only assigned jobs can be started.",
//     };
//   }

//   const { data: updatedJob, error: updateError } = await supabase
//     .from("jobs")
//     .update({
//       status: "in_progress",
//       started_at: new Date().toISOString(),
//     })
//     .eq("id", job.id)
//     .eq("worker_id", workerProfile.id)
//     .select("id, status, started_at")
//     .maybeSingle();

//   if (updateError) {
//     console.error("Start job update error:", updateError);

//     return {
//       error: "Unable to start this job.",
//     };
//   }

//   if (!updatedJob) {
//     console.error("Start job update affected no rows:", {
//       jobId: job.id,
//       workerId: workerProfile.id,
//     });

//     return {
//       error: "The job could not be updated. Please check the job permissions.",
//     };
//   }

//   const { error: historyError } = await supabase
//     .from("job_status_history")
//     .insert({
//       job_id: job.id,
//       status: "in_progress",
//       note: "Worker started the job.",
//       changed_by: user.id,
//     });

//   if (historyError) {
//     console.error("Start job status history error:", historyError);
//   }

//   console.log("START JOB UPDATED:", updatedJob);

//   revalidatePath(`/dashboard/worker/jobs/my/${job.id}`);
//   revalidatePath("/dashboard/worker/jobs/my");

//   return {
//     success: "Job started successfully.",
//   };
// }

// export async function completeJob(
//   _previousState: JobActionState,
//   formData: FormData,
// ): Promise<JobActionState> {
//   const { user } = await requireRole(["worker"]);
//   const supabase = await createClient();

//   const jobId = formData.get("job_id");

//   if (typeof jobId !== "string" || !jobId) {
//     return {
//       error: "Job ID is required.",
//     };
//   }

//   const { data: workerProfile } = await supabase
//     .from("worker_profiles")
//     .select("id")
//     .eq("user_id", user.id)
//     .maybeSingle();

//   if (!workerProfile) {
//     return {
//       error: "Your worker profile could not be found.",
//     };
//   }

//   const { data: job, error: jobError } = await supabase
//     .from("jobs")
//     .select("id, status, request_id")
//     .eq("id", jobId)
//     .eq("worker_id", workerProfile.id)
//     .maybeSingle();

//   if (jobError) {
//     console.error("Complete job lookup error:", jobError);

//     return {
//       error: "Unable to load this job.",
//     };
//   }

//   if (!job) {
//     return {
//       error: "Job not found.",
//     };
//   }

//   if (job.status !== "in_progress") {
//     return {
//       error: "Only jobs in progress can be completed.",
//     };
//   }

//   const { data: updatedJob, error: updateError } = await supabase
//     .from("jobs")
//     .update({
//       status: "completed",
//       completed_at: new Date().toISOString(),
//     })
//     .eq("id", job.id)
//     .eq("worker_id", workerProfile.id)
//     .select("id, status, completed_at")
//     .maybeSingle();

//   if (updateError) {
//     console.error("Complete job update error:", updateError);

//     return {
//       error: "Unable to complete this job.",
//     };
//   }

//   if (!updatedJob) {
//     console.error("Complete job update affected no rows:", {
//       jobId: job.id,
//       workerId: workerProfile.id,
//     });

//     return {
//       error: "The job could not be updated. Please check the job permissions.",
//     };
//   }

//   const { error: historyError } = await supabase
//     .from("job_status_history")
//     .insert({
//       job_id: job.id,
//       status: "completed",
//       note: "Worker completed the job.",
//       changed_by: user.id,
//     });

//   if (historyError) {
//     console.error("Complete job status history error:", historyError);
//   }

//   console.log("COMPLETE JOB UPDATED:", updatedJob);

//   revalidatePath(`/dashboard/worker/jobs/my/${job.id}`);
//   revalidatePath("/dashboard/worker/jobs/my");

//   // Customer request page
//   revalidatePath(`/dashboard/customer/requests/${job.request_id}`);

//   return {
//     success: "Job completed successfully.",
//   };
// }
