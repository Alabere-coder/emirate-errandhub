"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "../notifications/create-notification";

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

    // const { error } = await supabase.rpc("start_assigned_job", {
    //   p_job_id: jobId,
    // });
    const { error } = await supabase.rpc("start_assigned_job", {
      p_job_id: jobId,
    });

    if (!error) {
      const { data: job, error: lookupError } = await supabase
        .from("jobs")
        .select(
          `
      id,
      request_id,
      service_requests (
        customer_id
      )
    `,
        )
        .eq("id", jobId)
        .maybeSingle();

      if (lookupError) {
        console.error("Start job notification lookup error:", lookupError);
      } else if (job) {
        const request = job.service_requests;

        const customerId = Array.isArray(request)
          ? request[0]?.customer_id
          : request?.customer_id;

        if (customerId) {
          await createNotification({
            userId: customerId,
            type: "job_started",
            title: "Your job has started",
            message: "Your service provider has started working on your job.",
            link: `/dashboard/customer/jobs`,
            preference: "job_updates",
          });
        }
      }
    }

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

    const { data: jobDetails, error: notificationLookupError } = await supabase
      .from("jobs")
      .select(
        `
    id,
    service_requests (
      customer_id
    )
  `,
      )
      .eq("id", jobId)
      .maybeSingle();

    if (notificationLookupError) {
      console.error(
        "Complete job notification lookup error:",
        notificationLookupError,
      );
    } else if (jobDetails) {
      const request = jobDetails.service_requests;

      const customerId = Array.isArray(request)
        ? request[0]?.customer_id
        : request?.customer_id;

      if (customerId) {
        await createNotification({
          userId: customerId,
          type: "job_completed",
          title: "Job completed",
          message:
            "Your service provider has marked your job as completed. You can now review the service.",
          link: `/dashboard/customer/jobs`,
          preference: "job_updates",
        });
      }
    }

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
