"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

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

  if (typeof quoteId !== "string" || !quoteId) {
    return { error: "Quotation is required." };
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
    return { error: "Unable to verify the quotation." };
  }

  if (!quote) {
    return { error: "Quotation not found." };
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
    .update({ status: "rejected" })
    .eq("id", quote.id)
    .eq("status", "pending");

  if (error) {
    console.error("Reject quote error:", error);

    return {
      error: "Unable to reject the quotation.",
    };
  }

  revalidatePath(`/dashboard/customer/requests/${quote.request_id}`);

  return {
    success: "Quotation rejected.",
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
    return { error: "Quotation is required." };
  }

  // Get the quotation and verify that the request
  // belongs to the currently authenticated customer.
  const { data: quote, error: quoteError } = await supabase
    .from("quotes")
    .select(
      `
      id,
      request_id,
      worker_id,
      amount,
      currency,
      status,
      service_requests!inner (
        id,
        customer_id,
        status
      )
    `,
    )
    .eq("id", quoteId)
    .maybeSingle();

  if (quoteError) {
    console.error("Accept quote lookup error:", quoteError);

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
      error: "You are not authorized to accept this quotation.",
    };
  }

  if (quote.status !== "pending") {
    return {
      error: "This quotation has already been processed.",
    };
  }

  if (request.status === "completed" || request.status === "cancelled") {
    return {
      error: "This service request is no longer available.",
    };
  }

  // Make sure another job has not already been created
  // for this request.
  const { data: existingJob, error: existingJobError } = await supabase
    .from("jobs")
    .select("id")
    .eq("request_id", request.id)
    .maybeSingle();

  if (existingJobError) {
    console.error("Existing job lookup error:", existingJobError);

    return {
      error: "Unable to verify the current job status.",
    };
  }

  if (existingJob) {
    return {
      error: "A job has already been created for this request.",
    };
  }

  // Accept the selected quotation.
  const { error: acceptError } = await supabase
    .from("quotes")
    .update({
      status: "accepted",
    })
    .eq("id", quote.id)
    .eq("status", "pending");

  if (acceptError) {
    console.error("Accept quote error:", acceptError);

    return {
      error: "Unable to accept the quotation.",
    };
  }

  // Reject all other pending quotations
  // for the same request.
  const { error: rejectOthersError } = await supabase
    .from("quotes")
    .update({
      status: "rejected",
    })
    .eq("request_id", request.id)
    .eq("status", "pending")
    .neq("id", quote.id);

  if (rejectOthersError) {
    console.error("Reject other quotes error:", rejectOthersError);

    return {
      error:
        "The quotation was accepted, but the other quotations could not be updated.",
    };
  }

  // Create the actual job.
  const { error: jobError } = await supabase.from("jobs").insert({
    quote_id: quote.id,
    request_id: request.id,
    customer_id: user.id,
    worker_id: quote.worker_id,
    agreed_amount: quote.amount,
    currency: quote.currency,
    status: "assigned",
  });

  if (jobError) {
    console.error("Create job error:", jobError);

    return {
      error: "The quotation was accepted, but the job could not be created.",
    };
  }

  // Update the request status.
  const { error: requestUpdateError } = await supabase
    .from("service_requests")
    .update({
      status: "assigned",
    })
    .eq("id", request.id)
    .eq("customer_id", user.id);

  if (requestUpdateError) {
    console.error("Update request status error:", requestUpdateError);

    return {
      error:
        "The job was created, but the request status could not be updated.",
    };
  }

  revalidatePath(`/dashboard/customer/requests/${request.id}`);
  revalidatePath("/dashboard/customer/requests");
  revalidatePath("/dashboard/worker/jobs");
  revalidatePath("/dashboard/worker/jobs/my");

  return {
    success: "Quotation accepted. The service provider has been assigned.",
  };
}
