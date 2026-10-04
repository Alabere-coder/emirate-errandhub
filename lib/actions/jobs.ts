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

  const { error: updateError } = await supabase
    .from("jobs")
    .update({
      status: "in_progress",
      started_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("worker_id", workerProfile.id);

  if (updateError) {
    console.error("Start job update error:", updateError);

    return {
      error: "Unable to start this job.",
    };
  }

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
    .select("id, status")
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

  const { error: updateError } = await supabase
    .from("jobs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", job.id)
    .eq("worker_id", workerProfile.id);

  if (updateError) {
    console.error("Complete job update error:", updateError);

    return {
      error: "Unable to complete this job.",
    };
  }

  revalidatePath(`/dashboard/worker/jobs/my/${job.id}`);
  revalidatePath("/dashboard/worker/jobs/my");

  return {
    success: "Job completed successfully.",
  };
}
