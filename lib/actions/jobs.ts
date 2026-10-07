"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type JobActionState = {
  error?: string;
  success?: string;
};

export async function startJob(
  _previousState: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const jobId = formData.get("job_id");

  if (typeof jobId !== "string" || !jobId) {
    return {
      error: "Job ID is required.",
    };
  }

  const { data: workerProfile } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!workerProfile) {
    return {
      error: "Your worker profile could not be found.",
    };
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, status")
    .eq("id", jobId)
    .eq("worker_id", workerProfile.id)
    .maybeSingle();

  if (jobError) {
    console.error("Start job lookup error:", jobError);
    return {
      error: "Unable to load this job.",
    };
  }

  if (!job) {
    return {
      error: "Job not found.",
    };
  }

  if (job.status !== "assigned") {
    return {
      error: "Only assigned jobs can be started.",
    };
  }

  const { data: updatedJob, error: updateError } = await supabase
    .from("jobs")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("worker_id", workerProfile.id)
    .select("id, status, started_at")
    .maybeSingle();

  if (updateError) {
    console.error("Start job update error:", updateError);

    return {
      error: "Unable to start this job.",
    };
  }

  if (!updatedJob) {
    console.error("Start job update affected no rows:", {
      jobId: job.id,
      workerId: workerProfile.id,
    });

    return {
      error: "The job could not be updated. Please check the job permissions.",
    };
  }

  const { error: historyError } = await supabase
    .from("job_status_history")
    .insert({
      job_id: job.id,
      status: "in_progress",
      note: "Worker started the job.",
      changed_by: user.id,
    });

  if (historyError) {
    console.error("Start job status history error:", historyError);
  }

  console.log("START JOB UPDATED:", updatedJob);

  revalidatePath(`/dashboard/worker/jobs/my/${job.id}`);
  revalidatePath("/dashboard/worker/jobs/my");

  return {
    success: "Job started successfully.",
  };
}

export async function completeJob(
  _previousState: JobActionState,
  formData: FormData,
): Promise<JobActionState> {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const jobId = formData.get("job_id");

  if (typeof jobId !== "string" || !jobId) {
    return {
      error: "Job ID is required.",
    };
  }

  const { data: workerProfile } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!workerProfile) {
    return {
      error: "Your worker profile could not be found.",
    };
  }

  const { data: job, error: jobError } = await supabase
    .from("jobs")
    .select("id, status, request_id")
    .eq("id", jobId)
    .eq("worker_id", workerProfile.id)
    .maybeSingle();

  if (jobError) {
    console.error("Complete job lookup error:", jobError);

    return {
      error: "Unable to load this job.",
    };
  }

  if (!job) {
    return {
      error: "Job not found.",
    };
  }

  if (job.status !== "in_progress") {
    return {
      error: "Only jobs in progress can be completed.",
    };
  }

  const { data: updatedJob, error: updateError } = await supabase
    .from("jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("worker_id", workerProfile.id)
    .select("id, status, completed_at")
    .maybeSingle();

  if (updateError) {
    console.error("Complete job update error:", updateError);

    return {
      error: "Unable to complete this job.",
    };
  }

  if (!updatedJob) {
    console.error("Complete job update affected no rows:", {
      jobId: job.id,
      workerId: workerProfile.id,
    });

    return {
      error: "The job could not be updated. Please check the job permissions.",
    };
  }

  const { error: historyError } = await supabase
    .from("job_status_history")
    .insert({
      job_id: job.id,
      status: "completed",
      note: "Worker completed the job.",
      changed_by: user.id,
    });

  if (historyError) {
    console.error("Complete job status history error:", historyError);
  }

  console.log("COMPLETE JOB UPDATED:", updatedJob);

  revalidatePath(`/dashboard/worker/jobs/my/${job.id}`);
  revalidatePath("/dashboard/worker/jobs/my");

  // Customer request page
  revalidatePath(`/dashboard/customer/requests/${job.request_id}`);

  return {
    success: "Job completed successfully.",
  };
}
