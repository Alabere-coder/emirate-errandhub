"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth/require-role";
import { createAdminClient } from "@/lib/supabase/admin";
import { createNotification } from "@/lib/notifications/create-notification";

type DisputeActionResult = {
  success?: string;
  error?: string;
};

type DisputeDecision = "under_review" | "resolved" | "rejected";

function isValidUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export async function updateDisputeStatus(
  _previousState: DisputeActionResult,
  formData: FormData,
): Promise<DisputeActionResult> {
  const { user } = await requireRole(["admin"]);

  try {
    const supabase = createAdminClient();

    const { data: adminProfile, error: adminProfileError } = await supabase
      .from("profiles")
      .select("first_name, last_name")
      .eq("id", user.id)
      .single();

    if (adminProfileError || !adminProfile) {
      console.error("Failed to load admin profile:", adminProfileError);
      return {
        error: "Could not identify the administrator handling this dispute.",
      };
    }

    const adminName =
      [adminProfile.first_name, adminProfile.last_name]
        .filter(Boolean)
        .join(" ") || "An administrator";

    const disputeId = formData.get("dispute_id");
    const decision = formData.get("decision");
    const resolution = formData.get("resolution");

    if (!isValidUuid(disputeId)) {
      return { error: "Invalid dispute reference." };
    }

    if (
      decision !== "under_review" &&
      decision !== "resolved" &&
      decision !== "rejected"
    ) {
      return { error: "Choose a valid dispute decision." };
    }

    if (
      typeof resolution !== "string" ||
      resolution.trim().length < 10 ||
      resolution.trim().length > 3000
    ) {
      return {
        error: "Enter a decision note between 10 and 3,000 characters.",
      };
    }

    if (decision === "under_review" && resolution.trim().length < 10) {
      return {
        error: "Explain briefly why the dispute is being reviewed.",
      };
    }

    // const supabase = createAdminClient();

    const { data: dispute, error: lookupError } = await supabase
      .from("disputes")
      .select(
        `
    id,
    status,
    job_id,
    jobs (
      customer_id,
      worker_id
    )
  `,
      )
      .eq("id", disputeId)
      .maybeSingle();

    if (lookupError) {
      console.error("Admin dispute lookup failed:", lookupError.message);
      return { error: "Unable to load this dispute. Please try again." };
    }

    if (!dispute) {
      return { error: "This dispute could not be found." };
    }

    if (["resolved", "rejected", "closed"].includes(dispute.status)) {
      return {
        error:
          "This dispute is already in a final state and cannot be changed here.",
      };
    }

    const now = new Date().toISOString();

    const updateValues = {
      status: decision,
      resolution: resolution.trim(),
      resolved_by: decision === "under_review" ? null : user.id,
      resolved_at: decision === "under_review" ? null : now,
      updated_at: now,
    };

    const { data: updatedDispute, error: updateError } = await supabase
      .from("disputes")
      .update(updateValues)
      .eq("id", disputeId)
      .eq("status", dispute.status)
      .select("id")
      .maybeSingle();

    if (updateError) {
      console.error("Admin dispute update failed:", updateError.message);
      return {
        error: "Unable to save the decision. Please try again.",
      };
    }

    if (!updatedDispute) {
      return {
        error: "The dispute may have changed. Refresh the page and try again.",
      };
    }

    const job = Array.isArray(dispute.jobs) ? dispute.jobs[0] : dispute.jobs;

    if (job) {
      const { data: workerProfile, error: workerError } = await supabase
        .from("worker_profiles")
        .select("user_id")
        .eq("id", job.worker_id)
        .maybeSingle();

      if (workerError) {
        console.error(
          "Dispute notification worker lookup failed:",
          workerError,
        );
      }

      const participants = [job.customer_id, workerProfile?.user_id].filter(
        (id): id is string => typeof id === "string",
      );

      const notificationDetails = {
        under_review: {
          title: "Your dispute is under review",
          message: `Admin ${adminName} is reviewing the dispute associated with job ${dispute.job_id}.`,
        },
        resolved: {
          title: "Your dispute has been resolved",
          message: `Admin ${adminName} has resolved the dispute associated with job ${dispute.job_id}. Decision: ${resolution.trim()}`,
        },
        rejected: {
          title: "Your dispute has been rejected",
          message: `Admin ${adminName} has rejected the dispute associated with job ${dispute.job_id}. Reason: ${resolution.trim()}`,
        },
      }[decision];

      await Promise.all(
        [...new Set(participants)].map((participantId) =>
          createNotification({
            userId: participantId,
            type: `dispute_${decision}`,
            title: notificationDetails.title,
            message: notificationDetails.message,
            link: "/dashboard/disputes",
            preference: "job_updates",
          }),
        ),
      );

      await createNotification({
        userId: user.id,
        type: `dispute_${decision}_admin`,
        title: `Dispute ${decision.replace(/_/g, " ")}`,
        message: `Admin ${adminName} changed dispute ${dispute.id} to ${decision.replace(/_/g, " ")}. Job reference: ${dispute.job_id}. Decision note: ${resolution.trim()}.`,
        adminTitle: `Dispute ${decision.replace(/_/g, " ")} by administrator`,
        adminMessage: `Admin ${adminName} changed dispute ${dispute.id} to ${decision.replace(/_/g, " ")}. Job reference: ${dispute.job_id}. Decision note: ${resolution.trim()}.`,
        link: `/dashboard/admin/disputes/${dispute.id}`,
        adminOnly: true,
        excludeUserIds: [user.id],
      });
    }

    revalidatePath("/dashboard/admin/disputes");
    revalidatePath(`/dashboard/admin/disputes/${disputeId}`);

    return {
      success:
        decision === "under_review"
          ? "Dispute marked as under review."
          : decision === "resolved"
            ? "Dispute resolved successfully."
            : "Dispute rejected successfully.",
    };
  } catch (error) {
    console.error("Update dispute status action failed:", error);
    return {
      error: "Unable to update this dispute. Please try again.",
    };
  }
}
