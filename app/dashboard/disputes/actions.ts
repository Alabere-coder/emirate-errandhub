"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "../../../lib/notifications/create-notification";

export type DisputeActionState = {
  error?: string;
  success?: string;
  disputeId?: string;
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 3;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function isValidUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function getSafeExtension(file: File): string | null {
  switch (file.type) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return null;
  }
}

export async function createDispute(
  _previousState: DisputeActionState,
  formData: FormData,
): Promise<DisputeActionState> {
  const { user } = await requireRole(["customer", "worker"]);

  const supabase = await createClient();

  const { data: openerProfile, error: openerError } = await supabase
    .from("profiles")
    .select("first_name, last_name, role")
    .eq("id", user.id)
    .single();

  if (openerError || !openerProfile) {
    console.error("Failed to load dispute opener profile:", openerError);
    return {
      error: "Could not identify your account. Please try again.",
    };
  }

  const openerName =
    [openerProfile.first_name, openerProfile.last_name]
      .filter(Boolean)
      .join(" ") || "Unknown user";

  const openerRole = openerProfile.role === "worker" ? "Worker" : "Customer";

  try {
    const supabase = await createClient();

    const jobId = formData.get("job_id");
    const reason = formData.get("reason");
    const description = formData.get("description");

    if (!isValidUuid(jobId)) {
      return { error: "A valid job ID is required." };
    }

    if (
      typeof reason !== "string" ||
      reason.trim().length < 3 ||
      reason.trim().length > 120
    ) {
      return { error: "Enter a reason between 3 and 120 characters." };
    }

    if (
      typeof description !== "string" ||
      description.trim().length < 20 ||
      description.trim().length > 3000
    ) {
      return {
        error: "Describe the issue in 20 to 3,000 characters.",
      };
    }

    const evidenceEntries = formData
      .getAll("evidence")
      .filter(
        (entry): entry is File => entry instanceof File && entry.size > 0,
      );

    if (evidenceEntries.length > MAX_FILES) {
      return { error: "Attach no more than 3 evidence images." };
    }

    for (const file of evidenceEntries) {
      if (!ALLOWED_TYPES.has(file.type)) {
        return {
          error: "Evidence must be a JPEG, PNG, or WebP image.",
        };
      }

      if (file.size > MAX_FILE_SIZE) {
        return {
          error: "Each evidence image must be 5 MB or smaller.",
        };
      }

      if (!getSafeExtension(file)) {
        return { error: "One of the evidence file types is unsupported." };
      }
    }

    const { data: job, error: jobError } = await supabase
      .from("jobs")
      .select("id, customer_id, worker_id, request_id")
      .eq("id", jobId)
      .maybeSingle();

    if (jobError || !job) {
      return { error: "Unable to find this job." };
    }

    let isParticipant = job.customer_id === user.id;

    if (!isParticipant) {
      const { data: workerProfile, error: workerError } = await supabase
        .from("worker_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (workerError) {
        console.error("Dispute participant lookup error:", workerError);
        return {
          error: "Unable to verify your access to this job.",
        };
      }

      isParticipant = !!workerProfile && workerProfile.id === job.worker_id;
    }

    if (!isParticipant) {
      return {
        error: "You can only open disputes for your own jobs.",
      };
    }

    const { data: existingDispute, error: existingError } = await supabase
      .from("disputes")
      .select("id")
      .eq("job_id", jobId)
      .in("status", ["open", "under_review"])
      .limit(1)
      .maybeSingle();

    if (existingError) {
      console.error("Existing dispute lookup error:", existingError);
      return {
        error: "Unable to check for an existing dispute. Please try again.",
      };
    }

    if (existingDispute) {
      return { error: "This job already has an active dispute." };
    }

    const { data: dispute, error: insertError } = await supabase
      .from("disputes")
      .insert({
        job_id: jobId,
        opened_by: user.id,
        reason: reason.trim(),
        description: description.trim(),
        status: "open",
      })
      .select("id")
      .single();

    if (insertError || !dispute) {
      console.error("Create dispute error:", insertError);
      return {
        error: "Unable to submit the dispute. Please try again.",
      };
    }

    const uploadedPaths: string[] = [];
    const mediaRows: {
      dispute_id: string;
      uploaded_by: string;
      file_url: string;
      file_type: string;
    }[] = [];

    for (const file of evidenceEntries) {
      const extension = getSafeExtension(file);

      if (!extension) {
        return {
          error: `Dispute ${dispute.id} was created, but an evidence file type was unsupported. Please contact support.`,
          disputeId: dispute.id,
        };
      }

      const filePath = `${dispute.id}/${user.id}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("dispute-media")
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error("Dispute evidence upload failed:", uploadError.message);

        if (uploadedPaths.length > 0) {
          await supabase.storage.from("dispute-media").remove(uploadedPaths);
        }

        return {
          error: `Dispute ${dispute.id} was created, but evidence upload failed. Please reopen the dispute and contact support before retrying.`,
          disputeId: dispute.id,
        };
      }

      uploadedPaths.push(filePath);
      mediaRows.push({
        dispute_id: dispute.id,
        uploaded_by: user.id,
        file_url: filePath,
        file_type: file.type,
      });
    }

    if (mediaRows.length > 0) {
      const { error: mediaError } = await supabase
        .from("dispute_media")
        .insert(mediaRows);

      if (mediaError) {
        console.error(
          "Dispute media metadata insert failed:",
          mediaError.message,
        );
        await supabase.storage.from("dispute-media").remove(uploadedPaths);

        return {
          error: `Dispute ${dispute.id} was created, but evidence could not be recorded. Please contact support and provide this reference: ${dispute.id}`,
          disputeId: dispute.id,
        };
      }
    }

    // Notify the other participant in the job.
    let recipientUserId: string | null = null;

    if (job.customer_id === user.id) {
      // Customer opened the dispute: notify the worker.
      const { data: worker, error: workerLookupError } = await supabase
        .from("worker_profiles")
        .select("user_id")
        .eq("id", job.worker_id)
        .maybeSingle();

      if (workerLookupError) {
        console.error(
          "Dispute notification worker lookup error:",
          workerLookupError,
        );
      } else {
        recipientUserId = worker?.user_id ?? null;
      }
    } else {
      // Worker opened the dispute: notify the customer.
      recipientUserId = job.customer_id;
    }

    if (recipientUserId) {
      // await createNotification({
      //   userId: recipientUserId,
      //   type: "dispute_opened",
      //   title: "A dispute has been opened",
      //   message:
      //     "A dispute has been opened for a job you're involved in. Review the dispute for more details.",
      //   link: "/dashboard/disputes",
      //   preference: "job_updates",
      // });

      // Notify administrators about the new dispute.
      await createNotification({
        userId: user.id,
        type: "dispute_opened_admin",
        title: `New dispute opened by ${openerRole}`,
        message: `${openerRole} ${openerName} opened a dispute. Reason: ${reason.trim()}. Job reference: ${job.id}. Dispute reference: ${dispute.id}.`,
        adminTitle: `New dispute opened by ${openerRole}`,
        adminMessage: `${openerRole} ${openerName} opened a dispute. Reason: ${reason.trim()}. Job reference: ${job.id}. Dispute reference: ${dispute.id}.`,
        link: `/dashboard/admin/disputes/${dispute.id}`,
        adminOnly: true,
      });
    }

    revalidatePath("/dashboard/customer/jobs");
    revalidatePath("/dashboard/worker/jobs/my");
    revalidatePath("/dashboard/admin/disputes");
    revalidatePath(`/dashboard/admin/disputes/${dispute.id}`);

    return {
      success:
        mediaRows.length > 0
          ? "Your dispute and evidence have been submitted."
          : "Your dispute has been submitted.",
      disputeId: dispute.id,
    };
  } catch (error) {
    console.error("Create dispute action error:", error);
    return {
      error: "Unable to submit the dispute. Please try again.",
    };
  }
}
