"use server";

import { revalidatePath } from "next/cache";

import { requireRole } from "@/lib/auth/require-role";
import { createClient } from "@/lib/supabase/server";

export type ServiceQuotationActionState = {
  error?: string;
  success?: string;
};

function getString(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function getOptionalNumber(formData: FormData, name: string) {
  const value = getString(formData, name);

  if (!value) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

export async function createServiceQuotation(
  _previousState: ServiceQuotationActionState,
  formData: FormData,
): Promise<ServiceQuotationActionState> {
  const { user } = await requireRole(["worker"]);
  const supabase = await createClient();

  const serviceRequestId = getString(formData, "service_request_id");

  const amount = getOptionalNumber(formData, "amount");

  const currency = getString(formData, "currency") || "NGN";

  const message = getString(formData, "message") || null;

  const estimatedDuration = getOptionalNumber(formData, "estimated_duration");

  const estimatedStartTime =
    getString(formData, "estimated_start_time") || null;

  if (!serviceRequestId) {
    return {
      error: "Service request is required.",
    };
  }

  if (amount === null || amount <= 0) {
    return {
      error: "Please enter a valid quotation amount.",
    };
  }

  if (estimatedDuration !== null && estimatedDuration <= 0) {
    return {
      error: "Estimated duration must be greater than zero.",
    };
  }

  /*
   * Make sure the request exists and is still available.
   */
  const { data: request, error: requestError } = await supabase
    .from("service_requests")
    .select("id, status")
    .eq("id", serviceRequestId)
    .maybeSingle();

  if (requestError) {
    console.error("Service request lookup error:", requestError);

    return {
      error: "Unable to verify the service request.",
    };
  }

  if (!request) {
    return {
      error: "This service request no longer exists.",
    };
  }

  /*
   * Prevent quotations on completed/cancelled requests.
   *
   * We are intentionally checking the values explicitly
   * instead of assuming every possible future status.
   */
  if (request.status === "completed" || request.status === "cancelled") {
    return {
      error: "This service request is no longer accepting quotations.",
    };
  }

  /*
   * Check whether this worker already submitted
   * a quotation for this request.
   */
  const { data: existingQuotation, error: existingError } = await supabase
    .from("service_quotations")
    .select("id, status")
    .eq("service_request_id", serviceRequestId)
    .eq("worker_id", user.id)
    .maybeSingle();

  if (existingError) {
    console.error("Existing quotation lookup error:", existingError);

    return {
      error: "Unable to check your existing quotation.",
    };
  }

  if (existingQuotation) {
    return {
      error: "You have already submitted a quotation for this request.",
    };
  }

  const { error } = await supabase.from("service_quotations").insert({
    service_request_id: serviceRequestId,
    worker_id: user.id,
    amount,
    currency,
    message,
    estimated_duration: estimatedDuration,
    estimated_start_time: estimatedStartTime,
    status: "pending",
  });

  if (error) {
    console.error("Create service quotation error:", error);

    return {
      error: "Unable to submit your quotation. Please try again.",
    };
  }

  revalidatePath(`/dashboard/worker/requests/${serviceRequestId}`);

  return {
    success: "Your quotation has been submitted successfully.",
  };
}
