"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type WorkerApplicationActionState = {
  error?: string;
  success?: string;
};

export type WorkerApplicationState = {
  error?: string;
  success?: string;
};

export async function submitWorkerApplication(
  _previousState: WorkerApplicationState,
  formData: FormData,
): Promise<WorkerApplicationState> {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const applicationNote = formData.get("application_note");

  if (typeof applicationNote !== "string") {
    return {
      error:
        "Please tell us about your experience and the services you provide.",
    };
  }

  const note = applicationNote.trim();

  if (note.length < 30) {
    return {
      error:
        "Please provide at least 30 characters describing your experience and services.",
    };
  }

  const { data: existingApplication, error: existingError } = await supabase
    .from("worker_applications")
    .select("id, status")
    .eq("user_id", user.id)
    .maybeSingle();

  if (existingError) {
    console.error("Load worker application error:", existingError);

    return {
      error: "Unable to check your application.",
    };
  }

  if (
    existingApplication?.status === "pending" ||
    existingApplication?.status === "approved"
  ) {
    return {
      error: "You already have an active worker application.",
    };
  }

  if (existingApplication?.status === "rejected") {
    const { error } = await supabase
      .from("worker_applications")
      .update({
        application_note: note,
        status: "pending",
        rejection_reason: null,
        reviewed_by: null,
        reviewed_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingApplication.id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Resubmit worker application error:", error);

      return {
        error: "Unable to resubmit your application.",
      };
    }
  } else {
    const { error } = await supabase.from("worker_applications").insert({
      user_id: user.id,
      application_note: note,
      status: "pending",
    });

    if (error) {
      console.error("Create worker application error:", error);

      return {
        error: "Unable to submit your application.",
      };
    }
  }

  revalidatePath("/dashboard/worker/application");
  revalidatePath("/dashboard/worker");

  return {
    success: "Your worker application has been submitted for review.",
  };
}

export async function approveWorkerApplication(
  _previousState: WorkerApplicationActionState,
  formData: FormData,
): Promise<WorkerApplicationActionState> {
  const { user } = await requireRole(["admin"]);
  const supabase = await createClient();

  const applicationId = formData.get("application_id");

  if (typeof applicationId !== "string") {
    return {
      error: "Invalid application.",
    };
  }

  const { data: application, error: applicationError } = await supabase
    .from("worker_applications")
    .select("id, user_id, status")
    .eq("id", applicationId)
    .maybeSingle();

  if (applicationError || !application) {
    console.error("Load application for approval error:", applicationError);

    return {
      error: "Application not found.",
    };
  }

  if (application.status !== "pending") {
    return {
      error: "Only pending applications can be approved.",
    };
  }

  const { error: applicationUpdateError } = await supabase
    .from("worker_applications")
    .update({
      status: "approved",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", application.id);

  if (applicationUpdateError) {
    console.error("Approve worker application error:", applicationUpdateError);

    return {
      error: "Unable to approve the application.",
    };
  }

  const { data: existingWorker, error: workerLookupError } = await supabase
    .from("worker_profiles")
    .select("id")
    .eq("user_id", application.user_id)
    .maybeSingle();

  if (workerLookupError) {
    console.error("Load worker profile error:", workerLookupError);

    return {
      error:
        "Application was approved, but the worker profile could not be checked.",
    };
  }

  if (existingWorker) {
    const { error: workerUpdateError } = await supabase
      .from("worker_profiles")
      .update({
        verification_status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingWorker.id);

    if (workerUpdateError) {
      console.error("Update worker profile error:", workerUpdateError);

      return {
        error:
          "Application was approved, but the worker profile could not be updated.",
      };
    }
  } else {
    const { error: workerCreateError } = await supabase
      .from("worker_profiles")
      .insert({
        user_id: application.user_id,
        verification_status: "pending",
        is_available: false,
      });

    if (workerCreateError) {
      console.error("Create worker profile error:", workerCreateError);

      return {
        error:
          "Application was approved, but the worker profile could not be created.",
      };
    }
  }

  revalidatePath("/dashboard/admin/worker-applications");
  revalidatePath(`/dashboard/admin/worker-applications/${application.id}`);
  revalidatePath("/dashboard/worker");

  return {
    success: "Worker application approved.",
  };
}

export async function rejectWorkerApplication(
  _previousState: WorkerApplicationActionState,
  formData: FormData,
): Promise<WorkerApplicationActionState> {
  const { user } = await requireRole(["admin"]);
  const supabase = await createClient();

  const applicationId = formData.get("application_id");
  const rejectionReason = formData.get("rejection_reason");

  if (typeof applicationId !== "string") {
    return {
      error: "Invalid application.",
    };
  }

  if (typeof rejectionReason !== "string") {
    return {
      error: "Please provide a rejection reason.",
    };
  }

  const reason = rejectionReason.trim();

  if (reason.length < 10) {
    return {
      error: "The rejection reason must be at least 10 characters.",
    };
  }

  const { data: application, error: applicationError } = await supabase
    .from("worker_applications")
    .select("id, status")
    .eq("id", applicationId)
    .maybeSingle();

  if (applicationError || !application) {
    return {
      error: "Application not found.",
    };
  }

  if (application.status !== "pending") {
    return {
      error: "Only pending applications can be rejected.",
    };
  }

  const { error } = await supabase
    .from("worker_applications")
    .update({
      status: "rejected",
      rejection_reason: reason,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", application.id);

  if (error) {
    console.error("Reject worker application error:", error);

    return {
      error: "Unable to reject the application.",
    };
  }

  revalidatePath("/dashboard/admin/worker-applications");
  revalidatePath(`/dashboard/admin/worker-applications/${application.id}`);

  return {
    success: "Worker application rejected.",
  };
}
