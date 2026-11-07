"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";
import { createNotification } from "../notifications/create-notification";
import { checkWorkerEligibility } from "@/lib/actions/worker-eligibility";

export type QuoteActionState = {
  error?: string;
  success?: string;
};

export async function rejectQuote(
  _previousState: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  const { user } = await requireRole(["customer"]);
  const supabase = await createClient();

  const quoteId = formData.get("quote_id");
  const rejectionReason = formData.get("rejection_reason");

  if (typeof quoteId !== "string" || !quoteId) {
    return {
      error: "Quotation is required.",
    };
  }

  if (
    typeof rejectionReason !== "string" ||
    rejectionReason.trim().length < 10
  ) {
    return {
      error: "Please provide a rejection reason of at least 10 characters.",
    };
  }

  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select(
      `
        id,
        request_id,
        status,
        service_requests!inner (
          customer_id,
          status
        )
      `,
    )
    .eq("id", quoteId)
    .maybeSingle();

  if (quoteError) {
    console.error("Reject quote lookup error:", quoteError);

    return {
      error: "Unable to verify the quotation.",
    };
  }

  if (!quote) {
    return {
      error: "Quotation not found.",
    };
  }

  const request = Array.isArray(quote.service_requests)
    ? quote.service_requests[0]
    : quote.service_requests;

  if (!request || request.customer_id !== user.id) {
    return {
      error: "You are not authorized to reject this quotation.",
    };
  }

  if (quote.status !== "pending") {
    return {
      error: "This quotation has already been processed.",
    };
  }

  const { error } = await supabase
    .from("quotes")
    .update({
      status: "rejected",
      rejection_reason: rejectionReason.trim(),
      rejected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", quote.id)
    .eq("status", "pending");

  if (error) {
    console.error("Reject quote error:", error);

    return {
      error: "Unable to reject the quotation.",
    };
  }

  revalidatePath(`/dashboard/customer/requests/${quote.request_id}`);
  revalidatePath("/dashboard/customer/requests");

  revalidatePath("/dashboard/worker/jobs");
  revalidatePath("/dashboard/worker/jobs/my");
  revalidatePath(`/dashboard/worker/jobs/${quote.request_id}`);

  return {
    success: "Quotation rejected. The worker can submit a new quotation.",
  };
}

export async function acceptQuote(
  _previousState: QuoteActionState,
  formData: FormData,
): Promise<QuoteActionState> {
  const { user } = await requireRole(["customer"]);
  const supabase = await createClient();

  const quoteId = formData.get("quote_id");

  if (typeof quoteId !== "string" || !quoteId) {
    return {
      error: "Quotation is required.",
    };
  }

  const { data: jobId, error } = await supabase.rpc("accept_service_quote", {
    p_quote_id: quoteId,
  });

  if (error || !jobId) {
    console.error("Accept quote transaction error:", error);

    return {
      error: error?.message?.includes("not authorized")
        ? "You are not authorized to accept this quotation."
        : error?.message?.includes("certificate")
          ? "The service provider does not have the required approved certificate."
          : error?.message?.includes("unverified or unavailable")
            ? "The service provider is unverified or unavailable."
            : "Unable to accept this quotation. Please refresh and try again.",
    };
  }

  const { data: job, error: jobLookupError } = await supabase
    .from("jobs")
    .select(
      `
        request_id,
        worker_id,
        worker_profiles (
          user_id
        )
      `,
    )
    .eq("id", jobId)
    .eq("customer_id", user.id)
    .maybeSingle();

  if (jobLookupError || !job) {
    console.error("Accepted job lookup error:", jobLookupError);

    return {
      success:
        "Quotation accepted and job created. Refresh the page to see the assignment.",
    };
  }

  const workerProfile = job.worker_profiles;

  const workerUserId = Array.isArray(workerProfile)
    ? workerProfile[0]?.user_id
    : workerProfile?.user_id;

  if (workerUserId) {
    await createNotification({
      userId: workerUserId,
      type: "job_assigned",
      title: "New job assigned",
      message:
        "A customer has accepted your quotation. You can now view your assigned job.",
      link: `/dashboard/worker/jobs/my/${jobId}`,
      preference: "job_updates",
    });
  }

  revalidatePath(`/dashboard/customer/requests/${job.request_id}`);
  revalidatePath("/dashboard/customer/requests");
  revalidatePath("/dashboard/worker/jobs");
  revalidatePath("/dashboard/worker/jobs/my");

  return {
    success: "Quotation accepted. The service provider has been assigned.",
  };
}

// export async function acceptQuote(
//   _previousState: QuoteActionState,
//   formData: FormData,
// ): Promise<QuoteActionState> {
//   const { user } = await requireRole(["customer"]);
//   const supabase = await createClient();

//   const quoteId = formData.get("quote_id");

//   if (typeof quoteId !== "string" || !quoteId) {
//     return { error: "Quotation is required." };
//   }

//   const { data: jobId, error } = await supabase.rpc("accept_service_quote", {
//     p_quote_id: quoteId,
//   });

//   if (error || !jobId) {
//     console.error("Accept quote transaction error:", error);

//     return {
//       error: error?.message?.includes("not authorized")
//         ? "You are not authorized to accept this quotation."
//         : error?.message?.includes("certificate")
//           ? "The service provider does not have the required approved certificate."
//           : error?.message?.includes("unverified or unavailable")
//             ? "The service provider is unverified or unavailable."
//             : "Unable to accept this quotation. Please refresh and try again.",
//     };
//   }

//   const { data: job, error: jobLookupError } = await supabase
//     .from("jobs")
//     .select(
//       `
//     request_id,
//     worker_id,
//     worker_profiles (
//       user_id
//     )
//   `,
//     )
//     .eq("id", jobId)
//     .eq("customer_id", user.id)
//     .maybeSingle();

//   if (jobLookupError || !job) {
//     console.error("Accepted job lookup error:", jobLookupError);

//     return {
//       success:
//         "Quotation accepted and job created. Refresh the page to see the assignment.",
//     };
//   }

//   const workerProfile = job.worker_profiles;

//   const workerUserId = Array.isArray(workerProfile)
//     ? workerProfile[0]?.user_id
//     : workerProfile?.user_id;

//   if (workerUserId) {
//     await createNotification({
//       userId: workerUserId,
//       type: "job_assigned",
//       title: "New job assigned",
//       message:
//         "A customer has accepted your quotation. You can now view your assigned job.",
//       link: `/dashboard/worker/jobs/my/${jobId}`,
//       preference: "job_updates",
//     });
//   }

//   revalidatePath(`/dashboard/customer/requests/${job.request_id}`);
//   revalidatePath("/dashboard/customer/requests");
//   revalidatePath("/dashboard/worker/jobs");
//   revalidatePath("/dashboard/worker/jobs/my");

//   return {
//     success: "Quotation accepted. The service provider has been assigned.",
//   };
// }
